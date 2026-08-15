import { readdirSync } from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/data';
import { PageHeader } from '@/components/PageHeader';
import { Badge, SectionHead } from '@/components/terminal';
import { agentReachStatus } from '@/lib/connectors/agent-reach';
import { zernioStatus } from '@/lib/connectors/zernio';
import { SocialAutomationStudio } from '@/components/social/SocialAutomationStudio';
import { SocialDraftsManager } from '@/components/social/SocialDraftsManager';
import { Sparkles, Bot, Radio, Compass, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SocialAutomationPage() {
  const db = getDb();
  const reachStatus = await agentReachStatus();
  const zStatus = await zernioStatus();

  // Load drafts from social_posts table
  const allPosts = db.socialPosts.all();
  const draftPosts = allPosts.filter((p) => p.status === 'draft');

  // Load G-Brain notes for context sourcing dropdown
  let brainNotesCount = 0;
  try {
    const brainDir = path.join(process.cwd(), 'brain');
    brainNotesCount = readdirSync(brainDir).filter((f) => f.endsWith('.md')).length;
  } catch {
    brainNotesCount = 12;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ai content studio & trend intelligence"
        title="Social Automation"
        right={
          <div className="flex items-center gap-2">
            <Badge tone={reachStatus.state === 'connected' ? 'ok' : 'warn'}>
              Agent Reach · {reachStatus.state}
            </Badge>            <Badge tone={zStatus.state === 'connected' ? 'ok' : 'warn'}>
              Zernio · {zStatus.state}
            </Badge>
          </div>
        }
      />

      {/* Metric Tiles */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg-t border border-os-border bg-os-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-os-dim">Draft Queue</span>
            <Sparkles className="h-4 w-4 text-os-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-os-accent">{draftPosts.length}</span>
            <span className="text-xs text-os-dim">posts awaiting review</span>
          </div>
        </div>

        <div className="rounded-lg-t border border-os-border bg-os-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-os-dim">Research Layer</span>
            <Compass className="h-4 w-4 text-os-ok" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-os-text">Agent Reach</span>
            <span className="text-xs text-os-ok font-mono">{reachStatus.state}</span>
          </div>
        </div>

        <div className="rounded-lg-t border border-os-border bg-os-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-os-dim">Content Agent</span>
            <Bot className="h-4 w-4 text-os-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-os-text">Social Strategist</span>
            <span className="text-xs text-os-dim">active</span>
          </div>
        </div>

        <div className="rounded-lg-t border border-os-border bg-os-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-os-dim">G-Brain Context</span>
            <Radio className="h-4 w-4 text-os-accent" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-os-text">{brainNotesCount}</span>
            <span className="text-xs text-os-dim">notes available</span>
          </div>
        </div>
      </section>

      {/* Main AI Generation Studio */}
      <section>
        <SectionHead label="AI Content Generation Studio" count="Agent Reach + Social Strategist" />
        <SocialAutomationStudio />
      </section>

      {/* Draft Approval & Queue Manager */}
      <section>
        <SectionHead label="Draft Review & Approval Station" count={`${draftPosts.length} pending draft${draftPosts.length === 1 ? '' : 's'}`} />
        <SocialDraftsManager initialDrafts={draftPosts} />
      </section>

      {/* Automated Task Trigger Info */}
      <section className="rounded-lg border border-os-border bg-os-surface p-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-os-accent font-semibold">
            <Bot className="h-4 w-4" />
            <span>Weekly Automated Slate Proposal</span>
          </div>
          <Link href="/tasks" className="inline-flex items-center gap-1 text-os-dim hover:text-os-accent font-mono text-[11px]">
            View in Task Board <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <p className="mt-2 text-os-dim leading-relaxed">
          The Social Strategist agent runs every Sunday via <code className="text-os-text font-mono">agent_tasks</code> to scan live trend signals across Web, YouTube, RSS, and GitHub. Proposed content slates land directly in this queue as DRAFT posts waiting for your review.
        </p>
      </section>
    </div>
  );
}
