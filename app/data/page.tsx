'use client';

import { useState } from 'react';
import { Database, GitCompare, Table as TableIcon, Layers, Sparkles } from 'lucide-react';
import { DataChangesModal } from '@/components/data/DataChangesModal';

export default function DataPage() {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between border-b border-os-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-os-accent font-mono text-xs font-bold text-os-ink">
              <Database className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-lg font-bold text-os-text">Data, Notes & Changes Workspace</h1>
            <span className="rounded-full bg-os-ok/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-os-ok">
              ● Live DB & Vault Synced
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-os-dim">
            Inspect real-time database tables, view execution outputs, compare state diffs, and explore Obsidian brain notes.
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-os-border bg-os-surface overflow-hidden">
        <DataChangesModal
          isOpen={true}
          onClose={() => {}}
          title="Asteria OS Live Data & Changes Explorer"
          subtitle="Explore all 130+ Obsidian notes, agent runs, messages, tasks, and state diffs"
          defaultTab="explorer"
        />
      </div>
    </div>
  );
}
