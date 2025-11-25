# Vercel Deployment Guide

This guide will help you deploy Suzalink CRM to Vercel.

## Prerequisites

1. A Vercel account ([sign up here](https://vercel.com/signup))
2. A PostgreSQL database (recommended: [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com))
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Ensure all changes are committed and pushed to your repository
2. The project is already configured with:
   - `vercel.json` - Vercel configuration
   - `next.config.js` - Next.js configuration optimized for Vercel
   - Build command includes Prisma generation

## Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import your Git repository
4. Vercel will auto-detect Next.js framework

## Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://your-project.vercel.app

# Public App URL
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### Optional Variables

```bash
# Socket.io (if using real-time features)
NEXT_PUBLIC_SOCKET_URL=https://your-project.vercel.app

# Google Calendar Integration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Outlook Calendar Integration
OUTLOOK_CLIENT_ID=your-outlook-client-id
OUTLOOK_CLIENT_SECRET=your-outlook-client-secret

# Node Environment (automatically set by Vercel)
NODE_ENV=production
```

### Generating NEXTAUTH_SECRET

Run this command locally:
```bash
openssl rand -base64 32
```

## Step 4: Database Setup

### Option A: Vercel Postgres (Recommended)

1. In your Vercel project, go to **Storage** tab
2. Click **"Create Database"** → Select **Postgres**
3. Copy the `DATABASE_URL` connection string
4. Add it to your environment variables

### Option B: External Database (Neon, Supabase, etc.)

1. Create a PostgreSQL database on your preferred provider
2. Get the connection string
3. Add `DATABASE_URL` to Vercel environment variables

### Run Database Migrations

After setting up the database, you need to run migrations:

**Option 1: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Run migrations
npx prisma migrate deploy
```

**Option 2: Using a separate script**
You can create a one-time migration script or use Vercel's build command to run migrations.

## Step 5: Deploy

1. Click **"Deploy"** in Vercel dashboard
2. Vercel will:
   - Install dependencies (`npm install`)
   - Generate Prisma Client (`prisma generate`)
   - Build the Next.js app (`next build`)
   - Deploy to production

## Step 6: Post-Deployment

### Seed Initial Data (Optional)

If you need to seed initial users, you can:

1. Use Vercel CLI to run the seed script:
```bash
vercel env pull .env.local
npx prisma db push
npm run db:seed
```

2. Or create a one-time API route to seed data (remove after use)

### Verify Deployment

1. Visit your deployment URL: `https://your-project.vercel.app`
2. Test login with seeded credentials
3. Check that database connections work

## Important Notes

### Socket.io Considerations

⚠️ **Important**: The project includes a custom `server.ts` file for Socket.io. Vercel's serverless architecture doesn't support persistent WebSocket connections in the same way.

**Options:**
1. **Use Vercel Edge Functions** for Socket.io (requires configuration)
2. **Use a separate Socket.io service** (e.g., Socket.io Cloud, Railway, Render)
3. **Disable real-time features** if not critical

If you need Socket.io, consider:
- Moving Socket.io to a separate service
- Using Vercel's Edge Functions with WebSocket support
- Using alternative real-time solutions (Server-Sent Events, polling)

### File Uploads

The project uses local file storage (`/uploads` directory). On Vercel:
- **Local storage is ephemeral** - files will be lost on each deployment
- **Recommended**: Use cloud storage (AWS S3, Vercel Blob Storage, Cloudinary)

To fix this:
1. Set up Vercel Blob Storage or AWS S3
2. Update file upload logic to use cloud storage
3. Update file URLs to use cloud storage URLs

### Build Time

The build includes Prisma generation, which may take 1-2 minutes. This is normal.

### Environment Variables

- **Production**: Set in Vercel dashboard → Settings → Environment Variables
- **Preview**: Same variables are used for preview deployments
- **Development**: Use `.env.local` locally

## Troubleshooting

### Build Fails

1. Check build logs in Vercel dashboard
2. Ensure all environment variables are set
3. Verify `DATABASE_URL` is correct and accessible
4. Check Prisma schema is valid

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check database allows connections from Vercel IPs
3. Ensure SSL is enabled (add `?sslmode=require` to connection string)

### NextAuth Errors

1. Verify `NEXTAUTH_SECRET` is set and matches between environments
2. Ensure `NEXTAUTH_URL` matches your deployment URL exactly
3. Check that `trustHost: true` is set in `lib/auth.ts` (already configured)

### Prisma Client Errors

1. Ensure `prisma generate` runs during build (already in build command)
2. Check Prisma schema is valid
3. Verify database migrations are applied

## Continuous Deployment

Vercel automatically deploys:
- **Production**: On push to main/master branch
- **Preview**: On every push to other branches
- **Pull Requests**: Automatic preview deployments

## Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your custom domain

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Logs**: View in Vercel dashboard → Deployment → Functions
- **Errors**: Check Vercel dashboard for runtime errors

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

