# Testing Guide - Booking System Redesign

## Prerequisites

1. **Apply the Database Migration**
   ```bash
   # Option 1: Using the script (requires DATABASE_URL in .env)
   npx tsx scripts/apply-migration.ts
   
   # Option 2: Manually run the SQL file in your database client
   # File: prisma/migrations/20250101000000_booking_system_redesign/migration.sql
   ```

2. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

---

## Testing Checklist

### 1. Campaign Configuration (Admin/Manager Only)

#### Test Dynamic Status Management
1. Navigate to a campaign detail page
2. Go to the **Configuration** tab (or campaign settings)
3. **Statuses Tab**:
   - ✅ Create a new status (e.g., "RDV Confirmé")
   - ✅ Change status color
   - ✅ Set a status as default
   - ✅ Mark a status as final (e.g., "Gagné")
   - ✅ Drag and reorder statuses
   - ✅ Edit an existing status
   - ✅ Try to delete a status with leads (should show error)
   - ✅ Delete a status without leads

#### Test Meeting Types Management
1. **Meeting Types Tab**:
   - ✅ Create a new meeting type (e.g., "Visite Découverte")
   - ✅ Set icon and color
   - ✅ Set duration (15, 30, 45, 60, 90, 120 min)
   - ✅ Toggle "RDV physique" (requires address)
   - ✅ Drag and reorder meeting types
   - ✅ Edit an existing meeting type
   - ✅ Delete a meeting type

#### Test Visit Days Calendar
1. **Visit Calendar Tab**:
   - ✅ Click on dates to select them
   - ✅ Add notes for visit days (e.g., "Secteur Nord")
   - ✅ View visit days highlighted on calendar
   - ✅ Edit notes for existing visit days
   - ✅ Delete visit days
   - ✅ Navigate between months

**Expected Result**: All configurations should save and persist. Statuses and meeting types should appear in dropdowns when creating/editing leads and bookings.

---

### 2. Lead Prospecting with Dynamic Statuses

#### Test Status Updates
1. Open the prospecting drawer (from leads page)
2. Get a lead for prospecting
3. **Status Dropdown**:
   - ✅ Should show campaign-specific statuses (not hardcoded)
   - ✅ Statuses should have colors matching configuration
   - ✅ Select a status - should update immediately
   - ✅ Check activity log shows status change

#### Test Simplified Call Logging
1. During prospecting:
   - ✅ Update status only (no complex forms)
   - ✅ Add notes if needed
   - ✅ Status change should be logged automatically

**Expected Result**: Status dropdown shows dynamic statuses from campaign configuration. Status updates work smoothly.

---

### 3. Booking Creation & Approval Workflow

#### Test Booking Creation (BD User)
1. From prospecting drawer or lead detail:
   - ✅ Click "Nouveau RDV" or booking button
   - ✅ Select meeting type from campaign's meeting types
   - ✅ Fill in date/time, title, description
   - ✅ For physical meetings: enter address (should geocode)
   - ✅ For online meetings: enter meeting email
   - ✅ Create booking

2. **Verify Approval Status**:
   - ✅ Booking should be created with `approvalStatus: "on_hold"`
   - ✅ BD should see booking in their calendar but marked as "En attente"
   - ✅ Booking should NOT appear in contact portal yet

#### Test Booking Approval (Admin/Manager)
1. Navigate to bookings page or approval view
2. **Approval View**:
   - ✅ Filter by "En attente" status
   - ✅ View bookings grouped by date or proximity
   - ✅ See booking details (lead, BD, location, etc.)
   - ✅ Click approve button - booking should be approved
   - ✅ BD should receive notification
   - ✅ Booking status should change to "confirmed"
   - ✅ Booking should now appear in contact portal

3. **Test Rejection**:
   - ✅ Click reject button
   - ✅ Optionally add rejection reason
   - ✅ Booking should be marked as rejected
   - ✅ BD should receive notification with reason

**Expected Result**: BD bookings require approval. Admins/managers can approve/reject with one click. Approved bookings sync to calendars and contact portal.

---

### 4. Proximity & Date Grouping

#### Test Proximity Sorting
1. Create multiple physical bookings with addresses
2. In booking approval view:
   - ✅ Switch to "Par proximité" view
   - ✅ Bookings should be sorted by distance
   - ✅ Should show distance in km
   - ✅ Should group by postal code

#### Test Date Grouping
1. Create bookings on different dates
2. In booking approval view:
   - ✅ Switch to "Par date" view
   - ✅ Bookings should be grouped by date
   - ✅ Dates should be formatted in French
   - ✅ Each group should show count

**Expected Result**: Physical bookings can be sorted by proximity for route optimization. Date grouping helps with daily planning.

---

### 5. Weekly BD Planning

#### Test Weekly Assignment
1. Navigate to `/planning` (Admin/Manager only)
2. **Week Navigation**:
   - ✅ Use arrows to navigate weeks
   - ✅ Click "Cette semaine" to jump to current week
   - ✅ Week range should display correctly

3. **Assign Campaigns to BDs**:
   - ✅ For each BD, click "Ajouter" dropdown
   - ✅ Select a campaign to assign
   - ✅ Campaign should appear as a badge
   - ✅ Should show lead count for campaign
   - ✅ Remove assignment by clicking X
   - ✅ Assign same campaign to multiple BDs

4. **Campaign Summary**:
   - ✅ View all active campaigns
   - ✅ See which BDs are assigned to each campaign
   - ✅ See lead counts per campaign

**Expected Result**: Easy drag-and-drop style assignment of campaigns to BDs for the week. Visual overview of assignments.

---

### 6. Contact Portal (Read-Only)

