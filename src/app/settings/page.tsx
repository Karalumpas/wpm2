'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { useSettings } from '@/hooks/useSettings';
import { useEffect } from 'react';
import { ProtectedClient } from '@/components/auth/ProtectedClient';
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_POSITION_OPTIONS,
} from '@/types/settings';

interface DatabaseStats {
  products: number;
  variants: number;
  categories: number;
  brands: number;
  shops: number;
}

interface OperationResult {
  success: boolean;
  message: string;
  affectedRows?: number;
  details?: unknown;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [operationResult, setOperationResult] =
    useState<OperationResult | null>(null);
  const [confirmOperation, setConfirmOperation] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Settings hook
  const {
    settings,
    isLoading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useSettings();
  const [settingsUpdateLoading, setSettingsUpdateLoading] = useState(false);
  const [settingsUpdateResult, setSettingsUpdateResult] = useState<
    string | null
  >(null);

  const handleSettingsUpdate = async (key: string, value: unknown) => {
    try {
      setSettingsUpdateLoading(true);
      setSettingsUpdateResult(null);

      await updateSettings({ [key]: value });
      setSettingsUpdateResult('Settings updated successfully!');
      addLog(`✅ Settings updated: ${key} = ${value}`);

      // Clear success message after 3 seconds
      setTimeout(() => setSettingsUpdateResult(null), 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update settings';
      setSettingsUpdateResult(message);
      addLog(`❌ Failed to update settings: ${message}`);
    } finally {
      setSettingsUpdateLoading(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const copyLogsToClipboard = async () => {
    try {
      const content = logs.join('\n');
      await navigator.clipboard.writeText(content);
      addLog('📋 Logs copied to clipboard');
    } catch (err) {
      addLog('❌ Failed to copy logs to clipboard');
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      addLog('📊 Fetching database statistics...');

      const response = await fetch('/api/settings/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);
      addLog('✅ Database statistics loaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ Failed to fetch stats: ${message}`);
      setOperationResult({ success: false, message });
    } finally {
      setStatsLoading(false);
    }
  };

  const performOperation = async (
    operation: string,
    endpoint: string,
    confirmText: string
  ) => {
    if (confirmOperation !== operation) {
      setConfirmOperation(operation);
      return;
    }

    try {
      setLoading(true);
      setOperationResult(null);
      addLog(`🚀 Starting ${operation}...`);

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      setOperationResult(data);
      addLog(`✅ ${operation} completed successfully`);
      if (data.affectedRows !== undefined) {
        addLog(`📊 Affected rows: ${data.affectedRows}`);
      }

      // Refresh stats after operations
      await fetchStats();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ ${operation} failed: ${message}`);
      setOperationResult({ success: false, message });
    } finally {
      setLoading(false);
      setConfirmOperation(null);
    }
  };

  const operations = [
    {
      id: 'delete-products',
      title: 'Delete All Products',
      description:
        'Removes all products and their variants from the database. This will not affect your WooCommerce stores.',
      endpoint: '/api/settings/delete-products',
      confirmText: 'DELETE ALL PRODUCTS',
      icon: '🗑️',
      danger: true,
    },
    {
      id: 'delete-categories',
      title: 'Delete All Categories',
      description:
        'Removes all categories from the database. This will not affect your WooCommerce stores.',
      endpoint: '/api/settings/delete-categories',
      confirmText: 'DELETE ALL CATEGORIES',
      icon: '📂',
      danger: true,
    },
    {
      id: 'delete-brands',
      title: 'Delete All Brands',
      description: 'Removes all brands from the database.',
      endpoint: '/api/settings/delete-brands',
      confirmText: 'DELETE ALL BRANDS',
      icon: '🏷️',
      danger: true,
    },
    {
      id: 'reset-sync-status',
      title: 'Reset Sync Status',
      description:
        'Resets the last sync timestamps for all products, forcing a full re-sync on next operation.',
      endpoint: '/api/settings/reset-sync-status',
      confirmText: 'RESET SYNC STATUS',
      icon: '🔄',
      danger: false,
    },
    {
      id: 'cleanup-orphaned',
      title: 'Cleanup Orphaned Records',
      description:
        'Removes orphaned product variants, categories, and brand associations.',
      endpoint: '/api/settings/cleanup-orphaned',
      confirmText: 'CLEANUP ORPHANED',
      icon: '🧹',
      danger: false,
    },
    {
      id: 'vacuum-database',
      title: 'Optimize Database',
      description:
        'Runs database optimization and cleanup operations to improve performance.',
      endpoint: '/api/settings/vacuum-database',
      confirmText: 'OPTIMIZE DATABASE',
      icon: '⚡',
      danger: false,
    },
  ];

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
                    Settings
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Manage appearance, database and system settings
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={fetchStats}
                    disabled={statsLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                  >
                    {statsLoading ? '🔄' : '📊'} Refresh Stats
                  </button>
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                  >
                    {showLogs ? 'Hide' : 'Show'} Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            {/* User Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50">
              <div className="p-8 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  User Settings
                </h3>
                <p className="mt-2 text-gray-600">
                  Configure your display preferences and currency settings
                </p>
              </div>

              <div className="p-8 space-y-8">
                {/* Currency Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    Currency Settings
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Currency Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Currency
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => {
                          const selectedCurrency = SUPPORTED_CURRENCIES.find(
                            (c) => c.code === e.target.value
                          );
                          if (selectedCurrency) {
                            handleSettingsUpdate(
                              'currency',
                              selectedCurrency.code
                            );
                            handleSettingsUpdate(
                              'currencySymbol',
                              selectedCurrency.symbol
                            );
                          }
                        }}
                        disabled={settingsLoading || settingsUpdateLoading}
                        className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 disabled:opacity-50"
                      >
                        {SUPPORTED_CURRENCIES.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Currency Position */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Currency Position
                      </label>
                      <select
                        value={settings.currencyPosition}
                        onChange={(e) =>
                          handleSettingsUpdate(
                            'currencyPosition',
                            e.target.value
                          )
                        }
                        disabled={settingsLoading || settingsUpdateLoading}
                        className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 disabled:opacity-50"
                      >
                        {CURRENCY_POSITION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Display Settings */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">
                    Display Settings
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Products per page */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Products per page
                      </label>
                      <select
                        value={settings.productsPerPage}
                        onChange={(e) =>
                          handleSettingsUpdate(
                            'productsPerPage',
                            parseInt(e.target.value)
                          )
                        }
                        disabled={settingsLoading || settingsUpdateLoading}
                        className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 disabled:opacity-50"
                      >
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                        <option value={96}>96</option>
                      </select>
                    </div>

                    {/* Default view mode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Default view mode
                      </label>
                      <select
                        value={settings.defaultViewMode}
                        onChange={(e) =>
                          handleSettingsUpdate(
                            'defaultViewMode',
                            e.target.value
                          )
                        }
                        disabled={settingsLoading || settingsUpdateLoading}
                        className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 disabled:opacity-50"
                      >
                        <option value="grid">Grid</option>
                        <option value="list">List</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Settings Update Result */}
                {settingsUpdateResult && (
                  <div
                    className={`p-4 rounded-xl border ${
                      settingsUpdateResult.includes('successfully')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    <p className="font-medium flex items-center gap-2">
                      {settingsUpdateResult.includes('successfully') ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      {settingsUpdateResult}
                    </p>
                  </div>
                )}

                {settingsError && (
                  <div className="p-4 rounded-xl border bg-red-50 text-red-800 border-red-200">
                    <p className="font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {settingsError}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Database Management */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Appearance */}
              <div className="xl:col-span-2">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Appearance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        Color theme
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(
                          [
                            {
                              id: 'ocean',
                              name: 'Ocean',
                              swatch: ['#1d4ed8', '#2563eb', '#93c5fd'],
                            },
                            {
                              id: 'sunset',
                              name: 'Sunset',
                              swatch: ['#ea580c', '#fb923c', '#fed7aa'],
                            },
                            {
                              id: 'forest',
                              name: 'Forest',
                              swatch: ['#16a34a', '#34d399', '#bbf7d0'],
                            },
                            {
                              id: 'royal',
                              name: 'Royal',
                              swatch: ['#7c3aed', '#a78bfa', '#ddd6fe'],
                            },
                            {
                              id: 'neutral',
                              name: 'Neutral',
                              swatch: ['#3f3f46', '#a1a1aa', '#e4e4e7'],
                            },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            onClick={() => handleSettingsUpdate('theme', t.id)}
                            className={`p-3 rounded-lg border ${settings.theme === t.id ? 'ring-2 ring-indigo-500' : 'hover:bg-gray-50'}`}
                            aria-pressed={settings.theme === t.id}
                          >
                            <div className="flex items-center gap-2">
                              {t.swatch.map((c, i) => (
                                <span
                                  key={i}
                                  className="h-5 w-5 rounded"
                                  style={{ background: c }}
                                />
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-gray-800">
                              {t.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-2">
                        Font
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            { id: 'sans', name: 'Sans-serif' },
                            { id: 'serif', name: 'Serif' },
                            { id: 'mono', name: 'Monospace' },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            onClick={() => handleSettingsUpdate('font', f.id)}
                            className={`px-3 py-2 rounded-md border text-sm ${settings.font === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={!!settings.largeText}
                            onChange={(e) =>
                              handleSettingsUpdate(
                                'largeText',
                                e.target.checked
                              )
                            }
                          />
                          Larger base font
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Database Statistics */}
              <div className="xl:col-span-1">
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Database Statistics
                  </h3>

                  {stats ? (
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Products</dt>
                        <dd>
                          <Badge variant="secondary">
                            {stats.products.toLocaleString()}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">
                          Product Variants
                        </dt>
                        <dd>
                          <Badge variant="secondary">
                            {stats.variants.toLocaleString()}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Categories</dt>
                        <dd>
                          <Badge variant="secondary">
                            {stats.categories.toLocaleString()}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Brands</dt>
                        <dd>
                          <Badge variant="secondary">
                            {stats.brands.toLocaleString()}
                          </Badge>
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">
                          Shop Connections
                        </dt>
                        <dd>
                          <Badge variant="secondary">
                            {stats.shops.toLocaleString()}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Click &quot;Refresh Stats&quot; to load data
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Operations */}
              <div className="xl:col-span-2">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Database Operations
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Perform maintenance and cleanup operations on your
                      database
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {operations.map((operation) => (
                      <div key={operation.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">
                                {operation.icon}
                              </span>
                              <h4 className="text-base font-medium text-gray-900">
                                {operation.title}
                              </h4>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {operation.description}
                            </p>
                          </div>
                          <div className="ml-4">
                            {confirmOperation === operation.id ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-red-600 font-medium">
                                  Type &quot;{operation.confirmText}&quot; to
                                  confirm:
                                </span>
                                <input
                                  type="text"
                                  placeholder={operation.confirmText}
                                  className="text-xs border border-red-300 rounded px-2 py-1 w-32"
                                  onKeyPress={(e) => {
                                    if (
                                      e.key === 'Enter' &&
                                      e.currentTarget.value ===
                                        operation.confirmText
                                    ) {
                                      performOperation(
                                        operation.id,
                                        operation.endpoint,
                                        operation.confirmText
                                      );
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => setConfirmOperation(null)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  performOperation(
                                    operation.id,
                                    operation.endpoint,
                                    operation.confirmText
                                  )
                                }
                                disabled={loading}
                                className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                                  operation.danger
                                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500'
                                }`}
                              >
                                {loading ? '⏳' : operation.icon}{' '}
                                {operation.title}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Operation Result */}
            {operationResult && (
              <div className="mt-6">
                <Alert>
                  <div
                    className={`${operationResult.success ? 'text-green-700' : 'text-red-700'}`}
                  >
                    <p className="font-medium">
                      {operationResult.success ? '✅' : '❌'}{' '}
                      {operationResult.message}
                    </p>
                    {operationResult.affectedRows !== undefined && (
                      <p className="text-sm mt-1">
                        Affected records: {operationResult.affectedRows}
                      </p>
                    )}
                  </div>
                </Alert>
              </div>
            )}

            {/* Log Terminal */}
            {showLogs && (
              <div className="mt-6">
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      Operation Logs
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyLogsToClipboard}
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
                        onClick={clearLogs}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => setShowLogs(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Hide
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-900 p-4">
                    <div className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
                      {logs.length === 0 ? (
                        <div className="text-gray-500">No logs yet...</div>
                      ) : (
                        logs.map((log, index) => (
                          <div
                            key={index}
                            className={
                              log.includes('❌') || log.includes('💥')
                                ? 'text-red-400'
                                : log.includes('✅') || log.includes('🎉')
                                  ? 'text-green-400'
                                  : log.includes('📊') ||
                                      log.includes('🚀') ||
                                      log.includes('📋')
                                    ? 'text-blue-400'
                                    : 'text-gray-300'
                            }
                          >
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                    {loading && (
                      <div className="mt-2 flex items-center text-gray-400">
                        <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-2"></div>
                        <span className="text-xs">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedClient>
  );
}
