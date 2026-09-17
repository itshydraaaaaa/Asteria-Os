import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getDb } from '@/lib/data';
import { SocialPlatformSchema, SocialPostStatusSchema, type SocialPost } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/** The post queue, newest first. */
export async function GET() {
  return NextResponse.json({ posts: getDb().socialPosts.all() });
}

const UpdateSchema = z.object({
  id: z.string().min(1),
  status: SocialPostStatusSchema,
});

const CreateSchema = z.object({
  caption: z.string().min(1, 'caption is required'),
  platforms: z.array(SocialPlatformSchema).min(1, 'pick at least one platform'),
  mediaUrl: z.string().url().nullish(),
  scheduledFor: z.string().nullish(),
});

const DeleteSchema = z.object({
  id: z.string().min(1),
});

import { zernioPublishPost, zernioKey } from '@/lib/connectors/zernio';

/**
 * Queue a post or update an existing post's status (e.g. approve a draft to queued).
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  if (!json) return NextResponse.json({ error: 'invalid body' }, { status: 400 });

  // Handle status update (e.g. { id, status: 'queued' })
  if ('id' in json && 'status' in json) {
    const parsedUpdate = UpdateSchema.safeParse(json);
    if (!parsedUpdate.success) {
      return NextResponse.json({ error: parsedUpdate.error.flatten() }, { status: 400 });
    }
    getDb().socialPosts.updateStatus(parsedUpdate.data.id, parsedUpdate.data.status);

    // If approving to queued, attempt live publish/schedule to Zernio if key is present
    if (parsedUpdate.data.status === 'queued' && zernioKey()) {
      const existing = getDb().socialPosts.all().find((p) => p.id === parsedUpdate.data.id);
      if (existing) {
        try {
          const zernioRes = await zernioPublishPost({
            content: existing.caption,
            mediaUrl: existing.mediaUrl,
            platforms: existing.platforms,
            scheduledFor: existing.scheduledFor,
          });
          return NextResponse.json({
            success: true,
            id: parsedUpdate.data.id,
            status: parsedUpdate.data.status,
            zernioPost: zernioRes,
          });
        } catch (zErr) {
          return NextResponse.json({
            success: true,
            id: parsedUpdate.data.id,
            status: parsedUpdate.data.status,
            zernioError: zErr instanceof Error ? zErr.message : String(zErr),
          });
        }
      }
    }

    return NextResponse.json({ success: true, id: parsedUpdate.data.id, status: parsedUpdate.data.status });
  }

  // Handle creation
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const post: SocialPost = {
    id: randomUUID(),
    caption: parsed.data.caption,
    mediaUrl: parsed.data.mediaUrl ?? null,
    platforms: parsed.data.platforms,
    status: 'queued',
    scheduledFor: parsed.data.scheduledFor ?? null,
    createdAt: new Date().toISOString(),
  };
  getDb().socialPosts.enqueue(post);

  // Immediately publish to Zernio when a new post is created as 'queued' and key is available
  if (zernioKey()) {
    try {
      const zernioRes = await zernioPublishPost({
        content: post.caption,
        mediaUrl: post.mediaUrl,
        platforms: post.platforms,
        scheduledFor: post.scheduledFor,
      });
      return NextResponse.json({ post, zernioPost: zernioRes }, { status: 201 });
    } catch (zErr) {
      return NextResponse.json({
        post,
        zernioError: zErr instanceof Error ? zErr.message : String(zErr),
      }, { status: 201 });
    }
  }

  return NextResponse.json({ post }, { status: 201 });
}

export async function PATCH(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  getDb().socialPosts.updateStatus(parsed.data.id, parsed.data.status);
  return NextResponse.json({ success: true, id: parsed.data.id, status: parsed.data.status });
}

export async function DELETE(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  getDb().socialPosts.delete(parsed.data.id);
  return NextResponse.json({ success: true, id: parsed.data.id });
}