#### Test Contact Portal Access
1. Enable portal for a contact (from account page)
2. Generate portal link
3. Access portal as contact

#### Test Read-Only Bookings View
1. **Bookings Tab**:
   - ✅ Should show only approved bookings
   - ✅ Should show bookings for campaigns under their account
   - ✅ Should display: date, time, BD email, location, meeting type
   - ✅ Should NOT have create/edit/delete buttons
   - ✅ Past bookings should be in "Historique" tab

#### Test Visit Calendar View
1. **Calendrier visites Tab**:
   - ✅ Should show campaign visit days
   - ✅ Should display date, campaign name, notes
   - ✅ Should only show future visit days
   - ✅ Should be read-only

**Expected Result**: Contacts can view their bookings and see when commercial visits are planned, but cannot modify anything.

---

### 7. API Endpoints Testing

#### Test Campaign Status APIs
```bash
# Get statuses
curl http://localhost:3000/api/campaigns/{campaignId}/statuses

# Create status
curl -X POST http://localhost:3000/api/campaigns/{campaignId}/statuses \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Status", "color": "#FF0000", "isDefault": false}'

# Update status order
curl -X PUT http://localhost:3000/api/campaigns/{campaignId}/statuses \
  -H "Content-Type: application/json" \
  -d '{"statuses": [{"id": "...", "order": 0}, ...]}'
```

#### Test Booking APIs
```bash
# Get bookings with filters
curl "http://localhost:3000/api/bookings?approvalStatus=on_hold&groupBy=date"

# Approve booking
curl -X POST http://localhost:3000/api/bookings/{bookingId}/approve

# Reject booking
curl -X POST http://localhost:3000/api/bookings/{bookingId}/reject \
  -H "Content-Type: application/json" \
  -d '{"reason": "Conflict with existing appointment"}'
```

#### Test Weekly Planning APIs
```bash
# Get weekly assignments
curl "http://localhost:3000/api/planning/weekly?week=2025-01-06"

# Create assignment
curl -X POST http://localhost:3000/api/planning/weekly \
  -H "Content-Type: application/json" \
  -d '{"userId": "...", "campaignId": "...", "weekStart": "2025-01-06"}'
```

---

## Common Issues & Solutions

### Issue: "Status dropdown is empty"
**Solution**: 
- Check that campaign has statuses configured
- Verify migration created default statuses
- Check browser console for API errors

### Issue: "Booking approval buttons not showing"
**Solution**:
- Verify user role is ADMIN or MANAGER
- Check `canApprove` logic in component
- Verify booking has `approvalStatus: "on_hold"`

### Issue: "Proximity sorting not working"
**Solution**:
- Ensure bookings have `latitude` and `longitude` (geocoding)
- Check that addresses are valid
- Verify geocoding API is configured

### Issue: "Contact portal shows no bookings"
**Solution**:
- Ensure bookings are approved (`approvalStatus: "approved"`)
- Verify bookings are linked to leads in campaigns under contact's account
- Check contact portal API response

### Issue: "Migration errors"
**Solution**:
- Migration is now idempotent - can be run multiple times
- Check database connection string
- Verify all tables exist before migration
- Check PostgreSQL version compatibility

---

## Performance Testing

### Test Large Datasets
1. **Many Statuses**: Create 20+ statuses per campaign
   - ✅ Drag-reorder should be smooth
   - ✅ Status dropdown should load quickly

2. **Many Bookings**: Create 100+ bookings
   - ✅ Approval view should load in < 2 seconds
   - ✅ Proximity sorting should work efficiently
   - ✅ Date grouping should be fast

3. **Many Leads**: Test with 1000+ leads
   - ✅ Prospecting drawer should load quickly
   - ✅ Status updates should be instant
   - ✅ Activity logging should not slow down

---

## Integration Testing

### Test Complete Workflow
1. **Admin sets up campaign**:
   - Create statuses
   - Create meeting types
   - Add visit days

2. **Manager assigns BDs**:
   - Assign campaigns to BDs for the week

3. **BD prospects leads**:
   - Get next lead
   - Update status
   - Create booking (on_hold)

4. **Manager approves**:
   - View pending bookings
   - Approve booking

5. **Contact views**:
   - Access portal
   - See approved booking
   - See visit calendar

**Expected Result**: Complete workflow works end-to-end without errors.

---

## Browser Console Checks

Open browser DevTools and check for:
- ✅ No 404 errors for deleted components
- ✅ No API errors (check Network tab)
- ✅ React Query cache working (check React DevTools)
- ✅ No memory leaks (check Performance tab)

---

## Database Verification

After testing, verify database state:

```sql
-- Check statuses were created
SELECT COUNT(*) FROM lead_status_configs;

-- Check meeting types were created
SELECT COUNT(*) FROM campaign_meeting_types;

-- Check bookings have approval status
SELECT approval_status, COUNT(*) 
FROM bookings 
GROUP BY approval_status;

-- Check leads have status_id
SELECT COUNT(*) FROM leads WHERE status_id IS NOT NULL;

-- Check weekly assignments
SELECT COUNT(*) FROM weekly_assignments;
```

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Optimize performance** if queries are slow
3. **Add error handling** for edge cases
4. **Update documentation** with any changes
5. **Train users** on new features

---

## Quick Test Script

Run this to verify basic functionality:

```bash
# 1. Check migration applied
npx prisma studio
# Navigate to lead_status_configs, campaign_meeting_types tables

# 2. Start dev server
npm run dev

# 3. Test in browser:
# - Login as Admin
# - Go to a campaign
# - Configure statuses and meeting types
# - Create a booking as BD user
# - Approve as Admin
# - Check contact portal
```

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify database migration completed
4. Check Prisma client is regenerated
5. Verify environment variables are set

