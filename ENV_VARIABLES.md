# Environment Variables Reference

This document lists all environment variables used in the Suzalink CRM application.

## Required Variables

These variables **must** be set for the application to work:

### Database
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://user:password@host:5432/database?schema=public`
  - Example: `postgresql://postgres:password@localhost:5432/suzalink?schema=public`

### NextAuth Configuration
- `NEXTAUTH_SECRET` - Secret key for NextAuth.js session encryption
  - Generate with: `openssl rand -base64 32`
  - Must be at least 32 characters
  - Keep this secret and never commit it to version control

- `NEXTAUTH_URL` - The canonical URL of your site
  - Development: `http://localhost:3000`
  - Production: `https://your-domain.vercel.app`
  - Must match exactly (including protocol and port)

### Public App URL
- `NEXT_PUBLIC_APP_URL` - Public-facing URL for redirects and links
  - Usually same as `NEXTAUTH_URL`
  - Used for calendar OAuth callbacks and contact portal links

## Optional Variables

### Socket.io (Real-time Features)
- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL
  - Defaults to `NEXTAUTH_URL` if not set
  - Only needed if using real-time features

### Google Calendar Integration
- `GOOGLE_CLIENT_ID` - Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 2.0 Client Secret
- Get from: [Google Cloud Console](https://console.cloud.google.com/)

### Outlook Calendar Integration
- `OUTLOOK_CLIENT_ID` - Microsoft Azure App Client ID
- `OUTLOOK_CLIENT_SECRET` - Microsoft Azure App Client Secret
- Get from: [Azure Portal](https://portal.azure.com/)

### Aircall Integration (if used)
- `AIRCALL_API_ID` - Aircall API ID
- `AIRCALL_API_TOKEN` - Aircall API Token
- Get from: [Aircall Dashboard](https://aircall.io/)

### Node Environment
- `NODE_ENV` - Node.js environment
  - Automatically set by Vercel (`production` in production, `development` in preview)
  - Can be manually set to `development` or `production`

## Setting Environment Variables

### Local Development

Create a `.env.local` file in the project root:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/suzalink?schema=public"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable for the appropriate environments:
   - **Production**: Production deployments
   - **Preview**: Preview deployments (branches)
   - **Development**: Local development (if using Vercel CLI)

## Security Best Practices

1. **Never commit** `.env` or `.env.local` files to version control
2. **Use strong secrets** - Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially if exposed or compromised
4. **Use different secrets** for development, staging, and production
5. **Restrict database access** - Use connection pooling and IP whitelisting when possible
6. **Enable SSL** for database connections in production (add `?sslmode=require`)

## Verification

After setting environment variables, verify they're loaded:

1. Check Vercel deployment logs for any missing variable warnings
2. Test the application functionality:
   - Login should work (requires `NEXTAUTH_SECRET` and `DATABASE_URL`)
   - Database queries should succeed (requires `DATABASE_URL`)
   - Calendar integrations should work (if configured)

## Troubleshooting

### "Missing environment variable" errors
- Check that all required variables are set in Vercel dashboard
- Ensure variable names match exactly (case-sensitive)
- Redeploy after adding new variables

### Database connection errors
- Verify `DATABASE_URL` format is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled for production databases

### NextAuth errors
- Verify `NEXTAUTH_SECRET` is set and is at least 32 characters
- Ensure `NEXTAUTH_URL` matches your deployment URL exactly
- Check that `trustHost: true` is set in `lib/auth.ts` (already configured)

