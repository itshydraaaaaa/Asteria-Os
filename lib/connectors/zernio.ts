import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CRED_FILES, resolveCred } from '@/lib/creds';
import type { ConnectorStatus } from '@/lib/connectors/types';

const CONFIG_PATH = path.join(os.homedir(), '.config/social', 'config.json');

type ZernioConfig = {
  baseUrl?: string;
  v1Url?: string;
  accounts?: Record<string, { handle?: string; followers?: number }>;
};

function readConfig(): ZernioConfig {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/** Account map from ~/.config/social/config.json — handles + follower counts. */
export function zernioAccounts(): Record<string, { handle?: string; followers?: number }> {
  return readConfig().accounts ?? {};
}

export function zernioKey(): string | undefined {
  return resolveCred('ZERNIO_API_KEY', [CRED_FILES.socialMedia, CRED_FILES.agentsEnv]);
}

// ── Live follower counts ────────────────────────────────────────────────────
// The static config.json numbers go stale; the real live counts come back from
// the Zernio/Late `/v1/accounts` payload at metadata.profileData.followersCount
// (with page fan_count as a fallback for Facebook-style accounts).

type FollowerMap = Record<string, { handle?: string; followers?: number }>;

function pickFollowers(account: unknown): number | undefined {
  const a = (account ?? {}) as Record<string, any>;
  const md = (a.metadata ?? {}) as Record<string, any>;
  const pages = Array.isArray(md.availablePages) ? md.availablePages : [];
  const candidates = [
    md?.profileData?.followersCount,
    md?.userProfile?.followersCount,
    a?.profileData?.followersCount,
    a?.followersCount,
    pages[0]?.fan_count,
  ];
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c) && c >= 0) return c;
  }
  return undefined;
}

/** Map a `/v1/accounts` payload to the {platform: {handle, followers}} shape the
    snapshot sync consumes. Accounts without a resolvable follower count are
    dropped — never a fake zero. */
export function parseLiveAccounts(raw: unknown): FollowerMap {
  const accounts = (raw as { accounts?: unknown })?.accounts;
  if (!Array.isArray(accounts)) return {};
  const out: FollowerMap = {};
  for (const account of accounts) {
    const a = (account ?? {}) as Record<string, any>;
    const platform = typeof a.platform === 'string' ? a.platform : null;
    if (!platform) continue;
    const followers = pickFollowers(a);
    if (followers == null) continue;
    const username = typeof a.username === 'string' ? a.username : typeof a.displayName === 'string' ? a.displayName : undefined;
    out[platform] = { handle: username ? `@${username}` : undefined, followers };
  }
  return out;
}

let liveAccountsCache: { at: number; data: FollowerMap } | null = null;
const LIVE_TTL_MS = 60_000;

/** Live follower counts straight from Zernio/Late. 60s in-memory cache so rapid
    re-renders don't re-hit the API; 6s timeout; falls back to the last good
    response (or {}) on error so a page render never hangs or blanks out. */
export async function zernioLiveAccounts(): Promise<FollowerMap> {
  const now = Date.now();
  if (liveAccountsCache && now - liveAccountsCache.at < LIVE_TTL_MS) return liveAccountsCache.data;
  const key = zernioKey();
  if (!key) return {};
  const config = readConfig();
  try {
    const res = await fetch(`${config.v1Url ?? 'https://zernio.com/api/v1'}/accounts`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseLiveAccounts(await res.json());
    liveAccountsCache = { at: now, data };
    return data;
  } catch {
    return liveAccountsCache?.data ?? {};
  }
}

// ── Published-post history ──────────────────────────────────────────────────

export type ZernioPost = {
  platform: string;
  caption: string;
  url: string;
  publishedAt: string | null;
  status: string;
};

/** Map a `/history` (or `/v1/posts`) payload to recent published posts. Picks
    the first platform's live post URL. Engagement (likes/views) is intentionally
    absent — that lives behind Late's paid analytics add-on, so we never invent
    it. */
export function parseHistory(raw: unknown, limit = 6): ZernioPost[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { posts?: unknown })?.posts)
      ? ((raw as { posts: unknown[] }).posts)
      : null;
  if (!arr) return [];
  return arr.slice(0, limit).map((entry) => {
    const e = (entry ?? {}) as Record<string, any>;
    const postIds = Array.isArray(e.postIds) ? e.postIds : [];
    const primary = postIds.find((p: any) => p?.postUrl) ?? postIds[0] ?? {};
    const platform =
      (typeof primary.platform === 'string' && primary.platform) ||
      (Array.isArray(e.platforms) && typeof e.platforms[0] === 'string' && e.platforms[0]) ||
      'unknown';
    const caption = typeof e.post === 'string' ? e.post : typeof e.content === 'string' ? e.content : '';
    return {
      platform: String(platform),
      caption,
      url: typeof primary.postUrl === 'string' ? primary.postUrl : '',
      publishedAt: typeof e.created === 'string' ? e.created : typeof e.scheduleDate === 'string' ? e.scheduleDate : null,
      status: typeof e.status === 'string' ? e.status : 'unknown',
    };
  });
}

