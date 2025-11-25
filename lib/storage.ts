/**
 * Storage utility for file uploads
 * Supports both local development (filesystem) and production (Vercel Blob)
 */

import { put, get, del, list } from '@vercel/blob';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface StorageResult {
  url: string;
  path: string;
  delete: () => Promise<void>;
  read: () => Promise<Buffer>;
}

/**
 * Upload a file to storage
 * Uses Vercel Blob in production, local filesystem in development
 */
export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  folder?: string
): Promise<StorageResult> {
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Use Vercel Blob Storage
    const blobName = folder ? `${folder}/${fileName}` : fileName;
    const blob = await put(blobName, file, {
      access: 'public',
      addRandomSuffix: true, // Prevent filename conflicts
    });

    return {
      url: blob.url,
      path: blob.pathname,
      async delete() {
        await del(blob.url);
      },
      async read() {
        const downloaded = await get(blob.url);
        return Buffer.from(await downloaded.arrayBuffer());
      },
    };
  } else {
    // Use local filesystem for development
    const uploadsDir = join(process.cwd(), 'uploads', folder || '');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = join(uploadsDir, fileName);
    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return {
      url: `/uploads/${folder ? `${folder}/` : ''}${fileName}`,
      path: filePath,
      async delete() {
        try {
          await unlink(filePath);
        } catch (error) {
          // File might not exist, ignore
        }
      },
      async read() {
        const fs = await import('fs/promises');
        return await fs.readFile(filePath);
      },
    };
  }
}

/**
 * Get file from storage
 */
export async function getFile(urlOrPath: string): Promise<Buffer> {
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  
  if (isProduction && urlOrPath.startsWith('https://')) {
    // Vercel Blob URL
    const blob = await get(urlOrPath);
    return Buffer.from(await blob.arrayBuffer());
  } else {
    // Local filesystem path
    const fs = await import('fs/promises');
    return await fs.readFile(urlOrPath);
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(urlOrPath: string): Promise<void> {
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
  
  if (isProduction && urlOrPath.startsWith('https://')) {
    // Vercel Blob URL
    await del(urlOrPath);
  } else {
    // Local filesystem path
    try {
      const fs = await import('fs/promises');
      await fs.unlink(urlOrPath);
    } catch (error) {
      // File might not exist, ignore
    }
  }
}

/**
 * Check if storage is using Vercel Blob
 */
export function isBlobStorage(): boolean {
  return process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
}

