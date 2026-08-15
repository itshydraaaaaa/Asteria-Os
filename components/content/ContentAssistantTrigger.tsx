'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { ContentAssistantModal } from './ContentAssistantModal';

export function ContentAssistantTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-os-accent px-3 py-1.5 text-xs font-semibold text-black transition-all hover:opacity-90 shadow-md"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>+ Generate Drafts (Agent Reach)</span>
      </button>

      <ContentAssistantModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
