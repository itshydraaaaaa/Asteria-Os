import RunwayML, { TaskFailedError } from '@runwayml/sdk';
import { CRED_FILES, resolveCred } from '@/lib/creds';
import type { ConnectorStatus } from '@/lib/connectors/types';

export function runwayKey(): string | undefined {
  return (
    process.env.RUNWAYML_API_SECRET ||
    process.env.RUNWAY_API_KEY ||
    resolveCred('RUNWAYML_API_SECRET', [CRED_FILES.agentsEnv]) ||
    resolveCred('RUNWAY_API_KEY', [CRED_FILES.agentsEnv])
  );
}

export async function runwayStatus(): Promise<ConnectorStatus> {
  const key = runwayKey();
  if (!key) {
    return {
      id: 'runway',
      name: 'RunwayML (Gen-4.5 AI Video)',
      kind: 'creative',
      state: 'not_configured',
      detail: 'Set RUNWAYML_API_SECRET in .env.local to enable real 9:16 AI video generation.',
    };
  }
  return {
    id: 'runway',
    name: 'RunwayML (Gen-4.5 AI Video)',
    kind: 'creative',
    state: 'connected',
    detail: 'Runway Gen-4 Turbo SDK Ready · 9:16 Vertical Video Generation',
    meta: { model: 'gen4_turbo' },
  };
}

export type GenerateVideoInput = {
  promptText: string;
  promptImage?: string; // URL or data:image/png;base64,...
  ratio?: '720:1280' | '1280:720' | '1104:832' | '832:1104' | '960:960' | '1584:672';
  duration?: 5 | 10;
  model?: string;
};

export type GenerateVideoOutput = {
  ok: boolean;
  videoUrl?: string;
  taskId?: string;
  error?: string;
};

/**
 * Generate 9:16 vertical AI B-roll video using Runway Gen-4 Turbo.
 */
export async function generateRunwayVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  const key = runwayKey();
  if (!key) {
    return { ok: false, error: 'RUNWAYML_API_SECRET is not configured' };
  }

  try {
    const client = new RunwayML({ apiKey: key });

    const promptImage = input.promptImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=720&h=1280&fit=crop&q=80';

    const createParams: any = {
      model: input.model || 'gen4_turbo',
      promptImage,
      promptText: input.promptText,
      ratio: input.ratio || '720:1280',
      duration: input.duration || 5,
    };

    const task = await client.imageToVideo.create(createParams).waitForTaskOutput();

    const videoUrl = Array.isArray(task.output) ? task.output[0] : (task as any).output;
    return {
      ok: true,
      taskId: task.id,
      videoUrl: typeof videoUrl === 'string' ? videoUrl : undefined,
    };
  } catch (err) {
    if (err instanceof TaskFailedError) {
      const details = (err as any).taskDetails;
      return {
        ok: false,
        error: `Runway Video Task Failed: ${details?.failure || details?.error || String(err)}`,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: message,
    };
  }
}
