# ASTERIA OS — Full System Architecture & Functional Documentation

**ASTERIA OS** is a unified Freelance Operating System and AI Agent Command Center designed to run agency and freelance operations under a single, cohesive command deck.

This document provides a comprehensive technical breakdown of Asteria OS, covering its core concepts, design system, data model, page-by-page functionality, API endpoints, and AI agent execution framework.

---

## Table of Contents
1. [Executive Overview & Core Concept](#1-executive-overview--core-concept)
2. [Tech Stack & Architectural Principles](#2-tech-stack--architectural-principles)
3. [Design System & Visual Identity](#3-design-system--visual-identity)
4. [Detailed Page-by-Page Breakdown](#4-detailed-page-by-page-breakdown)
   - [Operator Console (`/`)](#41-operator-console-)
   - [Command Chat (`/chat`)](#42-command-chat-chat)
   - [Client Funnel (`/funnel`)](#43-client-funnel-funnel)
   - [Task Board (`/tasks`)](#44-task-board-tasks)
   - [Agents & Org Chart (`/agents`, `/org`)](#45-agents--org-chart-agents-org)
   - [Roadmap & Build Plan (`/roadmap`)](#46-roadmap--build-plan-roadmap)
   - [Unified Comms (`/comms`)](#47-unified-comms-comms)
   - [Finances & Statement Ingestion (`/finances`)](#48-finances--statement-ingestion-finances)
   - [Social Growth & Content (`/social`, `/content`)](#49-social-growth--content-social-content)
   - [G-Brain Knowledge Core (`/brain`)](#410-g-brain-knowledge-core-brain)
   - [Connections Board (`/integrations`)](#411-connections-board-integrations)
   - [Analytics & Operating Metrics (`/analytics`)](#412-analytics--operating-metrics-analytics)
   - [Agency Workflows (`/workflows`)](#413-agency-workflows-workflows)
   - [Skills Catalog (`/skills`)](#414-skills-catalog-skills)
5. [Database Schemas & Data Model](#5-database-schemas--data-model)
6. [API Route Registry](#6-api-route-registry)
7. [Developer & Testing Guide](#7-developer--testing-guide)

---

## 1. Executive Overview & Core Concept

**Asteria OS** solves the mental overhead and tool fragmentation of running a modern freelance or agency business. Instead of juggling dozens of disconnected browser tabs (CRM, project management, email, social scheduling, invoicing, notes, and AI tools), Asteria OS centralizes all operations into **one real-time command deck**.

### Core Pillars of the Platform:
- **Autonomous AI Workforce**: 30 specialized AI agents organized into 6 functional pillars (Sales, Marketing/Growth, TECH, Finances, Communications, Clients) led by the **Conductor Super-Agent**.
- **Natural Language Control Center (`/chat`)**: Operators can instruct individual agents (`@sdr-agent`, `@sales-agent`, `@dev-copilot`) or let the Conductor auto-route commands to execute workflows.
- **Dynamic Client Journey Pipeline (`/funnel`)**: Live visual space tracking clients from first contact to converted deal.
- **Unified Communications (`/comms`)**: Single feed consolidating emails, Slack channels, WhatsApp messages, and calendar events.
- **Honest System Status & Connectors**: Integrations (Stripe, Attio, Zernio, Beehiiv, Notion, G-Brain) report honest live statuses without fallback trickery.

---

## 2. Tech Stack & Architectural Principles

Asteria OS follows a strict **Repository-First Architecture**:

| Layer | Technology / Implementation |
|---|---|
| **Framework** | Next.js 14 App Router (`SSR: false` for canvas/SVG modules) |
| **Language** | TypeScript (Strict mode enabled, `tsc --noEmit`) |
| **Styling** | Vanilla CSS custom properties + Tailwind CSS (`os.*` tokens) |
| **Database** | SQLite via `better-sqlite3` (`data/founder-os.db`, WAL mode) |
| **Validation** | Zod schemas (`lib/schemas.ts`) enforcing runtime type-safety |
| **Testing** | Vitest (`vitest run`, 98 test modules, 870+ unit tests) |

### Key Architectural Rules:
1. **Repository Pattern**: No page or API route queries SQLite directly. All database access flows through repository singletons defined in `lib/db.ts` and initialized via `getDb()` in `lib/data.ts`.
2. **Schema Validation**: Every database query validates output rows through Zod schemas (`lib/schemas.ts`) before rendering.
3. **Honest Connector Status**: Connectors (`lib/connectors/`) report honest states (`connected`, `pending`, `error`) and never pretend to be connected without valid credentials.

---

## 3. Design System & Visual Identity

Asteria OS features a refined **Cosmic Monolith** visual theme:

- **Vector Mark (`AsteriaMark.tsx`)**: Four-pointed luminous star motif enclosed in a angled orbital ring (`#06b6d4`).
- **Default Theme (`asteria-dark`)**: Deep obsidian canvas (`#070a12`), luminous cyan accent (`#06b6d4`), emerald ok state (`#10b981`), amber warnings (`#f59e0b`), and crimson errors (`#ef4444`).
- **Alternate Theme (`asteria-midnight`)**: Midnight canvas (`#05050a`) with celestial violet starfire accents (`#8b5cf6`).
- **Typography**: Precision JetBrains Mono font (`--font-mono`) across all headers, stats, badges, and labels for an authentic command-terminal aesthetic.
- **Primitives (`components/terminal.tsx`)**: `Dot`, `Badge`, `Label`, `SectionHead`, `Kbd`, `Spark`.

---

## 4. Detailed Page-by-Page Breakdown

### 4.1 Operator Console (`/`)
The primary executive dashboard displaying top-level system health and pulse metrics.
- **Page Header**: Displays greeting ("Good morning, Asteria Operator") with fast keyboard shortcut triggers (`⌘K`).
- **State-of-the-World Bar**: One attention-first sentence distilling live facts (failed agent runs, downed connectors, unread emails, active agents).
- **Pulse Tiles**: Systems connection meter, active agent count, G-Brain health score, and inbound messages.
- **Home Social Graph**: Live reach chart and follower distribution across social platforms.
- **Roadmap Quarter Focus**: Key milestone items for the current quarter.
- **Live Activity Ticker**: Auto-scrolling ticker displaying real-time agent executions.

### 4.2 Command Chat (`/chat`)
A dedicated full-screen natural language command center.
- **Conductor Routing**: Connected to `POST /api/agents/conductor/chat`. Messages without an explicit `@agent` tag are automatically evaluated by the Conductor to select the best-fit agent.
- **Explicit Agent Mentioning**: Enter `@sdr-agent`, `@sales-agent`, `@finance-agent`, or `@dev-copilot` to chat directly with that agent.
- **Shortcut Action Chips**: Pre-populated one-click buttons (`Check system health`, `Find new leads`, `Draft proposal`, `Revenue summary`).
- **Agent Output & Routing Badges**: Displays `routedTo` tags, execution timestamps, and markdown responses.

### 4.3 Client Funnel (`/funnel`)
A visual client journey space tracking leads through 5 canonical stage hubs:
1. **First Touch**: Initial outreach or lead capture.
2. **Engaged**: Discovery call or active dialog.
3. **Nurtured**: Follow-ups and value delivery.
4. **Opted In**: Proposal sent or contract negotiating.
5. **Converted**: Closed client deal ($ value and product recorded).

- **Interactive Add Lead Modal (`FunnelAddContactModal`)**: Modal form to dynamically insert new client leads with contact details, company name, estimated deal value, and starting stage.
- **Likelihood & Decay Engine**: Nodes orbit stage hubs; quiet leads gradually fade toward crimson decay and move into the **Archive** tab after 90 days.
- **Journey Table & Outreach Links**: Complete lead roster with one-click `email`, `wa` (WhatsApp), `sms`, and CRM deep links (`attio↗`, `ghl↗`).

### 4.4 Task Board (`/tasks`)
An interactive Kanban task board for managing agent work.
- **3 Columns**: `To do` (open), `In progress` (doing), `Done` (done).
- **Drag-and-Drop Column Transitions**: Drag cards across columns with optimistic UI rendering and background reconciliation against `PATCH /api/agents/work`.
- **Interactive Add Task Modal**: Modal form allowing operators to create tasks and assign them to any agent in the system.
- **Background Polling**: 6-second poll interval keeps the board synced as agents advance cards during automated executions.

### 4.5 Agents & Org Chart (`/agents`, `/org`)
The agent workforce management center.
- **Agent Roster (`/agents`)**: Roster of 30 specialized agents (e.g. Conductor, SDR Agent, Proposal Writer, Code Copilot, Cashflow Auditor, Social Strategist).
- **Run Controls**: Instant `Run` buttons to trigger an agent's `run()` method (`POST /api/agents/[id]/run`) with real-time status output.
- **Org Hierarchy Board (`/org`)**: Visual reporting tree mapping pillar leads to worker agents.
- **Broadcast Composer**: Broadcast a prompt to multiple agents simultaneously (`POST /api/agents/broadcast`).

### 4.6 Roadmap & Build Plan (`/roadmap`)
Strategic build plan and quarterly milestone tracker.
- **Phases Section**: Overview of high-level system development phases (Phase 01 through Phase 06).
- **Interactive Quarterly Board (`RoadmapBoard`)**: Milestones organized by quarter (`2026-Q1` through `2026-Q4`).
- **Click-to-Cycle Status**: Click any milestone card to cycle its status: `Later` (default ghost) ➔ `Next` (warn) ➔ `Now` (accent) ➔ `Done` (ok).
- **Interactive Add Milestone Form**: Form to add custom milestones to any quarter.

### 4.7 Unified Comms (`/comms`)
Consolidated inbox combining multiple communication channels:
- **Channels**: Email (IMAP), Slack, WhatsApp, and Google Calendar.
- **Priority Annotations**: Automatic tagging of leads and work keywords (`COMMS_WORK_KEYWORDS`).
- **Unread Counters & Feed**: Filter feed by source or unread status.

### 4.8 Finances & Statement Ingestion (`/finances`)
Financial command center for tracking agency revenue and accounts:
- **Stripe Snapshot**: Live balance checks (available vs pending).
- **Statement Uploader (`StatementUploader`)**: Upload CSV/PDF bank statements to parse and persist transaction entries to SQLite.
- **Income Charts & Ledgers**: Business revenue breakdown by product line and client.

### 4.9 Social Growth & Content (`/social`, `/content`)
Growth dashboard tracking social channels:
- **Platforms**: Instagram, TikTok, Twitter/X, YouTube, LinkedIn.
- **Metrics**: Total follower reach, 7d/30d growth percentages, posting frequency bars.
- **Content Pipeline (`/content`)**: Social post queue and post composer (`components/PostComposer.tsx`).

### 4.10 G-Brain Knowledge Core (`/brain`)
Central knowledge repository and memory core:
- **Brain Viz (`BrainViz`)**: 3D SVG ring visualization representing knowledge clusters.
- **Graph Lens (`BrainGraphView`)**: Directory and file network graph.
- **Hybrid Search**: Natural language & keyword search over markdown knowledge files (`GET /api/brain?q=`).

### 4.11 Connections Board (`/integrations`)
Live catalog of 12 connector groups:
- **Connectors**: `attio`, `slack`, `email`, `stripe`, `notion`, `gbrain`, `zernio`, `wispr`, `miro`, `arcads`, `obsidian`, `local-stack`.
- **Status Badges**: `connected` (green), `pending` (dim), or `error` (red).

### 4.12 Analytics & Operating Metrics (`/analytics`)
Performance metrics and distribution charts:
- **Live Metric Tiles**: Real-time stats (`splitMetrics`) for audience, subscribers, pipeline deals, Stripe balance, and agent runs.
- **Distribution Pies**: Audience share donut, agent run volume by agent, run success outcomes.
- **14-Day Run Volume Area Chart**: Real daily execution counts over the past 2 weeks.

### 4.13 Agency Workflows (`/workflows`)
Process mapping for client delivery and operations:
- Step-by-step process chains assigned to humans or agents.
- Weekly time cost (hours/week) and financial leak calculations ($/mo).

### 4.14 Skills Catalog (`/skills`)
Library of executable skills with markdown instructions (`SKILL.md`) mapped to owner agents.

---

## 5. Database Schemas & Data Model

All data is stored in `data/founder-os.db` (SQLite). Primary database tables include:

```sql
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  tier TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  tools TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS funnel_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venture TEXT NOT NULL,
  status TEXT NOT NULL,
  product TEXT,
  amount_usd REAL,
  relationship TEXT NOT NULL DEFAULT 'warm',
  likelihood INTEGER NOT NULL DEFAULT 50,
  url TEXT,
  email TEXT,
  phone TEXT,
  person TEXT,
  company TEXT,
  role TEXT,
  linkedin TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roadmap_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  quarter TEXT NOT NULL,
  status TEXT NOT NULL,
  department_id TEXT,
  description TEXT NOT NULL DEFAULT ''
);
```

---

## 6. API Route Registry

| Route | Methods | Description |
|---|---|---|
| `/api/agents` | `GET` | Fetch all seeded/runtime agents grouped by department. |
| `/api/agents/[id]/run` | `POST` | Execute agent `run()` method and persist execution to `agent_runs`. |
| `/api/agents/[id]/chat` | `POST` | Send natural language prompt to agent or Conductor router. |
| `/api/agents/work` | `GET`, `POST`, `PATCH`, `DELETE` | CRUD endpoints for agent tasks and cron schedules. |
| `/api/funnel` | `GET`, `POST` | Fetch lead journeys or insert new client lead contacts. |
| `/api/roadmap` | `GET`, `POST`, `PATCH` | Fetch roadmap quarters or insert/update milestones. |
| `/api/connections` | `GET` | Return live statuses of all 12 connector groups. |
| `/api/brain` | `GET` | Hybrid search query over knowledge store. |
| `/api/webhooks/manychat` | `POST` | Ingest inbound Instagram/Facebook DMs. |

---

## 7. Developer & Testing Guide

### Common Development Commands:
```bash
# Start local development server (port 4100)
npm run dev

# Run Vitest test suite (98 test files, 870+ tests)
npm test

# Run TypeScript type check
npm run typecheck

# Re-seed SQLite database (idempotent)
npm run seed
```

### GitHub Repository:
The complete canonical codebase is maintained on GitHub:
👉 **[https://github.com/itshydraaaaaa/Asteria-Os](https://github.com/itshydraaaaaa/Asteria-Os)**
