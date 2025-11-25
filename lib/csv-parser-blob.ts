/**
 * CSV parser that works with both filesystem and Vercel Blob Storage
 */
import csv from "csv-parser";
import { Readable } from "stream";
import { getFile } from "./storage";
import { createReadStream } from "fs";
import { existsSync } from "fs";

export interface CSVRow {
  [key: string]: string;
}

/**
 * Create a readable stream from file path or Blob URL
 */
async function createFileStream(filePathOrUrl: string): Promise<NodeJS.ReadableStream> {
  // If it's a local filesystem path (development)
  if (!filePathOrUrl.startsWith('http') && existsSync(filePathOrUrl)) {
    return createReadStream(filePathOrUrl);
  }
  
  // Otherwise, it's a Blob URL - read it into a buffer and create stream
  const buffer = await getFile(filePathOrUrl);
  return Readable.from(buffer);
}

/**
 * Parse CSV headers from a file (filesystem path or Blob URL)
 */
export async function parseCSVHeaders(filePathOrUrl: string): Promise<string[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await createFileStream(filePathOrUrl);
      stream
        .pipe(csv())
        .on("headers", (headerList: string[]) => {
          stream.destroy();
          resolve(headerList);
        })
        .on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse CSV preview (first N rows) from a file
 */
export async function parseCSVPreview(
  filePathOrUrl: string,
  maxRows: number = 5
): Promise<CSVRow[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await createFileStream(filePathOrUrl);
      const rows: CSVRow[] = [];
      stream
        .pipe(csv())
        .on("data", (row: CSVRow) => {
          if (rows.length < maxRows) {
            rows.push(row);
          } else {
            stream.destroy();
            resolve(rows);
          }
        })
        .on("end", () => resolve(rows))
        .on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stream CSV rows from a file
 */
export async function streamCSVRows(
  filePathOrUrl: string,
  onChunk: (rows: CSVRow[]) => Promise<void>,
  chunkSize: number = 500
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await createFileStream(filePathOrUrl);
      let chunk: CSVRow[] = [];
      
      stream
        .pipe(csv())
        .on("data", async (row: CSVRow) => {
          chunk.push(row);
          
          if (chunk.length >= chunkSize) {
            stream.pause();
            await onChunk(chunk);
            chunk = [];
            stream.resume();
          }
        })
        .on("end", async () => {
          if (chunk.length > 0) {
            await onChunk(chunk);
          }
          resolve();
        })
        .on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

