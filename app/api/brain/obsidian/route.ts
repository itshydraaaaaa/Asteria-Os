import { NextResponse } from 'next/server';
import {
  readVaultNotes,
  searchVaultNotes,
  getVaultNote,
  obsidianStatus,
  getVaultPaths,
} from '@/lib/connectors/obsidian';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');
  const notePath = url.searchParams.get('path');
  const limit = parseInt(url.searchParams.get('limit') ?? '10', 10);

  if (notePath) {
    const note = getVaultNote(notePath);
    if (!note) {
      return NextResponse.json({ error: `Note not found: ${notePath}` }, { status: 404 });
    }
    return NextResponse.json(note);
  }

  if (query) {
    const results = searchVaultNotes(query, limit);
    return NextResponse.json({ query, count: results.length, results });
  }

  const status = await obsidianStatus();
  const allNotes = readVaultNotes();
  const vaults = getVaultPaths();

  return NextResponse.json({
    status,
    vaultCount: vaults.length,
    vaults,
    noteCount: allNotes.length,
    notes: allNotes.slice(0, 30).map((n) => ({ path: n.path, excerpt: n.content.slice(0, 150) })),
  });
}
