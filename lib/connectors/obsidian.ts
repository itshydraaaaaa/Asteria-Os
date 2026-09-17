import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { z } from 'zod';
import type { ConnectorStatus } from '@/lib/connectors/types';
import type { LlmToolSpec } from '@/lib/connectors/llm';

const DEFAULT_VAULTS = [
  path.join(os.homedir(), 'Downloads', 'Asteria_OS_Obsidian_Vault', 'Asteria_OS'),
  path.join(os.homedir(), 'Downloads', 'Asteria', 'Asteria'),
  path.join(os.homedir(), 'Documents', 'Notes Vault'),
];

export function getVaultPaths(): string[] {
  const envVaults = process.env.OBSIDIAN_VAULT;
  if (envVaults) {
    const parsed = envVaults
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter((s) => s && fs.existsSync(s));
    if (parsed.length > 0) return parsed;
  }
  return DEFAULT_VAULTS.filter((p) => fs.existsSync(p));
}

const WALK_CAP = 5000;
const NOTE_CONTENT_CAP = 20_000;

export type VaultNote = {
  path: string;
  vaultName: string;
  title: string;
  content: string;
};

/**
 * Read markdown notes from all configured/detected Obsidian vaults.
 */
export function readVaultNotes(customVaultPath?: string): { path: string; content: string }[] {
  const vaultPaths = customVaultPath ? [customVaultPath] : getVaultPaths();
  const notes: { path: string; content: string }[] = [];
  const state = { visited: 0 };

  for (const vPath of vaultPaths) {
    const vaultBaseName = path.basename(vPath);
    const walk = (dir: string) => {
      if (state.visited > WALK_CAP) return;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        state.visited++;
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name.endsWith('.md')) {
          try {
            const rel = path.relative(vPath, full).split(path.sep).join('/');
            const displayPath = vaultPaths.length > 1 ? `${vaultBaseName}/${rel}` : rel;
            notes.push({
              path: displayPath,
              content: fs.readFileSync(full, 'utf8').slice(0, NOTE_CONTENT_CAP),
            });
          } catch {
            // unreadable file — skip it
          }
        }
      }
    };
    walk(vPath);
  }

  return notes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Search across all Obsidian vault notes by query keyword or regex.
 */
export function searchVaultNotes(query: string, limit: number = 8): Array<{
  path: string;
  title: string;
  snippet: string;
  score: number;
}> {
  if (!query || !query.trim()) return [];
  const notes = readVaultNotes();
  const lowerQuery = query.toLowerCase().trim();
  const queryTerms = lowerQuery.split(/\s+/).filter((t) => t.length > 1);

  const scored = notes.map((n) => {
    const lowerPath = n.path.toLowerCase();
    const lowerContent = n.content.toLowerCase();
    const title = path.basename(n.path, '.md');
    let score = 0;

    if (lowerPath.includes(lowerQuery)) score += 10;
    if (title.toLowerCase().includes(lowerQuery)) score += 8;

    for (const term of queryTerms) {
      if (title.toLowerCase().includes(term)) score += 4;
      if (lowerPath.includes(term)) score += 3;
      const contentMatches = (lowerContent.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(contentMatches, 5);
    }

    let snippet = '';
    const matchIdx = lowerContent.indexOf(lowerQuery) !== -1 ? lowerContent.indexOf(lowerQuery) : lowerContent.indexOf(queryTerms[0] || '');
    if (matchIdx !== -1) {
      const start = Math.max(0, matchIdx - 80);
      const end = Math.min(n.content.length, matchIdx + 220);
      snippet = n.content.slice(start, end).replace(/\n+/g, ' ').trim();
    } else {
      snippet = n.content.slice(0, 200).replace(/\n+/g, ' ').trim();
    }

    return {
      path: n.path,
      title,
      snippet: snippet ? `...${snippet}...` : '',
      score,
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get full text of a specific vault note by its relative path.
 */
export function getVaultNote(notePath: string): { path: string; content: string } | null {
  const notes = readVaultNotes();
  const target = notePath.toLowerCase().trim();
  const found = notes.find((n) => n.path.toLowerCase() === target || n.path.toLowerCase().endsWith(target));
  return found ?? null;
}

/**
 * Obsidian LLM tool specifications for AI Agents & Conductor.
 */
export function obsidianChatTools(): LlmToolSpec[] {
  return [
    {
      name: 'search_obsidian_notes',
      description: 'Search across all notes, SOPs, strategy docs, and character bibles in the Obsidian Brain vault.',
      parameters: z.object({
        query: z.string().describe('The topic, keyword, or decision to look up in the Obsidian vault.'),
      }),
      async execute(args) {
        const query = typeof args.query === 'string' ? args.query : '';
        const results = searchVaultNotes(query, 5);
        if (results.length === 0) {
          return { found: 0, message: `No notes found matching "${query}" in the Obsidian vault.` };
        }
        return {
          found: results.length,
          results: results.map((r) => ({ path: r.path, title: r.title, snippet: r.snippet })),
        };
      },
    },
    {
      name: 'read_obsidian_note',
      description: 'Read the full contents of a specific markdown note from the Obsidian vault.',
      parameters: z.object({
        path: z.string().describe('The relative path of the note to read (e.g. "00_SYSTEM/Command Center.md").'),
      }),
      async execute(args) {
        const notePath = typeof args.path === 'string' ? args.path : '';
        const note = getVaultNote(notePath);
        if (!note) {
          return { error: `Note "${notePath}" not found in Obsidian vault.` };
        }
        return { path: note.path, content: note.content };
      },
    },
  ];
}

export async function obsidianStatus(): Promise<ConnectorStatus> {
  const vaultPaths = getVaultPaths();
  if (vaultPaths.length === 0) {
    return {
      id: 'obsidian',
      name: 'Obsidian Brain Vault',
      kind: 'knowledge',
      state: 'not_configured',
      detail: `No Obsidian vault found at configured paths — set OBSIDIAN_VAULT in .env.local.`,
    };
  }

  const allNotes = readVaultNotes();
  const vaultNames = vaultPaths.map((p) => path.basename(p)).join(', ');

  return {
    id: 'obsidian',
    name: 'Obsidian Brain Vault',
    kind: 'knowledge',
    state: 'connected',
    detail: `${allNotes.length.toLocaleString('en-US')} markdown notes indexed across vaults [${vaultNames}]`,
    meta: {
      notes: allNotes.length,
      vaultCount: vaultPaths.length,
      vaults: vaultPaths.join('; '),
    },
  };
}
