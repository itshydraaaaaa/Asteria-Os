import { NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { agentReachTrendScan, type AgentReachSearchResult } from '@/lib/connectors/agent-reach';

export type ContentGenMode = 'TREND_SCAN' | 'CALENDAR' | 'CAPTION_BATCH' | 'REPURPOSE';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode: ContentGenMode = body.mode || 'TREND_SCAN';
    const topic: string = body.topic || 'AI & Agency Automation';
    const platforms: string[] = body.platforms || ['web', 'youtube', 'twitter', 'linkedin'];
    const brainNote: string | undefined = body.brainNote;
    const roadmapMilestone: string | undefined = body.roadmapMilestone;

    const db = getDb();
    const startTime = Date.now();

    let digest = '';
    let sources: AgentReachSearchResult[] = [];
    let generatedDrafts: { platform: string; content: string; topic: string }[] = [];

    // Context Sourcing
    const recentSocialPosts = db.socialPosts.all().slice(0, 5);
    const topPerformingPlatform = (recentSocialPosts[0]?.platforms[0] as string) || 'twitter';

    if (mode === 'TREND_SCAN') {
      const scanResult = await agentReachTrendScan(topic, platforms);
      digest = scanResult.digest;
      sources = scanResult.sources;
    } else if (mode === 'CALENDAR') {
      const scanResult = await agentReachTrendScan(topic, platforms);
      digest = scanResult.digest;
      sources = scanResult.sources;

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      generatedDrafts = days.map((day, i) => {
        const plat = platforms[i % platforms.length] || topPerformingPlatform;
        return {
          platform: plat,
          topic,
          content: `[${day} Slot — ${plat.toUpperCase()}]\n${topic}: Key takeaways from recent market signals.\n\n#AsteriaOS #${plat}`,
        };
      });
    } else if (mode === 'CAPTION_BATCH') {
      generatedDrafts = [
        {
          platform: 'linkedin',
          topic,
          content: `🚀 Insights on ${topic}\n\nKey observations from our agency operations deck:\n• Scalable workflows\n• Autonomous AI agents\n• Clear ROI\n\nHow is your team tackling this?`,
        },
        {
          platform: 'twitter',
          topic,
          content: `Quick breakdown on ${topic}:\n\n1/ Automated agent execution\n2/ Real-time event telemetry\n3/ Zero manual overhead\n\nFull architecture breakdown below 👇`,
        },
        {
          platform: 'instagram',
          topic,
          content: `Behind the scenes with Asteria OS ⚡\n\nOptimizing ${topic} across all client workflows. Swipe for details! 📲`,
        },
        {
          platform: 'tiktok',
          topic,
          content: `3 things you didn't know about ${topic} 👇 #founder #ai #tech`,
        },
      ];
    } else if (mode === 'REPURPOSE') {
      const sourceText = brainNote || roadmapMilestone || topic;
      generatedDrafts = [
        {
          platform: 'linkedin',
          topic: `Repurposed: ${sourceText.slice(0, 30)}`,
          content: `📌 From our internal documentation:\n\n"${sourceText}"\n\nWhat this means for agency scaling in 2026.`,
        },
        {
          platform: 'twitter',
          topic: `Repurposed: ${sourceText.slice(0, 30)}`,
          content: `💡 Quick take from our operating playbook:\n\n${sourceText.slice(0, 220)}...`,
        },
        {
          platform: 'instagram',
          topic: `Repurposed: ${sourceText.slice(0, 30)}`,
          content: `Building in public:\n${sourceText}`,
        },
      ];
    }

    // Phase 4: Save generated posts strictly as status: 'draft' into social_posts table
    const savedPostIds: string[] = [];
    const validPlatforms = ['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin'] as const;
    for (const draft of generatedDrafts) {
      const postId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const p = validPlatforms.includes(draft.platform as any) ? (draft.platform as any) : 'twitter';
      db.socialPosts.enqueue({
        id: postId,
        caption: draft.content,
        mediaUrl: null,
        platforms: [p],
        status: 'draft',
        scheduledFor: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date().toISOString(),
      });
      savedPostIds.push(postId);
    }

    // Phase 6: Log execution to agent_runs table
    const durationMs = Date.now() - startTime;
    db.agentRuns.insert({
      id: `run-social-${Date.now()}`,
      agentId: 'social-agent',
      status: 'success',
      input: JSON.stringify({ mode, topic, platforms }),
      output: JSON.stringify({ draftsCount: generatedDrafts.length, savedPostIds, sourcesCount: sources.length }),
      error: null,
      tokensUsed: 420,
      costUsd: 0.002,
      startedAt: new Date(startTime).toISOString(),
      finishedAt: new Date().toISOString(),
      ok: true,
      summary: `Social Strategist generated ${generatedDrafts.length} DRAFT posts in mode ${mode} (${durationMs}ms)`,
    });

    return NextResponse.json({
      success: true,
      mode,
      topic,
      digest,
      sources,
      drafts: generatedDrafts,
      savedPostIds,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Content generation failed' },
      { status: 500 },
    );
  }
}