// ── Posting activity (per-day, per-platform) ────────────────────────────────

export type ZernioPostDay = { date: string; platforms: string[] };

/** Map a `/history` payload to one {date, platforms[]} per post, keeping the
    FULL cross-post platform list (a post sent to IG+TikTok+YT yields all three).
    Powers the posting-consistency chart's per-platform breakdown + hover. */
export function parsePostDays(raw: unknown): ZernioPostDay[] {
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { posts?: unknown })?.posts)
      ? ((raw as { posts: unknown[] }).posts)
      : null;
  if (!arr) return [];
  const out: ZernioPostDay[] = [];
  for (const entry of arr) {
    const e = (entry ?? {}) as Record<string, any>;
    const stamp = typeof e.created === 'string' ? e.created : typeof e.scheduleDate === 'string' ? e.scheduleDate : null;
    const platforms = Array.isArray(e.platforms) ? e.platforms.filter((p: unknown): p is string => typeof p === 'string') : [];
    if (!stamp || platforms.length === 0) continue;
    out.push({ date: stamp.slice(0, 10), platforms });
  }
  return out;
}

let postDaysCache: { at: number; data: ZernioPostDay[] } | null = null;

/** Full real posting history (date + cross-post platforms per post), 60s-cached.
    The endpoint returns the full set (~tens of posts), no pagination. */
