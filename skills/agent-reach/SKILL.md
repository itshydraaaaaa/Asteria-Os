---
name: agent-reach
description: Multi-platform social media intelligence and scraping skill for Asteria OS. Scrapes trends, hooks, and engagement metrics across TikTok, Instagram, YouTube, Reddit, X/Twitter, and LinkedIn.
---

# AgentReach Social Media Intelligence Skill

AgentReach equips Asteria OS with multi-channel web scraping and social media sentiment extraction capabilities.

## Supported Platforms & Extraction Methods

1. **Reddit (eddit)**
   - Direct JSON scraping via public endpoints (/r/{subreddit}/hot.json, /search.json).
   - Extracts post titles, selftext, upvotes, comment counts, and direct URLs.

2. **YouTube (youtube)**
   - Video metadata and trend analysis via YouTube search endpoints and RapidAPI/Social API connectors.
   - Extracts title, view counts, upload dates, author channel, and video IDs.

3. **TikTok (	iktok)**
   - Scrapes trending hashtags, short-form viral video metadata, view counts, and engagement rates.
   - Integrates with Zernio and social scrapers.

4. **Instagram (instagram)**
   - Scrapes reels, carousel posts, hashtag feeds, and creator profiles.
   - Analyzes caption hooks, like counts, and engagement velocity.

5. **Twitter / X (	witter / x)**
   - Real-time search query scraping and thread extraction for industry discourse and breaking news.

6. **LinkedIn (linkedin)**
   - B2B thought-leadership scraping, founder posts, and industry trend monitoring.

## Programmatic Usage in Asteria OS

`	ypescript
import { scrapeAllSocialMedia, scrapePlatform, extractViralHooks } from '@/lib/connectors/agent-reach';

// Scrape cross-platform trends
const digest = await scrapeAllSocialMedia({ query: 'AI agency automation' });

// Extract top performing hooks
const hooks = extractViralHooks(digest.items);
`

## LLM Chat Tools
- scrape_social_trends(query, platforms, limit): Scrapes posts across multiple social networks.
- scrape_single_platform(platform, query, limit): Targets a specific network for in-depth data.
