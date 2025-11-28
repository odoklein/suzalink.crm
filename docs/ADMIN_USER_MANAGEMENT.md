# Admin User Management Feature

## Overview

Complete admin user management system for Facturix CRM, allowing administrators to manage users, their roles, permissions, and track their activity.

## Features Implemented

### 1. User List View (`/admin/users`)
- **Search & Filter**: Search by email, filter by role and status
- **User Table**: Displays email, role, status, last activity, creation date
- **Quick Actions**: Edit, activate/deactivate, delete from dropdown menu
- **Add User**: Button to create new users
- **Design**: Follows design system with proper spacing, colors, and typography

### 2. User Detail Page (`/admin/users/[id]`)
- **Header Section**: Avatar, email, role badge, status, last login
- **Tabbed Interface**:
  - **Profile Tab**: Edit role, timezone, status, reset password
  - **Authorizations Tab**: Permission matrix with role inheritance
  - **Activity Tab**: User activity history with filtering
  - **Communication Tab**: Internal notes and system messages

### 3. User Dialog (Add/Edit)
- **Create Mode**: Email, role, password (optional), send invite option
- **Edit Mode**: Role and status management
- **Validation**: Email format, password strength (for create)
- **Auto-generation**: Random password if not provided

### 4. Permission Matrix
- **Permission Groups**: Accounts, Campaigns, Leads, Tasks, Reporting, Admin
- **Role Inheritance**: Shows which permissions come from role vs custom overrides
- **Override Indicators**: Badges showing when permissions are overridden
- **Permission Flags**:
  - `canManageAccounts`, `canViewAccounts`
  - `canManageCampaigns`, `canViewCampaigns`
  - `canManageLeads`, `canViewLeads`
  - `canManageTasks`, `canViewTasks`
  - `canViewReports`, `canExportReports`
  - `canManageUsers`
  - `canAccessInbox`
  - `canUseEmailAutomation`

### 5. Activity Tracking
- **Activity Feed**: Shows all user activities (calls, emails, notes, status changes)
- **Filtering**: Filter by activity type
- **Details**: Shows lead information, metadata, timestamps
- **Visual Indicators**: Color-coded icons for different activity types

### 6. Communication Tab
- **Internal Notes**: Add and view internal notes (admin-only)
- **System Messages**: Display system alerts and notifications
- **Rich Features**: Foundation for future communication features

### 7. Security Features
- **Soft Delete**: Users are deactivated (isActive = false) rather than hard deleted
- **Password Reset**: Admin can reset user passwords with temporary password generation
- **Access Control**: All routes protected by middleware (Admin-only)
- **Role-based Navigation**: Admin section only visible to ADMIN role

## Database Schema Updates

Added to `User` model:
- `isActive Boolean @default(true)` - Soft delete flag
- `permissions Json?` - Custom permission overrides
- `lastLoginAt DateTime?` - Track last login time

## API Endpoints

### User Management
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/[id]` - Get user details
- `PATCH /api/admin/users/[id]` - Update user (role, status, timezone)
- `DELETE /api/admin/users/[id]` - Soft delete user (set isActive = false)

### Permissions
- `GET /api/admin/users/[id]/permissions` - Get user permissions
- `PATCH /api/admin/users/[id]/permissions` - Update user permissions

### Activity
- `GET /api/admin/users/[id]/activities` - Get user activity history
  - Query params: `type` (CALL, EMAIL, NOTE, STATUS_CHANGE)

### Communications
- `GET /api/admin/users/[id]/communications` - Get communications (notes, messages)
- `POST /api/admin/users/[id]/communications` - Add internal note

### Password Reset
- `POST /api/admin/users/[id]/reset-password` - Reset user password

## Navigation

- **Sidebar**: Added "Administration" section with "Utilisateurs" link (Admin-only)
- **Settings Page**: Added "Gérer les utilisateurs" button for Admins

## Design System Compliance

All components follow the design system:
- **Colors**: #3BBF7A primary, #1B1F24 text, #6B7280 secondary text
- **Border Radius**: 12px for buttons/inputs, 16px for cards
- **Spacing**: 8-point grid system
- **Typography**: Design system scale (h2, body, caption)
- **Components**: Reused Card, Table, Tabs, Badge, Switch, Button components

## Future Enhancements

### Phase 2
- Bulk operations (activate/deactivate multiple users)
- Advanced filters (date range, activity count)
- User import/export
- Activity analytics and charts
- Real-time activity updates

### Phase 3
- Full communication system (internal messaging)
- Permission-based UI conditionals
- User impersonation (optional)
- Audit log for admin actions
- Email invite system integration
- Two-factor authentication management

## Security Notes

- All admin routes protected by middleware
- API endpoints check for ADMIN role
- Soft delete preserves historical data
- Permissions stored in encrypted JSON field
- Password reset generates secure temporary passwords

## Usage

1. **Access**: Navigate to `/admin/users` (Admin-only)
2. **Create User**: Click "Ajouter un utilisateur", fill form, optionally send invite
3. **Edit User**: Click user row or edit from dropdown
4. **Manage Permissions**: Go to user detail → Authorizations tab
5. **View Activity**: Go to user detail → Activity tab
6. **Add Notes**: Go to user detail → Communication tab

## Migration Required

After implementing, run:
```bash
npx prisma migrate dev --name add_user_management_fields
```

This will add:
- `isActive` field to User model
- `permissions` JSON field
- `lastLoginAt` timestamp field











