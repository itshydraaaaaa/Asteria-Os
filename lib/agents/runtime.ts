import { randomUUID } from 'node:crypto';
import type { FounderDb } from '@/lib/db';
import type { LlmToolSpec } from '@/lib/connectors/llm';
import type { AgentRun, Broadcast } from '@/lib/schemas';

export type AgentRunResult = { ok: boolean; summary: string; data?: unknown };

export type RuntimeAgent = {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  run(): Promise<AgentRunResult>;
  /**
   * Optional conversational entry point used by broadcasts. Agents that can
   * actually act on a message (e.g. the data agent querying G-Brain)
   * implement this; everyone else falls back to run() and replies with live
   * status. A future OpenClaw/Claude Code binding plugs in here.
   */
  respond?(message: string): Promise<AgentRunResult>;
  /**
   * Read-only tools this agent can call during a chat. Each wraps an existing
   * connector so the model can actually read live data mid-conversation.
   */
  chatTools?(): LlmToolSpec[];
};

export function createRuntime(db: FounderDb, agents: RuntimeAgent[]) {
  const registry = new Map(agents.map((a) => [a.id, a]));

  return {
    list(): RuntimeAgent[] {
      return [...registry.values()];
    },

    async run(id: string): Promise<AgentRun> {
      const agent = registry.get(id);
      if (!agent) throw new Error(`unknown agent: ${id}`);
      const runId = randomUUID();
      const startedAt = new Date().toISOString();

      // Persist running state first
      const initialRun: AgentRun = {
        id: runId,
        agentId: id,
        status: 'running',
        startedAt,
        finishedAt: '',
        ok: true,
        summary: 'Agent execution in progress...',
      };
      db.agentRuns.insert(initialRun);

      let result: AgentRunResult;
      try {
        result = await agent.run();
      } catch (err) {
        result = { ok: false, summary: err instanceof Error ? err.message : String(err) };
      }

      const finishedAt = new Date().toISOString();
      const finalStatus = result.ok ? 'success' : 'error';
      const finalRun: AgentRun = {
        id: runId,
        agentId: id,
        status: finalStatus,
        output: JSON.stringify(result.data ?? null),
        error: result.ok ? null : result.summary,
        startedAt,
        finishedAt,
        ok: result.ok,
        summary: result.summary,
      };
      db.agentRuns.insert(finalRun);
      return finalRun;
    },

    /** Speak to every agent at once; each replies in parallel. */
    async broadcast(message: string): Promise<Broadcast> {
      const broadcastId = randomUUID();
      const createdAt = new Date().toISOString();
      db.broadcasts.insert({ id: broadcastId, message, createdAt });

      const replies = await Promise.all(
        [...registry.values()].map(async (agent) => {
          let result: AgentRunResult;
          try {
            result = await (agent.respond ? agent.respond(message) : agent.run());
          } catch (err) {
            result = { ok: false, summary: err instanceof Error ? err.message : String(err) };
          }
          const reply = {
            id: randomUUID(),
            broadcastId,
            agentId: agent.id,
            ok: result.ok,
            reply: result.summary,
            finishedAt: new Date().toISOString(),
          };
          db.broadcasts.insertReply(reply);
          return reply;
        }),
      );

      return { id: broadcastId, message, createdAt, replies };
    },
  };
}

export type AgentRuntime = ReturnType<typeof createRuntime>;
