'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShopSchema, type CreateShopInput } from '@/lib/validation/shops';
import { z } from 'zod';
import { ProtectedClient } from '@/components/auth/ProtectedClient';

export default function NewShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateShopInput>({
    name: '',
    url: '',
    consumerKey: '',
    consumerSecret: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    try {
      createShopSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const testConnection = async () => {
    if (!validateForm()) return;

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/shops/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shop');
      }

      router.push('/connections');
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to create shop',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedClient>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 pb-4 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                  Add New Shop
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Connect a new WooCommerce shop to manage products
                </p>
              </div>
              <button
                onClick={() => router.push('/connections')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
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
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{errors.submit}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Shop Name *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base text-gray-900 px-4 py-3 border-gray-300 rounded-md ${
                      errors.name ? 'border-red-300' : ''
                    }`}
                    placeholder="My WooCommerce Shop"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700"
                >
                  Shop URL *
                </label>
                <div className="mt-1">
                  <input
                    type="url"
                    name="url"
                    id="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base text-gray-900 px-4 py-3 border-gray-300 rounded-md ${
                      errors.url ? 'border-red-300' : ''
                    }`}
                    placeholder="https://myshop.com"
                  />
                  {errors.url && (
                    <p className="mt-2 text-sm text-red-600">{errors.url}</p>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  The base URL of your WooCommerce website (will be
                  automatically converted to HTTPS)
                </p>
              </div>

              <div>
                <label
                  htmlFor="consumerKey"
                  className="block text-sm font-medium text-gray-700"
                >
                  Consumer Key *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="consumerKey"
                    id="consumerKey"
                    value={formData.consumerKey}
                    onChange={handleInputChange}
                    autoComplete="off"
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base text-gray-900 px-4 py-3 border-gray-300 rounded-md ${
                      errors.consumerKey ? 'border-red-300' : ''
                    }`}
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  {errors.consumerKey && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.consumerKey}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="consumerSecret"
                  className="block text-sm font-medium text-gray-700"
                >
                  Consumer Secret *
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    name="consumerSecret"
                    id="consumerSecret"
                    value={formData.consumerSecret}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base text-gray-900 px-4 py-3 border-gray-300 rounded-md ${
                      errors.consumerSecret ? 'border-red-300' : ''
                    }`}
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  {errors.consumerSecret && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.consumerSecret}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      API Credentials Required
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        You need to create WooCommerce REST API keys in your
                        shop admin:
                        <br />
                        <strong>
                          WooCommerce → Settings → Advanced → REST API
                        </strong>
                        <br />
                        Set permissions to &quot;Read/Write&quot; for full
                        product management.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {testResult && (
                <div
                  className={`rounded-md p-4 ${
                    testResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className={`h-5 w-5 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        {testResult.success ? (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        ) : (
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        )}
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3
                        className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}
                      >
                        {testResult.success
                          ? 'Connection Successful'
                          : 'Connection Failed'}
                      </h3>
                      <div
                        className={`mt-2 text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}
                      >
                        {testResult.success ? (
                          <div>
                            <p>All endpoints are working correctly!</p>
                            {testResult.details && (
                              <ul className="mt-1 space-y-1">
                                <li>
                                  WordPress:{' '}
                                  {testResult.details.reachable ? '✓' : '✗'}
                                </li>
                                <li>
                                  WooCommerce API:{' '}
                                  {testResult.details.auth ? '✓' : '✗'}
                                </li>
                                <li>
                                  Products endpoint:{' '}
                                  {testResult.details.productsOk ? '✓' : '✗'}
                                </li>
                                <li>
                                  Response time: {testResult.details.elapsedMs}
                                  ms
                                </li>
                              </ul>
                            )}
                          </div>
                        ) : (
                          <p>{testResult.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between space-x-3">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  disabled={loading || !testResult?.success}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
