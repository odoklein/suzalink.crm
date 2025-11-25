# 🎯 Facturix CRM - Implementation Task Breakdown

**Created:** November 21, 2025  
**Based on:** DEEP_ANALYSIS_AND_ROADMAP.md  
**Priority System:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## 🔴 PHASE 1: CRITICAL (Week 1-2) - Pipeline Module

### Task 1.1: Database Schema - Deal/Opportunity Model
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Add `Deal` model to `prisma/schema.prisma`
  ```prisma
  model Deal {
    id          String   @id @default(uuid())
    accountId   String   @map("account_id")
    campaignId  String?  @map("campaign_id")
    leadId      String?  @map("lead_id")
    ownerId     String   @map("owner_id")
    name        String
    value       Decimal  @db.Decimal(12, 2)
    stage       String   // "prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"
    probability Int      @default(0) // 0-100
    closeDate   DateTime @map("close_date")
    closedAt    DateTime? @map("closed_at")
    lostReason  String?  @map("lost_reason")
    notes       String?  @db.Text
    metadata    Json?    // Additional deal data
    createdAt   DateTime @default(now()) @map("created_at")
    updatedAt   DateTime @updatedAt @map("updated_at")
  }
  ```
- [ ] Add relations to Account, Campaign, Lead, User
- [ ] Add indexes: `accountId`, `campaignId`, `leadId`, `ownerId`, `stage`, `closeDate`
- [ ] Run migration: `npx prisma migrate dev --name add_deal_model`
- [ ] Generate Prisma client: `npx prisma generate`

**Files to Create/Modify:**
- `prisma/schema.prisma`

---

### Task 1.2: Deal API Endpoints
**Priority:** 🔴 Critical  
**Estimated Time:** 6 hours  
**Dependencies:** Task 1.1

**Subtasks:**
- [ ] Create `app/api/deals/route.ts`
  - `GET` - List deals with filters (stage, owner, account, date range)
  - `POST` - Create new deal
- [ ] Create `app/api/deals/[id]/route.ts`
  - `GET` - Get deal by ID with relations
  - `PUT` - Update deal
  - `DELETE` - Delete deal
- [ ] Create `app/api/deals/stats/route.ts`
  - Pipeline value by stage
  - Forecasted revenue
  - Win rate
  - Average deal size
  - Average sales cycle
- [ ] Add authentication checks to all endpoints
- [ ] Add permission checks (only owner or ADMIN/MANAGER can edit)

**Files to Create:**
- `app/api/deals/route.ts`
- `app/api/deals/[id]/route.ts`
- `app/api/deals/stats/route.ts`

---

### Task 1.3: Pipeline Kanban Component
**Priority:** 🔴 Critical  
**Estimated Time:** 8 hours  
**Dependencies:** Task 1.2

**Subtasks:**
- [ ] Create `components/pipeline/pipeline-kanban.tsx`
  - Kanban board with columns per stage
  - Drag-and-drop using @dnd-kit
  - Deal cards with key info (name, value, close date, probability)
  - Deal count and total value per stage
  - Filter by owner, account, date range
- [ ] Create `components/pipeline/deal-card.tsx`
  - Display deal info
  - Progress indicator (probability)
  - Quick actions (view, edit, delete)
  - Owner avatar
  - Account name
- [ ] Create `components/pipeline/deal-dialog.tsx`
  - Form for create/edit deal
  - Account selector
  - Campaign selector (optional)
  - Lead selector (optional)
  - Owner selector
  - Value input
  - Probability slider
  - Close date picker
  - Stage selector
  - Notes textarea

**Files to Create:**
- `components/pipeline/pipeline-kanban.tsx`
- `components/pipeline/deal-card.tsx`
- `components/pipeline/deal-dialog.tsx`

---

### Task 1.4: Pipeline Page
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.3

**Subtasks:**
- [ ] Create `app/(dashboard)/pipeline/page.tsx`
  - Pipeline KPIs (total value, forecasted, won, lost)
  - Filters (owner, account, date range)
  - "New Deal" button
  - Pipeline kanban view
  - Deal dialog integration
- [ ] Create deal stats widgets
- [ ] Add empty state (no deals)
- [ ] Add loading state
- [ ] Integrate with React Query for data fetching

**Files to Create:**
- `app/(dashboard)/pipeline/page.tsx`

---

### Task 1.5: Deal Detail Page
**Priority:** 🔴 Critical  
**Estimated Time:** 4 hours  
**Dependencies:** Task 1.2

