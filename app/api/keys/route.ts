import { NextResponse } from 'next/server';
import path from 'node:path';
import { z } from 'zod';
import { KEY_SLOTS, listKeyStatuses, upsertEnvLocal } from '@/lib/keys';

export const dynamic = 'force-dynamic';

const ENV_LOCAL = path.join(process.cwd(), '.env.local');

export async function GET() {
  // masked statuses only — raw values never cross this boundary
  return NextResponse.json({ keys: listKeyStatuses() });
}

const SetKeySchema = z.object({
  envVar: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).optional(),
  value: z.string().min(1).max(4096).optional(),
  bulkText: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = SetKeySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { envVar, value, bulkText } = parsed.data;

  if (bulkText) {
    const updatedKeys: string[] = [];
    // Try parsing as JSON (e.g. mcp.json) or as .env key-value lines
    let toSave: Record<string, string> = {};
    if (bulkText.trim().startsWith('{')) {
      try {
        const json = JSON.parse(bulkText);
        // Extract env entries from MCP servers if present
        if (json.mcpServers) {
          for (const s of Object.values(json.mcpServers as Record<string, any>)) {
            if (s.env && typeof s.env === 'object') {
              Object.assign(toSave, s.env);
            }
          }
        } else if (typeof json === 'object') {
          for (const [k, v] of Object.entries(json)) {
            if (typeof v === 'string') toSave[k] = v;
          }
        }
      } catch {
        // Not valid JSON, process as line-based env
      }
    }

    if (Object.keys(toSave).length === 0) {
      const lines = bulkText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().replace(/^export\s+/, '');
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const k = trimmed.slice(0, eq).trim();
          let v = trimmed.slice(eq + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (k && v) toSave[k] = v;
        }
      }
    }

    for (const [k, v] of Object.entries(toSave)) {
      upsertEnvLocal(ENV_LOCAL, k, v);
      process.env[k] = v;
      updatedKeys.push(k);
    }

    return NextResponse.json({ ok: true, count: updatedKeys.length, updatedKeys });
  }

  if (!envVar || !value) {
    return NextResponse.json({ error: 'envVar and value required' }, { status: 400 });
  }

  if (!KEY_SLOTS.some((s) => s.envVar === envVar)) {
    return NextResponse.json({ error: `unknown key slot: ${envVar}` }, { status: 400 });
  }
  upsertEnvLocal(ENV_LOCAL, envVar, value);
  process.env[envVar] = value; // live immediately; .env.local persists across restarts
  return NextResponse.json({ ok: true, envVar });
}
