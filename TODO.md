# Facturix CRM - Remaining Tasks

## 🔴 High Priority (Core Functionality)

### 1. Dashboard Statistics
- [ ] **Fetch real data** for dashboard stats (currently hardcoded to 0)
  - Total Accounts count
  - Active Campaigns count
  - Total Leads count
  - Conversion Rate calculation
- **File**: `app/(dashboard)/dashboard/page.tsx`
- **API**: Create `/api/dashboard/stats` endpoint

### 2. Lead Workspace - Campaign Selector
- [ ] **Add campaign selector** before "Get Next Lead"
  - User should select a campaign first
  - Then fetch next lead from that campaign
- **File**: `app/(dashboard)/leads/workspace/page.tsx`
- **Current Issue**: Shows toast "Please select a campaign first" but no selector

### 3. Lead Workspace - Action Integration
- [ ] **Integrate Click-to-Dial** component in workspace
- [ ] **Integrate Email compose** from workspace
- [ ] **Auto-unlock lead** when clicking "Finish & Get Next"
- **File**: `app/(dashboard)/leads/workspace/page.tsx`

### 4. Lead Unlock API
- [ ] **Verify unlock functionality** works when lead status changes
- [ ] **Add unlock endpoint** if needed: `/api/leads/[id]/unlock`
- **File**: `app/api/leads/[id]/lock/route.ts` (DELETE method exists)

## 🟡 Medium Priority (UI/UX Improvements)

### 5. Inbox Thread Detail Page
- [ ] **Create thread detail page**: `app/(dashboard)/inbox/[id]/page.tsx`
- [ ] **Show full email thread** with replies
- [ ] **Reply functionality** from thread view
- **Current**: Inbox links to `/inbox/${thread.id}` but page doesn't exist

### 6. Email Compose Page
- [ ] **Verify compose page** functionality
- [ ] **Add lead selection** if composing from workspace
- [ ] **Email templates** (optional enhancement)
- **File**: `app/(dashboard)/inbox/compose/page.tsx`

### 7. Guest Portal - Downloadable Files
- [ ] **Add downloadable files section** to portal
- [ ] **File upload API** for accounts
- [ ] **File management** in account detail page
- **File**: `app/portal/[token]/page.tsx`

### 8. Account Detail - File Management
- [ ] **Add file upload** to account detail page
- [ ] **List uploaded files** for guest portal
- **File**: `app/(dashboard)/accounts/[id]/page.tsx`

## 🟢 Low Priority (Polish & Enhancements)

### 9. Environment Variables Setup
- [ ] **Create `.env.example`** file with all required variables
- [ ] **Document** optional variables (Aircall, Email settings)
- **Note**: `.env.example` was blocked earlier, may need manual creation

### 10. Error Handling
- [ ] **Add error boundaries** for better error handling
- [ ] **Improve error messages** throughout the app
- [ ] **Add loading states** where missing

### 11. Activity Log Display
- [ ] **Show activity timeline** on lead detail page
- [ ] **Filter activities** by type
- **File**: `app/(dashboard)/leads/[id]/page.tsx`

### 12. Lead Table Enhancements
- [ ] **Add filters** (status, campaign, date range)
- [ ] **Add sorting** functionality
- [ ] **Add pagination** for large datasets
- **File**: `components/leads/lead-table.tsx`

### 13. CSV Import Progress
- [ ] **Add progress indicator** for CSV imports
- [ ] **Show import status** (processing, completed, errors)
- [ ] **Display import results** (X processed, Y errors)

### 14. Email Settings UI
- [ ] **Create UI** for users to configure email settings
- [ ] **IMAP/SMTP configuration** form
- [ ] **Test connection** button
- **New Page**: `app/(dashboard)/settings/email/page.tsx`

## 🔵 Optional Enhancements

### 15. Real-time Updates
- [ ] **Socket.io integration** for real-time lead updates
- [ ] **Live activity feed**
- **Note**: Socket.io is already in dependencies

### 16. Advanced Search
- [ ] **Global search** functionality
- [ ] **Search across** leads, accounts, campaigns

### 17. Reports & Analytics
- [ ] **Campaign performance** reports
- [ ] **User activity** reports
- [ ] **Export to CSV/PDF**

### 18. Bulk Actions
- [ ] **Bulk status update** for leads
- [ ] **Bulk assign** to BD
- [ ] **Bulk export**

## 📋 Testing & Documentation

### 19. Testing
- [ ] **Unit tests** for critical functions
- [ ] **Integration tests** for API routes
- [ ] **E2E tests** for key workflows

### 20. Documentation
- [ ] **API documentation** (Swagger/OpenAPI)
- [ ] **User guide** for BD users
- [ ] **Admin guide** for setup
- [ ] **Deployment guide**

## 🐛 Known Issues

1. **CSV Import**: Fixed uploads directory creation ✅
2. **Redis**: Removed, using direct processing ✅
3. **Params**: Fixed Next.js 16 params handling ✅

---

## Quick Wins (Can be done quickly)

1. ✅ Dashboard stats API (30 min)
2. ✅ Campaign selector in workspace (30 min)
3. ✅ Click-to-dial integration (15 min)
4. ✅ Email compose integration (15 min)
5. ✅ Inbox thread detail page (1 hour)

---

**Last Updated**: Based on current codebase review

