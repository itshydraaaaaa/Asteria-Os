'use client';

import { useState } from 'react';
import { Sparkles, Compass, Calendar, FileText, Repeat, ExternalLink, CheckCircle } from 'lucide-react';
import type { AgentReachSearchResult } from '@/lib/connectors/agent-reach';

export function SocialAutomationStudio() {
  const [mode, setMode] = useState<'TREND_SCAN' | 'CALENDAR' | 'CAPTION_BATCH' | 'REPURPOSE'>('TREND_SCAN');
  const [topic, setTopic] = useState('Autonomous AI Workflows & Agency Operations');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['web', 'youtube', 'twitter', 'linkedin']);
  const [loading, setLoading] = useState(false);
  const [resultDigest, setResultDigest] = useState('');
  const [sources, setSources] = useState<AgentReachSearchResult[]>([]);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const PRESETS = [
    'AI & Agency Automation',
    'Next.js 14 App Router Tech Stack',
    'Client Lead Funnel Optimization',
    'Building in Public: Founder OS',
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setResultDigest('');
    setSources([]);
    setGeneratedCount(null);
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
        setGeneratedCount(data.drafts?.length || 0);
        // Refresh window so draft manager updates instantly
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-os-border bg-os-surface p-6 shadow-lg space-y-6">
      {/* Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { id: 'TREND_SCAN', label: '1. Trend Scan', sub: 'Agent Reach research', icon: Compass },
          { id: 'CALENDAR', label: '2. Content Calendar', sub: 'Weekly post slots', icon: Calendar },
          { id: 'CAPTION_BATCH', label: '3. Caption Batch', sub: 'Multi-platform captions', icon: FileText },
          { id: 'REPURPOSE', label: '4. Repurpose Note', sub: 'From G-Brain / Roadmap', icon: Repeat },
        ].map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left transition-all ${
                active
                  ? 'border-os-accent bg-os-accent/10 text-os-accent font-semibold'
                  : 'border-os-border bg-os-surface2 text-os-muted hover:border-os-text'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">{m.label}</span>
              </div>
              <span className="text-[10.5px] text-os-dim">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Input Configuration */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-1">
            Topic / Core Focus
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-os-border bg-os-surface2 px-3 py-2 text-xs text-os-text focus:border-os-accent focus:outline-none"
            placeholder="Type topic or pick preset..."
          />
          {/* Quick Presets */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTopic(p)}
                className="rounded-full bg-os-surface2 px-2.5 py-0.5 text-[10px] font-mono text-os-dim hover:text-os-accent hover:bg-os-accent/10 border border-os-border transition-all"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-1.5">
            Target Research Channels (Agent Reach)
          </label>
          <div className="flex flex-wrap gap-2">
            {['web', 'youtube', 'rss', 'github', 'twitter', 'linkedin'].map((p) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-mono border transition-all ${
                  selectedPlatforms.includes(p)
                    ? 'border-os-accent bg-os-accent/20 text-os-accent font-medium'
                    : 'border-os-border bg-os-surface2 text-os-dim hover:text-os-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation Output Box */}
      {resultDigest && (
        <div className="rounded-lg border border-os-accent/40 bg-os-accent/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-os-accent">
              <CheckCircle className="h-4 w-4" />
              <span>Generation Complete & Saved to Draft Queue</span>
            </div>
            {generatedCount !== null && (
              <span className="font-mono text-xs text-os-ok">
                + {generatedCount} Draft Post{generatedCount === 1 ? '' : 's'} Created
              </span>
            )}
          </div>
          <pre className="text-[11.5px] font-mono text-os-text whitespace-pre-wrap max-h-48 overflow-y-auto">
            {resultDigest}
          </pre>

          {sources.length > 0 && (
            <div className="pt-2 border-t border-os-accent/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-os-dim">Agent Reach Source Intelligence</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {sources.slice(0, 4).map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10.5px] text-os-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{s.title.slice(0, 32)}...</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between border-t border-os-border pt-4">
        <span className="text-[11px] text-os-dim">
          All generated posts land safely as <code className="text-os-text font-mono">DRAFT</code> — human operator review required before publishing.
        </span>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-os-accent px-5 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
        >
          <Sparkles className="h-4 w-4" />
          <span>{loading ? 'Agent Reach Scanning...' : 'Run Content Generation'}</span>
        </button>
      </div>
    </div>
  );
}
