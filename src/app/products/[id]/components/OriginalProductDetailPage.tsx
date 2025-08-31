import Link from 'next/link';
import {
  formatDateTime,
  formatDimensions,
  formatPrice,
} from '@/lib/formatters';
import InteractiveGallery from './InteractiveGallery';
import CopyButton from './CopyButton';
import VariantsTable from '../variants/VariantsTable';

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  type: string;
  basePrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string;
  dimensions?: Record<string, unknown>;
  description?: string | null;
  shortDescription?: string | null;
  featuredImage?: string | null;
  galleryImages?: unknown;
  updatedAt?: Date;
  createdAt?: Date;
  lastSyncedAt?: Date | null;
}

interface Category {
  id: string;
  name: string;
  slug?: string | null;
}

interface Variant {
  id: string;
  sku: string;
  image?: string | null;
  price?: string | null;
  stockStatus?: string | null;
  attributes?: Record<string, unknown>;
}

interface OriginalProductDetailPageProps {
  product: Product;
  categories: Category[];
  variants: Variant[];
  allImages: string[];
}

export function OriginalProductDetailPage({
  product,
  categories,
  variants,
  allImages,
}: OriginalProductDetailPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {product.name}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="font-mono">SKU: {product.sku}</span>
              <CopyButton value={product.sku} label="Kopiér SKU" />
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Sidst opdateret{' '}
                {product.updatedAt ? formatDateTime(product.updatedAt) : '-'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />
            <TypeBadge type={product.type} />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Interactive gallery */}
          <div className="lg:col-span-7">
            <InteractiveGallery images={allImages} alt={product.name} />
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="lg:sticky lg:top-6 bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  {product.basePrice ? formatPrice(product.basePrice) : '-'}
                </span>
                {product.regularPrice && (
                  <span className="text-sm line-through text-gray-400">
                    {formatPrice(product.regularPrice)}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="text-gray-900 capitalize">{product.status}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900 capitalize">{product.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Lagerstatus</dt>
                  <dd className="text-gray-900">{product.stockStatus}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Vægt &amp; mål</dt>
                  <dd className="text-gray-900">
                    {formatDimensions(
                      (
                        product.dimensions as unknown as {
                          length?: string;
                          width?: string;
                          height?: string;
                        }
                      )?.length,
                      (
                        product.dimensions as unknown as {
                          length?: string;
                          width?: string;
                          height?: string;
                        }
                      )?.width,
                      (
                        product.dimensions as unknown as {
                          length?: string;
                          width?: string;
                          height?: string;
                        }
                      )?.height
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Sidst opdateret</dt>
                  <dd className="text-gray-900">
                    {product.updatedAt
                      ? formatDateTime(product.updatedAt)
                      : '-'}
                  </dd>
                </div>
              </dl>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors duration-150"
                >
                  Tilbage
                </Link>
                <Link
                  href={`/products/${product.id}/edit`}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:shadow-lg hover:brightness-110 transition-all duration-200"
                >
                  Rediger produkt
                </Link>
                <button className="px-5 py-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-800 transition-all duration-200">
                  Synkronisér nu
                </button>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Kategorier
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span
                      key={c.id}
                      className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Beskrivelse
                </h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {variants.length > 0 && (
          <div className="mt-8">
            <VariantsTable
              variants={variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                image: v.image || undefined,
                price: v.price ? String(v.price) : undefined,
                stockStatus: v.stockStatus || '-',
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    published: 'bg-green-100 text-green-800 border-green-200',
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    private: 'bg-gray-100 text-gray-800 border-gray-200',
  } as Record<string, string>;
  return (
    <span
      className={`px-3 py-1 text-xs rounded-full border ${map[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map = {
    simple: 'bg-blue-100 text-blue-800 border-blue-200',
    variable: 'bg-purple-100 text-purple-800 border-purple-200',
    grouped: 'bg-orange-100 text-orange-800 border-orange-200',
  } as Record<string, string>;
  return (
    <span
      className={`px-3 py-1 text-xs rounded-full border ${map[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      {type}
    </span>
  );
}