'use client';

import { useState } from 'react';
import {
  Settings,
  Code,
  Database,
  Key,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

type AdvancedClientProps = {
  user: {
    id?: string;
    email?: string | null;
  };
};

export default function AdvancedClient({ user }: AdvancedClientProps) {
  const [apiKey, setApiKey] = useState('wpm_sk_1234567890abcdef...');
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    'https://myapp.com/webhooks/wpm'
  );
  const [debugMode, setDebugMode] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const handleGenerateApiKey = () => {
    const newKey = `wpm_sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    // TODO: Show toast notification
  };

  const handleExportData = () => {
    console.log('Exporting data in format:', exportFormat);
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      console.log('Deleting account...');
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
          <Settings className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Advanced Settings
          </h2>
          <p className="text-sm text-gray-600">
            Developer tools and advanced configurations
          </p>
        </div>
      </div>

      {/* API Access */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Code className="h-5 w-5 text-blue-600" />
          API Access
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <button
                onClick={handleCopyApiKey}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button
                onClick={handleGenerateApiKey}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use this key to access the WPM API programmatically
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Documentation
            </label>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
                View API Docs
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Download OpenAPI Spec
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-green-600" />
          Webhooks
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://yourapp.com/webhooks"
            />
            <p className="text-xs text-gray-500 mt-1">
              Receive real-time notifications about events in your account
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Send
            </label>
            <div className="space-y-2">
              {[
                { id: 'product.created', label: 'Product Created' },
                { id: 'product.updated', label: 'Product Updated' },
                { id: 'sync.completed', label: 'Sync Completed' },
                { id: 'ai.task.completed', label: 'AI Task Completed' },
                { id: 'order.created', label: 'Order Created' },
              ].map((event) => (
                <label key={event.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
              Test Webhook
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              View Logs
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600" />
          Data Management
        </h3>

        <div className="space-y-6">
          {/* Export Data */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Export Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Download all your data in various formats
            </p>
            <div className="flex items-center gap-3">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="xml">XML</option>
              </select>
              <button
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>

          {/* Import Data */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Import Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Upload data from external sources
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drop files here or click to upload
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Choose Files
              </button>
            </div>
          </div>

          {/* Database Operations */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Database Operations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Optimize Database
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Clear Cache
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                Rebuild Indexes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Developer Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Debug Mode</h4>
              <p className="text-sm text-gray-600">
                Enable detailed logging and error reporting
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Beta Features</h4>
              <p className="text-sm text-gray-600">
                Access experimental features before public release
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Analytics Tracking</h4>
              <p className="text-sm text-gray-600">
                Help improve the app by sharing usage data
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          System Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Account Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono text-gray-900">
                  {user.id || 'user_123456'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">January 15, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span className="text-gray-900">Today at 14:32</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-3">Application</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="text-gray-900">2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="text-gray-900">Production</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Region:</span>
                <span className="text-gray-900">Europe (eu-west-1)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Danger Zone
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900">Delete Account</h4>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
