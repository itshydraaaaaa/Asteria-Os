'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Terminal,
  ArrowRight,
  RefreshCw,
  Trash2,
  Layers,
  Wrench,
  CheckCircle,
  Activity,
  Zap,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Database,
  Eye,
  GitCompare,
  Table as TableIcon,
} from 'lucide-react';
import { DataChangesModal } from '@/components/data/DataChangesModal';

type ToolCallItem = {
  name: string;
  args?: Record<string, unknown>;
  result?: unknown;
};

type Message = {
  id: string;
  sender: 'user' | 'agent' | 'tool';
  agentId?: string;
  agentName?: string;
  text: string;
  toolCalls?: ToolCallItem[];
  routedTo?: string;
  confidence?: number;
  suggestedOptions?: string[];
  timestamp: string;
};

type AgentActivityEvent = {
  id?: string;
  kind?: 'run' | 'message' | 'broadcast' | string;
  agentId: string;
  agentName?: string;
  status?: string;
  summary?: string;
  input?: any;
  output?: any;
  at?: string;
  startedAt?: string;
  finishedAt?: string;
  ok?: boolean;
};

const SUGGESTIONS = [
  { label: 'Check system health', prompt: 'Check all system connectors and report current status.' },
  { label: 'Obsidian GTM Strategy', prompt: 'Search our Obsidian vault notes for our GTM Strategy and summarize key phases.' },
  { label: 'Scrape Social Trends', prompt: 'Scrape the latest viral trends and hooks for agency automation across TikTok, Reddit, and Instagram.' },
  { label: 'Audit Brain Architecture', prompt: 'Audit our brain architecture and list active upgrade suggestions.' },
  { label: 'Find new leads', prompt: '@sdr-agent Find 5 new client leads for our freelance web services.' },
  { label: 'Revenue summary', prompt: '@finance-agent Provide a summary of current monthly revenue and pending invoices.' },
];

