# Database Migration Guide

## New Schema Changes

This update adds support for:
1. **Campaign-BD Assignments**: Many-to-many relationship between Campaigns and Users (BDs)
2. **Account-BD Assignments**: Many-to-many relationship between Accounts and Users (BDs)

## Migration Steps

1. **Generate the migration**:
   ```bash
   npx prisma migrate dev --name add_campaign_account_assignments
   ```

2. **Review the migration file** in `prisma/migrations/` to ensure it's correct

3. **Apply the migration**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

## New Models

### CampaignAssignment
- Links campaigns to users (BDs)
- Tracks who assigned and when
- Unique constraint on (campaignId, userId)

### AccountAssignment
- Links accounts to users (BDs)
- Tracks who assigned and when
- Unique constraint on (accountId, userId)

## API Endpoints Added

- `GET /api/users` - List users (with optional role filter)
- `GET /api/campaigns/[id]/assign` - Get campaign assignments
- `POST /api/campaigns/[id]/assign` - Assign BDs to campaign
- `DELETE /api/campaigns/[id]/assign` - Remove BD from campaign
- `GET /api/accounts/[id]/assign` - Get account assignments
- `POST /api/accounts/[id]/assign` - Assign BDs to account
- `DELETE /api/accounts/[id]/assign` - Remove BD from account
- `POST /api/leads/bulk` - Bulk operations on leads
- `GET /api/leads/export` - Export leads to CSV

## Enhanced Features

1. **Leads Page**:
   - Table/Card view toggle
   - Advanced search and filtering
   - Bulk actions (status update, assign, delete, export)
   - Inline status updates
   - Export functionality

2. **Assignment System**:
   - Assign multiple BDs to campaigns
   - Assign multiple BDs to accounts
   - View current assignments
   - Manage assignments from detail pages

3. **CSV Import**:
   - Enhanced error reporting
   - Better validation
   - Detailed error messages with row numbers

