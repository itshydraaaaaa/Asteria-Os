import { NextResponse } from 'next/server';
import { generateRunwayVideo, runwayKey } from '@/lib/connectors/runway';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const key = runwayKey();
    if (!key) {
      return NextResponse.json(
        { error: 'RUNWAYML_API_SECRET is missing. Please set RUNWAYML_API_SECRET in .env.local' },
        { status: 400 },
      );
    }

    const body = await req.json();
    const promptText = body.promptText || 'Cinematic 9:16 vertical AI b-roll shot, high resolution, 8k --ar 9:16';
    const promptImage = body.promptImage;
    const duration = body.duration || 5;

    const result = await generateRunwayVideo({
      promptText,
      promptImage,
      ratio: '720:1280',
      duration,
      model: 'gen4.5',
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Runway video generation failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taskId: result.taskId,
      videoUrl: result.videoUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Video generation failed' },
      { status: 500 },
    );
  }
}
