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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shops...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedClient>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                  Shop Connections
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your WooCommerce shop connections
                </p>
              </div>
              <button
                onClick={() => router.push('/connections/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add New Shop
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
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
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shops.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No shops connected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first WooCommerce shop.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/connections/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
    try {
      setSyncing(true);
      setSyncResult(null);
      setSyncLogs([]);
      setSyncProgress(0);
      setShowSyncLogs(true);

      addSyncLog('🚀 Starting product synchronization...');
      setSyncProgress(10);

      addSyncLog('📡 Sending sync request to API...');
      setSyncProgress(20);

      const response = await fetch('/api/shops/sync', {
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
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
              {shop.name}
            </h3>
            <p className="mt-1 text-sm text-gray-500 truncate">{shop.url}</p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Status Badge */}
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(shop.status)}`}
            >
              {shop.status}
            </span>
          </div>
        </div>

        {shop.lastConnectionCheckAt && (
          <div className="mt-3 text-xs text-gray-500">
            Last tested: {new Date(shop.lastConnectionCheckAt).toLocaleString()}
          </div>
        )}

        {/* Test Progress Bar */}
        {testing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Testing connection...</span>
              <span>{testProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${testProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Sync Progress Bar */}
        {syncing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Synchronizing products...</span>
              <span>{syncProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${syncProgress}%` }}
              ></div>
            </div>
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
            className={`mt-3 p-3 rounded-md text-sm ${
              testResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {testResult.success ? (
              <div>
                <p className="font-medium">✓ Connection successful</p>
                {testResult.details && (
                  <ul className="mt-1 text-xs space-y-1">
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
              <p>✗ {testResult.error}</p>
            )}
          </div>
        )}

        {syncResult && !syncing && (
          <div
            className={`mt-3 p-3 rounded-md text-sm ${
              syncResult.success
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {syncResult.success ? (
              <div>
                <p className="font-medium">✓ {syncResult.message}</p>
                {syncResult.details && (
                  <ul className="mt-1 text-xs space-y-1">
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
                      <li className="text-yellow-600">
                        ⚠️ {syncResult.details.errors.length} warnings
                      </li>
                    )}
                  </ul>
                )}
              </div>
            ) : (
              <p>✗ {syncResult.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="flex space-x-2">
          <button
            onClick={testConnection}
            disabled={testing || syncing}
            className={`flex-1 py-2 px-3 border rounded-md shadow-sm text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors ${
              testing
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {testing ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600"
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
            className={`flex-1 py-2 px-3 border rounded-md shadow-sm text-sm leading-4 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors ${
              syncing
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {syncing ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600"
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
            className="flex-1 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
