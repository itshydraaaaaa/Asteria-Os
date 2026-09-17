'use client';

import { useState } from 'react';
import { Send, Trash2, CheckCircle2, Clock } from 'lucide-react';
import type { SocialPost } from '@/lib/schemas';

export function SocialDraftsManager({ initialDrafts }: { initialDrafts: SocialPost[] }) {
  const [drafts, setDrafts] = useState<SocialPost[]>(initialDrafts);
  const [actionId, setActionId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      // Approve and update status to queued
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'queued' }),
      });
      if (res.ok) {
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      // fallback
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch('/api/social/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // ignore
    }
  };

  if (drafts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-os-border bg-os-surface p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-os-ok mb-2 opacity-80" />
        <h4 className="font-semibold text-os-text text-sm">No Pending Drafts in Queue</h4>
        <p className="text-xs text-os-dim mt-1">
          Use the AI Content Generation Studio above to generate content slates via Agent Reach.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {drafts.map((d) => (
        <div key={d.id} className="flex flex-col justify-between rounded-lg border border-os-border bg-os-surface p-4 text-xs space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-os-accent font-semibold">
                {d.platforms.join(', ')}
              </span>
              <span className="rounded bg-os-surface2 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide text-os-warn border border-os-warn/30">
                DRAFT
              </span>
            </div>
            <pre className="mt-2.5 font-mono text-[11.5px] text-os-text whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
              {d.caption}
            </pre>
          </div>

          <div className="flex items-center justify-between border-t border-os-border pt-3">
            <div className="flex items-center gap-1 text-[10px] text-os-dim font-mono">
              <Clock className="h-3 w-3" />
              <span suppressHydrationWarning>{d.scheduledFor ? d.scheduledFor.slice(0, 10) : 'Scheduled'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(d.id)}
                className="rounded p-1 text-os-dim hover:text-os-err transition-colors"
                title="Delete Draft"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => handleApprove(d.id)}
                disabled={actionId === d.id}
                className="flex items-center gap-1 rounded bg-os-accent px-2.5 py-1 text-[11px] font-semibold text-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                <span>Approve & Schedule</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
