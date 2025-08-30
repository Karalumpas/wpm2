'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  updateShopSchema,
  type UpdateShopInput,
  type ShopResponse,
} from '@/lib/validation/shops';
import { z } from 'zod';
import { ProtectedClient } from '@/components/auth/ProtectedClient';

export default function EditShopPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showingCredentials, setShowingCredentials] = useState(false);
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
  const [formData, setFormData] = useState<UpdateShopInput>({
    name: '',
    url: '',
    consumerKey: '',
    consumerSecret: '',
  });

  // Load shop data
  useEffect(() => {
    if (shopId) {
      loadShop();
    }
  }, [shopId]);

  const loadShop = async () => {
    try {
      setLoading(true);

      // Load basic shop info
      const shopResponse = await fetch(`/api/shops/${shopId}`);
      if (!shopResponse.ok) {
        throw new Error('Failed to load shop');
      }
      const shop: ShopResponse = await shopResponse.json();

      // Load credentials
      const credentialsResponse = await fetch(
        `/api/shops/${shopId}/credentials`
      );
      let consumerKey = '';
      let consumerSecret = '';

      if (credentialsResponse.ok) {
        const credentials = await credentialsResponse.json();
        consumerKey = credentials.consumerKey || '';
        consumerSecret = credentials.consumerSecret || '';
      }

      setFormData({
        name: shop.name,
        url: shop.url,
        consumerKey,
        consumerSecret,
      });
      setShowingCredentials(true); // Show credentials by default
    } catch (error) {
      setErrors({
        load: error instanceof Error ? error.message : 'Failed to load shop',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCredentialsVisibility = () => {
    if (showingCredentials) {
      // Hide credentials
      setFormData((prev) => ({
        ...prev,
        consumerKey: '',
        consumerSecret: '',
      }));
      setShowingCredentials(false);
    } else {
      // Show credentials - reload them
      loadShopCredentials();
    }
  };

  const loadShopCredentials = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}/credentials`);

      if (!response.ok) {
        throw new Error('Failed to load credentials');
      }

      const shop = await response.json();
      setFormData((prev) => ({
        ...prev,
        consumerKey: shop.consumerKey || '',
        consumerSecret: shop.consumerSecret || '',
      }));
      setShowingCredentials(true);
    } catch (error) {
      setErrors({
        credentials:
          error instanceof Error ? error.message : 'Failed to load credentials',
      });
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

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
      // Only validate fields that are filled
      const dataToValidate: UpdateShopInput = {};

      if (formData.name?.trim()) {
        dataToValidate.name = formData.name;
      }

      if (formData.url?.trim()) {
        dataToValidate.url = formData.url;
      }

      if (formData.consumerKey?.trim()) {
        dataToValidate.consumerKey = formData.consumerKey;
      }

      if (formData.consumerSecret?.trim()) {
        dataToValidate.consumerSecret = formData.consumerSecret;
      }

      updateShopSchema.parse(dataToValidate);
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

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/shops/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setTestResult({
          success: false,
          error: result.error || 'Connection test failed',
        });
        return;
      }

      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error:
          error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setErrors({});

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update shop');
      }

      router.push('/connections');
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to update shop',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this shop connection? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete shop');
      }

      router.push('/connections');
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Failed to delete shop',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedClient>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-b border-gray-200 pb-4 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold leading-tight text-gray-900">
                    Edit Shop
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Update your WooCommerce shop connection
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
                {errors.load && (
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
                          <p>{errors.load}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                    Consumer Key
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      name="consumerKey"
                      id="consumerKey"
                      value={formData.consumerKey}
                      onChange={handleInputChange}
                      autoComplete="off"
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base text-gray-900 px-4 py-3 pr-12 border-gray-300 rounded-md ${
                        errors.consumerKey ? 'border-red-300' : ''
                      }`}
                      placeholder={
                        showingCredentials
                          ? 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                          : 'Enter new Consumer Key or click Show to load existing'
                      }
                    />
                    {/* Copy Icon */}
                    {formData.consumerKey && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            formData.consumerKey || '',
                            'Consumer Key'
                          )
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 focus:outline-none"
                        title="Copy Consumer Key"
                      >
                        <svg
                          className="w-4 h-4"
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
                      </button>
                    )}
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
                    Consumer Secret
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="password"
                      name="consumerSecret"
                      id="consumerSecret"
                      value={formData.consumerSecret}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                      className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base text-gray-900 px-4 py-3 pr-12 border-gray-300 rounded-md ${
                        errors.consumerSecret ? 'border-red-300' : ''
                      }`}
                      placeholder={
                        showingCredentials
                          ? 'cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
                          : 'Enter new Consumer Secret or click Show to load existing'
                      }
                    />
                    {/* Copy Icon */}
                    {formData.consumerSecret && (
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            formData.consumerSecret || '',
                            'Consumer Secret'
                          )
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-green-600 focus:outline-none"
                        title="Copy Consumer Secret"
                      >
                        <svg
                          className="w-4 h-4"
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
                      </button>
                    )}
                    {errors.consumerSecret && (
                      <p className="mt-2 text-sm text-red-600">
                        {errors.consumerSecret}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggle Shop Credentials Button */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Shop Credentials
                      </h3>
                      <p className="text-sm text-gray-500">
                        {showingCredentials
                          ? 'Credentials are currently visible in the form fields'
                          : 'Load existing API credentials to view or copy them'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleCredentialsVisibility}
                      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        showingCredentials
                          ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                          : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'
                      }`}
                    >
                      {showingCredentials ? (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3 3 0 1015.12 15.12m-4.242-4.242L8.464 8.464m2.828 2.828l4.242 4.242m0 0l1.414-1.414M15.12 15.12l-2.122-2.122"
                            />
                          </svg>
                          Hide Shop Credentials
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Show Shop Credentials
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {errors.credentials && (
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
                          Error Loading Credentials
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{errors.credentials}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                        Security Note
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>
                          For security reasons, credentials are not pre-filled.
                          Enter your API credentials to update them. Leave empty
                          to keep existing credentials.
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
                        {testResult.success ? (
                          <svg
                            className="h-5 w-5 text-green-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
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
                        )}
                      </div>
                      <div className="ml-3">
                        <h3
                          className={`text-sm font-medium ${
                            testResult.success
                              ? 'text-green-800'
                              : 'text-red-800'
                          }`}
                        >
                          {testResult.success
                            ? 'Connection Successful'
                            : 'Connection Failed'}
                        </h3>
                        {testResult.success && testResult.details && (
                          <div className="mt-2 text-sm text-green-700">
                            <p>All endpoints are working correctly!</p>
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
                                Response time: {testResult.details.elapsedMs}ms
                              </li>
                            </ul>
                          </div>
                        )}
                        {!testResult.success && (
                          <div className="mt-2 text-sm text-red-700">
                            <p>{testResult.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {testing ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500"
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
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || saving}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-red-500"
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
                          Deleting...
                        </>
                      ) : (
                        'Delete Shop Connection'
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                        Updating...
                      </>
                    ) : (
                      'Update Shop'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedClient>
  );
}
