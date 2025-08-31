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
  X,
  Play,
  CircleAlert,
  CheckCircle2,
  Loader2,
  Pause,
  Square,
} from 'lucide-react';

function formatTime(d?: Date) {
  if (!d) return '-';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

function statusBadge(job: SyncJob) {
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
  const lastProgress =
    job.progress && job.progress.length
      ? job.progress[job.progress.length - 1]
      : undefined;
  const isRunning = job.status === 'running' || job.status === 'queued';
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
            {job.shopName || `Shop: ${job.shopId.slice(0, 8)}…`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(job)}
          {job.status === 'running' && (
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
              onClick={async () => {
                await controlSyncJob(job.id, 'pause');
                onChange();
              }}
              title="Pause"
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
              title="Genoptag"
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
              title="Stop"
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
        <div className="truncate">
          {job.message ?? (isRunning ? 'Arbejder…' : '')}
        </div>
      </div>

      {lastProgress && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="font-medium capitalize">{lastProgress.stage}</div>
            <div className="text-gray-700">
              {lastProgress.current}/{lastProgress.total}
            </div>
          </div>
          <ProgressBar
            current={lastProgress.current}
            total={lastProgress.total}
          />
          <div
            className="text-xs text-gray-700 truncate"
            title={lastProgress.message}
          >
            {lastProgress.message}
          </div>
        </div>
      )}
    </div>
  );
}

export function SyncCenter() {
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
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
  const [selectedShop, setSelectedShop] = useState<string | ''>('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const ordered = useMemo(() => {
    // running/queued first, then recent
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

  const handleStartAll = async () => {
    try {
      setStarting(true);
      const res = await startBackgroundSync();
      if ('error' in res) {
        alert(`Kunne ikke starte synkronisering: ${res.error}`);
      }
      await refresh();
    } finally {
      setStarting(false);
    }
  };
  const handleStartSingle = async () => {
    if (!selectedShop) return;
    try {
      setStarting(true);
      const res = await startBackgroundSync(selectedShop);
      if ('error' in res) {
        alert(`Kunne ikke starte synkronisering: ${res.error}`);
      }
      await refresh();
    } finally {
      setStarting(false);
    }
  };

  return (
    <>
      {/* Collapsible right sidebar (no overlay) */}
      <div
        className={`fixed right-0 top-16 bottom-0 z-40 transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-[calc(100%-42px)]'
        }`}
        style={{ width: 560 }}
        aria-expanded={open}
        aria-label="Synkronisering sidebar"
      >
        {/* Panel */}
        <div className="h-full w-full bg-white shadow-xl border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-white/90">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">
                Synkronisering
              </h2>
            </div>
            <button
              aria-label={open ? 'Skjul sidebar' : 'Vis sidebar'}
              onClick={() => setOpen((o) => !o)}
              className="h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-5 overflow-auto">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleStartAll}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={starting}
              >
                {starting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Start synk (alle shops)
              </button>
              <div className="flex items-center gap-2">
                <select
                  className="px-2.5 py-2 border rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-900 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <Play className="h-4 w-4" /> Start for shop
                </button>
              </div>
              <button
                onClick={() => refresh()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <RefreshCcw className="h-4 w-4" /> Opdater
              </button>
            </div>

            {error && (
              <div className="text-sm text-rose-700">
                Fejl ved hentning af jobstatus: {error}
              </div>
            )}

            {isLoading && jobs.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-700 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Henter status…
              </div>
            ) : (
              <div className="grid gap-3">
                {ordered.length === 0 ? (
                  <div className="text-sm text-gray-700">
                    Ingen job endnu. Start en synk for at se status.
                  </div>
                ) : (
                  ordered.map((job) => (
                    <div
                      key={job.id}
                      className={`rounded-lg ${selectedJob?.id === job.id ? 'ring-2 ring-indigo-400' : ''}`}
                      onClick={() => setSelectedJobId(job.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <JobCard job={job} onChange={refresh} />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Terminal-like log viewer for selected job */}
            {selectedJob && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">
                    Job log:{' '}
                    {selectedJob.shopName || selectedJob.shopId.slice(0, 8)}
                  </div>
                  <div className="flex items-center gap-2">
                    {(selectedJob.status === 'completed' ||
                      selectedJob.status === 'failed' ||
                      selectedJob.status === 'paused' ||
                      selectedJob.status === 'queued') && (
                      <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 text-gray-900"
                        onClick={async () => {
                          const r = await removeSyncJob(selectedJob.id);
                          if (!('error' in r)) {
                            await refresh();
                            setSelectedJobId(null);
                          }
                        }}
                        title="Fjern job fra liste"
                      >
                        Fjern job
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-48 sm:h-64 w-full bg-[#0b1020] text-[#d1e7ff] rounded-lg border border-[#1f2742] font-mono text-xs p-3 overflow-auto shadow-inner">
                  {(selectedJob.logs || []).slice(-400).map((line, idx) => (
                    <div key={idx} className="whitespace-pre">
                      {line}
                    </div>
                  ))}
                  {(!selectedJob.logs || selectedJob.logs.length === 0) && (
                    <div className="text-[#8aa4cf]">Ingen log endnu…</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toggle handle */}
        <button
          aria-label={open ? 'Skjul synkronisering' : 'Åbn synkronisering'}
          onClick={() => setOpen((o) => !o)}
          className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 h-10 w-10 rounded-l-md bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-lg flex items-center justify-center"
          title="Synkronisering"
        >
          <RefreshCcw className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

export default SyncCenter;
