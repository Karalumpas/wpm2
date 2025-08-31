'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
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
  const common = 'px-2 py-0.5 text-xs rounded-full border';
  switch (job.status) {
    case 'queued':
      return (
        <span
          className={`${common} bg-amber-50 text-amber-800 border-amber-200`}
        >
          Kø
        </span>
      );
    case 'running':
      return (
        <span className={`${common} bg-blue-50 text-blue-800 border-blue-200`}>
          Kører
        </span>
      );
    case 'paused':
      return (
        <span className={`${common} bg-gray-100 text-gray-700 border-gray-200`}>
          Pauset
        </span>
      );
    case 'completed':
      return (
        <span
          className={`${common} bg-emerald-50 text-emerald-800 border-emerald-200`}
        >
          Færdig
        </span>
      );
    case 'failed':
      return (
        <span className={`${common} bg-rose-50 text-rose-800 border-rose-200`}>
          Fejlet
        </span>
      );
  }
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function JobCard({ job, onChange }: { job: SyncJob; onChange: () => void }) {
  const last = job.progress?.[job.progress.length - 1];
  const icon =
    job.status === 'failed' ? (
      <CircleAlert className="h-4 w-4 text-rose-600" />
    ) : job.status === 'completed' ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    ) : (
      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
    );
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <div className="text-sm font-semibold text-gray-900">
            {job.shopName || `Shop: ${job.shopId.slice(0, 8)}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge job={job} />
          {job.status === 'running' && (
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
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
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
              onClick={async () => {
                await controlSyncJob(job.id, 'resume');
                onChange();
              }}
            >
              <Play className="h-3.5 w-3.5" /> Genoptag
            </button>
          )}
          {(job.status === 'running' ||
            job.status === 'queued' ||
            job.status === 'paused') && (
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50 text-rose-600 border-rose-200"
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
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
        <div>Enqueued: {formatTime(job.enqueuedAt as Date)}</div>
        <div>Start: {formatTime(job.startedAt as Date | undefined)}</div>
        <div>Slut: {formatTime(job.finishedAt as Date | undefined)}</div>
        <div className="truncate">{job.message || ''}</div>
      </div>
      {last && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="font-medium capitalize">{last.stage}</div>
            <div className="text-gray-700">
              {last.current}/{last.total}
            </div>
          </div>
          <ProgressBar current={last.current} total={last.total} />
          <div className="text-xs text-gray-700 truncate" title={last.message}>
            {last.message}
          </div>
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
  const { jobs, isLoading, error, refresh } = useSyncJobs();
  const { data: shopsData } = useSWR<{
    shops: Array<{ id: string; name: string; count: number }>;
  }>(
    '/api/shops',
    async (url) => {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load shops');
      return res.json();
    },
    { revalidateOnFocus: false }
  );

  const [starting, setStarting] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string | ''>('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const ordered = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const order = (s: SyncJob['status']) =>
        s === 'running' ? 0 : s === 'queued' ? 1 : s === 'failed' ? 2 : 3;
      const byStatus = order(a.status) - order(b.status);
      if (byStatus !== 0) return byStatus;
      const at = (x?: Date) => (x ? x.getTime() : 0);
      return (
        at(b.startedAt as Date | undefined) -
        at(a.startedAt as Date | undefined)
      );
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
      if ('error' in res)
        alert(`Kunne ikke starte synkronisering: ${res.error}`);
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
      if ('error' in res)
        alert(`Kunne ikke starte synkronisering: ${res.error}`);
      await refresh();
    } finally {
      setStarting(false);
    }
  }

  return (
    <div
      className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:flex-col border-l bg-white"
      style={{ width: collapsed ? '4rem' : '16rem' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-5 w-5 text-indigo-600" />
          {!collapsed && (
            <h2 className="text-sm font-semibold text-gray-900">Synk</h2>
          )}
        </div>
        <button
          className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white hover:bg-gray-50"
          onClick={onToggleCollapse}
          title={collapsed ? 'Udvid menu' : 'Skjul menu'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!collapsed && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleStartAll}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110 disabled:opacity-60"
                disabled={starting}
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start (alle)
              </button>
              <select
                className="px-2.5 py-2 border rounded-md bg-white text-gray-900"
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
              >
                <option value="">Vælg shop…</option>
                {shopsData?.shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartSingle}
                disabled={!selectedShop || starting}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-900"
              >
                <Play className="h-4 w-4" /> Start
              </button>
              <button
                onClick={() => refresh()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-900"
              >
                <RefreshCcw className="h-4 w-4" /> Opdater
              </button>
            </div>

            {error && (
              <div className="text-xs text-rose-700">
                Fejl ved hentning af jobstatus: {String(error)}
              </div>
            )}

            {isLoading && jobs.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-700 text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Henter status…
              </div>
            ) : (
              <div className="grid gap-2">
                {ordered.length === 0 ? (
                  <div className="text-xs text-gray-700">
                    Ingen job endnu. Start en synk for at se status.
                  </div>
                ) : (
                  ordered.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className={`rounded-lg ${selectedJob?.id === job.id ? 'ring-2 ring-indigo-400' : ''}`}
                    >
                      <JobCard job={job} onChange={refresh} />
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedJob && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-semibold text-gray-900">
                    Job log:{' '}
                    {selectedJob.shopName || selectedJob.shopId.slice(0, 8)}
                  </div>
                  {(selectedJob.status === 'completed' ||
                    selectedJob.status === 'failed' ||
                    selectedJob.status === 'paused' ||
                    selectedJob.status === 'queued') && (
                    <button
                      className="inline-flex items-center gap-2 px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-900 text-xs"
                      onClick={async () => {
                        const r = await removeSyncJob(selectedJob.id);
                        if (!('error' in r)) {
                          await refresh();
                          setSelectedJobId(null);
                        }
                      }}
                    >
                      Fjern job
                    </button>
                  )}
                </div>
                <div className="h-40 w-full bg-[#0b1020] text-[#d1e7ff] rounded-lg border border-[#1f2742] font-mono text-[11px] p-2 overflow-auto shadow-inner">
                  {(selectedJob.logs || []).slice(-400).map((line, idx) => (
                    <div key={idx} className="whitespace-pre">
                      {line}
                    </div>
                  ))}
                  {(!selectedJob.logs || selectedJob.logs.length === 0) && (
                    <div className="text-[#8aa4cf]">Ingen log endnu.</div>
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
