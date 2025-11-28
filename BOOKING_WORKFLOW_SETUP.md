# Booking Workflow - Setup Instructions

## What Was Built

### 1. Inline RDV Creation on Lead Page
- Location: Lead detail page (right sidebar)
- Component: `components/bookings/quick-booking-card.tsx`
- Collapsible card - no page navigation needed

### 2. Campaign Rendez-vous Tab
- Location: Campaign detail page → "Rendez-vous" tab
- Component: `components/campaigns/campaign-bookings-tab.tsx`
- Groups bookings by postal code (CP)
- Shows all RDVs created by BDs

### 3. Smart Placement Dialog
- Component: `components/campaigns/booking-placement-dialog.tsx`
- Click any booking → suggests optimal day based on territory plan
- Shows green checkmark for matching postal codes
- One-click placement into client agenda

## Setup Steps (REQUIRED)

### Step 1: Apply Database Changes
```bash
npx prisma generate
npx prisma db:push
```

### Step 2: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test the Workflow

1. **Go to a lead page**: `/leads/{leadId}`
   - Look in right sidebar for "Créer un RDV" card
   - Click to expand
   - Fill in contact details and date/time
   - Click "Créer le RDV"

2. **Go to campaign page**: `/campaigns/{campaignId}`
   - Click "Rendez-vous" tab (new tab between "Leads" and "Settings")
   - See bookings grouped by postal code
   - Click "Placer dans l'agenda" on any booking

3. **Placement dialog opens**:
   - Select optimal day (Mon-Fri)
   - Green checkmark = postal code matches territory plan
   - Click "Confirmer le placement"
   - Booking becomes appointment in client agenda

## Database Schema Changes

### Booking Model - New Fields:
- `contactName`, `contactEmail`, `contactPhone`
- `address`, `postalCode`, `city`
- `latitude`, `longitude`
- `appointmentId` (links to placed appointment)
- `status` now includes "placed"

### Appointment Model - New Field:
- `booking` (reverse relation)

## API Endpoints

- `POST /api/bookings` - Create booking with geo fields
- `GET /api/campaigns/{id}/bookings` - Get bookings grouped by CP
- `PATCH /api/bookings/{id}` - Update booking status

## Troubleshooting

**If you don't see changes:**
1. Make sure you ran `npx prisma generate` and `npx prisma db:push`
2. Restart the dev server
3. Hard refresh browser (Ctrl+Shift+R)
4. Check browser console for errors

**If Prisma commands fail:**
- Check `prisma/schema.prisma` for syntax errors
- Make sure PostgreSQL is running
- Check DATABASE_URL in `.env.local`
