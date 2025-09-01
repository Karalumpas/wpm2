'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { ShopResponse } from '@/lib/validation/shops';
import { ProtectedClient } from '@/components/auth/ProtectedClient';

export default function ConnectionsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<ShopResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch shops
  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shops');

      if (!response.ok) {
        throw new Error('Failed to fetch shops');
      }

      const data = await response.json();
      console.log('API response:', data); // Debug log
      setShops(Array.isArray(data) ? data : data.shops || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedClient>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100/50 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Shop Connections
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Manage your WooCommerce shop connections
                  </p>
                </div>
                <button
                  onClick={() => router.push('/connections/new')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  Add New Shop
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          {error && (
            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-red-100/50 p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <svg
                    className="h-5 w-5 text-red-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-900">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {shops.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100/50 p-12">
              <div className="text-center">
                <div className="p-4 bg-gray-100 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No shops connected
                </h3>
                <p className="text-gray-600 mb-8">
                  Get started by adding your first WooCommerce shop.
                </p>
                <button
                  onClick={() => router.push('/connections/new')}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  Add Shop
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} onUpdate={fetchShops} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedClient>
  );
}

interface ShopCardProps {
  shop: ShopResponse;
  onUpdate: () => void;
}

function ShopCard({ shop, onUpdate }: ShopCardProps) {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    details?: {
      reachable?: boolean;
      auth?: boolean;
      productsOk?: boolean;
      elapsedMs?: number;
    };
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      productsCreated: number;
      productsUpdated: number;
      categoriesCreated: number;
      categoriesUpdated: number;
      variationsCreated: number;
      variationsUpdated: number;
      errors: string[];
    };
  } | null>(null);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [testProgress, setTestProgress] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showTestLogs, setShowTestLogs] = useState(false);
  const [showSyncLogs, setShowSyncLogs] = useState(false);
  const [shouldUpdateOnClose, setShouldUpdateOnClose] = useState(false);
  const [syncJobId, setSyncJobId] = useState<string | null>(null);
  const progressSeenRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const addTestLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const addSyncLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSyncLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const copyToClipboard = async (logs: string[]) => {
    try {
      const content = logs.join('\n');
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setTestLogs([]);
      setTestProgress(0);
      setShowTestLogs(true);

      addTestLog('🔍 Starting connection test...');
      setTestProgress(10);

      addTestLog('📡 Sending test request to API...');
      setTestProgress(25);

      const response = await fetch(`/api/shops/${shop.id}/test`, {
        method: 'POST',
      });

      addTestLog(
        `📊 Received response: ${response.status} ${response.statusText}`
      );
      setTestProgress(50);

      if (!response.ok) {
        const errorText = await response.text();
        addTestLog(`❌ API Error: ${errorText}`);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      addTestLog('📋 Parsing response data...');
      setTestProgress(75);

      const result = await response.json();
      console.log('Test connection result:', result); // Debug log

      addTestLog('✅ Response parsed successfully');
      setTestProgress(90);

      if (result.success) {
        addTestLog('🎉 Connection test successful!');
        if (result.details) {
          addTestLog(
            `📈 Details: WordPress=${result.details.reachable ? '✅' : '❌'}, WooCommerce=${result.details.auth ? '✅' : '❌'}, Products=${result.details.productsOk ? '✅' : '❌'}`
          );
          addTestLog(`⏱️ Response time: ${result.details.elapsedMs}ms`);
        }
        addTestLog('ℹ️ Terminal will stay open - click "Hide" when ready');
        setShouldUpdateOnClose(true); // Mark that we should update when terminal closes
      } else {
        addTestLog(`❌ Connection failed: ${result.error || 'Unknown error'}`);
      }

      setTestResult(result);
      setTestProgress(100);

      // Mark that we should update when user manually closes terminal
      if (result.success) {
        setShouldUpdateOnClose(true);
      }
    } catch (err) {
      console.error('Test connection error:', err); // Debug log
      addTestLog(
        `💥 Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
      setTestProgress(100);
    } finally {
      setTesting(false);
    }
  };

  const syncProducts = async () => {
    let handedOff = false;
    try {
      setSyncing(true);
      setSyncResult(null);
      setSyncLogs([]);
      setSyncProgress(0);
      setShowSyncLogs(true);
      setSyncJobId(null);
      progressSeenRef.current = 0;

      addSyncLog('🚀 Starting product synchronization...');
      setSyncProgress(10);

      addSyncLog('📡 Sending sync request to API...');
      setSyncProgress(20);

      const response = await fetch('/api/shops/sync/background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shopId: shop.id }),
      });

      addSyncLog(
        `📊 Received response: ${response.status} ${response.statusText}`
      );
      setSyncProgress(30);

      if (!response.ok) {
        const errorText = await response.text();
        addSyncLog(`❌ API Error: ${errorText}`);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      addSyncLog('📋 Parsing response data...');
      setSyncProgress(40);

      const result = await response.json();
      if (
        result &&
        result.accepted &&
        Array.isArray(result.jobs) &&
        result.jobs[0]
      ) {
        const jobId = result.jobs[0] as string;
        setSyncJobId(jobId);
        addSyncLog(`✅ Job enqueued: ${jobId}`);
        const poll = async () => {
          try {
            const res = await fetch(
              `/api/shops/sync/background?jobId=${encodeURIComponent(jobId)}`
            );
            if (!res.ok) return;
            const job = await res.json();
            const progress = Array.isArray(job.progress) ? job.progress : [];
            if (progress.length > progressSeenRef.current) {
              const newItems = progress.slice(progressSeenRef.current);
              newItems.forEach(
                (p: {
                  stage: string;
                  current: number;
                  total: number;
                  message: string;
                }) =>
                  addSyncLog(
                    `[${p.stage}] ${p.current}/${p.total} - ${p.message}`
                  )
              );
              progressSeenRef.current = progress.length;
            }
            if (progress.length > 0) {
              const last = progress[progress.length - 1];
              const pct = Math.max(
                0,
                Math.min(
                  99,
                  Math.round(
                    (Number(last.current) /
                      Math.max(Number(last.total) || 1, 1)) *
                      100
                  )
                )
              );
              setSyncProgress(pct);
            }
            if (job.status === 'completed' || job.status === 'failed') {
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              setSyncProgress(100);
              const details = job.details || {};
              const errors = Array.isArray(details.errors)
                ? details.errors
                : [];
              setSyncResult({
                success: job.status === 'completed',
                message:
                  job.message ||
                  (job.status === 'completed'
                    ? 'Sync completed'
                    : job.error || 'Sync failed'),
                details: {
                  productsCreated: Number(details.productsCreated || 0),
                  productsUpdated: Number(details.productsUpdated || 0),
                  categoriesCreated: Number(details.categoriesCreated || 0),
                  categoriesUpdated: Number(details.categoriesUpdated || 0),
                  variationsCreated: Number(details.variationsCreated || 0),
                  variationsUpdated: Number(details.variationsUpdated || 0),
                  errors,
                },
              });
              if (job.status === 'completed')
                addSyncLog('✅ Synchronization completed');
              else
                addSyncLog(
                  `❌ Synchronization failed: ${job.error || 'Unknown error'}`
                );
              setSyncing(false);
              setShouldUpdateOnClose(true);
            }
          } catch {}
        };
        await poll();
        pollTimerRef.current = setInterval(poll, 2000);
        handedOff = true;
        return;
      }
      console.log('Sync result:', result); // Debug log

      addSyncLog('✅ Response parsed successfully');
      setSyncProgress(60);

      if (result.success) {
        addSyncLog('🎉 Product synchronization completed!');
        if (result.details) {
          addSyncLog(`📈 Summary:`);
          addSyncLog(
            `  📦 Products: ${result.details.productsCreated} created, ${result.details.productsUpdated} updated`
          );
          addSyncLog(
            `  📂 Categories: ${result.details.categoriesCreated} created, ${result.details.categoriesUpdated} updated`
          );
          addSyncLog(
            `  🎨 Variations: ${result.details.variationsCreated} created, ${result.details.variationsUpdated} updated`
          );

          if (result.details.errors && result.details.errors.length > 0) {
            addSyncLog(`⚠️ Errors encountered:`);
            result.details.errors.forEach((error: string) => {
              addSyncLog(`  ❌ ${error}`);
            });
          }
        }
        addSyncLog('ℹ️ Sync completed - click "Hide" when ready');
        setShouldUpdateOnClose(true);
      } else {
        addSyncLog(
          `❌ Synchronization failed: ${result.message || 'Unknown error'}`
        );
        if (result.details?.errors) {
          result.details.errors.forEach((error: string) => {
            addSyncLog(`  💥 ${error}`);
          });
        }
      }

      setSyncResult(result);
      setSyncProgress(100);
    } catch (err) {
      console.error('Sync error:', err); // Debug log
      addSyncLog(
        `💥 Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      setSyncResult({
        success: false,
        message: err instanceof Error ? err.message : 'Sync failed',
      });
      setSyncProgress(100);
    } finally {
      if (!handedOff) setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {shop.name}
            </h3>
            <p className="mt-1 text-sm text-gray-600 truncate">{shop.url}</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Status Badge */}
            {shop.status === 'active' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Active
              </span>
            ) : shop.status === 'error' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 font-medium text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 font-medium text-sm">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Inactive
              </span>
            )}
          </div>
        </div>

        {shop.lastConnectionCheckAt && (
          <div className="mt-4 text-sm text-gray-500">
            Last tested: {new Date(shop.lastConnectionCheckAt).toLocaleString()}
          </div>
        )}

        {/* Test Progress Bar */}
        {testing && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium">Testing connection...</span>
              <span className="font-mono">{testProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${testProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Sync Progress Bar */}
        {syncing && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium">Synchronizing products...</span>
              <span className="font-mono">{syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-emerald-600 to-green-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
            {syncJobId && (
              <div className="mt-2 text-xs text-gray-500 font-mono">
                Job: {syncJobId}
              </div>
            )}
          </div>
        )}

        {/* Terminal Log Window */}
        {showTestLogs && testLogs.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Test Log</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(testLogs)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={() => {
                    setShowTestLogs(false);
                    if (shouldUpdateOnClose) {
                      onUpdate(); // Update shops list if test was successful
                      setShouldUpdateOnClose(false);
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="font-mono text-xs space-y-1">
                {testLogs.map((log, index) => (
                  <div
                    key={index}
                    className={
                      log.includes('❌') || log.includes('💥')
                        ? 'text-red-400'
                        : log.includes('✅') || log.includes('🎉')
                          ? 'text-green-400'
                          : log.includes('📡') || log.includes('📊')
                            ? 'text-blue-400'
                            : 'text-gray-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
              {testing && (
                <div className="mt-2 flex items-center text-gray-400">
                  <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-xs">Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sync Log Window */}
        {showSyncLogs && syncLogs.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700">Sync Log</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyToClipboard(syncLogs)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={() => {
                    setShowSyncLogs(false);
                    if (shouldUpdateOnClose) {
                      onUpdate(); // Update shops list if sync was successful
                      setShouldUpdateOnClose(false);
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
              <div className="font-mono text-xs space-y-1">
                {syncLogs.map((log, index) => (
                  <div
                    key={index}
                    className={
                      log.includes('❌') || log.includes('💥')
                        ? 'text-red-400'
                        : log.includes('✅') ||
                            log.includes('🎉') ||
                            log.includes('📦') ||
                            log.includes('📂') ||
                            log.includes('🎨')
                          ? 'text-green-400'
                          : log.includes('📡') ||
                              log.includes('📊') ||
                              log.includes('📈')
                            ? 'text-blue-400'
                            : log.includes('⚠️')
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
              {syncing && (
                <div className="mt-2 flex items-center text-gray-400">
                  <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-2"></div>
                  <span className="text-xs">Synchronizing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {testResult && !testing && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm border ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {testResult.success ? (
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Connection successful
                </p>
                {testResult.details && (
                  <ul className="mt-2 text-xs space-y-1 pl-6">
                    <li>
                      WordPress: {testResult.details.reachable ? '✓' : '✗'}
                    </li>
                    <li>WooCommerce: {testResult.details.auth ? '✓' : '✗'}</li>
                    <li>
                      Products API: {testResult.details.productsOk ? '✓' : '✗'}
                    </li>
                    <li>Response time: {testResult.details.elapsedMs}ms</li>
                  </ul>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {testResult.error}
              </p>
            )}
          </div>
        )}

        {syncResult && !syncing && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm border ${
              syncResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {syncResult.success ? (
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {syncResult.message}
                </p>
                {syncResult.details && (
                  <ul className="mt-2 text-xs space-y-1 pl-6">
                    <li>
                      Products:{' '}
                      {syncResult.details.productsCreated +
                        syncResult.details.productsUpdated}{' '}
                      total
                    </li>
                    <li>
                      Categories:{' '}
                      {syncResult.details.categoriesCreated +
                        syncResult.details.categoriesUpdated}{' '}
                      total
                    </li>
                    <li>
                      Variations:{' '}
                      {syncResult.details.variationsCreated +
                        syncResult.details.variationsUpdated}{' '}
                      total
                    </li>
                    {syncResult.details.errors.length > 0 && (
                      <li className="text-amber-700">
                        ⚠️ {syncResult.details.errors.length} warnings
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {syncResult.message}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-100">
        <div className="flex gap-3">
          <button
            onClick={testConnection}
            disabled={testing || syncing}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              testing
                ? 'bg-blue-100 border border-blue-200 text-blue-700 cursor-not-allowed'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
            }`}
          >
            {testing ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Testing...
              </div>
            ) : (
              'Test Connection'
            )}
          </button>
          <button
            onClick={syncProducts}
            disabled={testing || syncing}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
              syncing
                ? 'bg-emerald-100 border border-emerald-200 text-emerald-700 cursor-not-allowed'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
            }`}
          >
            {syncing ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4 text-emerald-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Syncing...
              </div>
            ) : (
              'Sync Products'
            )}
          </button>
          <button
            onClick={() => window.open(`/connections/${shop.id}/edit`, '_self')}
            disabled={testing || syncing}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
