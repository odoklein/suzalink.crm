# Suzalink CRM - Suzali Conseil

A specialized B2B Sales Outsourcing Platform built with Next.js 16, TypeScript, and PostgreSQL.

## Features

- **Account & Campaign Management**: Manage client accounts and sales campaigns
- **Dynamic CSV Import**: Upload and map CSV files with custom field schemas
- **Lead Management**: Smart lead locking system with FOR UPDATE SKIP LOCKED
- **Activity Logging**: Track calls, emails, notes, and status changes
- **Email Integration**: IMAP sync and SMTP sending
- **Aircall Integration**: Click-to-dial and webhook call logging
- **Guest Portal**: Token-based client portal with analytics

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Actions)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database**: PostgreSQL (via Supabase/Neon)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Background Processing**: Direct processing (no queue system)
- **Email**: Nodemailer + IMAP

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your app URL (e.g., http://localhost:3000)

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Seed the database with initial users:
```bash
npm run db:seed
```

This will create:
- **Admin user**: `admin@suzali.com` / `admin123`
- **Manager user**: `manager@suzali.com` / `manager123`
- **BD user**: `bd@suzali.com` / `bd123`

⚠️ **Important**: Change these default passwords after first login!

6. Run the development server:
```bash
npm run dev
```

7. Open your browser and navigate to `http://localhost:3000`
8. Login with the credentials created in step 5

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (dashboard)/        # Dashboard routes
│   ├── api/                # API routes
│   ├── portal/             # Guest portal
│   └── login/              # Login page
├── components/             # React components
│   ├── ui/                 # Shadcn UI components
│   ├── dashboard/          # Dashboard components
│   ├── leads/              # Lead components
│   └── campaigns/          # Campaign components
├── lib/                    # Utility libraries
│   ├── csv-processor.ts   # CSV import processing
│   └── email-sync.ts      # Email sync scheduler
└── prisma/                 # Prisma schema
```

## Key Features Implementation

### CSV Import
- Multi-step wizard: Upload → Preview → Mapping → Import
- Streaming CSV parser for large files
- Direct background processing (no queue system required)
- Custom field schema support

### Lead Locking
- PostgreSQL FOR UPDATE SKIP LOCKED for concurrent access
- 30-minute lock timeout
- Automatic unlock on status change

### Email Sync
- IMAP sync scheduler (runs every 3 minutes)
- Automatic lead matching by email
- Activity log creation
- No external queue system required

### Guest Portal
- Token-based access (no login required)
- Analytics dashboard
- Read-only view

## Development

### Database Migrations
```bash
npx prisma migrate dev
```

### View Database
```bash
npx prisma studio
```

### Build for Production
```bash
npm run build
npm start
```

## License

Proprietary - Suzali Conseil

