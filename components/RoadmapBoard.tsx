'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/terminal';
import type { RoadmapStatus } from '@/lib/schemas';

const STATUS_BADGE: Record<RoadmapStatus, { tone: BadgeTone; ghost: boolean; label: string }> = {
  done: { tone: 'ok', ghost: false, label: 'Done' },
  now: { tone: 'accent', ghost: false, label: 'Now' },
  next: { tone: 'warn', ghost: false, label: 'Next' },
  later: { tone: 'default', ghost: true, label: 'Later' },
};

const NEXT_STATUS: Record<RoadmapStatus, RoadmapStatus> = {
  later: 'next',
  next: 'now',
  now: 'done',
  done: 'later',
};

type Item = {
  id: string;
  title: string;
  quarter: string;
  status: RoadmapStatus;
  departmentId: string | null;
  description: string;
};

type QuarterGroup = {
  quarter: string;
  items: Item[];
};

export function RoadmapBoard({
  initialQuarters,
  departmentsMap,
}: {
  initialQuarters: QuarterGroup[];
  departmentsMap: Record<string, string>;
}) {
  const [quarters, setQuarters] = useState<QuarterGroup[]>(initialQuarters);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [quarter, setQuarter] = useState('2026-Q3');
  const [status, setStatus] = useState<RoadmapStatus>('planned' as any);
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          quarter,
          status: status === ('planned' as any) ? 'next' : status,
          description: description.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          setQuarters((prev) => {
            const nextQ = [...prev];
            const qIdx = nextQ.findIndex((q) => q.quarter === quarter);
            if (qIdx >= 0) {
              nextQ[qIdx] = {
                ...nextQ[qIdx],
                items: [data.item, ...nextQ[qIdx].items],
              };
            } else {
              nextQ.push({ quarter, items: [data.item] });
            }
            return nextQ;
          });
          setTitle('');
          setDescription('');
          setIsAdding(false);
        }
      }
    } catch {
      /* network error */
    }
  };

  const handleCycleStatus = async (item: Item) => {
    const nextS = NEXT_STATUS[item.status] || 'now';
    try {
      setQuarters((prev) =>
        prev.map((q) => ({
          ...q,
          items: q.items.map((i) => (i.id === item.id ? { ...i, status: nextS } : i)),
        })),
      );
      await fetch('/api/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: nextS }),
      });
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 rounded-md border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3 py-1.5 font-mono text-[12px] font-medium text-os-accent transition-colors hover:bg-os-surface2"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Milestone
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-os-border bg-os-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-os-text">
              Create Roadmap Milestone
            </span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-os-dim hover:text-os-text">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="Milestone title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-md border border-os-border bg-os-bg px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
              autoFocus
            />
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="rounded-md border border-os-border bg-os-bg px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
            >
              <option value="2026-Q1">2026 · Q1</option>
              <option value="2026-Q2">2026 · Q2</option>
              <option value="2026-Q3">2026 · Q3</option>
              <option value="2026-Q4">2026 · Q4</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-os-accent px-4 py-1.5 font-mono text-xs font-bold text-os-accent-ink transition-opacity hover:opacity-90"
            >
              Save Milestone
            </button>
          </div>
          <input
            type="text"
            placeholder="Short description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-3 w-full rounded-md border border-os-border bg-os-bg px-3 py-1.5 text-xs text-os-text outline-none focus:border-os-accent"
          />
        </form>
      )}

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4 ultra:grid-cols-6">
        {quarters.map(({ quarter: qName, items }) => {
          const doneN = items.filter((r) => r.status === 'done').length;
          return (
            <section key={qName}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold tracking-[0.12em]">
                  {qName.replace('-', ' · ')}
                </span>
                <span className="font-mono text-[10px] text-os-dim">
                  {doneN}/{items.length} done
                </span>
                <span className="h-px flex-1 bg-os-border" />
              </div>
              <div className="flex flex-col gap-2.5">
                {items.map((item) => {
                  const badge = STATUS_BADGE[item.status] || STATUS_BADGE.later;
                  const deptName = item.departmentId ? departmentsMap[item.departmentId] : null;
                  const done = item.status === 'done';
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleCycleStatus(item)}
                      title="Click to cycle status"
                      className={`hoverable cursor-pointer rounded-lg-t border border-os-border bg-os-surface px-[15px] py-3 transition-opacity ${
                        done ? 'opacity-[0.62]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div
                          className={`text-[12.5px] font-semibold leading-snug ${
                            done ? 'text-os-muted line-through decoration-os-dim' : ''
                          }`}
                        >
                          {item.title}
                        </div>
                        <Badge tone={badge.tone} ghost={badge.ghost}>
                          {badge.label}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1.5 text-[11px] leading-relaxed text-os-dim [text-wrap:pretty]">
                          {item.description}
                        </p>
                      )}
                      {deptName && (
                        <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[9.5px] text-os-muted">
                          <span className="h-[5px] w-[5px] rounded-sm bg-os-accent" />
                          {deptName}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
