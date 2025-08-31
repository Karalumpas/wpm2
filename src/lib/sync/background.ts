import { db } from '@/db';
import { shops } from '@/db/schema';
import { createSyncServiceForShop } from '@/lib/woo/sync-service';
import type { WooCommerceProductSyncService } from '@/lib/woo/sync-service';
import { eq } from 'drizzle-orm';

type JobStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed';

export type SyncJob = {
  id: string;
  shopId: string;
  shopName?: string;
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
  logs: string[];
};

class BackgroundSyncQueue {
  private queue: SyncJob[] = [];
  private jobs = new Map<string, SyncJob>();
  private processing = false;
  private controllers = new Map<
    string,
    {
      paused: boolean;
      cancelled: boolean;
      waiters: Array<() => void>;
      isPaused: () => boolean;
      isCancelled: () => boolean;
      waitIfPaused: () => Promise<void>;
    }
  >();

  enqueue(shopId: string): SyncJob {
    const id = `${shopId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const job: SyncJob = {
      id,
      shopId,
      status: 'queued',
      enqueuedAt: new Date(),
      progress: [],
      logs: [],
    };
    // Best-effort fetch of shop name for UI
    void (async () => {
      try {
        const rows = await db
          .select({ name: shops.name })
          .from(shops)
          .where(eq(shops.id, shopId))
          .limit(1);
        if (rows.length) {
          job.shopName = rows[0].name;
        }
      } catch {}
    })();
    job.logs.push(
      `[${new Date().toLocaleTimeString()}] Job oprettet for shop ${shopId}`
    );
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
      job.logs.push(
        `[${new Date().toLocaleTimeString()}] Starter synkronisering…`
      );

      // Ensure shop exists (will throw if missing)
      const found = await db
        .select()
        .from(shops)
        .where(eq(shops.id, job.shopId))
        .limit(1);
      if (found.length === 0) {
        throw new Error(`Shop not found: ${job.shopId}`);
      }

      const service: WooCommerceProductSyncService =
        await createSyncServiceForShop(job.shopId);

      // Attach job controller for pause/cancel support
      const controller = this.ensureController(job.id);
      service.setController?.({
        isPaused: () => controller.paused,
        isCancelled: () => controller.cancelled,
        waitIfPaused: async () => {
          if (!controller.paused) return;
          await new Promise<void>((resolve) =>
            controller.waiters.push(resolve)
          );
        },
      });
      if (controller.paused) {
        job.status = 'paused';
        job.logs.push(`[${new Date().toLocaleTimeString()}] Job sat på pause`);
      }

      service.setProgressCallback((p) => {
        job.progress?.push({
          stage: p.stage,
          current: p.current,
          total: p.total,
          message: p.message,
        });
        // Append readable log line (cap log size)
        const line = `[${new Date().toLocaleTimeString()}] ${p.stage} ${p.current}/${p.total} – ${p.message}`;
        job.logs.push(line);
        if (job.logs.length > 500) job.logs.splice(0, job.logs.length - 500);
      });

      const result = await service.syncAll();
      job.status = 'completed';
      job.finishedAt = new Date();
      job.message = result.message;
      job.details = result.details;
      job.logs.push(
        `[${new Date().toLocaleTimeString()}] Færdig: ${result.message}`
      );
    } catch (e) {
      job.status = 'failed';
      job.finishedAt = new Date();
      job.error = e instanceof Error ? e.message : 'Unknown error';
      job.logs.push(
        `[${new Date().toLocaleTimeString()}] Fejlede: ${job.error}`
      );
    } finally {
      // Keep processing remaining jobs
      setImmediate(() => this.processNext());
    }
  }

  private ensureController(jobId: string) {
    let c = this.controllers.get(jobId);
    if (!c) {
      c = {
        paused: false,
        cancelled: false,
        waiters: [],
        isPaused: function () {
          return this.paused;
        },
        isCancelled: function () {
          return this.cancelled;
        },
        waitIfPaused: async function () {
          if (!this.paused) return;
          await new Promise<void>((resolve) => this.waiters.push(resolve));
        },
      };
      this.controllers.set(jobId, c);
    }
    return c;
  }

  pause(jobId: string): SyncJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    if (job.status === 'running') {
      this.ensureController(jobId).paused = true;
      job.status = 'paused';
      job.logs.push(`[${new Date().toLocaleTimeString()}] Pauser job`);
    } else if (job.status === 'queued') {
      // queued: mark paused; will start as paused
      this.ensureController(jobId).paused = true;
      job.status = 'paused';
      job.logs.push(
        `[${new Date().toLocaleTimeString()}] Job i kø sat på pause`
      );
    }
    return job;
  }

  resume(jobId: string): SyncJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    const c = this.ensureController(jobId);
    if (c.paused) {
      c.paused = false;
      // Release all waiters
      const waiters = c.waiters.splice(0, c.waiters.length);
      waiters.forEach((w) => w());
      if (job.status === 'paused') job.status = 'running';
      job.logs.push(`[${new Date().toLocaleTimeString()}] Genoptager job`);
    }
    return job;
  }

  cancel(jobId: string): SyncJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    const c = this.ensureController(jobId);
    c.cancelled = true;
    // Ensure we release pause to let worker observe cancellation
    if (c.paused) this.resume(jobId);
    job.logs.push(
      `[${new Date().toLocaleTimeString()}] Stopper job (anmoder om annullering)`
    );
    return job;
  }

  remove(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.status === 'running') return false; // cannot remove running; stop first
    // Remove from queue if queued/paused in queue
    this.queue = this.queue.filter((j) => j.id !== jobId);
    this.jobs.delete(jobId);
    this.controllers.delete(jobId);
    return true;
  }
}

// Singleton instance (module scope)
export const backgroundSyncQueue = new BackgroundSyncQueue();
