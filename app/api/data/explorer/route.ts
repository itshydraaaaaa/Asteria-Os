import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { readVaultNotes } from '@/lib/connectors/obsidian';

export async function GET(req: Request | NextRequest) {
  try {
    const db = getDb();
    const url = new URL(req.url);
    const table = url.searchParams.get('table') || 'all';
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10), 1), 500);
    const search = (url.searchParams.get('search') || '').toLowerCase().trim();

    const safeCount = (fn: () => any[]): number => {
      try {
        return fn().length;
      } catch {
        return 0;
      }
    };

    const safeFetch = (fn: () => any[]): any[] => {
      try {
        return fn();
      } catch {
        return [];
      }
    };

    // Table statistics
    const stats = {
      agent_runs: safeCount(() => db.agentRuns.recent(500)),
      agent_messages: safeCount(() => db.agentMessages.recent(500)),
      obsidian_vault: safeCount(() => readVaultNotes()),
      social_posts: safeCount(() => db.socialPosts.all()),
      funnel_contacts: safeCount(() => db.funnel.journeys()),
      roadmap_items: safeCount(() => db.roadmap.all()),
      metrics: safeCount(() => db.metrics.all()),
      tools: safeCount(() => db.tools.all()),
      departments: safeCount(() => db.departments.all()),
      agents: safeCount(() => db.agents.all()),
      sops: safeCount(() => db.sopTasks.all()),
      skills: safeCount(() => db.skills.all()),
      broadcasts: safeCount(() => db.broadcasts.recent(100)),
    };

    if (table === 'all') {
      return NextResponse.json({
        ok: true,
        stats,
        availableTables: Object.keys(stats),
        recentActivity: safeFetch(() => db.agentRuns.recent(15)),
      });
    }

    let rows: any[] = [];

    switch (table) {
      case 'agent_runs': {
        rows = safeFetch(() => db.agentRuns.recent(limit));
        break;
      }
      case 'agent_messages': {
        rows = safeFetch(() => db.agentMessages.recent(limit));
        break;
      }
      case 'obsidian_vault': {
        const notes = safeFetch(() => readVaultNotes());
        rows = notes.map((n, idx) => ({
          id: `note-${idx}`,
          path: n.path,
          title: n.path.split('/').pop()?.replace('.md', '') || n.path,
          content: n.content,
          snippet: n.content.slice(0, 240).replace(/\n+/g, ' '),
          length: n.content.length,
        }));
        break;
      }
      case 'social_posts': {
        rows = safeFetch(() => db.socialPosts.all());
        break;
      }
      case 'funnel_contacts': {
        rows = safeFetch(() => db.funnel.journeys());
        break;
      }
      case 'roadmap_items': {
        rows = safeFetch(() => db.roadmap.all());
        break;
      }
      case 'metrics': {
        rows = safeFetch(() => db.metrics.all());
        break;
      }
      case 'tools': {
        rows = safeFetch(() => db.tools.all());
        break;
      }
      case 'departments': {
        rows = safeFetch(() => db.departments.all());
        break;
      }
      case 'agents': {
        rows = safeFetch(() => db.agents.all());
        break;
      }
      case 'sops': {
        rows = safeFetch(() => db.sopTasks.all());
        break;
      }
      case 'skills': {
        rows = safeFetch(() => db.skills.all());
        break;
      }
      case 'broadcasts': {
        rows = safeFetch(() => db.broadcasts.recent(limit));
        break;
      }
      default: {
        return NextResponse.json({ ok: false, error: `Unknown table: ${table}` }, { status: 400 });
      }
    }

    if (search) {
      rows = rows.filter((r) => {
        const jsonStr = JSON.stringify(r).toLowerCase();
        return jsonStr.includes(search);
      });
    }

    const total = rows.length;
    const paginated = rows.slice(0, limit);

    return NextResponse.json({
      ok: true,
      table,
      total,
      limit,
      stats,
      rows: paginated,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
