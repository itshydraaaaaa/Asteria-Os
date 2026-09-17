import { NextResponse } from 'next/server';
import { executeReelVideoPipeline } from '@/lib/video-pipeline';
import type { ReelPackage } from '@/app/api/social/generate/route';

export const dynamic = 'force-dynamic';

/**
 * SSE streaming endpoint for the 3-Step Video Production Pipeline.
 * Streams events as each keyframe image and video clip is generated,
 * so the UI can progressively render scene assets in real time.
 *
 * Event types:
 *   { type: 'progress', step: string, percent: number }
 *   { type: 'keyframe', sceneIndex: number, asset: SceneAsset }
 *   { type: 'video',    sceneIndex: number, asset: SceneAsset }
 *   { type: 'complete', result: ReelMontageResult }
 *   { type: 'error',    message: string }
 */
export async function POST(req: Request) {
  let reel: ReelPackage;
  try {
    const body = await req.json();
    reel = body.reelPackage;
    if (!reel || !Array.isArray(reel.scenes)) {
      return NextResponse.json(
        { error: 'Invalid ReelPackage. Expected a valid reelPackage with scenes.' },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller already closed
        }
      };

      try {
        const result = await executeReelVideoPipeline(reel, {
          onProgress(step, percent) {
            send({ type: 'progress', step, percent });
          },
          onKeyframeReady(sceneIndex, asset) {
            send({ type: 'keyframe', sceneIndex, asset });
          },
          onVideoReady(sceneIndex, asset) {
            send({ type: 'video', sceneIndex, asset });
          },
        });

        send({ type: 'complete', result });
      } catch (err) {
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to produce reel montage pipeline',
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
