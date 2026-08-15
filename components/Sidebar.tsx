'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_OPERATE, NAV_AGENTS, NAV_INTELLIGENCE, NAV_SYSTEM, NAV_LIBRARY, type NavItem } from '@/lib/nav';
import { AsteriaMark } from '@/components/AsteriaMark';

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-2">
      <div className="px-3 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-os-dim font-medium">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-os-accent/10 text-os-accent font-semibold shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                  : 'text-os-muted hover:bg-os-surface2 hover:text-os-text'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-os-accent shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  active ? 'text-os-accent' : 'text-os-dim group-hover:text-os-text'
                }`}
                strokeWidth={1.8}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [live, setLive] = useState<{ up: number; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/connections')
      .then((res) => res.json())
      .then((body: { connections?: { state: string }[] }) => {
        if (cancelled || !Array.isArray(body.connections)) return;
        setLive({
          up: body.connections.filter((c) => c.state === 'connected').length,
          total: body.connections.length,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[232px] flex-col border-r border-os-border bg-os-bg/95 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 pb-4 pt-5 border-b border-os-border/60">
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-1 rounded-full bg-os-accent/20 blur-md" />
          <AsteriaMark size={32} className="relative shrink-0 text-os-accent" />
        </div>
        <div>
          <div className="text-[13.5px] font-extrabold tracking-[0.12em] text-os-text uppercase">ASTERIA OS</div>
          <div className="mt-0.5 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.14em] text-os-accent font-medium">
            Agency Command Deck
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-3">
        <NavGroup title="Operate" items={NAV_OPERATE} pathname={pathname} />
        <NavGroup title="Agents" items={NAV_AGENTS} pathname={pathname} />
        <NavGroup title="Intelligence" items={NAV_INTELLIGENCE} pathname={pathname} />
        <NavGroup title="System" items={NAV_SYSTEM} pathname={pathname} />
        <NavGroup title="Variants" items={NAV_LIBRARY} pathname={pathname} />
      </nav>

      {/* System Status Footer */}
      <div className="flex flex-col gap-2 border-t border-os-border/60 px-4 py-3.5 bg-os-surface/40">
        <div className="flex items-center justify-between font-mono text-[10.5px]">
          <span className="flex items-center gap-2 text-os-muted">
            <span className="h-2 w-2 rounded-full bg-os-ok animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span>Systems</span>
          </span>
          <span className="font-semibold text-os-ok">{live ? `${live.up}/${live.total} Connected` : 'Active'}</span>
        </div>
        <div className="whitespace-nowrap font-mono text-[9.5px] text-os-dim">
          localhost:4100 · sqlite · real agents
        </div>
      </div>
    </aside>
  );
}
