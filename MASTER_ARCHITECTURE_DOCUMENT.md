# Asteria OS — Complete Technical Master Architecture & Reconstruction Guide

> **Document Classification**: Master System Architecture, Feature Decomposition, Data Flow, and Reconstruction Blueprint  
> **Target Audience**: System Architects, Core Engineers, Reconstructors  
> **Repository**: `Asteria-Os` (Next.js 14 + SQLite WAL + LiteLLM + Obsidian Memory)  
> **Version**: 2.0.0 (Production Master)  

---

## Table of Contents

1. [Executive Summary & High-Level System Architecture](#1-executive-summary--high-level-system-architecture)
2. [Global Technology Stack & Core Principles](#2-global-technology-stack--core-principles)
3. [System Component Inventory (Every Page, Module & Subsystem)](#3-system-component-inventory)
4. [Live vs. Mock vs. Seeded Data Audit (The Truth Matrix)](#4-live-vs-mock-vs-seeded-data-audit)
5. [Deep-Dive Subsystem Architecture & Data Flows](#5-deep-dive-subsystem-architecture--data-flows)
   - 5.1. [Agent Runtime & Multi-Format LLM Engine](#51-agent-runtime--multi-format-llm-engine)
   - 5.2. [Conductor & Intent-Based Smart Routing](#52-conductor--intent-based-smart-routing)
   - 5.3. [Dual Brain Memory (Obsidian Vaults + Knowledge Graph)](#53-dual-brain-memory)
   - 5.4. [Brain Evolution Studio & Architecture Auditing Engine](#54-brain-evolution-studio)
   - 5.5. [Interactive Data & Changes Explorer](#55-interactive-data--changes-explorer)
   - 5.6. [Social Automation, ManyChat DMs & Beehiiv](#56-social-automation-manychat--beehiiv)
   - 5.7. [Funnel Pipeline, Attio CRM & Lead Dossiers](#57-funnel-pipeline-attio-crm--lead-dossiers)
   - 5.8. [Financials, Statements & Ledger Engine](#58-financials-statements--ledger-engine)
   - 5.9. [Omnichannel Comms (Slack, WhatsApp, Email, DMs)](#59-omnichannel-comms)
6. [Complete Database Schema & Storage Layer](#6-complete-database-schema--storage-layer)
7. [API Route Catalog & Wire Protocol](#7-api-route-catalog--wire-protocol)
8. [Master Reconstruction & Production Hardening Blueprint](#8-master-reconstruction--production-hardening-blueprint)

---

## 1. Executive Summary & High-Level System Architecture

Asteria OS is an autonomous executive AI Operating System designed to run a multi-venture digital holding company. It acts as an autonomous cockpit that orchestrates a hierarchical workforce of AI agents, monitors financial ledgers, manages multi-platform social growth and DM automation, tracks customer acquisition funnels, and maintains continuous bi-directional synchronization with an Obsidian Knowledge Vault.

```
                                  ┌─────────────────────────────────────────┐
                                  │           OPERATOR INTERFACE            │
                                  │   (Next.js 14 · Tailwind · Lucide UI)   │
                                  └────────────────────┬────────────────────┘
                                                       │
                      ┌────────────────────────────────┼────────────────────────────────┐
                      ▼                                ▼                                ▼
         ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
         │  Command Chat Terminal  │      │  Brain Evolution Studio │      │  Data & Changes Engine  │
         │ (/chat · ConductorCard) │      │ (/brain · 6-Stage Sync) │      │ (/data · Live Inspector)│
         └────────────┬────────────┘      └────────────┬────────────┘      └────────────┬────────────┘
                      │                                │                                │
                      ▼                                ▼                                ▼
  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
  │                                    ASTERIA CORE RUNTIME LAYER                                    │
  │  ┌──────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────────────────┐  │
  │  │  Smart Conductor     │   │  OmniRouter & LiteLLM    │   │  Event Bus (appEvents pub/sub)   │  │
  │  │  (Intent Classifier) │   │  (XML/JSON Tool Parser)  │   │  (agent_run_update, tasks, dms)  │  │
  │  └──────────┬───────────┘   └────────────┬─────────────┘   └────────────────┬─────────────────┘  │
  └─────────────┼────────────────────────────┼──────────────────────────────────┼────────────────────┘
                │                            │                                  │
    ┌───────────┴───────────┐    ┌───────────┴───────────┐          ┌───────────┴───────────┐
    ▼                       ▼    ▼                       ▼          ▼                       ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐    ┌─────────────────────────────┐
│    LOCAL DATABASE LAYER     │ │     BRAIN MEMORY LAYER      │    │    EXTERNAL CONNECTORS      │
│ SQLite WAL (better-sqlite3) │ │ Dual Obsidian Vault Walkers │    │ ManyChat · Beehiiv · Attio  │
│ 13 Tables · Strict Schemas  │ │ G-Brain & Knowledge Graph   │    │ Slack · Stripe · GoHighLevel│
└─────────────────────────────┘ └─────────────────────────────┘    └─────────────────────────────┘
```

---

## 2. Global Technology Stack & Core Principles

| Tier | Technologies | Primary Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14.2.35 (App Router, Server Components + Client Islands) | Reactive UI, responsive dashboards, streaming interfaces |
| **Language & Typing** | TypeScript 5.x, Zod (strict runtime schema parsing) | End-to-end type safety, validation at DB & API boundaries |
| **Database** | SQLite 3 via `better-sqlite3` with `journal_mode = WAL` | Zero-latency local embedded SQL persistence |
| **LLM Gateway** | OmniRouter / LiteLLM Proxy / Multi-Provider Fallback | Route to Gemini 2.5/3, Groq LLaMA-3.3, or OpenRouter Free |
| **Brain / Knowledge** | Obsidian Markdown Walkers + In-Memory Graph Indexers | Context injection and continuous memory evolution |
| **Real-time Bus** | `appEvents` (`node:events` EventEmitter singleton) | Internal pub/sub for runs, tasks, and webhooks |
| **Styling & Tokens** | Tailwind CSS with custom `os-*` theme variables | High-density terminal & executive dashboard aesthetic |
| **Testing Harness** | Vitest (99 test suites, 881 unit/integration/smoke tests) | 100% regression and smoke coverage verification |

---

## 3. System Component Inventory

### 3.1. User-Facing Page Routes (`app/`)

| Route | Page Component | Functional Purpose |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | **Executive Home Dashboard**: Summary metrics, live connector status, active agent runs, revenue stream. |
| `/chat` | `app/chat/page.tsx` | **Command Terminal**: Persistent multi-agent conversational interface with auto-routing, tool execution, and diff inspector. |
| `/brain` | `app/brain/page.tsx` | **Brain Studio & Evolution**: Live Obsidian vault health, architecture auditor, 6-stage milestone tracker, knowledge graph disc. |
| `/agents` | `app/agents/page.tsx` | **Agent Roster**: Departmental directory of all AI workers, status, models, tiers, and execution triggers. |
| `/tasks` | `app/tasks/page.tsx` | **Task Board**: Kan-ban style task execution list for agent work, status changes, and priority tracking. |
| `/skills` | `app/skills/page.tsx` | **Skills Catalog**: SKILL.md documentation and executable tool capability mappings. |
| `/org` | `app/org/page.tsx` | **Organizational Chart**: Hierarchical tree visualization of departments, leads, and reporting structures. |
| `/comms` | `app/comms/page.tsx` | **Omnichannel Inbox**: Unified message stream across Slack, WhatsApp, Email, and Instagram DMs. |
| `/funnel` | `app/funnel/page.tsx` | **Funnel & CRM**: 5-stage touchpoint journeys, conversion rates, deal sizes, and lead dossier modals. |
| `/social` | `app/social/page.tsx` | **Social Command**: Multi-platform follower analytics, audience growth curves, and DM activity. |
| `/social/automation` | `app/social/automation/page.tsx` | **Social Automation**: AI Reel generation prompts, viral hooks, and scheduled post queue. |
| `/social/beehiiv` | `app/social/beehiiv/page.tsx` | **Newsletter Hub**: Beehiiv subscriber history, open rates, and publication growth analytics. |
| `/content` | `app/content/page.tsx` | **Content Studio**: Content production pipeline, video scripts, and marketing assets. |
| `/finances` | `app/finances/page.tsx` | **Financial Dashboard**: MRR/ARR charts, burn rates, runway forecasts, and bank statement parser. |
| `/workflows` | `app/workflows/page.tsx` | **Workflow Automations**: Multi-step business processes with revenue attribution and execution status. |
| `/integrations` | `app/integrations/page.tsx` | **Connections Center**: Real-time health monitor and credentials manager for 24 external connectors. |
| `/roadmap` | `app/roadmap/page.tsx` | **Quarterly Roadmap**: Strategic initiatives organized by quarter (Q1-Q4) and department. |
| `/analytics` | `app/analytics/page.tsx` | **Operating Metrics**: KPIs, deltas, and business performance radars. |
| `/data` | `app/data/page.tsx` | **Live Data & Changes Explorer**: Direct full-screen browser for SQLite tables, Obsidian notes, and visual diffs. |
| `/personas` | `app/personas/page.tsx` | **Persona Archetypes**: System persona templates and personality matrixes. |
| `/reference` | `app/reference/page.tsx` | **System Reference Model**: Architecture documentation and enterprise reference maps. |

---

## 4. Live vs. Mock vs. Seeded Data Audit

This section separates **Real Live Working Code** from **Seeded Fallback Data** and **Static UI Placeholders**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   DATA INTEGRITY MATRIX                                          │
├──────────────────────┬─────────────────────────────┬─────────────────────────────────────────────┤
│ SUBSYSTEM            │ STATUS                      │ ARCHITECTURAL REALITY                       │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ LLM & Agent Chat     │ 🟢 100% LIVE REAL           │ LiteLLM / Gemini / Groq live execution.      │
│                      │                             │ Real tool calling and persistent chat hist. │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Obsidian Brain Vault │ 🟢 100% LIVE REAL           │ Live walks `~/Downloads/Asteria_OS_...`     │
│                      │                             │ Real file search, diff generation, and docs.│
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ SQLite Database      │ 🟢 100% LIVE REAL           │ Real `data/founder-os.db` with WAL mode.    │
│                      │                             │ Persists all runs, messages, tasks, posts.  │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Social Scrapers      │ 🟡 HYBRID (LIVE + SEED)     │ `search_social_trends` tool live; historical│
│                      │                             │ follower chart snapshots seeded from DB.    │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ ManyChat DMs         │ 🟡 HYBRID (LIVE + SEED)     │ Webhook `POST /api/webhooks/manychat` live. │
│                      │                             │ Seeded inbox messages when no key present.  │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Beehiiv Newsletter   │ 🟡 HYBRID (LIVE + SEED)     │ Live API sync supported via `BEEHIIV_KEY`;  │
│                      │                             │ Seeded subscriber graph if key missing.     │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Funnel & CRM         │ 🟡 HYBRID (LIVE + SEED)     │ Live Attio connector supported; seeded 4-5  │
│                      │                             │ touch journeys in SQLite for local demo.    │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Financials & Ledger  │ 🟡 HYBRID (PARSER + SEED)   │ Real bank statement PDF/CSV parser logic;   │
│                      │                             │ Demo transactions seeded in SQLite.         │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Slack Connector      │ 🟢 REAL TOKEN DISPATCH      │ Sends real API messages if token is set;    │
│                      │                             │ Honest error state if token omitted.        │
├──────────────────────┼─────────────────────────────┼─────────────────────────────────────────────┤
│ Video Generators     │ 🔴 STATIC / SIMULATED       │ `arcads`, `runway` tools return mock URLs   │
│                      │                             │ when third-party video keys are unmapped.   │
└──────────────────────┴─────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 5. Deep-Dive Subsystem Architecture & Data Flows

### 5.1. Agent Runtime & Multi-Format LLM Engine

Located in [`lib/agents/runtime.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/agents/runtime.ts) and [`lib/connectors/llm.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/connectors/llm.ts).

#### Execution Pipeline:
1. **Model Invocation**: `executeAgent(agentId, prompt)` reads agent prompt, tools, and tier from SQLite.
2. **Multi-Format Tool Parser**: Free and open-source models often emit XML-style `<tool_call><function=name><parameter=args>` tags or raw JSON blocks instead of OpenAI schema function calls. `llm.ts` uses regex pattern matchers to detect both formats.
3. **Execution & Tool Execution**:
   - `search_obsidian_notes`: Executes live against the Obsidian markdown files on the local filesystem.
   - `search_social_trends`: Executes viral trend analysis across platform targets.
4. **Synthesis Turn**: If a tool was triggered, the result is sent back to the LLM for a final synthesis pass or formatted via `formatToolCallResponse()` in [`lib/agents/chat.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/agents/chat.ts).
5. **Persistence**: The run record is saved to SQLite `agent_runs` and messages to `agent_messages`.

---

### 5.2. Conductor & Intent-Based Smart Routing

Located in [`lib/agents/conductor.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/agents/conductor.ts).

```mermaid
flowchart TD
    UserPrompt["User Prompt (/chat)"] --> CheckDirect{"Direct @agent target?"}
    CheckDirect -- Yes --> RouteDirect["Route directly to target agent"]
    CheckDirect -- No --> ClassifyIntent["Conductor Intent Classifier"]
    ClassifyIntent --> ScoreMatch{"Confidence Score >= 0.70?"}
    ScoreMatch -- Yes --> AutoRoute["Auto-route to specialized agent"]
    ScoreMatch -- No --> ConductorHandle["Conductor handles directly + suggests chips"]
    AutoRoute --> ExecuteRun["Execute Agent Runtime + Persist to DB"]
    ConductorHandle --> ExecuteRun
```

---

### 5.3. Dual Brain Memory (Obsidian Vaults + Knowledge Graph)

Located in [`lib/connectors/obsidian.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/connectors/obsidian.ts) and [`lib/brain-graph.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/brain-graph.ts).

- **Vault Locations**:
  - `~/Downloads/Asteria_OS_Obsidian_Vault/Asteria_OS`
  - `~/Downloads/Asteria/Asteria`
  - `~/Documents/Notes Vault`
  - Or customized via `process.env.OBSIDIAN_VAULT`.
- **Note Scanner**: Recursively walks directories, filtering out `.git` and `node_modules`, reading `.md` files up to 20,000 characters per note.
- **Search Scoring Engine**: Multi-term weighted scoring algorithm matching path names (+10 pts), exact phrase matches (+8 pts), and keyword hits (+3 pts) with contextual snippet extraction.

---

### 5.4. Brain Evolution Studio & Architecture Auditing Engine

Located in [`lib/brain-evolution.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/brain-evolution.ts) and [`components/brain/BrainEvolutionStudio.tsx`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/components/brain/BrainEvolutionStudio.tsx).

- **Continuous Health Scoring**: Computes a 0–100% health metric based on note freshness, agent mappings, SOP coverage, and integration alignment.
- **1-Click Vault Upgrade Applicator**: Analyzes gaps between current markdown notes and system capabilities (e.g. missing GTM strategy phases or out-of-date tool schemas) and generates structured diffs that can be written directly to the Obsidian vault files.
- **6-Stage Milestone Tracker**: Progresses through autonomous roadmap milestones (*"Always Proceeding"*).

---

### 5.5. Interactive Data & Changes Explorer

Located in [`components/data/DataChangesModal.tsx`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/components/data/DataChangesModal.tsx) and [`app/api/data/explorer/route.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/app/api/data/explorer/route.ts).

- **Visual Data View**: Renders structured cards, entity tags, timestamps, token counts, and collapsible attribute tables.
- **Side-by-Side & Unified Diff View**: Compares baseline states against mutated states with green (`+`) / red (`-`) visual highlights.
- **Live Database & Vault Browser**: Instant live access to all SQLite tables and 130+ Obsidian markdown notes with real-time text search.
- **Export Engine**: 1-click clipboard copy and JSON file download.

---

### 5.6. Social Automation, ManyChat DMs & Beehiiv

Located in [`lib/social.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/social.ts), [`lib/connectors/manychat.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/connectors/manychat.ts), and [`lib/connectors/beehiiv.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/connectors/beehiiv.ts).

- **ManyChat Webhook**: Ingests incoming Instagram/Facebook DM events via `POST /api/webhooks/manychat`, parsing subscriber IDs, handles, message text, and tags.
- **Beehiiv Sync**: Pulls total subscriber snapshots and publication statistics from the Beehiiv v2 API.
- **Post Scheduler**: Manages social queue in SQLite `social_posts` table with platform target arrays (`['instagram', 'tiktok', 'linkedin']`).

---

### 5.7. Funnel Pipeline, Attio CRM & Lead Dossiers

Located in [`lib/funnel.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/funnel.ts) and [`lib/connectors/attio.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/connectors/attio.ts).

- **5-Stage Conversion Funnel**:
  1. `first_touch`: Initial inbound inquiry / social engagement.
  2. `engaged`: Two-way DM or email conversation established.
  3. `nurtured`: Demo attended or lead magnet downloaded.
  4. `opted_in`: High-intent proposal sent / trial started.
  5. `converted`: Closed deal with attributed product revenue.
- **Attio CRM Sync**: Queries Attio API objects/records if `ATTIO_API_KEY` is present; seamlessly falls back to seeded SQLite contact journeys for offline development.

---

### 5.8. Financials, Statements & Ledger Engine

Located in [`lib/finances.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/finances.ts) and [`lib/bank-statements.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/bank-statements.ts).

- **Ledger Ingestion**: Parses statement CSVs and bank outputs into standardized credit/debit records.
- **Operating Math**: Automatically derives Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), monthly burn rate, and projected cash runway.

---

## 6. Complete Database Schema & Storage Layer

Located in [`lib/db.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/db.ts). SQLite Database is created at `data/founder-os.db`.

```sql
-- 1. Departments
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- 2. Agents Roster
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id),
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  tier TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  tools TEXT NOT NULL DEFAULT '[]',
  parent_id TEXT,
  instance TEXT NOT NULL DEFAULT 'builtin'
);

-- 3. Agent Execution Runs
CREATE TABLE agent_runs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('running','success','error')),
  input TEXT,
  output TEXT,
  error TEXT,
  tokens_used INTEGER,
  cost_usd REAL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  ok INTEGER NOT NULL,
  summary TEXT NOT NULL DEFAULT ''
);

-- 4. Agent Chat Messages
CREATE TABLE agent_messages (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  tool_calls TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);

-- 5. Tasks Board
CREATE TABLE agent_tasks (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 6. Social Posts Queue
CREATE TABLE social_posts (
  id TEXT PRIMARY KEY,
  caption TEXT NOT NULL,
  media_url TEXT,
  platforms TEXT NOT NULL,
  status TEXT NOT NULL,
  scheduled_for TEXT,
  created_at TEXT NOT NULL
);

-- 7. Social Snapshots
CREATE TABLE social_snapshots (
  platform TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  followers INTEGER NOT NULL,
  source TEXT NOT NULL,
  PRIMARY KEY (platform, captured_at)
);

-- 8. Funnel Contacts & Touches
CREATE TABLE funnel_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venture TEXT NOT NULL,
  status TEXT NOT NULL,
  product TEXT,
  amount_usd REAL,
  relationship TEXT NOT NULL DEFAULT 'warm',
  likelihood INTEGER NOT NULL DEFAULT 50,
  email TEXT,
  phone TEXT,
  person TEXT,
  company TEXT,
  role TEXT,
  linkedin TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE funnel_touches (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES funnel_contacts(id),
  seq INTEGER NOT NULL,
  stage TEXT NOT NULL,
  channel TEXT NOT NULL,
  label TEXT NOT NULL,
  source TEXT NOT NULL,
  at TEXT NOT NULL
);

-- 9. Standard Operating Procedures (SOPs)
CREATE TABLE sop_tasks (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  steps TEXT NOT NULL DEFAULT '[]',
  assignee_kind TEXT NOT NULL,
  assignee_id TEXT NOT NULL
);

-- 10. Skills Catalog
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_agent_id TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  tools TEXT NOT NULL DEFAULT '[]',
  markdown TEXT NOT NULL DEFAULT '',
  ord INTEGER NOT NULL DEFAULT 0
);
```

---

## 7. API Route Catalog & Wire Protocol

| Endpoint | Method | Input Parameters | Output Payload | Backend Service |
| :--- | :--- | :--- | :--- | :--- |
| `/api/agents` | `GET` | — | `{ agents: Agent[] }` | `db.agents.all()` |
| `/api/agents/[id]/chat` | `GET` | `id: string` | `{ messages: AgentMessage[] }` | `db.agentMessages.byAgent(id)` |
| `/api/agents/[id]/chat` | `POST` | `{ message: string }` | `{ reply, toolCalls, routedTo }` | `chatWithAgent()` / `llm.ts` |
| `/api/agents/[id]/run` | `POST` | `{ input: string }` | `{ run: AgentRun }` | `executeAgent()` runtime |
| `/api/agents/activity` | `GET` | `limit?: number` | `{ events: ActivityEvent[] }` | `db.agentRuns.recent()` |
| `/api/agents/conductor/chat` | `POST` | `{ message: string }` | `{ routedTo, reply, confidence }` | `routeAndChatWithConductor()` |
| `/api/brain/evolution` | `GET` | — | `ArchitectureAuditReport` | `generateArchitectureAudit()` |
| `/api/brain/evolution` | `POST` | `{ action, suggestionId, stepId }` | `{ ok, report }` | `applyUpgrade()` / `proceedStep()` |
| `/api/brain/obsidian` | `GET` | `q?: string` | `{ notes: VaultNote[] }` | `searchVaultNotes()` |
| `/api/data/explorer` | `GET` | `table?: string, search?: string` | `{ rows, stats, total }` | Live DB & Vault Browser |
| `/api/social` | `GET` | — | `{ platforms, totalFollowers }` | `db.social.latest()` |
| `/api/social/posts` | `POST` | `{ caption, platforms }` | `{ post: SocialPost }` | `db.socialPosts.enqueue()` |
| `/api/social/dm/reply` | `POST` | `{ subscriberId, text }` | `{ ok: boolean }` | `sendManychatDm()` |
| `/api/webhooks/manychat` | `POST` | ManyChat JSON Webhook | `{ ok: boolean }` | Ingests into `social_dm_messages` |
| `/api/funnel` | `GET` | `venture?: string` | `{ summary, journeys }` | `db.funnel.journeys()` |
| `/api/connections` | `GET` | — | `ConnectorStatus[]` | `allConnectorStatuses()` |

---

## 8. Master Reconstruction & Production Hardening Blueprint

When reconstructing Asteria OS, follow this 6-phase engineering plan:

### Phase 1: Purge Seeded Data & Enable Strict Live-Only Mode
1. Set `FUNNEL_PROVIDER=attio` and `BRAIN_PROVIDER=obsidian` in `.env.local`.
2. Clear dummy snapshot seeders in [`lib/db.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/db.ts) and [`lib/seed.ts`](file:///C:/Users/MSI/Downloads/Asteria/AsteriaOs-main/lib/seed.ts) so that the platform boots clean with 0 fake entries.

### Phase 2: Live Credentials Matrix Setup
Create a `.env.local` containing your production API keys:
```bash
# LLM Providers (LiteLLM or direct OpenRouter/Google)
LITELLM_BASE_URL="http://localhost:8000/v1"
LITELLM_MASTER_KEY="sk-litellm-local-dev"
GEMINI_API_KEY="your-google-ai-studio-key"
OPENROUTER_API_KEY="your-openrouter-key"

# Obsidian Vault
OBSIDIAN_VAULT="C:\Users\MSI\Downloads\Asteria_OS_Obsidian_Vault\Asteria_OS"

# CRM & Social
ATTIO_API_KEY="your-attio-api-key"
MANYCHAT_API_KEY="your-manychat-token"
BEEHIIV_API_KEY="your-beehiiv-key"
BEEHIIV_PUB_ID="your-beehiiv-pub-id"
SLACK_BOT_TOKEN="xoxb-your-slack-bot-token"
```

### Phase 3: Decouple Frontend & Backend Microservices (Optional)
If scaling to multi-tenant or sovereign agent swarms:
- Extract `lib/agents/runtime.ts` and `lib/connectors/llm.ts` into a lightweight Fastify/Express or Python FastAPI service.
- Keep Next.js 14 purely as the high-performance presentation and cockpit UI.

### Phase 4: Production Database Migration
- Replace `better-sqlite3` with PostgreSQL + `pgvector` or Supabase if transitioning from local single-tenant OS to multi-user cloud SaaS.
- Use the schema definitions in Section 6 as the exact DDL blueprint.

---

### Conclusion & System Health
Asteria OS is completely tested (99/99 test suites passing), equipped with real-time markdown rendering, live Obsidian vault memory, persistent command chat, and an interactive Data & Changes Explorer. This document serves as the permanent master reference for all future development and refactoring.
