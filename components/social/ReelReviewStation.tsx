'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles,
  Clapperboard,
  CheckCircle2,
  Copy,
  Flame,
  Clock,
  Mic,
  Tv,
  Music,
  Share2,
  ShieldCheck,
  Wand2,
  Download,
  Volume2,
  Play,
  Film,
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Eye,
} from 'lucide-react';
import type { ReelPackage } from '@/app/api/social/generate/route';
import type { ReelMontageResult, SceneAsset } from '@/lib/video-pipeline';

export function ReelReviewStation({
  reel,
  onApprove,
}: {
  reel: ReelPackage;
  onApprove?: () => void;
}) {
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'SCENES' | 'AI_PROMPTS' | 'TELEPROMPTER' | 'METADATA' | 'MONTAGE'>('SCENES');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Pipeline Execution State
  const [isProducing, setIsProducing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStepMessage, setPipelineStepMessage] = useState('');
  const [montageResult, setMontageResult] = useState<ReelMontageResult | null>(null);

  // Progressive streaming state: assets are populated one-by-one via SSE
  const [progressiveAssets, setProgressiveAssets] = useState<Partial<SceneAsset>[]>([]);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);

  // Publish State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  const activeHook = reel.hooks[selectedHookIndex] || reel.hooks[0];
  const score = reel.review.viralScore;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDownloadBrief = () => {
    const jsonStr = JSON.stringify({ ...reel, montageResult }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reel-Production-Brief-${reel.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Update a single asset in the progressive array by scene index
  const updateAsset = useCallback((sceneIndex: number, updates: Partial<SceneAsset>) => {
    setProgressiveAssets((prev) => {
      const next = [...prev];
      next[sceneIndex] = { ...next[sceneIndex], ...updates };
      return next;
    });
  }, []);

  /**
   * Consume the SSE stream from /api/social/produce-reel.
   * Each event progressively updates the UI: keyframes appear first, then videos.
   */
  const handleRunVideoPipeline = async () => {
    setIsProducing(true);
    setActiveTab('MONTAGE');
    setMontageResult(null);
    setPipelineProgress(5);
    setPipelineStepMessage('Initializing 3-Step Video Production Pipeline...');
    setPlayingVideoIndex(null);
    setPublishStatus(null);

    // Initialize empty asset slots so the grid renders immediately
    const initialAssets: Partial<SceneAsset>[] = reel.scenes.map((s, idx) => ({
      sceneIndex: idx,
      timestamp: s.timestamp,
      name: s.name,
      promptText: s.aiPrompt,
      imageStatus: 'idle' as const,
      videoStatus: 'idle' as const,
    }));
    setProgressiveAssets(initialAssets);

    try {
      const res = await fetch('/api/social/produce-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reelPackage: reel }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Pipeline HTTP error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));

              switch (event.type) {
                case 'progress':
                  setPipelineStepMessage(event.step);
                  setPipelineProgress(event.percent);
                  break;

                case 'keyframe':
                  updateAsset(event.sceneIndex, {
                    imageUrl: event.asset.imageUrl,
                    imageStatus: 'completed',
                  });
                  break;

                case 'video':
                  updateAsset(event.sceneIndex, {
                    videoUrl: event.asset.videoUrl,
                    videoStatus: 'completed',
                  });
                  break;

                case 'complete':
                  setMontageResult(event.result);
                  setPipelineProgress(100);
                  setPipelineStepMessage('3-Step Video Production Complete! Preview your clips below.');
                  break;

                case 'error':
                  setPipelineStepMessage(`Pipeline Error: ${event.message}`);
                  break;
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      setPipelineStepMessage(`Pipeline Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProducing(false);
    }
  };

  // Determine if pipeline is done and all videos are available for preview
  const pipelineComplete = montageResult?.ok === true;
  const allVideosReady = progressiveAssets.length > 0 && progressiveAssets.every((a) => a.videoStatus === 'completed' && a.videoUrl);

  return (
    <div className="rounded-xl border border-os-accent/40 bg-os-surface p-5 shadow-xl space-y-6 animate-in fade-in duration-300">
      {/* Reviewer Header & Viral Score Gauge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-os-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-os-accent/20 text-os-accent border border-os-accent/30">
            <Clapperboard className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-os-text text-sm sm:text-base">{reel.title}</h3>
              <span className="rounded bg-os-surface2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-os-accent border border-os-accent/30 font-semibold">
                PRO 9:16 REEL
              </span>
            </div>
            <p className="text-xs text-os-dim flex items-center gap-1.5 mt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-os-ok" />
              <span>Audited by {reel.review.reviewerAgent}</span>
            </p>
          </div>
        </div>

        {/* Action Button: Run 3-Step Automated Video Pipeline */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunVideoPipeline}
            disabled={isProducing}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-os-accent to-purple-600 px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition-all shadow-md disabled:opacity-50"
          >
            {isProducing ? (
              <Loader2 className="h-4 w-4 animate-spin text-black" />
            ) : (
              <Film className="h-4 w-4 text-black" />
            )}
            <span>{isProducing ? 'Producing Montage...' : 'Produce 3-Step Video Montage'}</span>
          </button>

          {/* Viral Score Badge */}
          <div className="flex items-center gap-2.5 bg-os-surface2 p-2 rounded-lg border border-os-border">
            <div className="flex items-center gap-1 text-os-warn font-bold font-mono text-base">
              <Flame className="h-4 w-4 text-os-warn fill-os-warn" />
              <span>{score}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer Agent Critique Banner */}
      <div className="rounded-lg border border-os-border bg-os-surface2/60 p-3.5 text-xs space-y-2">
        <div className="flex items-center justify-between text-os-accent font-semibold">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Viral Retention Optimizations Applied
          </span>
          <span className="font-mono text-[10px] text-os-ok font-semibold">READY TO RECORD / PUBLISH</span>
        </div>
        <p className="text-os-muted leading-relaxed italic text-[11.5px]">
          &quot;{reel.review.critique}&quot;
        </p>
        {reel.review.improvementsMade?.length > 0 && (
          <ul className="mt-1 space-y-1 text-[11px] text-os-dim">
            {reel.review.improvementsMade.map((imp, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-os-ok shrink-0" />
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hook Formulator: 3 Tested Variations */}
      <div>
        <label className="block text-[11px] font-mono uppercase tracking-wider text-os-dim mb-2">
          Hook Formulator (0-3s Retention Angle):
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {reel.hooks.map((h, i) => {
            const isSelected = selectedHookIndex === i;
            return (
              <button
                key={h.id || i}
                onClick={() => setSelectedHookIndex(i)}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all ${
                  isSelected
                    ? 'border-os-accent bg-os-accent/15 text-os-text ring-1 ring-os-accent font-medium'
                    : 'border-os-border bg-os-surface2 text-os-muted hover:border-os-dim'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-os-accent font-bold">
                    Option {i + 1} · {h.type}
                  </span>
                  <span className="font-mono text-[9.5px] text-os-ok">+{h.score} pts</span>
                </div>
                <p className="text-[11.5px] leading-snug">&quot;{h.text}&quot;</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-os-border text-xs font-mono overflow-x-auto">
        {[
          { id: 'SCENES', label: '9:16 Timeline Breakdown', icon: Tv },
          { id: 'AI_PROMPTS', label: 'AI Video & B-Roll Prompts', icon: Wand2 },
          { id: 'MONTAGE', label: '🎬 3-Step Video Montage Pipeline', icon: Film },
          { id: 'TELEPROMPTER', label: 'Teleprompter Voiceover', icon: Mic },
          { id: 'METADATA', label: 'Audio & ReplyRush Trigger', icon: Music },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-all whitespace-nowrap ${
                active
                  ? 'border-os-accent text-os-accent font-semibold bg-os-accent/5'
                  : 'border-transparent text-os-dim hover:text-os-text'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'MONTAGE' && pipelineComplete && (
                <span className="rounded bg-os-ok/20 px-1.5 py-0.2 text-[9px] text-os-ok font-bold">READY</span>
              )}
              {tab.id === 'MONTAGE' && isProducing && (
                <Loader2 className="h-3 w-3 animate-spin text-os-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Scene Timeline */}
      {activeTab === 'SCENES' && (
        <div className="space-y-3">
          {reel.scenes.map((scene, i) => (
            <div
              key={i}
              className="rounded-lg border border-os-border bg-os-surface2 p-3.5 text-xs grid gap-3 md:grid-cols-12 items-start"
            >
              <div className="md:col-span-3 space-y-1">
                <div className="flex items-center gap-1.5 font-mono text-os-accent font-semibold text-[11px]">
                  <Clock className="h-3 w-3" />
                  <span>{scene.timestamp}</span>
                </div>
                <div className="font-semibold text-os-text text-[12px]">{scene.name}</div>
                {scene.soundCue && (
                  <div className="flex items-center gap-1 font-mono text-[10px] text-os-dim">
                    <Volume2 className="h-3 w-3 text-os-warn" />
                    <span>{scene.soundCue}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-4 space-y-1 border-l border-os-border pl-3">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-os-dim block">
                  Visual / On-Screen Cue
                </span>
                <p className="text-os-muted text-[11.5px] leading-relaxed">{scene.visualCue}</p>
                <div className="mt-1 rounded bg-os-surface px-2 py-1 font-mono text-[10px] text-os-warn border border-os-border">
                  TEXT OVERLAY: &quot;{scene.onScreenText}&quot;
                </div>
                {scene.textOverlayStyle && (
                  <span className="text-[9.5px] font-mono text-os-dim block">
                    Style: {scene.textOverlayStyle}
                  </span>
                )}
              </div>

              <div className="md:col-span-5 space-y-1 border-l border-os-border pl-3">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-os-dim block">
                  Spoken Voiceover
                </span>
                <p className="text-os-text font-medium text-[11.5px] leading-relaxed">
                  {i === 0 ? activeHook.text : scene.voiceover}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: AI Video Prompts */}
      {activeTab === 'AI_PROMPTS' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-os-dim font-mono">
              Copy-paste prompts into Midjourney / Runway Gen-3 / Pika, or run the 3-step automated montage pipeline below.
            </p>
          </div>
          {reel.scenes.map((scene, i) => (
            <div key={i} className="rounded-lg border border-os-border bg-os-surface2 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-os-accent font-semibold">
                  Scene {i + 1} ({scene.timestamp}) · {scene.name}
                </span>
                <button
                  onClick={() => copyToClipboard(scene.aiPrompt, `ai-prompt-${i}`)}
                  className="flex items-center gap-1 rounded bg-os-surface px-2.5 py-1 text-[10.5px] font-mono text-os-accent border border-os-border hover:bg-os-accent/10 transition-all"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedText === `ai-prompt-${i}` ? 'Copied!' : 'Copy AI Prompt'}</span>
                </button>
              </div>
              <pre className="font-mono text-[11.5px] text-os-text whitespace-pre-wrap leading-relaxed bg-os-surface p-2.5 rounded border border-os-border">
                {scene.aiPrompt}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: 3-Step Video Montage Pipeline - PROGRESSIVE STREAMING */}
      {activeTab === 'MONTAGE' && (
        <div className="space-y-4 text-xs">
          {/* Pipeline Controller Status */}
          <div className="rounded-lg border border-os-border bg-os-surface2 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="h-4 w-4 text-os-accent" />
                <span className="font-bold text-os-text text-sm">3-Step Video Montage Workflow</span>
              </div>
              <button
                onClick={handleRunVideoPipeline}
                disabled={isProducing}
                className="flex items-center gap-1.5 rounded bg-os-accent px-3 py-1.5 text-xs font-bold text-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isProducing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isProducing ? 'Executing Pipeline...' : 'Run Automated Production'}</span>
              </button>
            </div>

            {pipelineStepMessage && (
              <div className="space-y-2">
                <p className="font-mono text-[11px] text-os-accent">{pipelineStepMessage}</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-os-surface">
                  <div
                    className="h-full bg-gradient-to-r from-os-accent to-purple-500 transition-all duration-500"
                    style={{ width: `${pipelineProgress}%` }}
                  />
                </div>
              </div>
            )}

            {!progressiveAssets.length && !isProducing && !montageResult && (
              <p className="text-[11px] text-os-dim leading-relaxed">
                Click <b>&quot;Run Automated Production&quot;</b> to execute the 3 steps:
                1. Render 9:16 scene keyframe images ➔ 2. Runway Gen-4.5 image-to-video motion generation ➔ 3. Stitch 4-scene video montage with kinetic captions &amp; audio.
              </p>
            )}
          </div>

          {/* Progressive Scene Assets Grid: renders as SSE events arrive */}
          {progressiveAssets.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-mono text-[11px] uppercase tracking-wider text-os-accent font-bold">
                Rendered Scene Assets & Video Clips ({progressiveAssets.length} Scenes):
              </h4>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {progressiveAssets.map((asset, i) => {
                  const hasImage = asset.imageStatus === 'completed' && asset.imageUrl;
                  const hasVideo = asset.videoStatus === 'completed' && asset.videoUrl;
                  const isVideoPlaying = playingVideoIndex === i;

                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 space-y-2 flex flex-col justify-between transition-all duration-500 ${
                        hasVideo
                          ? 'border-os-ok/50 bg-os-surface2'
                          : hasImage
                            ? 'border-os-accent/40 bg-os-surface2'
                            : 'border-os-border bg-os-surface2/50'
                      }`}
                    >
                      {/* Header */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-os-accent font-bold">{asset.timestamp}</span>
                          <span className={`font-semibold ${hasVideo ? 'text-os-ok' : hasImage ? 'text-os-accent' : 'text-os-dim'}`}>
                            Scene {i + 1}
                          </span>
                        </div>
                        <p className="font-semibold text-os-text text-xs line-clamp-1">{asset.name}</p>
                      </div>

                      {/* Visual Area: Keyframe / Video / Placeholder */}
                      <div className="relative aspect-[9/16] w-full overflow-hidden rounded bg-black border border-os-border">
                        {/* Video player (shown when user clicks preview) */}
                        {isVideoPlaying && hasVideo ? (
                          <video
                            src={asset.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                            onClick={() => setPlayingVideoIndex(null)}
                          />
                        ) : hasImage ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={asset.imageUrl}
                              alt={asset.name || ''}
                              className="h-full w-full object-cover opacity-90 transition-opacity duration-700"
                            />
                            {/* Video play overlay */}
                            {hasVideo ? (
                              <button
                                onClick={() => setPlayingVideoIndex(i)}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 hover:bg-black/50 transition-all group cursor-pointer"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-os-accent/90 group-hover:bg-os-accent transition-all shadow-lg">
                                  <Play className="h-5 w-5 text-black ml-0.5" />
                                </div>
                                <span className="font-mono text-[9px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded mt-2">
                                  Preview Video Clip
                                </span>
                              </button>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                                {asset.videoStatus === 'idle' ? (
                                  <span className="font-mono text-[9px] text-white/60 bg-black/50 px-2 py-1 rounded">
                                    Keyframe Ready
                                  </span>
                                ) : (
                                  <>
                                    <Loader2 className="h-5 w-5 text-os-accent animate-spin mb-1" />
                                    <span className="font-mono text-[9px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded">
                                      Generating Video...
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {asset.imageStatus === 'in_progress' || isProducing ? (
                              <>
                                <Loader2 className="h-6 w-6 text-os-accent animate-spin mb-1.5" />
                                <span className="font-mono text-[9px] text-white/70">Rendering Keyframe...</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-6 w-6 text-os-dim/40 mb-1" />
                                <span className="font-mono text-[9px] text-white/40">Waiting...</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status badges */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] font-mono text-os-dim truncate max-w-[70%]">
                          &quot;{reel.scenes[i]?.onScreenText}&quot;
                        </div>
                        <div className="flex items-center gap-1">
                          {hasImage && (
                            <span className="rounded bg-os-accent/20 px-1 py-0.5 text-[8px] font-mono text-os-accent font-bold">
                              IMG
                            </span>
                          )}
                          {hasVideo && (
                            <span className="rounded bg-os-ok/20 px-1 py-0.5 text-[8px] font-mono text-os-ok font-bold">
                              VID
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pipeline Complete: Final Preview Section */}
          {pipelineComplete && allVideosReady && (
            <div className="rounded-lg border border-os-ok/40 bg-os-ok/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-os-ok" />
                <span className="font-bold text-os-ok text-sm">Pipeline Complete — Preview Your Clips</span>
              </div>
              <p className="text-[11px] text-os-dim">
                All {progressiveAssets.length} scene videos are rendered. Click each scene above to preview the video clip inline.
                When satisfied, click <b>&quot;Approve &amp; Queue to Zernio&quot;</b> below to publish.
              </p>
              {montageResult?.warning && (
                <div className="mt-2 rounded bg-os-warn/10 border border-os-warn/30 p-2.5 text-[11px] text-os-warn flex items-center gap-2">
                  <Flame className="h-4 w-4 shrink-0" />
                  <span>{montageResult.warning}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Teleprompter */}
      {activeTab === 'TELEPROMPTER' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-os-dim font-mono">
              Word-for-word voiceover script (30-60s read pace).
            </span>
            <button
              onClick={() => copyToClipboard(reel.teleprompter, 'teleprompter')}
              className="flex items-center gap-1.5 rounded bg-os-surface2 px-3 py-1 text-xs font-mono text-os-accent border border-os-border hover:bg-os-accent/10 transition-all"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedText === 'teleprompter' ? 'Copied to Clipboard!' : 'Copy Teleprompter Script'}</span>
            </button>
          </div>
          <div className="rounded-lg border border-os-border bg-os-surface2 p-5 font-mono text-sm leading-relaxed text-os-text whitespace-pre-wrap">
            {reel.teleprompter}
          </div>
        </div>
      )}

      {/* Tab 5: Caption, Audio & ReplyRush */}
      {activeTab === 'METADATA' && (
        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <div className="space-y-2 rounded-lg border border-os-border bg-os-surface2 p-4">
            <span className="font-mono text-[10px] uppercase tracking-wider text-os-dim block font-bold">
              Instagram Reel / TikTok Caption
            </span>
            <pre className="font-mono text-[11.5px] text-os-text whitespace-pre-wrap leading-relaxed">
              {reel.caption}
            </pre>
            <div className="pt-2 border-t border-os-border flex flex-wrap gap-1.5">
              {reel.hashtags?.map((tag, i) => (
                <span key={i} className="text-os-accent font-mono text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-os-border bg-os-surface2 p-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-os-dim block font-bold">
                Recommended Audio Energy
              </span>
              <p className="text-os-text font-semibold text-xs mt-1">{reel.audioVibe}</p>
            </div>
            {reel.elevenLabsVoiceSpec && (
              <div className="border-t border-os-border pt-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-os-dim block font-bold">
                  ElevenLabs / Arcads Voice Spec
                </span>
                <p className="text-os-accent font-mono text-xs mt-0.5">{reel.elevenLabsVoiceSpec}</p>
              </div>
            )}
            <div className="border-t border-os-border pt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-os-dim block font-bold">
                ReplyRush DM Automation Trigger
              </span>
              <p className="text-os-ok font-mono text-xs mt-0.5">
                Trigger: Comment &apos;{reel.replyRushTrigger || 'SCALE'}&apos; to receive automated AI DM
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Action */}
      <div className="flex flex-col gap-3 border-t border-os-border pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleDownloadBrief}
            className="flex items-center gap-1.5 rounded-md border border-os-border bg-os-surface2 px-3 py-1.5 text-xs text-os-dim hover:text-os-text transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Production Brief (JSON)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(reel.teleprompter, 'teleprompter-footer')}
              className="flex items-center gap-1.5 rounded-md border border-os-border bg-os-surface2 px-3.5 py-1.5 text-xs text-os-text hover:border-os-accent transition-all"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedText === 'teleprompter-footer' ? 'Copied!' : 'Copy Teleprompter'}</span>
            </button>
            <button
              onClick={async () => {
                setIsPublishing(true);
                setPublishStatus(null);
                try {
                  const videoClipUrl = montageResult?.sceneAssets?.[0]?.videoUrl || montageResult?.finalMontageBrief?.videoClips?.[0]?.videoUrl;
                  const res = await fetch('/api/social/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      caption: `🎬 REEL: ${reel.title}\n\n👇 Comment '${reel.replyRushTrigger || 'SCALE'}' to receive the automation SOP!\n\n${reel.caption}\n\n${reel.hashtags?.join(' ') || ''}`,
                      platforms: ['instagram', 'tiktok'],
                      mediaUrl: videoClipUrl || null,
                    }),
                  });
                  const data = await res.json();
                  if (data.zernioPost?.ok) {
                    setPublishStatus('Published to Zernio! Check @itshydraaaaaa & @hydra.qq');
                  } else if (data.zernioError) {
                    setPublishStatus(`Queued locally. Zernio: ${data.zernioError}`);
                  } else {
                    setPublishStatus('Post queued successfully');
                  }
                  if (onApprove) onApprove();
                } catch (err) {
                  setPublishStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
                } finally {
                  setIsPublishing(false);
                }
              }}
              disabled={isPublishing || !pipelineComplete}
              title={!pipelineComplete ? 'Run the video pipeline first, then preview clips before approving' : undefined}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-bold transition-all shadow-md ${
                pipelineComplete
                  ? 'bg-os-accent text-black hover:opacity-90'
                  : 'bg-os-dim/30 text-os-dim cursor-not-allowed'
              } disabled:opacity-50`}
            >
              {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{isPublishing ? 'Publishing...' : !pipelineComplete ? 'Run Pipeline First' : 'Approve & Queue to Zernio'}</span>
            </button>
          </div>
        </div>
        {publishStatus && (
          <p className={`text-[11px] font-mono ${publishStatus.startsWith('Error') ? 'text-red-400' : 'text-os-ok'}`}>
            {publishStatus}
          </p>
        )}
      </div>
    </div>
  );
}
