'use client';

import useSWR from 'swr';

export type SyncProgressItem = {
  stage: string;
  current: number;
  total: number;
  message: string;
};

export type SyncJob = {
  id: string;
  shopId: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed';
  shopName?: string;
  enqueuedAt: string | Date;
  startedAt?: string | Date;
  finishedAt?: string | Date;
  message?: string;
  details?: unknown;
  error?: string;
  progress?: SyncProgressItem[];
  logs: string[];
};

type JobsResponse = { jobs: SyncJob[] } | SyncJob;

async function fetcher(url: string): Promise<JobsResponse> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useSyncJobs(jobId?: string) {
  const { data, error, isLoading, mutate } = useSWR<JobsResponse>(
    jobId
      ? `/api/shops/sync/background?jobId=${encodeURIComponent(jobId)}`
      : '/api/shops/sync/background',
    fetcher,
    {
      refreshInterval: 1500,
      revalidateOnFocus: false,
    }
  );

  let jobs: SyncJob[] = [];
  if (data) {
    if ('jobs' in data) jobs = data.jobs;
    else jobs = [data as SyncJob];
  }

  // Normalize date fields to Date for UI formatting
  const normalized = jobs.map((j) => ({
    ...j,
    enqueuedAt: new Date(j.enqueuedAt),
    startedAt: j.startedAt ? new Date(j.startedAt) : undefined,
    finishedAt: j.finishedAt ? new Date(j.finishedAt) : undefined,
  }));

  return {
    jobs: normalized,
    error: error ? (error as Error).message : null,
    isLoading,
    refresh: () => mutate(),
  };
}

export async function startBackgroundSync(
  shopId?: string
): Promise<{ accepted: boolean; jobs: string[] } | { error: string }> {
  const res = await fetch('/api/shops/sync/background', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(shopId ? { shopId } : {}),
  });
  try {
    return await res.json();
  } catch {
    return { error: 'Ugyldigt svar fra serveren' };
  }
}

export async function controlSyncJob(
  jobId: string,
  action: 'pause' | 'resume' | 'cancel'
): Promise<SyncJob | { error: string }> {
  const res = await fetch('/api/shops/sync/background', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, action }),
  });
  try {
    return await res.json();
  } catch {
    return { error: 'Ugyldigt svar fra serveren' };
  }
}

export async function removeSyncJob(
  jobId: string
): Promise<{ removed: boolean } | { error: string }> {
  const res = await fetch('/api/shops/sync/background', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId }),
  });
  try {
    return await res.json();
  } catch {
    return { error: 'Ugyldigt svar fra serveren' };
  }
}
