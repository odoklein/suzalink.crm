import csv from "csv-parser";
import { createReadStream } from "fs";
import { Readable } from "stream";

export interface CSVRow {
  [key: string]: string;
}

export async function parseCSVHeaders(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const headers: string[] = [];
    const stream = createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headerList: string[]) => {
        headers.push(...headerList);
        stream.destroy();
        resolve(headerList);
      })
      .on("error", reject);
  });
}

export async function parseCSVHeadersFromStream(stream: Readable): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const headers: string[] = [];
    const csvStream = stream
      .pipe(csv())
      .on("headers", (headerList: string[]) => {
        headers.push(...headerList);
        csvStream.destroy();
        resolve(headerList);
      })
      .on("error", reject);
  });
}

export async function parseCSVPreviewFromStream(
  stream: Readable,
  maxRows: number = 5
): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CSVRow[] = [];
    const csvStream = stream
      .pipe(csv())
      .on("data", (row: CSVRow) => {
        if (rows.length < maxRows) {
          rows.push(row);
        } else {
          csvStream.destroy();
          resolve(rows);
        }
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

export async function parseCSVPreview(filePath: string, maxRows: number = 5): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CSVRow[] = [];
    const stream = createReadStream(filePath)
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
  });
}

export async function streamCSVRows(
  filePath: string,
  onChunk: (rows: CSVRow[]) => Promise<void>,
  chunkSize: number = 500
): Promise<void> {
  return new Promise((resolve, reject) => {
    let chunk: CSVRow[] = [];
    
    const stream = createReadStream(filePath)
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
  });
}

export async function streamCSVRowsFromStream(
  stream: Readable,
  onChunk: (rows: CSVRow[]) => Promise<void>,
  chunkSize: number = 500
): Promise<void> {
  return new Promise((resolve, reject) => {
    let chunk: CSVRow[] = [];

    const csvStream = stream
      .pipe(csv())
      .on("data", async (row: CSVRow) => {
        chunk.push(row);

        if (chunk.length >= chunkSize) {
          csvStream.pause();
          await onChunk(chunk);
          chunk = [];
          csvStream.resume();
        }
      })
      .on("end", async () => {
        if (chunk.length > 0) {
          await onChunk(chunk);
        }
        resolve();
      })
      .on("error", reject);
  });
}
