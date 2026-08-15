---
name: trend-research
description: Read-only trend research & web content intelligence powered by Agent Reach (Web, YouTube, RSS, GitHub, Exa, Twitter, Reddit, Bilibili, LinkedIn).
group: Creative
owner: social-strategist
---

# Trend Research & Content Intelligence (Agent Reach)

The `trend-research` skill arms the **Social Strategist** agent with eyes on live platforms before drafting content.

## Supported Read-Only Channels

1. **Web & Search**: `agent-reach search "<query>" --platforms web,exa`
2. **YouTube Transcripts**: `agent-reach search "<query>" --platforms youtube`
3. **RSS Feeds**: `agent-reach search "<query>" --platforms rss`
4. **GitHub & Tech**: `agent-reach search "<query>" --platforms github`
5. **Social Platforms** (if configured): `twitter`, `reddit`, `linkedin`, `instagram`, `bilibili`

## Usage Rules

- Use `agentReachTrendScan(topic, platforms)` to fetch live trend digests and source URLs.
- Always include source platform URLs in `TREND_SCAN` mode output for attribution & transparency.
- All generated content must land as `status: 'DRAFT'` in the `social_posts` table — no auto-publishing.