export function CommandChatView({
  agents,
}: {
  agents: { id: string; name: string; role: string }[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [targetAgent, setTargetAgent] = useState('conductor');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activities, setActivities] = useState<AgentActivityEvent[]>([]);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [showActivitySidebar, setShowActivitySidebar] = useState(true);
  
  // Data & Changes Inspector State
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorData, setInspectorData] = useState<any>(null);
  const [inspectorChanges, setInspectorChanges] = useState<any>(null);
  const [inspectorTitle, setInspectorTitle] = useState('Data & Changes Explorer');
  const [inspectorSubtitle, setInspectorSubtitle] = useState('Inspect live system data, execution outputs, and state diffs');
  const [inspectorTab, setInspectorTab] = useState<'visual' | 'diff' | 'explorer' | 'json'>('visual');
  const [inspectorTable, setInspectorTable] = useState('agent_runs');
  const bottomRef = useRef<HTMLDivElement>(null);

  const openInspectorForData = (
    data: any,
    title: string,
    subtitle?: string,
    tab: 'visual' | 'diff' | 'explorer' | 'json' = 'visual',
    changes?: any,
  ) => {
    setInspectorData(data);
    setInspectorTitle(title);
    setInspectorSubtitle(subtitle || 'Live execution payload and state diff');
    setInspectorTab(tab);
    setInspectorChanges(changes);
    setInspectorOpen(true);
  };

  const openExplorer = (tbl: string = 'agent_runs') => {
    setInspectorData(null);
    setInspectorTitle('Database & Vault Data Explorer');
    setInspectorSubtitle('Browse live database tables and Obsidian notes');
    setInspectorTab('explorer');
    setInspectorTable(tbl);
    setInspectorOpen(true);
  };


  const loadChatHistory = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/${agentId}/chat`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const mapped: Message[] = data.messages.map((m: any) => {
            const foundAgent = agents.find((a) => a.id === m.agentId);
            return {
              id: m.id,
              sender: m.role === 'user' ? 'user' : m.role === 'tool' ? 'tool' : 'agent',
              agentId: m.agentId,
              agentName: foundAgent ? foundAgent.name : m.agentId === 'conductor' ? 'Asteria Conductor' : 'Asteria Agent',
              text: m.content,
              toolCalls: m.toolCalls,
              timestamp: m.createdAt
                ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
            };
          });
          setMessages(mapped);
          return;
        }
      }
      // If empty history, show standard welcome
      setMessages([
        {
          id: 'init-1',
          sender: 'agent',
          agentId: targetAgent,
          agentName: targetAgent === 'conductor' ? 'Asteria Conductor' : agents.find((a) => a.id === targetAgent)?.name || targetAgent,
          text: `Ready for commands. I am wired to your live Obsidian vaults, AgentReach social scrapers, and autonomous agent roster. Ask anything or dispatch a task.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Failed to load chat history', err);
    } finally {
      setInitialLoading(false);
    }
  }, [agents, targetAgent]);

  const loadRecentActivity = async () => {
    try {
      const res = await fetch('/api/agents/activity?limit=8');
      if (res.ok) {
        const data = await res.json();
        const evts = data.events || data.runs || [];
        setActivities(evts.slice(0, 8));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadChatHistory(targetAgent);
    loadRecentActivity();
  }, [targetAgent, loadChatHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const endpoint = `/api/agents/${targetAgent}/chat`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (res.ok) {
        const body = await res.json();
        const agentMsgText = body.reply || body.content || body.summary || 'Command processed successfully.';
        const routedTo = body.routedTo;
        const respondingAgent = agents.find((a) => a.id === (routedTo || targetAgent)) || {
          name: targetAgent === 'conductor' ? 'Asteria Conductor' : targetAgent,
        };

        const replyMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'agent',
          agentId: routedTo || targetAgent,
          agentName: respondingAgent.name,
          text: agentMsgText,
          toolCalls: body.toolCalls,
          routedTo,
          confidence: body.confidence,
          suggestedOptions: body.suggestedOptions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, replyMsg]);
        loadRecentActivity();
      } else {
        const errBody = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'agent',
            agentName: 'System Error',
            text: `Error processing command: ${errBody.error || res.statusText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          agentName: 'System Error',
          text: `Connection error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-xl border border-os-border bg-os-surface overflow-hidden">
      {/* Main Chat Stream Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-border bg-os-surface2 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-xs text-os-text">
            <Terminal className="h-4 w-4 text-os-accent" />
            <span className="font-bold uppercase tracking-wider">Asteria Command Terminal</span>
            <span className="rounded-full bg-os-ok/15 px-2 py-0.5 text-[10px] font-semibold text-os-ok">
              ● Live Connected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadChatHistory(targetAgent)}
              title="Refresh Conversation"
              className="rounded p-1 text-os-muted hover:text-os-text hover:bg-os-border/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <span className="font-mono text-[10px] uppercase text-os-dim">Target:</span>
            <select
              value={targetAgent}
              onChange={(e) => setTargetAgent(e.target.value)}
              className="rounded-md border border-os-border bg-os-surface px-2.5 py-1 font-mono text-xs text-os-text outline-none focus:border-os-accent"
            >
              <option value="conductor">★ Conductor (Smart Auto-Route)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.role})
                </option>
              ))}
            </select>

            <button
              onClick={() => openExplorer('agent_runs')}
              className="flex items-center gap-1.5 rounded-md border border-os-border bg-os-surface px-2.5 py-1 font-mono text-xs text-os-text hover:border-os-accent hover:text-os-accent transition-colors"
              title="Open Live Database & Vault Data Explorer"
            >
              <Database className="h-3.5 w-3.5 text-os-accent" />
              <span>Data Explorer</span>
            </button>

            <button
              onClick={() => setShowActivitySidebar((v) => !v)}
              className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                showActivitySidebar
                  ? 'border-os-accent bg-os-accent/10 text-os-accent'
                  : 'border-os-border text-os-dim hover:text-os-text'
              }`}
            >
              <Activity className="h-3.5 w-3.5 inline mr-1" />
              <span>Activity Hub</span>
            </button>
          </div>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {initialLoading ? (
            <div className="flex items-center justify-center h-full text-os-dim font-mono text-xs">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span>Loading persisted agent history...</span>
            </div>
          ) : (
            messages
              .filter((m) => m.sender !== 'tool')
              .map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border font-mono text-xs ${
                    m.sender === 'user'
                      ? 'border-os-accent/30 bg-os-accent/10 text-os-accent'
                      : 'border-os-border bg-os-surface2 text-os-text'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-os-accent" />
                  )}
                </div>

                <div className={`max-w-[85%] flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="mb-1 flex items-center gap-2 font-mono text-[10px] text-os-dim">
                    <span className="font-semibold text-os-muted">
                      {m.sender === 'user' ? 'Operator' : m.agentName}
                    </span>
                    {m.routedTo && (
                      <span className="rounded bg-os-accent/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-os-accent">
                        routed to @{m.routedTo}
                      </span>
                    )}
                    <span>{m.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-os-accent text-os-ink font-medium'
                        : 'border border-os-border bg-os-surface2 text-os-text'
                    }`}
                  >
                    {m.sender === 'user' ? (
                      <div className="whitespace-pre-wrap font-medium">{m.text}</div>
                    ) : (
                      <MarkdownContent text={m.text} />
                    )}

                    {/* Tool Calls Execution Box */}
                    {m.toolCalls && m.toolCalls.length > 0 && (
                      <div className="mt-3 border-t border-os-border/50 pt-2.5 space-y-2">
                        <button
                          onClick={() => toggleToolExpand(m.id)}
                          className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold text-os-accent hover:underline"
                        >
                          <Wrench className="h-3 w-3" />
                          <span>{m.toolCalls.length} Tool Actions Executed</span>
                          {expandedTools[m.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </button>

                        {expandedTools[m.id] && (
                          <div className="space-y-2 pt-1">
                            {m.toolCalls.map((tc, idx) => (
                              <div key={idx} className="rounded bg-black/40 p-2.5 font-mono text-[11px] border border-os-border">
                                <div className="text-os-accent font-semibold">⚡ {tc.name}</div>
                                {tc.args && (
                                  <div className="mt-1 text-os-dim">
                                    Args: {JSON.stringify(tc.args)}
                                  </div>
                                )}
                                {tc.result !== undefined && (
                                  <div className="mt-1 text-emerald-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                    Output: {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                                  </div>
                                )}
                                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-os-border/40">
                                  <button
                                    onClick={() =>
                                      openInspectorForData(
                                        tc.result !== undefined ? tc.result : tc,
                                        `Tool Data: ${tc.name}`,
                                        `Arguments: ${JSON.stringify(tc.args || {})}`,
                                        'visual',
                                      )
                                    }
                                    className="flex items-center gap-1 text-[10.5px] text-os-accent hover:underline font-bold"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Inspect Tool Output & Table</span>
                                  </button>
                                  <button
                                    onClick={() =>
                                      openInspectorForData(
                                        tc,
                                        `Tool Payload: ${tc.name}`,
                                        'Raw JSON & Schema View',
                                        'json',
                                      )
                                    }
                                    className="text-[10px] text-os-dim hover:text-os-text"
                                  >
                                    Raw JSON
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data & Diff Inspection Footer Bar on Agent Messages */}
                    {m.sender === 'agent' && (
                      <div className="mt-3 flex items-center justify-between border-t border-os-border/50 pt-2 font-mono text-[10.5px]">
                        <button
                          onClick={() =>
                            openInspectorForData(
                              m.toolCalls && m.toolCalls.length > 0
                                ? { agent: m.agentName, message: m.text, toolCalls: m.toolCalls }
                                : { agent: m.agentName, message: m.text, timestamp: m.timestamp },
                              `Data Inspector: ${m.agentName || 'Agent Response'}`,
                              `Timestamp: ${m.timestamp} · Persisted Message ID: ${m.id}`,
                              'visual',
                            )
                          }
                          className="flex items-center gap-1 text-os-accent hover:underline font-semibold"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Inspect Data & Schema</span>
                        </button>

                        <button
                          onClick={() =>
                            openInspectorForData(
                              { message: m.text, toolCalls: m.toolCalls },
                              `Changes & Diff: ${m.agentName || 'Agent Execution'}`,
                              `Execution Delta & Mutated State`,
                              'diff',
                              { before: 'Prompt received by agent', after: m.text }
                            )
                          }
                          className="flex items-center gap-1 text-os-muted hover:text-os-text"
                        >
                          <GitCompare className="h-3 w-3" />
                          <span>View State Diff</span>
                        </button>
                      </div>
                    )}

                    {m.confidence !== undefined && m.confidence < 0.70 && m.suggestedOptions && (
                      <div className="mt-3 border-t border-os-border/50 pt-2.5">
                        <div className="font-mono text-[10px] text-os-warn mb-1.5 font-semibold">
                          ⚠ Low routing confidence ({Math.round(m.confidence * 100)}%). Direct to target agent:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.suggestedOptions.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setTargetAgent(opt);
                                setInput(`@${opt} `);
                              }}
                              className="rounded border border-os-accent/40 bg-os-accent/10 px-2 py-1 font-mono text-[10px] text-os-accent hover:bg-os-accent hover:text-os-ink transition-colors"
                            >
                              @{opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-os-border bg-os-surface2">
                <Sparkles className="h-4 w-4 animate-spin text-os-accent" />
              </div>
              <div className="font-mono text-xs text-os-dim animate-pulse">
                Processing command · Executing Obsidian Memory search & AgentReach scrapers...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Command suggestion chips */}
        <div className="flex flex-wrap items-center gap-2 border-t border-os-border bg-os-surface2/60 px-4 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-os-dim">Shortcuts:</span>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s.prompt)}
              className="flex items-center gap-1 rounded-full border border-os-border bg-os-surface px-2.5 py-0.5 font-mono text-[10.5px] text-os-muted transition-colors hover:border-os-accent hover:text-os-accent"
            >
              <span>{s.label}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          ))}
        </div>

        {/* Input bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 border-t border-os-border bg-os-surface p-3"
        >
          <input
            type="text"
            placeholder={
              targetAgent === 'conductor'
                ? 'Command Asteria OS... (e.g. "search obsidian for GTM", "scrape viral hooks", "@sales-agent write proposal")'
                : `Message ${agents.find((a) => a.id === targetAgent)?.name || targetAgent}...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-os-border bg-os-surface2 px-4 py-2.5 text-xs text-os-text outline-none focus:border-os-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-os-accent px-4 py-2.5 font-mono text-xs font-bold text-os-ink transition-opacity disabled:opacity-50 hover:opacity-90 shadow-sm"
          >
            <span>Execute</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>

      {/* Right Sidebar: Implementation & Action Stream */}
      {showActivitySidebar && (
        <div className="w-80 border-l border-os-border bg-os-surface2/40 flex flex-col overflow-hidden">
          <div className="border-b border-os-border p-3.5 font-mono text-xs font-bold text-os-text flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-os-accent" />
              <span>Implementation Stream</span>
            </span>
            <button
              onClick={() => openExplorer('agent_runs')}
              className="text-[10px] text-os-accent hover:underline font-normal"
            >
              View All ({activities.length}) →
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <div
              onClick={() => openExplorer('obsidian_vault')}
              className="cursor-pointer rounded-md border border-os-border bg-os-surface p-3 space-y-1.5 hover:border-os-accent transition-colors"
            >
              <div className="flex items-center justify-between font-mono text-[10.5px] uppercase text-os-dim">
                <span>Connected Brain Memory</span>
                <span className="text-os-accent text-[9.5px]">Open Vault →</span>
              </div>
              <div className="text-xs font-semibold text-os-text flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-os-ok" />
                <span>130+ Obsidian Vault Notes Indexed</span>
              </div>
              <p className="text-[11px] text-os-muted leading-relaxed">
                Click to explore vault notes, search contents, and inspect files in the Data Explorer.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-[10.5px] uppercase text-os-dim tracking-wider">
                Recent Agent Runs & Actions
              </div>

              {activities.length === 0 ? (
                <div className="rounded border border-dashed border-os-border p-4 text-center font-mono text-[11px] text-os-dim">
                  No execution runs logged yet. Send a command to trigger agent execution.
                </div>
              ) : (
                activities.map((act, index) => {
                  const isOk = act.ok !== false && act.status !== 'error';
                  const label = (act.kind || act.status || 'RUN').toUpperCase();
                  const timeStr = act.at || act.finishedAt || act.startedAt;

                  return (
                    <div
                      key={act.id || `${act.agentId}-${index}`}
                      onClick={() =>
                        openInspectorForData(
                          act,
                          `Execution Run: @${act.agentId}`,
                          `Status: ${label} · Timestamp: ${timeStr ? new Date(timeStr).toLocaleString() : 'Recent'}`,
                          'visual',
                          {
                            before: act.input || 'Initial Trigger & Input',
                            after: act.output || act.summary || 'Execution Result',
                          }
                        )
                      }
                      className="cursor-pointer rounded border border-os-border bg-os-surface p-2.5 space-y-1 hover:border-os-accent transition-colors group"
                    >
                      <div className="flex items-center justify-between font-mono text-[10.5px]">
                        <span className="font-bold text-os-text">@{act.agentId}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${
                            isOk ? 'bg-os-ok/15 text-os-ok' : 'bg-os-err/15 text-os-err'
                          }`}
                        >
                          {label}
                        </span>
                      </div>

                      {act.summary && <p className="text-[11px] text-os-muted line-clamp-2">{act.summary}</p>}

                      <div className="flex items-center justify-between pt-1 font-mono text-[9.5px] text-os-dim">
                        <span>
                          {timeStr ? new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </span>
                        <span className="text-os-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Inspect <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Data & Changes Inspector Modal */}
      <DataChangesModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        title={inspectorTitle}
        subtitle={inspectorSubtitle}
        initialData={inspectorData}
        changes={inspectorChanges}
        defaultTab={inspectorTab}
        tableName={inspectorTable}
      />
    </div>
  );
}


function renderInline(str: string): React.ReactNode {
  const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-os-text">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-os-accent border border-os-border/50">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function MarkdownContent({ text }: { text: string }) {
  if (text.trim().startsWith('{') && text.includes('"tool"')) {
    try {
      const parsed = JSON.parse(text);
      return (
        <div className="rounded border border-blue-500/30 bg-blue-500/10 p-2 font-mono text-[11px] text-blue-300">
          <span className="font-bold text-os-accent">⚡ Tool Invocation:</span> {parsed.tool || parsed.name}
        </div>
      );
    } catch {
      // ignore
    }
  }

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushTable = (key: string) => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const rows = tableRows.slice(1).filter((r) => !r.every((c) => c.includes('---')));
      elements.push(
        <div key={key} className="my-2.5 overflow-x-auto rounded border border-os-border bg-os-surface">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="border-b border-os-border bg-os-surface2/80 text-os-muted">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="p-2 font-bold">{col.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-os-border/50">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-os-surface2/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 text-os-text">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const flushCodeBlock = (key: string) => {
    if (codeBlockLines.length > 0) {
      elements.push(
        <pre key={key} className="my-2 overflow-x-auto rounded border border-os-border bg-black/60 p-2.5 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
          {codeBlockLines.join('\n')}
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(`code-${i}`);
      } else {
        if (inTable) flushTable(`table-${i}`);
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      inTable = true;
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(`table-${i}`);
    }

    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-2.5 border-os-border" />);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="mt-2.5 mb-1 text-sm font-bold text-os-text border-b border-os-border pb-1">{renderInline(line.slice(2))}</h2>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="mt-2 mb-1 text-xs font-bold text-os-accent">{renderInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="mt-1.5 mb-0.5 text-xs font-semibold text-os-text">{renderInline(line.slice(4))}</h4>);
      continue;
    }

    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="my-1.5 border-l-2 border-os-accent bg-os-accent/5 px-3 py-1 text-xs italic text-os-muted">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-xs text-os-text leading-relaxed">
          {renderInline(line.trim().slice(2))}
        </li>
      );
      continue;
    }

    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={i} className="my-1 flex items-start gap-2 text-xs text-os-text leading-relaxed">
          <span className="font-mono font-bold text-os-accent">{numMatch[1]}.</span>
          <div>{renderInline(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      elements.push(<div key={`space-${i}`} className="h-1" />);
      continue;
    }

    elements.push(<p key={i} className="text-xs text-os-text leading-relaxed">{renderInline(line)}</p>);
  }

  if (inTable) flushTable('table-end');
  if (inCodeBlock) flushCodeBlock('code-end');

  return <div className="space-y-1">{elements}</div>;
}
