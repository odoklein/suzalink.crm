/**
 * Email Sync Engine v2
 * 
 * Comprehensive IMAP/POP3 sync engine with:
 * - Full and incremental sync support
 * - Multi-folder synchronization
 * - Proper email threading (RFC 5322)
 * - Attachment handling
 * - Sync state tracking
 */

import Imap from "imap";
import { simpleParser, ParsedMail, Attachment } from "mailparser";
import { prisma } from "./prisma";
import { Readable } from "stream";
import crypto from "crypto";

// ============================================
// Types
// ============================================

export interface EmailSettings {
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  protocol?: "imap" | "pop3";
}

export interface SyncResult {
  success: boolean;
  folder: string;
  processed: number;
  errors: number;
  duration: number;
  newEmails: number;
  deletedEmails: number;
  errorMessage?: string;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

interface ParsedEmailData {
  messageId: string;
  inReplyTo?: string;
  references: string[];
  subject: string;
  fromAddress: string;
  fromName?: string;
  toAddresses: EmailAddress[];
  ccAddresses?: EmailAddress[];
  bccAddresses?: EmailAddress[];
  replyToAddress?: string;
  bodyPlain?: string;
  bodyHtml?: string;
  snippet: string;
  size: number;
  hasAttachments: boolean;
  importance: string;
  sentAt?: Date;
  receivedAt: Date;
  attachments: ParsedAttachment[];
  rawHeaders: Record<string, string>;
}

interface ParsedAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  content: Buffer;
  isInline: boolean;
}

// ============================================
// Email Parser
// ============================================

/**
 * Parse a raw email into structured data
 */
export async function parseEmail(
  stream: Readable | Buffer | string,
  uid?: number
): Promise<ParsedEmailData> {
  const parsed = await simpleParser(stream);
  
  // Extract addresses
  const extractAddresses = (addressList: any): EmailAddress[] => {
    if (!addressList?.value) return [];
    return addressList.value.map((addr: any) => ({
      email: addr.address || "",
      name: addr.name || undefined,
    }));
  };

  // Generate message ID if missing
  const messageId = parsed.messageId || 
    `<${crypto.randomUUID()}@generated.local>`;
  
  // Parse references for threading
  const references = parsed.references 
    ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references])
    : [];

  // Extract from address
  const fromAddr = parsed.from?.value?.[0];
  
  // Create snippet (first 200 chars of plain text)
  const plainText = parsed.text || "";
  const snippet = plainText
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  // Parse attachments
  const attachments: ParsedAttachment[] = [];
  if (parsed.attachments) {
    for (const att of parsed.attachments) {
      attachments.push({
        filename: att.filename || `attachment-${attachments.length + 1}`,
        contentType: att.contentType || "application/octet-stream",
        size: att.size || att.content?.length || 0,
        contentId: att.contentId?.replace(/[<>]/g, ""),
        content: att.content,
        isInline: att.contentDisposition === "inline",
      });
    }
  }

  // Determine importance
  let importance = "normal";
  const priorityHeader = parsed.headers.get("x-priority") || 
    parsed.headers.get("importance");
  if (priorityHeader) {
    const val = String(priorityHeader).toLowerCase();
    if (val.includes("1") || val.includes("high")) importance = "high";
    else if (val.includes("5") || val.includes("low")) importance = "low";
  }

  // Extract raw headers for storage
  const rawHeaders: Record<string, string> = {};
  parsed.headers.forEach((value, key) => {
    rawHeaders[key] = String(value);
  });

  return {
    messageId,
    inReplyTo: parsed.inReplyTo?.replace(/[<>]/g, ""),
    references: references.map(r => r.replace(/[<>]/g, "")),
    subject: parsed.subject || "(No Subject)",
    fromAddress: fromAddr?.address || "",
    fromName: fromAddr?.name,
    toAddresses: extractAddresses(parsed.to),
    ccAddresses: extractAddresses(parsed.cc),
    bccAddresses: extractAddresses(parsed.bcc),
    replyToAddress: parsed.replyTo?.value?.[0]?.address,
    bodyPlain: parsed.text,
    bodyHtml: parsed.html || undefined,
    snippet,
    size: plainText.length + (parsed.html?.length || 0),
    hasAttachments: attachments.length > 0,
    importance,
    sentAt: parsed.date,
    receivedAt: parsed.date || new Date(),
    attachments,
    rawHeaders,
  };
}

