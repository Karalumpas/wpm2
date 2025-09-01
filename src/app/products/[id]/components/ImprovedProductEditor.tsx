'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  X,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Package,
  Ruler,
  FileText,
  AlertCircle,
  Eye,
  RotateCcw,
} from 'lucide-react';

type ProductData = {
  id: string;
  sku: string;
  name: string;
  basePrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  status: 'published' | 'draft' | 'private';
  type: 'simple' | 'variable' | 'grouped';
  stockStatus?: string | null;
  dimensions?: { length?: string; width?: string; height?: string } | null;
  description?: string | null;
  shortDescription?: string | null;
};

interface ImprovedProductEditorProps {
  initial: ProductData;
}

export default function ImprovedProductEditor({
  initial,
}: ImprovedProductEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductData>(initial);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'basic' | 'pricing' | 'inventory' | 'seo' | 'media'
  >('basic');
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const onChange = useCallback(
    <K extends keyof ProductData>(key: K, value: ProductData[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
      setHasChanges(true);

      // Clear validation error for this field
      if (validationErrors[key as string]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[key as string];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!form.sku.trim()) {
      errors.sku = 'SKU is required';
    }

    if (form.basePrice && isNaN(parseFloat(form.basePrice))) {
      errors.basePrice = 'Price must be a valid number';
    }

    if (form.regularPrice && isNaN(parseFloat(form.regularPrice))) {
      errors.regularPrice = 'Regular price must be a valid number';
    }

    if (form.salePrice && isNaN(parseFloat(form.salePrice))) {
      errors.salePrice = 'Sale price must be a valid number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const save = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/products/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Failed to save changes');
      }

      setHasChanges(false);
      // Show success message
      showNotification('Product updated successfully!', 'success');
    } catch (e) {
      console.error(e);
      showNotification('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setForm(initial);
    setHasChanges(false);
    setValidationErrors({});
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    // In a real app, you'd use a toast notification system
    alert(message);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'seo', label: 'SEO & Content', icon: FileText },
    { id: 'media', label: 'Media', icon: ImageIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Edit Product
                </h1>
                <p className="text-gray-600 mt-1">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {form.sku}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  {form.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}

              <button
                onClick={reset}
                disabled={!hasChanges}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={() => router.push(`/products/${form.id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>

              <button
                onClick={save}
                disabled={saving || !hasChanges}
                className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar with tabs */}
          <div className="lg:col-span-1">
            <nav className="space-y-2 sticky top-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
              {activeTab === 'basic' && (
                <BasicInfoTab
                  form={form}
                  onChange={onChange}
                  errors={validationErrors}
                />
              )}
              {activeTab === 'pricing' && (
                <PricingTab
                  form={form}
                  onChange={onChange}
                  errors={validationErrors}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryTab
                  form={form}
                  onChange={onChange}
                  errors={validationErrors}
                />
              )}
              {activeTab === 'seo' && (
                <SEOTab
                  form={form}
                  onChange={onChange}
                  errors={validationErrors}
                />
              )}
              {activeTab === 'media' && <MediaTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicInfoTab({
  form,
  onChange,
  errors,
}: {
  form: ProductData;
  onChange: <K extends keyof ProductData>(
    key: K,
    value: ProductData[K]
  ) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Basic Information
        </h2>
        <p className="text-gray-600">
          Essential product details and identification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormField label="Product Name" required error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={`input-field ${errors.name ? 'border-red-300' : ''}`}
            placeholder="Enter product name"
          />
        </FormField>

        <FormField
          label="SKU"
          required
          error={errors.sku}
          help="Stock Keeping Unit - unique identifier"
        >
          <input
            type="text"
            value={form.sku}
            onChange={(e) => onChange('sku', e.target.value)}
            className={`input-field font-mono ${errors.sku ? 'border-red-300' : ''}`}
            placeholder="Enter SKU"
          />
        </FormField>

        <FormField label="Product Status" required>
          <select
            value={form.status}
            onChange={(e) =>
              onChange('status', e.target.value as ProductData['status'])
            }
            className="input-field"
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="private">Private</option>
          </select>
        </FormField>

        <FormField label="Product Type" required>
          <select
            value={form.type}
            onChange={(e) =>
              onChange('type', e.target.value as ProductData['type'])
            }
            className="input-field"
          >
            <option value="simple">Simple Product</option>
            <option value="variable">Variable Product</option>
            <option value="grouped">Grouped Product</option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

function PricingTab({
  form,
  onChange,
  errors,
}: {
  form: ProductData;
  onChange: <K extends keyof ProductData>(
    key: K,
    value: ProductData[K]
  ) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Pricing</h2>
        <p className="text-gray-600">
          Set regular and sale prices for your product
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FormField
          label="Base Price"
          error={errors.basePrice}
          help="Primary selling price"
        >
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.basePrice ?? ''}
              onChange={(e) => onChange('basePrice', e.target.value || null)}
              className={`input-field pl-12 ${errors.basePrice ? 'border-red-300' : ''}`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">DKK</span>
            </div>
          </div>
        </FormField>

        <FormField
          label="Regular Price"
          error={errors.regularPrice}
          help="Original price before discounts"
        >
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.regularPrice ?? ''}
              onChange={(e) => onChange('regularPrice', e.target.value || null)}
              className={`input-field pl-12 ${errors.regularPrice ? 'border-red-300' : ''}`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">DKK</span>
            </div>
          </div>
        </FormField>

        <FormField
          label="Sale Price"
          error={errors.salePrice}
          help="Discounted price (optional)"
        >
          <div className="relative">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.salePrice ?? ''}
              onChange={(e) => onChange('salePrice', e.target.value || null)}
              className={`input-field pl-12 ${errors.salePrice ? 'border-red-300' : ''}`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 font-medium">DKK</span>
            </div>
          </div>
        </FormField>
      </div>

      {/* Price comparison */}
      {(form.basePrice || form.regularPrice || form.salePrice) && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-3">Price Preview</h3>
          <div className="flex items-center gap-4">
            {form.salePrice && (
              <div className="text-2xl font-bold text-blue-600">
                DKK {parseFloat(form.salePrice).toFixed(2)}
              </div>
            )}
            {form.regularPrice && form.salePrice && (
              <div className="text-lg text-gray-500 line-through">
                DKK {parseFloat(form.regularPrice).toFixed(2)}
              </div>
            )}
            {form.basePrice && !form.salePrice && (
              <div className="text-2xl font-bold text-gray-900">
                DKK {parseFloat(form.basePrice).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryTab({
  form,
  onChange,
  errors,
}: {
  form: ProductData;
  onChange: <K extends keyof ProductData>(
    key: K,
    value: ProductData[K]
  ) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Inventory & Shipping
        </h2>
        <p className="text-gray-600">
          Stock status, dimensions, and shipping details
        </p>
      </div>

      <div className="space-y-6">
        <FormField label="Stock Status">
          <select
            value={form.stockStatus ?? ''}
            onChange={(e) => onChange('stockStatus', e.target.value || null)}
            className="input-field"
          >
            <option value="">Select status</option>
            <option value="instock">In Stock</option>
            <option value="outofstock">Out of Stock</option>
            <option value="onbackorder">On Backorder</option>
          </select>
        </FormField>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Dimensions
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Length (cm)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.dimensions?.length ?? ''}
                onChange={(e) =>
                  onChange('dimensions', {
                    ...(form.dimensions ?? {}),
                    length: e.target.value || undefined,
                  })
                }
                className="input-field"
                placeholder="0.0"
              />
            </FormField>

            <FormField label="Width (cm)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.dimensions?.width ?? ''}
                onChange={(e) =>
                  onChange('dimensions', {
                    ...(form.dimensions ?? {}),
                    width: e.target.value || undefined,
                  })
                }
                className="input-field"
                placeholder="0.0"
              />
            </FormField>

            <FormField label="Height (cm)">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={form.dimensions?.height ?? ''}
                onChange={(e) =>
                  onChange('dimensions', {
                    ...(form.dimensions ?? {}),
                    height: e.target.value || undefined,
                  })
                }
                className="input-field"
                placeholder="0.0"
              />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  );
}

function SEOTab({
  form,
  onChange,
  errors,
}: {
  form: ProductData;
  onChange: <K extends keyof ProductData>(
    key: K,
    value: ProductData[K]
  ) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Content & SEO
        </h2>
        <p className="text-gray-600">
          Product descriptions and search optimization
        </p>
      </div>

      <div className="space-y-6">
        <FormField
          label="Short Description"
          help="Brief summary displayed in product listings"
        >
          <textarea
            value={form.shortDescription ?? ''}
            onChange={(e) =>
              onChange('shortDescription', e.target.value || null)
            }
            rows={3}
            className="input-field resize-none"
            placeholder="Write a brief product summary..."
          />
        </FormField>

        <FormField
          label="Full Description"
          help="Detailed product information (HTML supported)"
        >
          <textarea
            value={form.description ?? ''}
            onChange={(e) => onChange('description', e.target.value || null)}
            rows={8}
            className="input-field resize-y"
            placeholder="Write a detailed product description..."
          />
        </FormField>
      </div>
    </div>
  );
}

function MediaTab() {
  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Media Gallery
        </h2>
        <p className="text-gray-600">Upload and manage product images</p>
      </div>

      <div className="space-y-6">
        {/* Featured Image */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Featured Image
          </h3>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop an image here, or click to select
            </p>
            <p className="text-sm text-gray-500">Recommended size: 800x800px</p>
            <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload className="h-4 w-4" />
              Choose File
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Product Gallery
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center hover:border-blue-400 transition-colors cursor-pointer"
              >
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Add Image</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
      </label>
      {children}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