**Subtasks:**
- [ ] Create `app/(dashboard)/pipeline/[id]/page.tsx`
  - Deal overview section
  - Timeline/activity log
  - Related lead info
  - Related account info
  - Notes section
  - Edit button
  - Delete button (with confirmation)
- [ ] Link deal to lead detail page
- [ ] Link deal to account detail page
- [ ] Add "Create Deal" button on lead detail page

**Files to Create:**
- `app/(dashboard)/pipeline/[id]/page.tsx`

**Files to Modify:**
- `app/(dashboard)/leads/[id]/page.tsx` - Add "Create Deal" button
- `app/(dashboard)/accounts/[id]/page.tsx` - Show related deals

---

### Task 1.6: Deal Integration with Existing Features
**Priority:** 🔴 Critical  
**Estimated Time:** 3 hours  
**Dependencies:** Task 1.5

**Subtasks:**
- [ ] Update dashboard with pipeline metrics
- [ ] Add "Deals" to sidebar navigation
- [ ] Create deal activity log entries when stage changes
- [ ] Update lead detail page to show associated deals
- [ ] Update account detail page to show deals list
- [ ] Add deal creation from lead workspace

**Files to Modify:**
- `app/(dashboard)/dashboard/page.tsx`
- `components/dashboard/sidebar.tsx`
- `app/(dashboard)/leads/[id]/page.tsx`
- `app/(dashboard)/accounts/[id]/page.tsx`
- `app/(dashboard)/leads/workspace/page.tsx`

---

**Total Time for Phase 1 (Pipeline):** ~29 hours (~4 days)

---

## 🟠 PHASE 2: HIGH PRIORITY (Week 2-3)

### Task 2.1: Email Settings UI
**Priority:** 🟠 High  
**Estimated Time:** 6 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Create `app/(dashboard)/settings/email/page.tsx`
  - IMAP configuration form (host, port, username, password, SSL)
  - SMTP configuration form (host, port, username, password, SSL)
  - "Test Connection" button for IMAP
  - "Test Connection" button for SMTP
  - Save button
  - Security note about encryption
- [ ] Create `app/api/users/email-settings/route.ts`
  - `GET` - Fetch user's email settings (passwords masked)
  - `PUT` - Update email settings (encrypt credentials)
- [ ] Create `app/api/users/email-settings/test/route.ts`
  - `POST` - Test IMAP connection
  - `POST` - Test SMTP connection
- [ ] Implement credential encryption utility in `lib/crypto.ts`
- [ ] Add "Email Settings" link to user menu/settings

**Files to Create:**
- `app/(dashboard)/settings/email/page.tsx`
- `app/api/users/email-settings/route.ts`
- `app/api/users/email-settings/test/route.ts`
- `lib/crypto.ts`

---

### Task 2.2: Real-time Features - Socket.io Foundation
**Priority:** 🟠 High  
**Estimated Time:** 8 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Create Socket.io server in `lib/socket.ts`
  - Server initialization
  - Authentication middleware
  - Room management (per organization, per campaign)
- [ ] Update `app/api/socket/route.ts` for WebSocket endpoint
- [ ] Create `lib/socket-client.ts` for client-side connection
- [ ] Create React context `components/providers.tsx` for socket
- [ ] Implement real-time lead lock notifications
  - Emit when lead is locked
  - Emit when lead is unlocked
  - Update UI in real-time
- [ ] Implement real-time activity feed updates
  - Emit when activity is created
  - Update activity feed in real-time

**Files to Create:**
- `lib/socket.ts`
- `lib/socket-client.ts`
- `app/api/socket/route.ts`

**Files to Modify:**
- `components/providers.tsx`
- `app/(dashboard)/leads/workspace/page.tsx`
- `components/activity/activity-feed.tsx`

---

### Task 2.3: Campaign Performance Dashboard
**Priority:** 🟠 High  
**Estimated Time:** 6 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Create `app/(dashboard)/campaigns/[id]/analytics/page.tsx`
  - Lead funnel chart (New → Contacted → Qualified → Nurture → Lost)
  - Activity metrics (calls, emails, notes)
  - Response rates (email open, reply rate)
  - Time-to-conversion chart
  - BD performance comparison
  - Date range selector
  - Export button
- [ ] Create `components/campaigns/campaign-funnel-chart.tsx`
- [ ] Create `app/api/campaigns/[id]/analytics/route.ts`
  - Fetch detailed campaign analytics
  - Calculate metrics
