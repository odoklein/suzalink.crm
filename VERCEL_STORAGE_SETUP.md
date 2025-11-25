# Vercel Storage Setup Guide

## Problem

Your application currently uses local filesystem storage (`uploads/` directory) which works locally but **doesn't work on Vercel** because:

- Vercel's filesystem is **read-only** (except `/tmp`)
- Files are **ephemeral** - lost on each deployment
- The `/uploads` directory is gitignored and won't be deployed

## Solution: Vercel Blob Storage

I've implemented a storage abstraction that:
- Uses **Vercel Blob Storage** in production (on Vercel)
- Uses **local filesystem** in development (localhost)
- Works seamlessly with your existing CSV upload code

## Setup Steps

### 1. Install Dependencies

The package has been added to `package.json`. Run:

```bash
npm install
```

This installs `@vercel/blob` which is required for cloud storage.

### 2. Create Vercel Blob Store

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **"Create Database"** or **"Add Storage"**
4. Select **"Blob"**
5. Choose a name (e.g., `suzalink-files`)
6. Select a region (choose closest to your users)
7. Click **"Create"**

### 3. Get Blob Store Token

After creating the Blob store:

1. Go to **Storage** → Your Blob store
2. Click **"Settings"** or **"API"**
3. Copy the **"Store Token"** or **"BLOB_READ_WRITE_TOKEN"**

### 4. Add Environment Variable

In Vercel Dashboard → Project Settings → Environment Variables:

Add:
```
BLOB_READ_WRITE_TOKEN=your-blob-store-token-here
```

**Important**: Add this for **Production**, **Preview**, and **Development** environments.

### 5. Deploy

After setting the environment variable, redeploy your application. The storage will automatically:
- Use Vercel Blob in production
- Use local filesystem in development

## How It Works

### Storage Abstraction (`lib/storage.ts`)

The storage utility automatically detects the environment:
- **Production** (Vercel): Uses `@vercel/blob` to store files in cloud
- **Development** (localhost): Uses local filesystem in `uploads/` directory

### CSV Processing

- **`lib/csv-parser-blob.ts`**: Updated CSV parser that works with both filesystem paths and Blob URLs
- **`lib/csv-processor.ts`**: Updated to use the new parser
- **`app/api/campaigns/[id]/import/route.ts`**: Updated to use storage abstraction

## File Storage Locations

### Development (localhost)
- Files stored in: `uploads/csv-imports/`
- Accessible via: `/uploads/csv-imports/filename.csv`

### Production (Vercel)
- Files stored in: Vercel Blob Storage
- Accessible via: `https://[blob-url].public.blob.vercel-storage.com/...`
- Automatically cleaned up after processing

## Other File Uploads

The same storage abstraction can be used for:
- Account file uploads (`app/api/accounts/[id]/files/route.ts`)
- Message attachments (`app/api/conversations/[id]/attachments/route.ts`)

You can update these routes similarly by:
1. Importing `uploadFile` from `@/lib/storage`
2. Replacing filesystem operations with `uploadFile()`
3. Using the returned URL instead of file paths

## Testing

### Local Development
1. Files will be saved to `uploads/` directory (as before)
2. Everything works the same as before

### Production (Vercel)
1. Files are uploaded to Vercel Blob Storage
2. Files are automatically accessible via URLs
3. Files can be deleted after processing

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not set"
- Make sure you've added the environment variable in Vercel dashboard
- Redeploy after adding the variable

### Files not uploading
- Check Vercel deployment logs
- Verify Blob store is created and token is correct
- Check that `@vercel/blob` package is installed

### CSV parsing errors
- The new parser reads from Blob URLs, not filesystem paths
- Make sure `filePath` in your code is the Blob URL (starts with `https://`)

## Cost Considerations

Vercel Blob Storage pricing:
- **Free tier**: 1 GB storage, 1 GB bandwidth/month
- **Pro**: $0.15/GB storage, $0.40/GB bandwidth
- Files are automatically deleted after CSV processing, so costs are minimal

For CSV files that are processed immediately and then deleted, this is very cost-effective.

## Alternative: AWS S3

If you prefer AWS S3 instead of Vercel Blob:

1. Set up AWS S3 bucket
2. Install `@aws-sdk/client-s3`
3. Update `lib/storage.ts` to use S3 instead of Vercel Blob
4. Add AWS credentials to Vercel environment variables

The storage abstraction makes it easy to switch providers if needed.

