# Facturix CRM – Enhancement Backlog

_Last updated: 2025-11-20_

This document summarizes the current Facturix CRM surface area and enumerates enhancement ideas that **extend** the existing product rather than replacing it. References follow workspace paths (e.g. `app/(dashboard)/dashboard/page.tsx`).

---

## 1. Current System Snapshot

- **Positioning**: Facturix CRM (Suzali Conseil) is a specialized B2B sales outsourcing platform focused on campaign-based lead execution (see `README.md`).
- **Tech stack**: Next.js 16 App Router + TypeScript strict mode (`tsconfig.json`), Tailwind + Shadcn/UI (`components/ui/*`, `designsystem.txt`), Prisma + PostgreSQL (`prisma/schema.prisma`), NextAuth auth (`app/api/auth/[...nextauth]/route.ts`), and integrations for IMAP/SMTP email (`lib/email-sync.ts`, `lib/email.ts`) plus Aircall (`lib/aircall.ts`, `components/aircall/click-to-dial.tsx`).
- **Accounts & Campaigns**: CRUD pages inside `app/(dashboard)/accounts/*` and `app/(dashboard)/campaigns/*`, CSV-based lead ingestion via `components/csv-upload/csv-upload-wizard.tsx` and `lib/csv-processor.ts`.
- **Lead management**: Advanced table/card (`components/leads/lead-table-enhanced.tsx`, `components/leads/lead-card-view.tsx`), filters & bulk actions (`components/leads/lead-filters.tsx`, `components/leads/bulk-actions.tsx`), locking logic via `app/api/leads/next/route.ts` + `prisma` `FOR UPDATE SKIP LOCKED`.
- **Assignments**: `CampaignAssignment`/`AccountAssignment` models plus dialogs (`components/assignments/*`) and APIs under `app/api/campaigns/[id]/assign` & `app/api/accounts/[id]/assign`.
- **Activities**: Logging utilities (`lib/notifications.ts`, `lib/tasks.ts`) and feed UI (`components/activity/activity-feed.tsx`).
- **Email & Inbox**: IMAP sync job via `app/api/cron/email-sync/route.ts`, inbox list (`app/(dashboard)/inbox/page.tsx`), compose view (`app/(dashboard)/inbox/compose/page.tsx`), template + sequence builders (`components/email/*`), plus automation surface at `app/(dashboard)/email-automation/page.tsx`.
- **Dashboard**: `app/(dashboard)/dashboard/page.tsx` uses `KPIWidgets`, `RecentDeals`, and `TaskList` but still relies on placeholder stats until `/api/dashboard/stats` is wired (see `TODO.md`).
- **Portal**: Token-based client analytics view in `app/portal/[token]/page.tsx`, currently read-only with space for file sharing.
- **Search & Tasks**: Global search scaffolding (`app/(dashboard)/search/page.tsx`, `components/search/*`, `lib/search.ts`), task list/dialog (`components/tasks/*`, `lib/tasks.ts`).
- **Design coherence**: Existing UI already aligns with `designsystem.txt` (mint green #3BBF7A, 16px cards, Inter typography, 8px grid), enforcing consistency via shared components in `components/ui/*`.

---

## 2. Enhancement Buckets & Ideas

Each idea references current building blocks so implementation remains incremental.

### 2.1 Dashboard & Analytics

1. **Live KPI wiring** – Finish `/api/dashboard/stats/route.ts` to feed `KPIWidgets` with real counts (accounts, active campaigns, leads, conversion), matching TODO item 1.
2. **Per-BD performance tiles** – Extend `components/dashboard/kpi-widgets.tsx` to render a grid sourced from activity counts (calls/emails/tasks) per BD via `lib/activity-feed` queries.
3. **Campaign funnel charts** – Add a funnel visualization component (reuse `components/dashboard/analytics-charts.tsx`) showing lead status progression per campaign.
4. **Activity trends** – Introduce time-series cards (7/30-day lines) for calls/emails using the existing chart primitives and `activity-feed` data.
5. **Manager overview toggle** – Use NextAuth role info (from `types/next-auth.d.ts`) to let managers switch KPI scope between “my metrics” and “team metrics”.
6. **At-risk campaigns panel** – Cross-check `activities` + `campaigns` to flag low-activity or aging campaigns within a new `Card` block on the dashboard.
7. **Goal tracking widgets** – Store goals per BD/campaign (extend Prisma) and visualize progress with ring charts or progress bars (`components/ui/progress.tsx`).

### 2.2 Leads Workspace & BD Flow

1. **Campaign selector before “Get Next”** – Complete the selector UX referenced in `TODO.md` by plugging `components/ui/select.tsx` into `app/(dashboard)/leads/workspace/page.tsx`.
2. **Inline call outcomes** – Add quick-action buttons (No answer, VM, Interested, Not a fit) that log activities via `app/api/activities/route.ts` and update lead status before unlocking.
3. **Script & objection drawer** – Side panel using `components/ui/collapsible.tsx` showing per-campaign scripts stored alongside campaign metadata.
4. **Keyboard shortcuts** – Hook into `useHotkeys` (add small helper) for actions like call/email/log/next to speed up BDs.
5. **Auto-unlock on completion** – Ensure “Finish & Get Next” triggers the existing `DELETE /api/leads/[id]/lock` route plus status updates to prevent orphaned locks.
6. **Context panel** – Display recent emails/calls for the active lead by reusing `components/activity/activity-feed.tsx` in condensed mode within the workspace.

### 2.3 Leads & Campaign Management

1. **Saved lead views** – Persist filter/sort/column combos from `LeadTableEnhanced` to the DB (per user) and surface them as chips or dropdown presets.
2. **Campaign filter presets** – Allow managers to define default filters per campaign so BDs instantly land on the right slice; reuse existing filter schema.
3. **Custom statuses per campaign** – Build optional status sets referencing current global statuses but scoped to campaigns (noted in `IMPLEMENTATION_SUMMARY.md`).
4. **Lead score breakdown UI** – Surface the contributions from `lib/lead-scoring.ts` inside the lead detail sidebar.
5. **Bulk enrichment helpers** – Add quick cleanup operations (normalize phone, standardize countries) to `app/api/leads/bulk/route.ts` and expose them through `BulkActions`.
6. **Duplicate detection** – A view that highlights possible duplicates (email/phone matches) leveraging `/api/leads?search=` results.
7. **Campaign cohort analysis** – Chart conversion by cohort start week inside `app/(dashboard)/campaigns/[id]/page.tsx` using existing chart components.

### 2.4 Inbox, Email & Automation

1. **Thread detail page** – Build `app/(dashboard)/inbox/[id]/page.tsx` to show full email threads with replies, referencing `app/api/inbox/threads/[id]/route.ts`.
2. **Inline reply & templates** – Embed `components/email/template-editor.tsx` or a lite version inside the thread page with personalization tokens.
3. **Compose-from-lead integration** – When composing from workspace or lead detail, prefill recipient info and link the sent email back to the lead’s activities.
4. **Template personalization tokens** – Extend the template editor to resolve `{{firstName}}`, `{{company}}`, etc., using lead/account data.
5. **Sequence performance analytics** – Display open/click/reply rates per step inside `app/(dashboard)/email-automation/page.tsx` using data from `lib/email-templates.ts`.
6. **Snooze emails** – Add a “Snooze” action that creates a due task via `lib/tasks.ts` and surfaces it in the inbox UI.
7. **Email settings UI** – Implement `app/(dashboard)/settings/email/page.tsx` where users manage IMAP/SMTP credentials (per TODO item 14).

### 2.5 Accounts, Portal & Client Collaboration

1. **Account file management** – Add upload controls plus listing on `app/(dashboard)/accounts/[id]/page.tsx` leveraging the existing `uploads/` directory and a new metadata model.
2. **Guest portal downloads** – Mirror those files in `app/portal/[token]/page.tsx` with role-aware visibility.
3. **Account health summary** – Mini dashboard on account detail surfaces (active campaigns, avg lead quality, meetings booked) using existing stats utilities.
4. **Per-account goals** – Track goals (SQLs/month etc.) and show them both in account detail and the dashboard/portal.
5. **Internal comments** – Lightweight comment thread per account using the activity model (type = `COMMENT`).
6. **Client-visible notes** – Add a flag on notes/activities so select entries appear in the portal for transparency.

### 2.6 Search, Tasks & Activity

1. **True global search** – Upgrade `app/(dashboard)/search/page.tsx` to query `/api/search` for leads/accounts/campaigns/tasks with result tabs.
2. **Scoped filters** – Within search, provide type-specific filters (e.g., lead status, account industry) using current filter components.
3. **Lead timeline** – Embed `components/activity/activity-feed.tsx` on `app/(dashboard)/leads/[id]/page.tsx` with filters for Calls/Emails/Notes.
4. **Activity quick jumps** – Jump links to “first contact” or “last reply” using timeline anchors.
5. **Task Kanban** – Alternative view in `components/tasks/task-list.tsx` grouping tasks into Today/This Week/Later columns.
6. **Smart follow-up suggestions** – Generate tasks like “No touch in 7 days” from activity gaps and surface them in notifications or the dashboard.

### 2.7 System Architecture, Performance & Reliability

1. **Background job abstraction** – Wrap direct processing (CSV import, email sync) in a lightweight job service (still in-process) to simplify future worker adoption.
2. **CSV import progress tracking** – Expose row-processing progress via `/api/bulk` endpoints or websockets so users see live status during imports.
3. **Socket.io live updates** – Utilize the existing Socket.io dependency to push real-time lead locks/unlocks, task changes, activity feed additions.
4. **Cached dashboard stats** – Short-term caching layer (Redis-ready but optional) for expensive stat queries powering `/api/dashboard/stats`.
5. **Audit log** – Persist audit events (assignments, deletions, exports) referencing `lib/notifications.ts` for admin visibility.
6. **Role-based feature toggles** – Centralize feature gating per role in `lib/auth.ts` to limit access to bulk deletes, analytics, etc.

### 2.8 Design System & UX Polish

1. **Spacing audit** – Systematically align pages to the 8px grid and 16–24px card padding described in `designsystem.txt`.
2. **Consistent card framing** – Ensure all card surfaces use 16px radius, light shadow (`0 2px 6px rgba(0,0,0,0.05)`), and border tokens.
3. **Empty states** – Friendly, mint-accented empty states with single CTAs for leads, campaigns, tasks, inbox, portal.
4. **Skeleton loaders** – Replace spinners with skeletons/shimmers in lead tables, dashboard charts, portal lists using Tailwind animations.
5. **Micro-interactions** – Apply hover scale (1.01) and 120–150 ms fade transitions to buttons, cards, pipeline columns per section 13 of the design system.
6. **Notification UX** – Enhance `components/notifications/notification-dropdown.tsx` with grouped sections (“Aujourd’hui”, “Plus tôt”) and status chips.
7. **Dark mode prep** – Later, introduce dark tokens from `designsystem.txt` via CSS variables while keeping mint accent constant.

---

## 3. Prioritization & Execution Approach

1. **Persona-first lens** – Decide which persona to optimize first (BD efficiency, manager visibility, client transparency). This guides bucket selection.
2. **Pick a focused batch** – Select 5–10 ideas (e.g., dashboard stats, workspace campaign selector, inbox thread view, account files, activity timeline) that maximize impact vs. effort.
3. **Vertical slices** – For each idea, deliver API + UI together (e.g., `/api/dashboard/stats` + `KPIWidgets` wiring) so each iteration is fully usable.
4. **Feedback loops** – Deploy slices to a small BD/manager group, capture feedback after a few days, then iterate before scaling to the next batch.
5. **Design system guardrails** – Validate every new UI against `designsystem.txt` (colors, spacing, typography) to maintain CRM consistency.
6. **Track progress** – Use an internal checklist or project board mirroring these buckets; link tasks to existing TODO items when applicable.

---

This backlog should serve as a living document—extend each bucket with estimates, owners, and sequencing as priorities evolve.


