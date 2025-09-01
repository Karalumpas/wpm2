'use client';

import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import {
  useSyncJobs,
  startBackgroundSync,
  controlSyncJob,
  removeSyncJob,
  type SyncJob,
} from '@/hooks/useSyncJobs';
import {
  RefreshCcw,
  Pause,
  Play,
  Square,
  CheckCircle2,
  CircleAlert,
  Loader2,
} from 'lucide-react';

function formatTime(d?: Date) {
  if (!d) return '-';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

function StatusBadge({ job }: { job: SyncJob }) {
  const common = 'px-3 py-1.5 text-xs rounded-xl border font-medium shadow-sm';
  switch (job.status) {
    case 'queued':
      return (
        <span
          className={`${common} bg-amber-50 text-amber-800 border-amber-200`}
        >
          Queued
        </span>
      );
    case 'running':
      return (
        <span className={`${common} bg-blue-50 text-blue-800 border-blue-200`}>
          Running
        </span>
      );
    case 'paused':
      return (
        <span
          className={`${common} bg-slate-100 text-slate-700 border-slate-200`}
        >
          Paused
        </span>
      );
    case 'completed':
      return (
        <span
          className={`${common} bg-emerald-50 text-emerald-800 border-emerald-200`}
        >
          Completed
        </span>
      );
    case 'failed':
      return (
        <span className={`${common} bg-rose-50 text-rose-800 border-rose-200`}>
          Failed
        </span>
      );
  }
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SyncJobCard({
  job,
  onChange,
  last,
}: {
  job: SyncJob;
  onChange: () => void;
  last?: {
    productsSynced: number;
    totalProducts: number;
    categoriesSynced: number;
    totalCategories: number;
  };
}) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-900">
            {job.shopName || `Shop: ${job.shopId.slice(0, 8)}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge job={job} />
          {job.status === 'running' && (
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 text-xs font-medium shadow-sm"
              onClick={async () => {
                await controlSyncJob(job.id, 'pause');
                onChange();
              }}
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          {job.status === 'paused' && (
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-xs font-medium shadow-sm"
              onClick={async () => {
                await controlSyncJob(job.id, 'resume');
                onChange();
              }}
            >
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          )}
          {(job.status === 'running' ||
            job.status === 'queued' ||
            job.status === 'paused') && (
            <button
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 transition-all duration-200 text-xs font-medium shadow-sm"
              onClick={async () => {
                await controlSyncJob(job.id, 'cancel');
                onChange();
              }}
            >
              <Square className="h-3.5 w-3.5" /> Stop
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div className="space-y-1">
          <div>
            <span className="font-medium">Enqueued:</span>{' '}
            {formatTime(job.enqueuedAt as Date)}
          </div>
          <div>
            <span className="font-medium">Started:</span>{' '}
            {formatTime(job.startedAt as Date | undefined)}
          </div>
        </div>
        <div className="space-y-1">
          <div>
            <span className="font-medium">Finished:</span>{' '}
            {formatTime(job.finishedAt as Date | undefined)}
          </div>
          <div className="truncate">
            <span className="font-medium">Status:</span>{' '}
            {job.message || 'No message'}
          </div>
        </div>
      </div>

      {last && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              Products Progress
            </span>
            <span className="text-slate-600">
              {last.productsSynced} / {last.totalProducts}
            </span>
          </div>
          <ProgressBar
            current={last.productsSynced}
            total={last.totalProducts}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              Categories Progress
            </span>
            <span className="text-slate-600">
              {last.categoriesSynced} / {last.totalCategories}
            </span>
          </div>
          <ProgressBar
            current={last.categoriesSynced}
            total={last.totalCategories}
          />
        </div>
      )}
    </div>
  );
}

export default function SyncSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  // Always poll for sync jobs, but adjust intervals based on sidebar state
  const { jobs, refresh, error } = useSyncJobs(undefined, { sidebarCollapsed: collapsed });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState('');
  const [starting, setStarting] = useState(false);
  
  // Check if there are any active jobs that need monitoring
  const hasActiveJobs = jobs.some(job => 
    job.status === 'running' || job.status === 'queued'
  );
  
  // Force a refresh when sidebar is expanded after being collapsed
  useEffect(() => {
    if (!collapsed) {
      refresh();
    }
  }, [collapsed, refresh]);

  const { data: shopsData } = useSWR<{
    shops: Array<{ id: string; name: string }>;
  }>('/api/shops', async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

  const ordered = useMemo(() => {
    return [...jobs]
      .sort((a, b) => {
        if (a.status === 'running' && b.status !== 'running') return -1;
        if (b.status === 'running' && a.status !== 'running') return 1;
        return (
          new Date(b.enqueuedAt).getTime() - new Date(a.enqueuedAt).getTime()
        );
      })
      .map((job) => {
        const logs = job.logs || [];
        const last = logs
          .slice(-30)
          .map((line) => {
            const productMatch = line.match(/synced (\d+)\/(\d+) products/i);
            const categoryMatch = line.match(/synced (\d+)\/(\d+) categories/i);
            return {
              productsSynced: productMatch ? parseInt(productMatch[1]) : 0,
              totalProducts: productMatch ? parseInt(productMatch[2]) : 0,
              categoriesSynced: categoryMatch ? parseInt(categoryMatch[1]) : 0,
              totalCategories: categoryMatch ? parseInt(categoryMatch[2]) : 0,
            };
          })
          .reduce(
            (acc, cur) => ({
              productsSynced: Math.max(acc.productsSynced, cur.productsSynced),
              totalProducts: Math.max(acc.totalProducts, cur.totalProducts),
              categoriesSynced: Math.max(
                acc.categoriesSynced,
                cur.categoriesSynced
              ),
              totalCategories: Math.max(
                acc.totalCategories,
                cur.totalCategories
              ),
            }),
            {
              productsSynced: 0,
              totalProducts: 0,
              categoriesSynced: 0,
              totalCategories: 0,
            }
          );
        return { ...job, last };
      });
  }, [jobs]);

  const selectedJob =
    ordered.find((j) => j.id === selectedJobId) ||
    ordered.find((j) => j.status === 'running') ||
    ordered[0];

  async function handleStartAll() {
    try {
      setStarting(true);
      const res = await startBackgroundSync();
      if ('error' in res) alert(`Could not start sync: ${res.error}`);
      await refresh();
    } finally {
      setStarting(false);
    }
  }

  async function handleStartSingle() {
    if (!selectedShop) return;
    try {
      setStarting(true);
      const res = await startBackgroundSync(selectedShop);
      if ('error' in res) alert(`Could not start sync: ${res.error}`);
      await refresh();
    } finally {
      setStarting(false);
    }
  }

  return (
    <div
      className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 backdrop-blur-md border-l border-slate-200 shadow-xl"
      style={{ width: collapsed ? '4rem' : '20rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md">
            <RefreshCcw className="h-5 w-5" />
          </div>
          {!collapsed && (
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Sync Center
            </h2>
          )}
        </div>
        <button
          className={cn(
            "hidden lg:inline-flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md relative",
            hasActiveJobs 
              ? "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700" 
              : "bg-white hover:bg-slate-50 border-slate-200"
          )}
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sync center' : 'Collapse sync center'}
        >
          {hasActiveJobs && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
          )}
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!collapsed && (
          <div className="space-y-4">
            {/* Control Panel */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Sync Controls
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleStartAll}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 font-medium"
                  disabled={starting}
                >
                  {starting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Start All Shops
                </button>

                <div className="space-y-2">
                  <select
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300"
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                  >
                    <option value="">Select Shop...</option>
                    {shopsData?.shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleStartSingle}
                      disabled={!selectedShop || starting}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm disabled:opacity-60 text-sm font-medium"
                    >
                      <Play className="h-4 w-4" /> Start
                    </button>
                    <button
                      onClick={() => refresh()}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm text-sm font-medium"
                    >
                      <RefreshCcw className="h-4 w-4" /> Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Jobs List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Active Jobs
              </h3>
              {ordered.length === 0 ? (
                <div className="bg-white/60 rounded-2xl border border-slate-200 p-6 text-center text-slate-500 text-sm">
                  No sync jobs running
                </div>
              ) : (
                ordered
                  .slice(0, 3)
                  .map((job) => (
                    <SyncJobCard
                      key={job.id}
                      job={job}
                      onChange={refresh}
                      last={job.last}
                    />
                  ))
              )}
            </div>

            {/* Job Details */}
            {selectedJob && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-slate-900">
                    Job Details:{' '}
                    {selectedJob.shopName || selectedJob.shopId.slice(0, 8)}
                  </div>
                  {(selectedJob.status === 'completed' ||
                    selectedJob.status === 'failed' ||
                    selectedJob.status === 'paused' ||
                    selectedJob.status === 'queued') && (
                    <button
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 transition-all duration-200 text-xs font-medium shadow-sm"
                      onClick={async () => {
                        const r = await removeSyncJob(selectedJob.id);
                        if (!('error' in r)) {
                          await refresh();
                          setSelectedJobId(null);
                        }
                      }}
                    >
                      Remove Job
                    </button>
                  )}
                </div>
                <div className="h-40 w-full bg-slate-900 text-blue-100 rounded-xl border border-slate-300 font-mono text-xs p-3 overflow-auto shadow-inner">
                  {(selectedJob.logs || []).slice(-400).map((line, idx) => (
                    <div key={idx} className="whitespace-pre-wrap break-words">
                      {line}
                    </div>
                  ))}
                  {(!selectedJob.logs || selectedJob.logs.length === 0) && (
                    <div className="text-slate-400">No logs yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
