/**
 * Email Queue System
 * 
 * Background job queue for email processing tasks.
 * Uses database-backed queue with optional BullMQ for Redis environments.
 * 
 * Job Types:
 * - EMAIL_SYNC: Sync emails from IMAP/POP3
 * - EMAIL_PARSE: Parse raw email content
 * - ATTACHMENT_UPLOAD: Upload attachments to S3
 * - SEARCH_INDEX: Update search indexes
 */

import { prisma } from "./prisma";
import { syncUserEmails, processSyncJobs } from "./email-sync-v2";

// ============================================
// Types
// ============================================

export type EmailJobType = 
  | "FULL_SYNC"
  | "INCREMENTAL_SYNC" 
  | "FOLDER_SYNC"
  | "PARSE_EMAIL"
  | "UPLOAD_ATTACHMENT"
  | "INDEX_SEARCH"
  | "CLEANUP_OLD_EMAILS";

export interface EmailJob {
  id: string;
  type: EmailJobType;
  userId: string;
  data: Record<string, any>;
  priority: number;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  attempts: number;
  maxAttempts: number;
  scheduledFor?: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// ============================================
// Job Queue Class
// ============================================

export class EmailJobQueue {
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private concurrency: number;

  constructor(concurrency: number = 3) {
    this.concurrency = concurrency;
  }

  /**
   * Add a job to the queue
   */
  async addJob(
    userId: string,
    type: EmailJobType,
    data: Record<string, any> = {},
    options: {
      priority?: number;
      delay?: number;
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const { priority = 0, delay = 0, maxAttempts = 3 } = options;

    // Check for duplicate pending jobs
    const existingJob = await prisma.emailSyncJob.findFirst({
      where: {
        userId,
        jobType: this.mapJobType(type),
        status: { in: ["pending", "processing"] },
        folder: data.folder || null,
      },
    });

    if (existingJob) {
      return existingJob.id;
    }

    const job = await prisma.emailSyncJob.create({
      data: {
        userId,
        jobType: this.mapJobType(type),
        folder: data.folder,
        priority,
        status: "pending",
        maxAttempts,
        scheduledFor: delay > 0 ? new Date(Date.now() + delay) : null,
        result: data,
      },
    });

    return job.id;
  }

  /**
   * Add multiple jobs as a batch
   */
  async addBulkJobs(
    jobs: Array<{
      userId: string;
      type: EmailJobType;
      data?: Record<string, any>;
      priority?: number;
    }>
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const job of jobs) {
      const id = await this.addJob(
        job.userId,
        job.type,
        job.data || {},
        { priority: job.priority }
      );
      jobIds.push(id);
    }

    return jobIds;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<EmailJob | null> {
    const job = await prisma.emailSyncJob.findUnique({
      where: { id: jobId },
    });

    if (!job) return null;

    return this.mapToEmailJob(job);
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = await prisma.emailSyncJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status === "completed" || job.status === "processing") {
      return false;
    }

    await prisma.emailSyncJob.update({
      where: { id: jobId },
      data: { status: "cancelled" },
    });

    return true;
  }

  /**
   * Get queue statistics
   */
  async getStats(userId?: string): Promise<QueueStats> {
    const where = userId ? { userId } : {};

    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.emailSyncJob.count({ where: { ...where, status: "pending" } }),
      prisma.emailSyncJob.count({ where: { ...where, status: "processing" } }),
      prisma.emailSyncJob.count({ where: { ...where, status: "completed" } }),
      prisma.emailSyncJob.count({ where: { ...where, status: "failed" } }),
      prisma.emailSyncJob.count({ where }),
    ]);