- [ ] Add "Analytics" tab to campaign detail page

**Files to Create:**
- `app/(dashboard)/campaigns/[id]/analytics/page.tsx`
- `components/campaigns/campaign-funnel-chart.tsx`

**Files to Modify:**
- `app/api/campaigns/[id]/analytics/route.ts` (enhance existing)
- `app/(dashboard)/campaigns/[id]/page.tsx` (add Analytics tab)

---

### Task 2.4: BD Performance Reports
**Priority:** 🟠 High  
**Estimated Time:** 6 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Create `app/(dashboard)/reports/bd-performance/page.tsx`
  - BD selector
  - Date range selector
  - Metrics: calls, emails, tasks completed, leads contacted, conversion rate
  - Activity timeline chart
  - Comparison with team average
  - Export button
- [ ] Create `app/api/reports/bd-performance/route.ts`
  - Fetch BD performance data
  - Calculate metrics
  - Compare with team average
- [ ] Create `components/reports/bd-performance-chart.tsx`
- [ ] Add "Reports" section to sidebar

**Files to Create:**
- `app/(dashboard)/reports/bd-performance/page.tsx`
- `app/api/reports/bd-performance/route.ts`
- `components/reports/bd-performance-chart.tsx`

---

### Task 2.5: Email Tracking (Opens & Clicks)
**Priority:** 🟠 High  
**Estimated Time:** 8 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Create `EmailTracking` model in Prisma
  ```prisma
  model EmailTracking {
    id            String   @id @default(uuid())
    emailThreadId String   @map("email_thread_id")
    trackingId    String   @unique @map("tracking_id")
    opens         Int      @default(0)
    clicks        Json?    // Array of clicked links with timestamps
    firstOpenedAt DateTime? @map("first_opened_at")
    lastOpenedAt  DateTime? @map("last_opened_at")
    createdAt     DateTime @default(now()) @map("created_at")
  }
  ```
- [ ] Create tracking pixel endpoint `app/api/email/track/open/[trackingId]/route.ts`
- [ ] Create link redirect endpoint `app/api/email/track/click/[trackingId]/route.ts`
- [ ] Modify email sending to include tracking pixel and wrap links
- [ ] Display tracking stats in thread view
- [ ] Show "Opened" badge on inbox list
- [ ] Create template analytics page showing open/click rates

**Files to Create:**
- `app/api/email/track/open/[trackingId]/route.ts`
- `app/api/email/track/click/[trackingId]/route.ts`

**Files to Modify:**
- `prisma/schema.prisma`
- `lib/email.ts`
- `app/(dashboard)/inbox/[id]/page.tsx`
- `app/(dashboard)/inbox/page.tsx`

---

### Task 2.6: User Profile Page
**Priority:** 🟠 High  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Create `app/(dashboard)/settings/profile/page.tsx`
  - Avatar upload
  - Display name
  - Email (read-only)
  - Role badge
  - Password change section
  - Email signature editor
  - Time zone selector
  - Save button
- [ ] Create `app/api/users/profile/route.ts`
  - `GET` - Fetch current user profile
  - `PUT` - Update profile
- [ ] Create `app/api/users/avatar/route.ts`
  - `POST` - Upload avatar
- [ ] Create `app/api/users/password/route.ts`
  - `PUT` - Change password (verify old password)
- [ ] Add "Profile" link to user menu

**Files to Create:**
- `app/(dashboard)/settings/profile/page.tsx`
- `app/api/users/profile/route.ts`
- `app/api/users/avatar/route.ts`
- `app/api/users/password/route.ts`

---

**Total Time for Phase 2:** ~38 hours (~5 days)

---

## 🟡 PHASE 3: MEDIUM PRIORITY (Week 4-5)

### Task 3.1: Advanced Search Improvements
**Priority:** 🟡 Medium  
**Estimated Time:** 6 hours

**Subtasks:**
- [ ] Add saved search functionality
  - Save search model in Prisma
  - "Save this search" button
  - Saved searches dropdown
- [ ] Add search history (last 10 searches)
- [ ] Implement search within results
- [ ] Add boolean operators (AND, OR, NOT)
- [ ] Add fuzzy matching option
- [ ] Search by custom fields

**Files to Create:**
- `components/search/saved-searches.tsx`

**Files to Modify:**
- `prisma/schema.prisma` (add SavedSearch model)
- `app/(dashboard)/search/page.tsx`
- `app/api/search/route.ts`

