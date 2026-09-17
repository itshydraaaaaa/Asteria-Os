'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Compass, Calendar, FileText, Repeat, ExternalLink, CheckCircle, Clapperboard } from 'lucide-react';
import type { AgentReachSearchResult } from '@/lib/connectors/agent-reach';
import type { ReelPackage } from '@/app/api/social/generate/route';
import { ReelReviewStation } from '@/components/social/ReelReviewStation';

export function SocialAutomationStudio() {
  const router = useRouter();
  const [mode, setMode] = useState<'REELS' | 'TREND_SCAN' | 'CALENDAR' | 'CAPTION_BATCH' | 'REPURPOSE'>('REELS');
  const [topic, setTopic] = useState('Why Autonomous AI Workflows Beat Retainers in 2026');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin']);
  const [loading, setLoading] = useState(false);
  const [resultDigest, setResultDigest] = useState('');
  const [sources, setSources] = useState<AgentReachSearchResult[]>([]);
  const [generatedCount, setGeneratedCount] = useState<number | null>(null);
  const [reelPackage, setReelPackage] = useState<ReelPackage | null>(null);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const PRESETS = [
    'Why Autonomous AI Workflows Beat Retainers in 2026',
    'The $100B Gaming Industry Crash & How to Adapt',
    '3 Automations Every Agency Needs to Run This Week',
    'How We Scaled Founder OS to $50k/mo with Zero Employees',
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setResultDigest('');
    setSources([]);
    setGeneratedCount(null);
    setReelPackage(null);
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
        if (data.reelPackage) {
          setReelPackage(data.reelPackage);
        }
        router.refresh();
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { id: 'REELS', label: '1. Reels & Shorts Studio', sub: '9:16 Script + Viral Reviewer', icon: Clapperboard, highlight: true },
          { id: 'TREND_SCAN', label: '2. Trend Scan', sub: 'Agent Reach intelligence', icon: Compass },
          { id: 'CAPTION_BATCH', label: '3. Caption Batch', sub: 'Multi-platform captions', icon: FileText },
          { id: 'CALENDAR', label: '4. Content Calendar', sub: 'Weekly post schedule', icon: Calendar },
          { id: 'REPURPOSE', label: '5. Repurpose Note', sub: 'From G-Brain / Roadmap', icon: Repeat },
        ].map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id as any)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                active
                  ? 'border-os-accent bg-os-accent/15 text-os-accent font-semibold ring-1 ring-os-accent/50'
                  : 'border-os-border bg-os-surface2 text-os-muted hover:border-os-text'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">{m.label}</span>
              </div>
              <span className="text-[10px] text-os-dim">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Input Configuration */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-1">
            Topic / Video Core Concept
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
            Target Distribution Channels
          </label>
          <div className="flex flex-wrap gap-2">
            {['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'web'].map((p) => (
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

      {/* Main Action Bar */}
      <div className="flex items-center justify-between border-t border-os-border pt-4">
        <span className="text-[11px] text-os-dim">
          {mode === 'REELS'
            ? 'Produces 3 hooks, 4 scene breakdowns, teleprompter script & viral reviewer audit.'
            : 'Generated posts land safely as DRAFT for human operator review.'}
        </span>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-md bg-os-accent px-5 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
        >
          <Sparkles className="h-4 w-4" />
          <span>{loading ? 'Scriptwriter & Reviewer Running...' : 'Generate 9:16 Reel Package'}</span>
        </button>
      </div>

      {/* Interactive Reel Review Station Output */}
      {reelPackage && (
        <div className="pt-2">
          <ReelReviewStation
            reel={reelPackage}
            onApprove={() => {
              router.refresh();
            }}
          />
        </div>
      )}

      {/* Standard Digest Output Box (if not reels mode or extra info) */}
      {!reelPackage && resultDigest && (
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
              <span className="text-[10px] font-mono uppercase tracking-wider text-os-dim">
                Source Intelligence
              </span>
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
    </div>
  );
}