    return { pending, processing, completed, failed, total };
  }

  /**
   * Start processing jobs
   */
  start(intervalMs: number = 5000): void {
    if (this.processingInterval) {
      console.log("Email job queue already running");
      return;
    }

    console.log(`Starting email job queue (interval: ${intervalMs}ms, concurrency: ${this.concurrency})`);
    
    // Process immediately
    this.processJobs();

    // Schedule periodic processing
    this.processingInterval = setInterval(() => {
      this.processJobs();
    }, intervalMs);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log("Email job queue stopped");
    }
  }

  /**
   * Process pending jobs
   */
  private async processJobs(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Get pending jobs
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
        take: this.concurrency,
      });

      // Process jobs concurrently
      await Promise.all(
        jobs.map(job => this.processJob(job))
      );
    } catch (error) {
      console.error("Error processing jobs:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: any): Promise<void> {
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
      let result: any;

      switch (job.jobType) {
        case "full_sync":
          result = await syncUserEmails(job.userId, { fullSync: true });
          break;

        case "incremental_sync":
          result = await syncUserEmails(job.userId, { fullSync: false });
          break;

        case "folder_sync":
          result = await syncUserEmails(job.userId, { 
            folder: job.folder,
            fullSync: false,
          });
          break;

        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

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
            ? new Date(Date.now() + this.getRetryDelay(job.attempts))
            : undefined,
        },
      });

      console.error(`Job ${job.id} failed:`, error.message);
    }
  }

  /**
   * Get retry delay with exponential backoff
   */
  private getRetryDelay(attempts: number): number {
    // Base delay of 1 minute, doubles each attempt, max 1 hour
    const baseDelay = 60000;
    const maxDelay = 3600000;
    return Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
  }

  /**
   * Map job type to database format
   */
  private mapJobType(type: EmailJobType): string {
    const mapping: Record<EmailJobType, string> = {
      FULL_SYNC: "full_sync",
      INCREMENTAL_SYNC: "incremental_sync",
      FOLDER_SYNC: "folder_sync",
      PARSE_EMAIL: "parse_email",
      UPLOAD_ATTACHMENT: "upload_attachment",
      INDEX_SEARCH: "index_search",
      CLEANUP_OLD_EMAILS: "cleanup_old_emails",
    };
    return mapping[type] || type.toLowerCase();
  }

  /**
   * Map database job to EmailJob type
   */
  private mapToEmailJob(job: any): EmailJob {
    return {
      id: job.id,
      type: job.jobType.toUpperCase() as EmailJobType,
      userId: job.userId,
      data: job.result || {},
      priority: job.priority,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      scheduledFor: job.scheduledFor,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { count } = await prisma.emailSyncJob.deleteMany({
      where: {
        status: { in: ["completed", "failed", "cancelled"] },
        updatedAt: { lt: cutoffDate },
      },
    });

    return count;
  }
}

// ============================================
// Singleton Instance
// ============================================

let queueInstance: EmailJobQueue | null = null;

export function getEmailQueue(): EmailJobQueue {
  if (!queueInstance) {
    queueInstance = new EmailJobQueue();
  }
  return queueInstance;
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Queue a full email sync for a user
 */
export async function queueFullSync(userId: string, priority: number = 0): Promise<string> {
  const queue = getEmailQueue();
  return queue.addJob(userId, "FULL_SYNC", {}, { priority });
}

/**
 * Queue an incremental email sync for a user
 */
export async function queueIncrementalSync(userId: string, priority: number = 0): Promise<string> {
  const queue = getEmailQueue();
  return queue.addJob(userId, "INCREMENTAL_SYNC", {}, { priority });
}

/**
 * Queue a folder-specific sync
 */
export async function queueFolderSync(
  userId: string,
  folder: string,
  priority: number = 0
): Promise<string> {
  const queue = getEmailQueue();
  return queue.addJob(userId, "FOLDER_SYNC", { folder }, { priority });
}

/**
 * Schedule sync for all active users
 */
export async function scheduleAllUserSyncs(): Promise<number> {
  const users = await prisma.user.findMany({
    where: {
      emailSettings: { not: null },
      isActive: true,
    },
    select: { id: true },
  });

  const queue = getEmailQueue();
  
  for (const user of users) {
    await queue.addJob(user.id, "INCREMENTAL_SYNC", {}, { priority: 0 });
  }

  return users.length;
}

/**
 * Start the email queue worker
 */
export function startEmailQueueWorker(intervalMs: number = 10000): void {
  const queue = getEmailQueue();
  queue.start(intervalMs);
}

/**
 * Stop the email queue worker
 */
export function stopEmailQueueWorker(): void {
  const queue = getEmailQueue();
  queue.stop();
}