/**
 * Compute thread ID based on references chain
 */
function computeThreadId(
  messageId: string,
  inReplyTo?: string,
  references: string[] = []
): string {
  // If no references, this is the start of a thread
  if (!inReplyTo && references.length === 0) {
    return messageId;
  }
  
  // Thread ID is the first message in the references chain
  // or the in-reply-to if no references
  return references[0] || inReplyTo || messageId;
}

// ============================================
// IMAP Sync Engine
// ============================================

export class ImapSyncEngine {
  private userId: string;
  private settings: EmailSettings;
  private imap: Imap | null = null;

  constructor(userId: string, settings: EmailSettings) {
    this.userId = userId;
    this.settings = settings;
  }

  /**
   * Connect to IMAP server
   */
  private async connect(): Promise<void> {
    console.log(`📧 Connecting to IMAP: ${this.settings.imap_host}:${this.settings.imap_port || 993}`);
    console.log(`📧 IMAP user: ${this.settings.imap_user}`);
    
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.settings.imap_user,
        password: this.settings.imap_password,
        host: this.settings.imap_host,
        port: this.settings.imap_port || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 30000,
        authTimeout: 15000,
        debug: (msg) => console.log(`📧 IMAP: ${msg}`),
      });

      this.imap.once("ready", () => {
        console.log("✅ IMAP connected successfully");
        resolve();
      });
      this.imap.once("error", (err) => {
        console.error("❌ IMAP connection error:", err.message);
        reject(err);
      });
      this.imap.connect();
    });
  }

  /**
   * Disconnect from IMAP server
   */
  private disconnect(): void {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }

  /**
   * List all available folders
   */
  async listFolders(): Promise<string[]> {
    await this.connect();
    
    return new Promise((resolve, reject) => {
      this.imap!.getBoxes((err, boxes) => {
        if (err) {
          this.disconnect();
          return reject(err);
        }

        const folders: string[] = [];
        const extractFolders = (obj: any, prefix = "") => {
          for (const name of Object.keys(obj)) {
            const fullPath = prefix ? `${prefix}/${name}` : name;
            folders.push(fullPath);
            if (obj[name].children) {
              extractFolders(obj[name].children, fullPath);
            }
          }
        };
        extractFolders(boxes);
        
        this.disconnect();
        resolve(folders);
      });
    });
  }

  /**
   * Sync a specific folder (full or incremental)
   */
  async syncFolder(
    folder: string = "INBOX",
    fullSync: boolean = false
  ): Promise<SyncResult> {
    const startTime = Date.now();
    let processed = 0;
    let errors = 0;
    let newEmails = 0;

    console.log(`📧 Starting sync for folder: ${folder}, fullSync: ${fullSync}`);

    try {
      await this.connect();

      // Get sync state
      let syncState = await prisma.emailSyncState.findUnique({
        where: { userId_folder: { userId: this.userId, folder } },
      });

      // Open folder
      const box = await new Promise<any>((resolve, reject) => {
        this.imap!.openBox(folder, false, (err, box) => {
          if (err) reject(err);
          else resolve(box);
        });
      });

      const uidValidity = box.uidvalidity;
      console.log(`📧 Opened folder ${folder}: ${box.messages.total} total messages, uidValidity: ${uidValidity}`);

      // Check if we need full resync (UIDVALIDITY changed)
      if (syncState && syncState.uidValidity !== uidValidity) {
        console.log(`UIDVALIDITY changed for ${folder}, forcing full resync`);
        fullSync = true;
      }

      // Update sync state to syncing
      await prisma.emailSyncState.upsert({
        where: { userId_folder: { userId: this.userId, folder } },
        create: {
          userId: this.userId,
          folder,
          uidValidity,
          syncStatus: "syncing",
          totalMessages: box.messages.total,
        },
        update: {
          uidValidity,
          syncStatus: "syncing",
          totalMessages: box.messages.total,
        },
      });

      // Determine what to fetch
      let searchCriteria: any[];
      if (fullSync || !syncState?.lastUid) {
        // Full sync: fetch all emails
        searchCriteria = ["ALL"];
      } else {
        // Incremental sync: only fetch new emails
        searchCriteria = [["UID", `${syncState.lastUid + 1}:*`]];
      }

      // Search for emails
      console.log(`📧 Searching emails with criteria:`, searchCriteria);
      const uids = await new Promise<number[]>((resolve, reject) => {
        this.imap!.search(searchCriteria, (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        });
      });

      console.log(`📧 Found ${uids.length} emails to sync`);

      if (uids.length === 0) {
        this.disconnect();
        await this.updateSyncState(folder, uidValidity, syncState?.lastUid || 0, "idle", box.messages.total);
        return {
          success: true,
          folder,
          processed: 0,
          errors: 0,
          duration: Date.now() - startTime,
          newEmails: 0,
          deletedEmails: 0,
        };
      }

      // Fetch emails in batches
      const batchSize = 50;
      let highestUid = syncState?.lastUid || 0;

      for (let i = 0; i < uids.length; i += batchSize) {
        const batchUids = uids.slice(i, i + batchSize);
        
        try {
          const emails = await this.fetchEmails(batchUids, folder);
          
          for (const email of emails) {
            try {
              await this.saveEmail(email, folder);
              newEmails++;
              if (email.uid > highestUid) {
                highestUid = email.uid;
              }
            } catch (error) {
              console.error(`Error saving email UID ${email.uid}:`, error);
              errors++;
            }
            processed++;
          }

          // Update progress
          const progress = Math.round((i + batchUids.length) / uids.length * 100);
          await prisma.emailSyncState.update({
            where: { userId_folder: { userId: this.userId, folder } },
            data: { 
              syncProgress: progress,
              syncedMessages: processed,
            },
          });
        } catch (batchError) {
          console.error(`Error processing batch:`, batchError);
          errors++;
        }
      }

      this.disconnect();
      await this.updateSyncState(folder, uidValidity, highestUid, "idle", box.messages.total);

      return {
        success: true,
        folder,
        processed,
        errors,
        duration: Date.now() - startTime,
        newEmails,
        deletedEmails: 0,
      };
    } catch (error: any) {
      this.disconnect();
      
      await prisma.emailSyncState.upsert({
        where: { userId_folder: { userId: this.userId, folder } },
        create: {
          userId: this.userId,
          folder,
          syncStatus: "error",
          errorMessage: error.message,
          errorCount: 1,
        },
        update: {
          syncStatus: "error",
          errorMessage: error.message,
          errorCount: { increment: 1 },
        },
      });

      return {
        success: false,
        folder,
        processed,
        errors: errors + 1,
        duration: Date.now() - startTime,
        newEmails,
        deletedEmails: 0,
        errorMessage: error.message,
      };
    }
  }

  /**
   * Fetch emails by UIDs
   */
  private async fetchEmails(
    uids: number[],
    folder: string
  ): Promise<Array<ParsedEmailData & { uid: number }>> {
    return new Promise((resolve, reject) => {
      const emails: Array<ParsedEmailData & { uid: number }> = [];
      
      const fetch = this.imap!.fetch(uids, {
        bodies: "",
        struct: true,
      });

      fetch.on("message", (msg, seqno) => {
        let uid = 0;
        
        msg.on("attributes", (attrs) => {
          uid = attrs.uid;
        });

        msg.on("body", async (stream) => {
          try {
            const parsed = await parseEmail(stream);
            emails.push({ ...parsed, uid });
          } catch (error) {
            console.error(`Error parsing email:`, error);
          }
        });
      });

      fetch.once("error", (err) => reject(err));
      fetch.once("end", () => resolve(emails));
    });
  }

  /**
   * Save email to database
   */
  private async saveEmail(
    emailData: ParsedEmailData & { uid: number },
    folder: string
  ): Promise<void> {
    const threadId = computeThreadId(
      emailData.messageId,
      emailData.inReplyTo,
      emailData.references
    );

    // Check if email already exists
    const existing = await prisma.email.findUnique({
      where: {
        userId_messageId: {
          userId: this.userId,
          messageId: emailData.messageId,
        },
      },
    });

    if (existing) {
      // Update existing email (flags may have changed)
      await prisma.email.update({
        where: { id: existing.id },
        data: {
          folder,
          imapUid: emailData.uid,
          imapFolder: folder,
        },
      });
      return;
    }

    // Try to link to a lead based on email address
    let leadId: string | null = null;
    try {
      const leads = await prisma.lead.findMany({
        where: {
          standardData: {
            path: ["email"],
            string_contains: emailData.fromAddress.toLowerCase(),
          },
        },
        take: 1,
      });
      if (leads.length > 0) {
        leadId = leads[0].id;
      }
    } catch (error) {
      // Lead linking is optional, continue without it
    }

    // Calculate thread position
    const threadEmails = await prisma.email.findMany({
      where: {
        userId: this.userId,
        threadId,
      },
      orderBy: { receivedAt: "asc" },
      select: { id: true },
    });
    const threadPosition = threadEmails.length;

    // Create email record
    const email = await prisma.email.create({
      data: {
        userId: this.userId,
        accountEmail: this.settings.imap_user,
        messageId: emailData.messageId,
        inReplyTo: emailData.inReplyTo,
        references: emailData.references,
        threadId,
        threadPosition,
        subject: emailData.subject,
        fromAddress: emailData.fromAddress,
        fromName: emailData.fromName,
        toAddresses: emailData.toAddresses,
        ccAddresses: emailData.ccAddresses,
        bccAddresses: emailData.bccAddresses,
        replyToAddress: emailData.replyToAddress,
        bodyPlain: emailData.bodyPlain,
        bodyHtml: emailData.bodyHtml,
        snippet: emailData.snippet,
        size: emailData.size,
        hasAttachments: emailData.hasAttachments,
        importance: emailData.importance,
        folder,
        sentAt: emailData.sentAt,
        receivedAt: emailData.receivedAt,
        imapUid: emailData.uid,
        imapFolder: folder,
        leadId,
        rawHeaders: emailData.rawHeaders,
      },
    });

    // Save attachments (store metadata, actual files would go to S3)
    for (const att of emailData.attachments) {
      const storageKey = `emails/${this.userId}/${email.id}/${crypto.randomUUID()}-${att.filename}`;
      
      await prisma.emailAttachment.create({
        data: {
          emailId: email.id,
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          contentId: att.contentId,
          storageKey,
          isInline: att.isInline,
          checksum: crypto
            .createHash("md5")
            .update(att.content)
            .digest("hex"),
        },
      });

      // In production, upload att.content to S3 using storageKey
      // await uploadToS3(storageKey, att.content, att.contentType);
    }
  }

  /**
   * Update sync state after successful sync
   */
  private async updateSyncState(
    folder: string,
    uidValidity: number,
    lastUid: number,
    status: string,
    totalMessages: number
  ): Promise<void> {
    await prisma.emailSyncState.update({
      where: { userId_folder: { userId: this.userId, folder } },
      data: {
        uidValidity,
        lastUid,
        syncStatus: status,
        syncProgress: 100,
        lastSyncAt: new Date(),
        errorMessage: null,
        totalMessages,
      },
    });
  }

  /**
   * Sync all folders
   */
  async syncAllFolders(fullSync: boolean = false): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    try {
      const folders = await this.listFolders();
      
      // Prioritize important folders
      const priorityFolders = ["INBOX", "Sent", "Drafts"];
      const sortedFolders = [
        ...priorityFolders.filter(f => folders.includes(f)),
        ...folders.filter(f => !priorityFolders.includes(f)),
      ];

      for (const folder of sortedFolders) {
        const result = await this.syncFolder(folder, fullSync);
        results.push(result);
      }
    } catch (error: any) {
      results.push({
        success: false,
        folder: "ALL",
        processed: 0,
        errors: 1,
        duration: 0,
        newEmails: 0,
        deletedEmails: 0,
        errorMessage: error.message,
      });
    }

    return results;
  }
}

