import { appEvents, type AppEventPayload } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`),
      );

      const unsubscribe = appEvents.subscribe('*', (event: AppEventPayload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream closed
        }
      });

      // Keep-alive ping every 15s
      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(timer);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(timer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
