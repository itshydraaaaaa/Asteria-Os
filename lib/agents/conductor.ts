/**
 * Conductor routing. A message can name its target explicitly with a leading
 * `@<agentId|name>`; otherwise the model picks the best-fit agent from the
 * roster. Either way the Conductor delegates to that agent's chat (with its
 * tools) and returns `{ routedTo, ...chat }`. Routing never throws on a bad
 * `@name` — it falls back to model routing.
 */
import { chat as llmChat } from '@/lib/connectors/llm';
import { chatWithAgent, type ChatResult } from '@/lib/agents/chat';
import type { FounderDb } from '@/lib/db';
import type { RuntimeAgent } from '@/lib/agents/runtime';

export type ConductorResult = ChatResult & {
  routedTo: string;
  confidence: number;
  suggestedOptions?: string[];
};

const AT_PREFIX = /^@(\S+)\s*/;

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function matchAgent(agents: RuntimeAgent[], token: string): RuntimeAgent | undefined {
  const t = slug(token);
  const direct = agents.find((a) => a.id === token || a.id === t || slug(a.name) === t);
  if (direct) return direct;

  const aliases: Record<string, string> = {
    'sdr-agent': 'sales-agent',
    sdr: 'sales-agent',
    sales: 'sales-agent',
    marketing: 'social-agent',
    content: 'social-agent',
    dev: 'tech-lead',
    developer: 'tech-lead',
  };

  const aliasTarget = aliases[t];
  if (aliasTarget) {
    return agents.find((a) => a.id === aliasTarget);
  }
  return undefined;
}

/** Ask the model for the single best-fit agent id; fall back to the first agent. */
async function pickAgent(routable: RuntimeAgent[], message: string): Promise<{ id: string; confidence: number }> {
  const roster = routable.map((a) => `- ${a.id}: ${a.name} — ${a.description}`).join('\n');
  const system = [
    'You are the Conductor, the router for Founder OS operator agents.',
    'Pick the single best-fit agent for the user message.',
    'Reply with ONLY that agent id and nothing else. Options:',
    roster,
  ].join('\n');
  const res = await llmChat({ system, messages: [{ role: 'user', content: message }] });
  const picked = (res.text.trim().split(/\s+/)[0] ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
  const found = routable.find((a) => a.id === picked);

  // Short or ambiguous prompts have low confidence
  const isAmbiguous = message.trim().length < 15 || /^(do it|check|stuff|help|run|go)$/i.test(message.trim());
  const confidence = found ? (isAmbiguous ? 0.45 : 0.95) : 0.30;

  return { id: (found ?? routable[0]).id, confidence };
}

export async function routeConductorMessage(
  db: FounderDb,
  agents: RuntimeAgent[],
  message: string,
  opts: { screenContext?: string } = {},
): Promise<ConductorResult> {
  const routable = agents.filter((a) => a.id !== 'conductor');
  let targetId: string | undefined;
  let delivered = message;
  let confidence = 1.0;

  const at = message.match(AT_PREFIX);
  if (at) {
    const explicit = matchAgent(routable, at[1]);
    if (explicit) {
      targetId = explicit.id;
      delivered = message.replace(AT_PREFIX, '').trim() || message;
      confidence = 1.0;
    }
  }

  if (!targetId) {
    const pick = await pickAgent(routable, message);
    targetId = pick.id;
    confidence = pick.confidence;
  }

  const suggestedOptions = confidence < 0.70 ? ['sales-agent', 'sdr-agent', 'finance-agent', 'dev-copilot'] : undefined;
  const result = await chatWithAgent(db, agents, targetId, delivered, opts);

  try {
    const { randomUUID } = await import('node:crypto');
    db.agentRuns.insert({
      id: randomUUID(),
      agentId: targetId,
      status: 'success',
      input: delivered,
      output: result.reply,
      tokensUsed: 150,
      costUsd: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      ok: true,
      summary: `[${targetId}] ${delivered.slice(0, 100)}`,
    });
  } catch {
    // Non-blocking
  }

  return { routedTo: targetId, confidence, suggestedOptions, ...result };
}
