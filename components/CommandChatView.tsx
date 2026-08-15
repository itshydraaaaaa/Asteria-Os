'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, ArrowRight } from 'lucide-react';

type Message = {
  id: string;
  sender: 'user' | 'agent';
  agentId?: string;
  agentName?: string;
  text: string;
  routedTo?: string;
  timestamp: string;
};

const SUGGESTIONS = [
  { label: 'Check system health', prompt: 'Check all system connectors and report current status.' },
  { label: 'Find new leads', prompt: '@sdr-agent Find 5 new client leads for our freelance web services.' },
  { label: 'Draft proposal', prompt: '@sales-agent Draft a $5,000 web app proposal for a potential client.' },
  { label: 'Revenue summary', prompt: '@finance-agent Provide a summary of current monthly revenue and pending invoices.' },
];

export function CommandChatView({
  agents,
}: {
  agents: { id: string; name: string; role: string }[];
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'agent',
      agentId: 'conductor',
      agentName: 'Asteria Conductor',
      text: 'Welcome to the Asteria Command Center. I am your Conductor super-agent. Ask me anything or type `@agentName <command>` to route directly to a specialized agent.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [targetAgent, setTargetAgent] = useState('conductor');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
          routedTo,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, replyMsg]);
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
    <div className="flex h-[calc(100vh-120px)] flex-col rounded-xl border border-os-border bg-os-surface overflow-hidden">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-os-border bg-os-bg2 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-os-text">
          <Terminal className="h-4 w-4 text-os-accent" />
          <span className="font-bold uppercase tracking-wider">Asteria Command Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase text-os-dim">Target Agent:</span>
          <select
            value={targetAgent}
            onChange={(e) => setTargetAgent(e.target.value)}
            className="rounded-md border border-os-border bg-os-bg px-2.5 py-1 font-mono text-xs text-os-text outline-none focus:border-os-accent"
          >
            <option value="conductor">★ Conductor (Auto-Route)</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border font-mono text-xs ${
                m.sender === 'user'
                  ? 'border-os-accent/30 bg-os-accent/10 text-os-accent'
                  : 'border-os-border bg-os-bg2 text-os-text'
              }`}
            >
              {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-os-accent" />}
            </div>

            <div className={`max-w-[80%] flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="mb-1 flex items-center gap-2 font-mono text-[10px] text-os-dim">
                <span className="font-semibold text-os-muted">{m.sender === 'user' ? 'Operator' : m.agentName}</span>
                {m.routedTo && (
                  <span className="rounded bg-os-accent/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-os-accent">
                    routed to @{m.routedTo}
                  </span>
                )}
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`rounded-xl px-4 py-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-os-accent text-os-accent-ink font-medium shadow-sm'
                    : 'border border-os-border bg-os-bg text-os-text'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-os-border bg-os-bg2">
              <Sparkles className="h-4 w-4 animate-spin text-os-accent" />
            </div>
            <div className="font-mono text-xs text-os-dim animate-pulse">Processing command & executing agent tools...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Command suggestion chips */}
      <div className="flex flex-wrap items-center gap-2 border-t border-os-border bg-os-bg/50 px-4 py-2">
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
        className="flex items-center gap-2 border-t border-os-border bg-os-bg p-3"
      >
        <input
          type="text"
          placeholder={
            targetAgent === 'conductor'
              ? 'Command Asteria OS... (e.g. "@sdr-agent find leads" or "check system health")'
              : `Message ${agents.find((a) => a.id === targetAgent)?.name || targetAgent}...`
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 rounded-lg border border-os-border bg-os-surface px-4 py-2.5 text-xs text-os-text outline-none focus:border-os-accent"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-os-accent px-4 py-2.5 font-mono text-xs font-bold text-os-accent-ink transition-opacity disabled:opacity-50 hover:opacity-90"
        >
          <span>Send</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
