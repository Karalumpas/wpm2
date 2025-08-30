import { db } from '@/db';
import { shops } from '@/db/schema';
import { createSyncServiceForShop } from '@/lib/woo/sync-service';
import { eq } from 'drizzle-orm';

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export type SyncJob = {
  id: string;
  shopId: string;
  status: JobStatus;
  enqueuedAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  message?: string;
  details?: unknown;
  error?: string;
  progress?: Array<{
    stage: string;
    current: number;
    total: number;
    message: string;
  }>;
};

class BackgroundSyncQueue {
  private queue: SyncJob[] = [];
  private jobs = new Map<string, SyncJob>();
  private processing = false;

  enqueue(shopId: string): SyncJob {
    const id = `${shopId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const job: SyncJob = {
      id,
      shopId,
      status: 'queued',
      enqueuedAt: new Date(),
      progress: [],
    };
    this.queue.push(job);
    this.jobs.set(id, job);
    this.kick();
    return job;
  }

  get(jobId: string): SyncJob | undefined {
    return this.jobs.get(jobId);
  }

  list(): SyncJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => a.enqueuedAt.getTime() - b.enqueuedAt.getTime()
    );
  }

  private kick() {
    if (this.processing) return;
    this.processing = true;
    setImmediate(() => this.processNext());
  }

  private async processNext() {
    const job = this.queue.shift();
    if (!job) {
      this.processing = false;
      return;
    }

    try {
      job.status = 'running';
      job.startedAt = new Date();

      // Ensure shop exists (will throw if missing)
      const found = await db
        .select()
        .from(shops)
        .where(eq(shops.id, job.shopId))
        .limit(1);
      if (found.length === 0) {
        throw new Error(`Shop not found: ${job.shopId}`);
      }

      const service = await createSyncServiceForShop(job.shopId);
      service.setProgressCallback((p) => {
        job.progress?.push({
          stage: p.stage,
          current: p.current,
          total: p.total,
          message: p.message,
        });
      });

      const result = await service.syncAll();
      job.status = 'completed';
      job.finishedAt = new Date();
      job.message = result.message;
      job.details = result.details;
    } catch (e) {
      job.status = 'failed';
      job.finishedAt = new Date();
      job.error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      // Keep processing remaining jobs
      setImmediate(() => this.processNext());
    }
  }
}

// Singleton instance (module scope)
export const backgroundSyncQueue = new BackgroundSyncQueue();
