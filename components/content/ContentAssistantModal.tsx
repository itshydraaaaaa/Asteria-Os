'use client';

import { useState } from 'react';
import { Sparkles, X, Compass, Calendar, FileText, Repeat, ExternalLink, CheckCircle, Clapperboard } from 'lucide-react';
import type { AgentReachSearchResult } from '@/lib/connectors/agent-reach';
import type { ReelPackage } from '@/app/api/social/generate/route';
import { ReelReviewStation } from '@/components/social/ReelReviewStation';

export function ContentAssistantModal({
  isOpen,
  onClose,
  onGenerated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerated?: () => void;
}) {
  const [mode, setMode] = useState<'REELS' | 'TREND_SCAN' | 'CALENDAR' | 'CAPTION_BATCH' | 'REPURPOSE'>('REELS');
  const [topic, setTopic] = useState('Why Autonomous AI Workflows Beat Retainers in 2026');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin']);
  const [loading, setLoading] = useState(false);
  const [resultDigest, setResultDigest] = useState('');
  const [sources, setSources] = useState<AgentReachSearchResult[]>([]);
  const [draftsCount, setDraftsCount] = useState<number | null>(null);
  const [reelPackage, setReelPackage] = useState<ReelPackage | null>(null);

  if (!isOpen) return null;

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setResultDigest('');
    setSources([]);
    setDraftsCount(null);
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
        setDraftsCount(data.drafts?.length || 0);
        if (data.reelPackage) {
          setReelPackage(data.reelPackage);
        }
        if (onGenerated) onGenerated();
      }
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-os-border bg-os-surface p-6 shadow-2xl space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-os-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-os-accent/10 text-os-accent">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-os-text">Content Assistant & Reels Studio</h3>
              <p className="text-[11px] text-os-dim">Multi-Agent Scriptwriting & Viral Reviewer Pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-os-dim hover:text-os-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'REELS', label: '1. Reels & Shorts', icon: Clapperboard },
            { id: 'TREND_SCAN', label: '2. Trend Scan', icon: Compass },
            { id: 'CAPTION_BATCH', label: '3. Captions', icon: FileText },
            { id: 'CALENDAR', label: '4. Calendar', icon: Calendar },
            { id: 'REPURPOSE', label: '5. Repurpose', icon: Repeat },
          ].map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs transition-all ${
                  active
                    ? 'border-os-accent bg-os-accent/15 text-os-accent font-medium ring-1 ring-os-accent/50'
                    : 'border-os-border bg-os-surface2 text-os-muted hover:border-os-text'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[11px] font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-1">
              Topic / Video Core Concept
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
              Target Distribution Channels
            </label>
            <div className="flex flex-wrap gap-2">
              {['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'web'].map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`rounded-full px-3 py-1 text-[11px] font-mono border transition-all ${
                    selectedPlatforms.includes(p)
                      ? 'border-os-accent bg-os-accent/20 text-os-accent font-semibold'
                      : 'border-os-border bg-os-surface2 text-os-dim hover:text-os-text'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between border-t border-os-border pt-4">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-xs text-os-muted hover:text-os-text">
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-os-accent px-5 py-2 text-xs font-bold text-black hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? 'Scriptwriter & Reviewer Running...' : 'Generate 9:16 Reel Package'}</span>
          </button>
        </div>

        {/* Output Area */}
        {reelPackage && (
          <div className="pt-2">
            <ReelReviewStation reel={reelPackage} onApprove={onClose} />
          </div>
        )}

        {!reelPackage && resultDigest && (
          <div className="rounded-lg border border-os-accent/30 bg-os-accent/5 p-4 space-y-3">
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
          </div>
        )}
      </div>
    </div>
  );
}