// ============================================
// Sync Job Runner
// ============================================

/**
 * Run email sync for a user
 */
export async function syncUserEmails(
  userId: string,
  options: {
    folder?: string;
    fullSync?: boolean;
  } = {}
): Promise<SyncResult | SyncResult[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.emailSettings) {
    return {
      success: false,
      folder: options.folder || "ALL",
      processed: 0,
      errors: 1,
      duration: 0,
      newEmails: 0,
      deletedEmails: 0,
      errorMessage: "User not found or no email settings",
    };
  }

  const settings = user.emailSettings as EmailSettings;
  const engine = new ImapSyncEngine(userId, settings);

  if (options.folder) {
    return engine.syncFolder(options.folder, options.fullSync);
  } else {
    return engine.syncAllFolders(options.fullSync);
  }
}

/**
 * Create a sync job for a user
 */
export async function createSyncJob(
  userId: string,
  jobType: "full_sync" | "incremental_sync" | "folder_sync",
  folder?: string,
  priority: number = 0
): Promise<string> {
  const job = await prisma.emailSyncJob.create({
    data: {
      userId,
      jobType,
      folder,
      priority,
      status: "pending",
    },
  });

  return job.id;
}

/**
 * Process pending sync jobs
 */
export async function processSyncJobs(limit: number = 10): Promise<void> {
  const jobs = await prisma.emailSyncJob.findMany({
    where: {
      status: "pending",
      OR: [
        { scheduledFor: null },
        { scheduledFor: { lte: new Date() } },
      ],
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" },
    ],
    take: limit,
  });

  for (const job of jobs) {
    // Mark as processing
    await prisma.emailSyncJob.update({
      where: { id: job.id },
      data: {
        status: "processing",
        startedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    try {
      const result = await syncUserEmails(job.userId, {
        folder: job.folder || undefined,
        fullSync: job.jobType === "full_sync",
      });

      // Mark as completed
      await prisma.emailSyncJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          result: Array.isArray(result) ? { results: result } : result,
        },
      });
    } catch (error: any) {
      const shouldRetry = job.attempts < job.maxAttempts;
      
      await prisma.emailSyncJob.update({
        where: { id: job.id },
        data: {
          status: shouldRetry ? "pending" : "failed",
          error: error.message,
          scheduledFor: shouldRetry 
            ? new Date(Date.now() + 60000 * Math.pow(2, job.attempts))
            : undefined,
        },
      });
    }
  }
}

