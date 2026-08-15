'use client';

import { usePathname } from 'next/navigation';
import { Bot, Search, Command, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CONDUCTOR_OPEN_EVENT } from '@/components/ConductorPanel';

const SEGMENT_LABELS: Record<string, string> = {
  '': 'Home Deck',
  chat: 'Command Chat',
  social: 'Social Growth',
  comms: 'Unified Comms',
  agents: 'AI Workforce',
  tasks: 'Task Kanban',
  skills: 'Skills Catalog',
  org: 'Org Hierarchy',
  brain: 'G-Brain Knowledge',
  finances: 'Finances & Ledgers',
  funnel: 'Client Lead Funnel',
  workflows: 'Agency Workflows',
  integrations: 'Connections',
  roadmap: 'Roadmap Build',
  analytics: 'Platform Analytics',
  reference: 'Reference Model',
  personas: 'Personas',
};

export function openPalette() {
  window.dispatchEvent(new CustomEvent('alex:palette'));
}

export function Topbar() {
  const pathname = usePathname();
  const segment = pathname.split('/')[1] ?? '';
  const here = SEGMENT_LABELS[segment] ?? (segment ? segment.replace(/[-_]/g, ' ') : 'Home Deck');

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-os-border/60 bg-os-bg/85 px-6 backdrop-blur-xl">
      {/* Breadcrumb & Path */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <span className="text-os-dim font-medium">asteria-os</span>
        <span className="text-os-dim/50">/</span>
        <span className="font-semibold text-os-accent capitalize">{here}</span>
      </div>

      {/* Center Search Bar Trigger */}
      <button
        onClick={openPalette}
        className="hidden md:flex items-center gap-3 rounded-lg border border-os-border/70 bg-os-surface/60 px-3.5 py-1.5 text-xs text-os-dim hover:border-os-accent/40 hover:text-os-text hover:bg-os-surface transition-all shadow-inner w-72"
      >
        <Search className="h-3.5 w-3.5 text-os-dim" />
        <span className="flex-1 text-left">Search or type command...</span>
        <kbd className="flex items-center gap-0.5 rounded border border-os-border bg-os-surface2 px-1.5 py-0.5 font-mono text-[10px] text-os-dim">
          <Command className="h-3 w-3" /> K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Operator Badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-os-accent/30 bg-os-accent/10 px-3 py-1 font-mono text-[10.5px] text-os-accent font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Operator: Alex</span>
        </div>

        <ThemeToggle />

        {/* Mobile Search Button */}
        <button
          onClick={openPalette}
          title="Command Palette (⌘K)"
          className="md:hidden grid h-8 w-8 place-items-center rounded-lg border border-os-border bg-os-surface text-os-muted hover:border-os-accent hover:text-os-accent transition-all"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Conductor Assistant Trigger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(CONDUCTOR_OPEN_EVENT))}
          title="Ask the Conductor about this screen"
          aria-label="Open the Conductor agent panel"
          className="flex items-center gap-1.5 rounded-lg border border-os-accent/40 bg-os-accent/10 px-3 py-1.5 text-xs font-semibold text-os-accent hover:bg-os-accent/20 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Conductor</span>
        </button>
      </div>
    </header>
  );
}
