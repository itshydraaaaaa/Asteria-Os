import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { groupRoadmapByQuarter } from '@/lib/roadmap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  return NextResponse.json({ quarters: groupRoadmapByQuarter(db.roadmap.all()) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, quarter = '2026-Q3', status = 'planned', departmentId = null, description = '' } = body;
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    const db = getDb();
    const item = {
      id: `road-${Date.now()}`,
      title,
      quarter,
      status,
      departmentId: departmentId || null,
      description,
    };
    db.roadmap.insert(item);
    return NextResponse.json({ ok: true, item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, quarter, title } = body;
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const db = getDb();
    const existing = db.roadmap.all().find((i) => i.id === id);
    if (!existing) return NextResponse.json({ error: 'item not found' }, { status: 404 });
    const updated = {
      ...existing,
      status: status || existing.status,
      quarter: quarter || existing.quarter,
      title: title || existing.title,
    };
    db.roadmap.insert(updated);
    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