// ============================================
// Email Scheduler
// ============================================

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Start the email sync scheduler
 */
export function startEmailSyncScheduler(intervalMs: number = 5 * 60 * 1000): void {
  if (syncInterval) {
    console.log("Email sync scheduler already running");
    return;
  }

  console.log(`Starting email sync scheduler (interval: ${intervalMs / 1000}s)`);

  // Initial sync for all users
  scheduleAllUserSyncs();

  // Schedule periodic syncs
  syncInterval = setInterval(() => {
    scheduleAllUserSyncs();
  }, intervalMs);
}

/**
 * Stop the email sync scheduler
 */
export function stopEmailSyncScheduler(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("Email sync scheduler stopped");
  }
}

/**
 * Schedule sync jobs for all users with email settings
 */
async function scheduleAllUserSyncs(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        emailSettings: { not: null },
        isActive: true,
      },
      select: { id: true },
    });

    for (const user of users) {
      // Check if there's already a pending job
      const pendingJob = await prisma.emailSyncJob.findFirst({
        where: {
          userId: user.id,
          status: { in: ["pending", "processing"] },
        },
      });

      if (!pendingJob) {
        await createSyncJob(user.id, "incremental_sync");
      }
    }

    // Process jobs
    await processSyncJobs();
  } catch (error) {
    console.error("Error in email sync scheduler:", error);
  }
}