---

### Task 3.2: Bulk Data Enrichment Tools
**Priority:** 🟡 Medium  
**Estimated Time:** 6 hours

**Subtasks:**
- [ ] Create `app/(dashboard)/tools/data-quality/page.tsx`
  - Duplicate detection (find duplicates by email, phone)
  - Merge duplicates tool
  - Phone number formatting (normalize to E.164)
  - Email validation (check format, MX records)
  - Data cleanup (trim whitespace, fix casing)
- [ ] Create `app/api/tools/duplicates/route.ts`
- [ ] Create `app/api/tools/merge-leads/route.ts`
- [ ] Create `app/api/tools/normalize-data/route.ts`

**Files to Create:**
- `app/(dashboard)/tools/data-quality/page.tsx`
- `app/api/tools/duplicates/route.ts`
- `app/api/tools/merge-leads/route.ts`
- `app/api/tools/normalize-data/route.ts`

---

### Task 3.3: Custom Campaign Statuses
**Priority:** 🟡 Medium  
**Estimated Time:** 4 hours

**Subtasks:**
- [ ] Add `customStatuses` JSON field to Campaign model
- [ ] Create campaign status configuration UI
- [ ] Update lead status selectors to use campaign-specific statuses
- [ ] Add status color customization
- [ ] Migration to preserve existing statuses

**Files to Modify:**
- `prisma/schema.prisma`
- `app/(dashboard)/campaigns/[id]/edit/page.tsx`
- `components/campaigns/campaign-settings.tsx`
- `components/leads/lead-table-enhanced.tsx`

---

### Task 3.4: Advanced Calendar Features
**Priority:** 🟡 Medium  
**Estimated Time:** 8 hours

**Subtasks:**
- [ ] Implement Apple Calendar integration (CalDAV)
  - OAuth flow for iCloud
  - Sync events bidirectionally
- [ ] Add Outlook integration
  - OAuth flow for Microsoft
  - Sync events bidirectionally
- [ ] Add meeting reminders
  - Email reminders (15 min, 1 hour, 1 day before)
  - Push notifications
- [ ] Add recurring meetings
  - Recurrence rules (daily, weekly, monthly)
  - Edit series or single occurrence
- [ ] Create meeting templates
  - Save common meeting configurations
  - Quick create from template

**Files to Create:**
- `lib/apple-calendar.ts`
- `lib/outlook-calendar.ts`
- `app/api/calendar/apple/auth/route.ts`
- `app/api/calendar/apple/callback/route.ts`
- `app/api/calendar/outlook/auth/route.ts`
- `app/api/calendar/outlook/callback/route.ts`

**Files to Modify:**
- `components/bookings/schedule-meeting-dialog.tsx`
- `app/(dashboard)/calendar/page.tsx`

---

### Task 3.5: Dark Mode Implementation
**Priority:** 🟡 Medium  
**Estimated Time:** 6 hours

**Subtasks:**
- [ ] Create theme context and provider
- [ ] Add theme toggle component (header)
- [ ] Update Tailwind config with dark mode colors
- [ ] Convert all components to use CSS variables
- [ ] Store theme preference in localStorage
- [ ] Detect system preference
- [ ] Test all pages in dark mode
- [ ] Fix any contrast issues

**Files to Create:**
- `lib/theme-context.tsx`
- `components/theme-toggle.tsx`

**Files to Modify:**
- `tailwind.config.ts`
- `app/globals.css`
- Multiple component files (use dark: prefix)

---

**Total Time for Phase 3:** ~30 hours (~4 days)

---

## 🟢 PHASE 4: LOW PRIORITY / NICE-TO-HAVE (Ongoing)

### Task 4.1: Progressive Web App (PWA)
**Priority:** 🟢 Low  
**Estimated Time:** 8 hours

**Subtasks:**
- [ ] Create `manifest.json` for PWA
- [ ] Add service worker for offline caching
- [ ] Create app icons (various sizes)
- [ ] Add install prompt
- [ ] Test offline functionality
- [ ] Add to home screen capability

---

### Task 4.2: Mobile Optimization
**Priority:** 🟢 Low  
**Estimated Time:** 12 hours

**Subtasks:**
- [ ] Audit all pages for mobile responsiveness
- [ ] Create mobile-specific layouts for key pages
- [ ] Add touch gestures (swipe, long-press)
- [ ] Optimize navigation for mobile
- [ ] Test on various devices

