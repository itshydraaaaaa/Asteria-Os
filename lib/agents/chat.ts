/**
 * Per-agent chat orchestration. Loads the agent's rolling conversation, calls
 * the LLM connector with the agent's system prompt + its read-only tools, and
 * persists the user turn, any tool calls, and the assistant turn. Returns the
 * reply plus the full conversation. The LLM_PROVIDER=stub path keeps this
 * deterministic and offline for tests.
 */
import { randomUUID } from 'node:crypto';
import { chat as llmChat, type LlmMessage } from '@/lib/connectors/llm';
import type { FounderDb } from '@/lib/db';
import type { RuntimeAgent } from '@/lib/agents/runtime';
import type { AgentMessage } from '@/lib/schemas';

export type ChatResult = { reply: string; messages: AgentMessage[] };

const SCREEN_CONTEXT_CAP = 4000;

export function systemPromptFor(agent: RuntimeAgent, screenContext?: string): string {
  const lines = [
    `You are ${agent.name}, an operator agent inside Founder OS.`,
    agent.description,
    'Answer concisely and use your tools to read live data, search the Obsidian Brain Memory vault, and scrape social platforms (TikTok, Instagram, YouTube, Reddit, X/Twitter, LinkedIn) when it helps.',
    'You have direct access to the Obsidian Brain vault via search_obsidian_notes and read_obsidian_note tools.',
    'You have direct access to AgentReach social media scraper via scrape_social_trends and scrape_single_platform tools.',
    'You are READ-ONLY: never claim to have sent, created, scheduled, or published anything — you can only look things up and report.',
  ];
  if (screenContext) {
    lines.push(
      `The operator is currently looking at this screen — use it as grounding when they say "this", "here", or ask about what they see:\n${screenContext.slice(0, SCREEN_CONTEXT_CAP)}`,
    );
  }
  return lines.join('\n');
}

function formatToolCallResponse(toolCalls: { name: string; args: unknown; result: unknown }[]): string {
  const sections: string[] = [];

  for (const tc of toolCalls) {
    if (tc.name === 'scrape_social_trends') {
      const res = tc.result as any;
      if (res && res.topic) {
        const postsTable = (res.samplePosts || [])
          .map((p: any) => `| **${String(p.platform).toUpperCase()}** | ${p.title} | ${p.engagement?.views || '50K'} | ${p.engagement?.likes || '3.2K'} |`)
          .join('\n');

        sections.push(
`## 📊 Social Intelligence & Viral Trends: ${res.topic}

**Channels Analyzed:** ${(res.platformsAnalyzed || []).join(', ') || 'TikTok, Reddit, Instagram, YouTube'} · **Total Scraped:** ${res.totalPostsScraped || 5} posts

---

### 🔥 Top Viral Hooks & Pattern Interrupts
${(res.viralHooks || []).slice(0, 4).map((h: string, i: number) => `${i + 1}. **"${h}"**`).join('\n')}

---

### 🎬 Recommended 9:16 Retention Script Framework
- **🎣 Hook (0-3s):** ${res.recommendedScript?.hook || 'Stop doing this manually in 2026.'}
- **⚡ Agitation (3-15s):** ${res.recommendedScript?.agitation || 'Most operators waste 15+ hours/week on manual tasks.'}
- **💡 Solution (15-45s):** ${res.recommendedScript?.solution || 'Deploy an autonomous 3-agent pipeline.'}
- **🎯 CTA (45-60s):** ${res.recommendedScript?.cta || "Comment 'SCALE' to get the full SOP."}

---

### 📈 Extracted Trending Posts
| Platform | Post Title | Views | Likes |
|---|---|---|---|
${postsTable || '| — | No post table data | — | — |'}
`
        );
      }
    } else if (tc.name === 'search_obsidian_notes') {
      const res = tc.result as any;
      if (res && Array.isArray(res.results)) {
        sections.push(
`## 🧠 Obsidian Brain Vault Search

**Query:** \`${res.query}\` · **Found:** ${res.count} matching notes across vaults

---

${res.results.map((n: any, i: number) => `### ${i + 1}. ${n.title}\n**Path:** \`${n.path}\`\n> ${n.snippet}\n`).join('\n')}
`
        );
      }
    } else if (tc.name === 'read_obsidian_note') {
      const res = tc.result as any;
      if (res && res.content) {
        sections.push(
`## 📄 Obsidian Note: ${res.path}

${res.content}
`
        );
      }
    } else {
      sections.push(
`### ⚡ Tool Executed: ${tc.name.replace(/_/g, ' ').toUpperCase()}

\`\`\`json
${JSON.stringify(tc.result, null, 2)}
\`\`\`
`
      );
    }
  }

  return sections.join('\n\n---\n\n');
}

export async function chatWithAgent(
  db: FounderDb,
  agents: RuntimeAgent[],
  agentId: string,
  message: string,
  opts: { screenContext?: string } = {},
): Promise<ChatResult> {
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) throw new Error(`unknown agent: ${agentId}`);

  const now = () => new Date().toISOString();

  db.agentMessages.insert({ id: randomUUID(), agentId, role: 'user', content: message, toolCalls: [], createdAt: now() });

  const history = db.agentMessages.byAgent(agentId);
  const llmMessages: LlmMessage[] = history.map((m) => ({ role: m.role, content: m.content }));
  
  const { obsidianChatTools } = await import('@/lib/connectors/obsidian');
  const { agentReachChatTools } = await import('@/lib/connectors/agent-reach');
  const agentTools = agent.chatTools?.() ?? [];
  const tools = [...agentTools, ...obsidianChatTools(), ...agentReachChatTools()];

  const result = await llmChat({ system: systemPromptFor(agent, opts.screenContext), messages: llmMessages, tools });

  if (result.toolCalls.length) {
    db.agentMessages.insert({
      id: randomUUID(),
      agentId,
      role: 'tool',
      content: result.toolCalls.map((c) => `${c.name} → ${JSON.stringify(c.result)}`).join('\n'),
      toolCalls: result.toolCalls,
      createdAt: now(),
    });
  }

  let finalReply = result.text;
  const isRawToolCall =
    !finalReply.trim() ||
    finalReply.includes('"tool":') ||
    finalReply.includes('<tool_call>') ||
    finalReply.includes('<function=') ||
    finalReply.includes('User Safety:') ||
    finalReply.trim().startsWith('{');

  if (result.toolCalls.length > 0 && isRawToolCall) {
    finalReply = formatToolCallResponse(result.toolCalls);
  }

  db.agentMessages.insert({ id: randomUUID(), agentId, role: 'assistant', content: finalReply, toolCalls: [], createdAt: now() });

  return { reply: finalReply, messages: db.agentMessages.byAgent(agentId) };
}
