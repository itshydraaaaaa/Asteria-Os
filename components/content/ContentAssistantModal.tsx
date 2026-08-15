'use client';

import { useState } from 'react';
import { Sparkles, X, Compass, Calendar, FileText, Repeat, ExternalLink, CheckCircle } from 'lucide-react';
import type { AgentReachSearchResult } from '@/lib/connectors/agent-reach';

export function ContentAssistantModal({
  isOpen,
  onClose,
  onGenerated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerated?: () => void;
}) {
  const [mode, setMode] = useState<'TREND_SCAN' | 'CALENDAR' | 'CAPTION_BATCH' | 'REPURPOSE'>('TREND_SCAN');
  const [topic, setTopic] = useState('AI Automation & Agentic Workflows');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['web', 'youtube', 'twitter', 'linkedin']);
  const [loading, setLoading] = useState(false);
  const [resultDigest, setResultDigest] = useState('');
  const [sources, setSources] = useState<AgentReachSearchResult[]>([]);
  const [draftsCount, setDraftsCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResultDigest('');
    setSources([]);
    setDraftsCount(null);
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, topic, platforms: selectedPlatforms }),
      });
      const data = await res.json();
      if (data.success) {
        setResultDigest(data.digest || '');
        setSources(data.sources || []);
        setDraftsCount(data.drafts?.length || 0);
        if (onGenerated) onGenerated();
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl border border-os-border bg-os-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-os-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-os-accent/10 text-os-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-os-text">Content Assistant</h3>
              <p className="text-[11px] text-os-dim">Agent Reach Research & Content Generation Pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-os-dim hover:text-os-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { id: 'TREND_SCAN', label: 'Trend Scan', icon: Compass },
            { id: 'CALENDAR', label: 'Calendar', icon: Calendar },
            { id: 'CAPTION_BATCH', label: 'Caption Batch', icon: FileText },
            { id: 'REPURPOSE', label: 'Repurpose', icon: Repeat },
          ].map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs transition-all ${
                  active
                    ? 'border-os-accent bg-os-accent/10 text-os-accent font-medium'
                    : 'border-os-border bg-os-surface2 text-os-muted hover:border-os-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-1">
              Topic / Focus Area
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-md border border-os-border bg-os-surface2 px-3 py-2 text-xs text-os-text focus:border-os-accent focus:outline-none"
              placeholder="e.g. Next.js App Router, AI Agency Workflows..."
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-1.5">
              Research Channels (Agent Reach)
            </label>
            <div className="flex flex-wrap gap-2">
              {['web', 'youtube', 'rss', 'github', 'twitter', 'linkedin'].map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`rounded-full px-3 py-1 text-[11px] font-mono border transition-all ${
                    selectedPlatforms.includes(p)
                      ? 'border-os-accent bg-os-accent/20 text-os-accent'
                      : 'border-os-border bg-os-surface2 text-os-dim hover:text-os-text'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Result Area */}
        {resultDigest && (
          <div className="mt-5 rounded-lg border border-os-accent/30 bg-os-accent/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-os-accent">
              <CheckCircle className="h-4 w-4" />
              <span>Generation Output</span>
              {draftsCount !== null && (
                <span className="ml-auto text-[11px] text-os-ok font-mono">
                  + {draftsCount} Draft{draftsCount === 1 ? '' : 's'} Created (Status: DRAFT)
                </span>
              )}
            </div>
            <pre className="text-[11.5px] font-mono text-os-text whitespace-pre-wrap max-h-40 overflow-y-auto">
              {resultDigest}
            </pre>

            {sources.length > 0 && (
              <div className="pt-2 border-t border-os-accent/20">
                <span className="text-[10px] font-mono uppercase tracking-wider text-os-dim">Source Intelligence</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {sources.slice(0, 3).map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10.5px] text-os-accent hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>{s.title.slice(0, 30)}...</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-os-border pt-4">
          <span className="text-[10.5px] text-os-dim">Drafts land in queue with status: DRAFT for human approval.</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-os-muted hover:text-os-text">
              Close
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md bg-os-accent px-4 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{loading ? 'Scanning & Generating...' : 'Run Generation'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