---

### Task 4.3: Advanced Integrations
**Priority:** 🟢 Low  
**Estimated Time:** Varies (2-3 days per integration)

**Subtasks:**
- [ ] Slack integration (notifications, commands)
- [ ] LinkedIn integration (lead enrichment)
- [ ] Zapier webhooks (outgoing)
- [ ] WhatsApp Business API (messaging)
- [ ] CRM export (Salesforce, HubSpot)

---

### Task 4.4: AI/ML Features
**Priority:** 🟢 Low  
**Estimated Time:** 20+ hours

**Subtasks:**
- [ ] Machine learning lead scoring model
- [ ] Email response suggestions (GPT integration)
- [ ] Auto-categorization of leads
- [ ] Sentiment analysis on notes
- [ ] Predictive deal closing probability
- [ ] Chatbot for internal queries

---

### Task 4.5: Testing & Quality Assurance
**Priority:** 🟢 Low (but important long-term)  
**Estimated Time:** 20+ hours

**Subtasks:**
- [ ] Set up Jest for unit testing
- [ ] Write unit tests for utility functions
- [ ] Set up Playwright for E2E testing
- [ ] Write E2E tests for critical workflows:
  - Login flow
  - Create campaign and import CSV
  - Lead workspace flow
  - Create deal
  - Schedule meeting
- [ ] Set up CI/CD with automated testing
- [ ] Achieve 70%+ code coverage

---

## 📊 Summary & Time Estimates

| Phase | Priority | Estimated Time | Tasks |
|-------|----------|----------------|-------|
| Phase 1 | 🔴 Critical | 29 hours (~4 days) | 6 tasks - Pipeline Module |
| Phase 2 | 🟠 High | 38 hours (~5 days) | 6 tasks - Email, Reports, Real-time |
| Phase 3 | 🟡 Medium | 30 hours (~4 days) | 5 tasks - Search, Data Quality, Dark Mode |
| Phase 4 | 🟢 Low | 40+ hours (~6+ days) | 5 tasks - PWA, Mobile, AI/ML, Testing |
| **Total** | | **~137 hours** | **~19 days** |

---

## 🎯 Recommended Execution Order

### Sprint 1 (Week 1-2): Pipeline Foundation
1. Task 1.1: Database Schema
2. Task 1.2: Deal API Endpoints
3. Task 1.3: Pipeline Kanban Component
4. Task 1.4: Pipeline Page
5. Task 1.5: Deal Detail Page
6. Task 1.6: Deal Integration

**Goal:** Complete, functional pipeline module

---

### Sprint 2 (Week 3): High-Value Quick Wins
1. Task 2.1: Email Settings UI
2. Task 2.3: Campaign Performance Dashboard
3. Task 2.6: User Profile Page

**Goal:** Improve user experience and self-service

---

### Sprint 3 (Week 4): Real-time & Tracking
1. Task 2.2: Socket.io Foundation
2. Task 2.5: Email Tracking
3. Task 2.4: BD Performance Reports

**Goal:** Add competitive features

---

### Sprint 4 (Week 5-6): Polish & Enhancements
1. Task 3.1: Advanced Search
2. Task 3.2: Bulk Data Tools
3. Task 3.3: Custom Campaign Statuses
4. Task 3.5: Dark Mode

**Goal:** Quality of life improvements

---

### Backlog (Ongoing):
- Task 3.4: Advanced Calendar Features
- Task 4.1: PWA
- Task 4.2: Mobile Optimization
- Task 4.3: Advanced Integrations
- Task 4.4: AI/ML Features
- Task 4.5: Testing Suite

**Goal:** Future-proofing and differentiation

---

## 📋 Definition of Done

For each task, ensure:
- [ ] Code is written and follows existing patterns
- [ ] TypeScript types are properly defined
- [ ] Component follows design system
- [ ] API endpoints have authentication
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Empty states are designed
- [ ] Mobile responsive (where applicable)
- [ ] No linting errors
- [ ] Manually tested
- [ ] Documentation updated (if needed)
- [ ] Committed to version control

---

## 🚀 Getting Started

To begin implementation:

1. **Set up branch:** `git checkout -b feature/pipeline-module`
2. **Start with Task 1.1:** Database schema changes
3. **Test thoroughly** after each task
4. **Commit frequently** with clear messages
5. **Create PR** after completing Sprint 1

---

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Status:** 📋 Ready for Development