export async function zernioPostDays(): Promise<ZernioPostDay[]> {
  const now = Date.now();
  if (postDaysCache && now - postDaysCache.at < LIVE_TTL_MS) return postDaysCache.data;
  const key = zernioKey();
  if (!key) return [];
  const config = readConfig();
  try {
    const res = await fetch(`${config.baseUrl ?? 'https://getlate.dev/api'}/history?limit=200`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parsePostDays(await res.json());
    postDaysCache = { at: now, data };
    return data;
  } catch {
    return postDaysCache?.data ?? [];
  }
}

let livePostsCache: { at: number; data: ZernioPost[] } | null = null;

/** Recent published posts from Zernio/Late, same 60s-cache + timeout discipline
    as the account fetch. */
export async function zernioRecentPosts(limit = 6): Promise<ZernioPost[]> {
  const now = Date.now();
  if (livePostsCache && now - livePostsCache.at < LIVE_TTL_MS) return livePostsCache.data.slice(0, limit);
  const key = zernioKey();
  if (!key) return [];
  const config = readConfig();
  try {
    const res = await fetch(`${config.baseUrl ?? 'https://getlate.dev/api'}/history`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = parseHistory(await res.json(), 24);
    livePostsCache = { at: now, data };
    return data.slice(0, limit);
  } catch {
    return livePostsCache?.data.slice(0, limit) ?? [];
  }
}

export async function zernioStatus(): Promise<ConnectorStatus> {
  const key = zernioKey();
  const config = readConfig();
  const accounts = Object.entries(config.accounts ?? {});
  if (!key) {
    return {
      id: 'zernio',
      name: 'Zernio (Social)',
      kind: 'social',
      state: 'not_configured',
      detail: 'ZERNIO_API_KEY not found in env, ~/.config/social/.env, or knowledge/.env.agents.',
    };
  }
  const followers = accounts.reduce((sum, [, a]) => sum + (a.followers ?? 0), 0);
  try {
    const res = await fetch(`${config.v1Url ?? 'https://zernio.com/api/v1'}/accounts`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const liveAccounts = Array.isArray(raw?.accounts) ? raw.accounts : [];
    const handles = liveAccounts
      .map((a: any) => (a.username ? `@${a.username}` : a.displayName ? `@${a.displayName}` : null))
      .filter(Boolean)
      .join(', ');
    const totalFollowers = liveAccounts.reduce((sum: number, a: any) => sum + (pickFollowers(a) ?? 0), 0);
    return {
      id: 'zernio',
      name: 'Zernio (Social)',
      kind: 'social',
      state: 'connected',
      detail: `${liveAccounts.length} live channels (${handles || 'Connected'}) · ${totalFollowers.toLocaleString('en-US')} total followers`,
      meta: { platforms: liveAccounts.length, followers: totalFollowers, handles },
    };
  } catch (err) {
    return {
      id: 'zernio',
      name: 'Zernio (Social)',
      kind: 'social',
      state: 'error',
      detail: `Key found but API check failed: ${err instanceof Error ? err.message : String(err)}`,
      meta: { platforms: accounts.length },
    };
  }
}

/**
 * Publish or schedule a post to connected social channels via Zernio API.
 * Spec reference: llms-full.txt (POST /v1/posts)
 */
export async function zernioPublishPost(post: {
  content: string;
  mediaUrl?: string | null;
  platforms?: string[];
  scheduledFor?: string | null;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = zernioKey();
  if (!key) return { ok: false, error: 'ZERNIO_API_KEY is not configured' };
  const config = readConfig();
  const endpoint = `${config.v1Url ?? 'https://zernio.com/api/v1'}/posts`;

  try {
    // Fetch live account IDs from Zernio to map platform string names to accountId
    let accountMap: Record<string, string> = {};
    try {
      const accRes = await fetch(`${config.v1Url ?? 'https://zernio.com/api/v1'}/accounts`, {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      });
      if (accRes.ok) {
        const accJson = await accRes.json();
        if (Array.isArray(accJson?.accounts)) {
          for (const a of accJson.accounts) {
            if (a.platform && a._id) {
              accountMap[a.platform.toLowerCase()] = a._id;
            }
          }
        }
      }
    } catch {
      // Fallback map if /v1/accounts is unreachable
    }

    const requestedPlatforms = post.platforms ?? ['instagram', 'tiktok'];
    const formattedPlatforms = requestedPlatforms.map((p) => {
      const platName = typeof p === 'string' ? p.toLowerCase() : (p as any).platform?.toLowerCase();
      const accountId = typeof p === 'object' && (p as any).accountId ? (p as any).accountId : accountMap[platName];
      return {
        platform: platName,
        accountId: accountId || undefined,
      };
    }).filter((p) => p.accountId);

    // If no specific accountId was found for the requested platform, pass all available connected accounts
    const finalPlatforms = formattedPlatforms.length > 0
      ? formattedPlatforms
      : Object.entries(accountMap).map(([plat, id]) => ({ platform: plat, accountId: id }));

    const mediaUrl = post.mediaUrl || 'https://placeholdervideo.dev/720x1280';
    const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('video') || mediaUrl.includes('cloudfront') || mediaUrl.includes('placeholdervideo');
    const mediaItems = [{ url: mediaUrl, type: isVideo ? 'video' : 'image' }];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: post.content,
        mediaItems,
        mediaUrl,
        postType: isVideo ? 'reel' : 'post',
        platforms: finalPlatforms,
        scheduledFor: post.scheduledFor ?? undefined,
        publishNow: !post.scheduledFor,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, error: `Zernio API error (${res.status}): ${err}` };
    }

    const data = await res.json();
    return { ok: true, id: data?._id ?? data?.id ?? data?.post?._id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
