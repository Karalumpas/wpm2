'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';

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
  const timestamp = new Date().toLocaleTimeString();
  console.debug(`🔄 [${timestamp}] Polling sync jobs: ${url.includes('jobId') ? 'specific job' : 'all jobs'}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  
  // Log active jobs for debugging
  const jobs = 'jobs' in data ? data.jobs : [data];
  const activeJobs = jobs.filter((job: SyncJob) => job.status === 'running' || job.status === 'queued');
  if (activeJobs.length > 0) {
    console.debug(`🏃 Active jobs: ${activeJobs.length}/${jobs.length}`);
  }
  
  return data;
}

export function useSyncJobs(jobId?: string, uiContext?: { sidebarCollapsed?: boolean }) {
  const [isTabActive, setIsTabActive] = useState(true);

  // Monitor tab visibility to pause polling when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<JobsResponse>(
    isTabActive 
      ? (jobId
          ? `/api/shops/sync/background?jobId=${encodeURIComponent(jobId)}`
          : '/api/shops/sync/background')
      : null, // null disables SWR completely when tab is not active
    fetcher,
    {
      refreshInterval: (data) => {
        // Don't poll when tab is not active
        if (!isTabActive) return 0;
        
        // Dynamic refresh interval based on job status
        if (!data) return 8000; // Initial load - 8 seconds
        
        const jobs = 'jobs' in data ? data.jobs : [data as SyncJob];
        const hasActiveJobs = jobs.some(job => 
          job.status === 'running' || job.status === 'queued'
        );
        
        // If there are active jobs, poll frequently regardless of UI state
        if (hasActiveJobs) {
          return 3000; // Active jobs - always check every 3 seconds
        }
        
        // If no jobs at all, poll very infrequently
        if (jobs.length === 0) {
          return uiContext?.sidebarCollapsed ? 120000 : 60000; // 2 min if collapsed, 1 min if expanded
        }
        
        // Check if there are recent jobs (less than 5 minutes old)
        const hasRecentJobs = jobs.some(job => {
          const enqueuedTime = new Date(job.enqueuedAt).getTime();
          const now = Date.now();
          return now - enqueuedTime < 5 * 60 * 1000; // Less than 5 minutes ago
        });
        
        if (hasRecentJobs) {
          return uiContext?.sidebarCollapsed ? 30000 : 15000; // Longer interval when collapsed
        } else {
          return uiContext?.sidebarCollapsed ? 120000 : 60000; // Much longer when collapsed
        }
      },
      revalidateOnFocus: true, // Re-enable to refresh when tab becomes active
      revalidateOnReconnect: false,
      dedupingInterval: 3000, // Longer deduping interval
    }
  );

  let jobs: SyncJob[] = [];
  if (data) {
    if ('jobs' in data) jobs = data.jobs;
    else jobs = [data as SyncJob];
  }

  // Calculate if we have any meaningful activity
  const hasJobs = jobs.length > 0;
  const hasActiveJobs = jobs.some(job => 
    job.status === 'running' || job.status === 'queued'
  );
  const hasRecentJobs = jobs.some(job => {
    const enqueuedTime = new Date(job.enqueuedAt).getTime();
    const now = Date.now();
    return now - enqueuedTime < 5 * 60 * 1000; // Less than 5 minutes ago
  });

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
