'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductListItem } from '@/types/product';
import { useSettings } from '@/hooks/useSettings';
import { formatPrice } from '@/lib/utils/currency';

interface ProductRowProps {
  product: ProductListItem;
}

export function ProductRow({ product }: ProductRowProps) {
  const { settings } = useSettings();
  const featuredImage = product.featuredImage || (product.images && product.images[0]) || null;
  const hasVariants = product.type === 'variable' && (product.variantCount && product.variantCount > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
      {/* Image */}
      <div className="lg:col-span-1">
        <div className="w-12 h-12 relative bg-gray-100 rounded overflow-hidden">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="lg:col-span-4 space-y-1">
        <div>
          <Link 
            href={`/products/${product.id}`}
            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
          >
            {product.name}
          </Link>
        </div>
        {product.isFeatured && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Featured
          </span>
        )}
      </div>

      {/* SKU */}
      <div className="lg:col-span-1">
        <span className="text-sm font-mono text-gray-600">{product.sku}</span>
      </div>

      {/* Price */}
      <div className="lg:col-span-1">
        {hasVariants ? (
          <PriceRange product={product} settings={settings} />
        ) : (
          <div className="space-y-1">
            <span className="font-medium text-gray-900 text-sm">
              {formatPrice(product.basePrice, settings)}
            </span>
          </div>
        )}
      </div>

      {/* Stock */}
      <div className="lg:col-span-1">
        <span className="text-sm text-gray-500">-</span>
      </div>

      {/* Status */}
      <div className="lg:col-span-2 flex items-center gap-2">
        <ProductStatusBadge status={product.status} />
        <ProductTypeBadge type={product.type} />
      </div>

      {/* Actions */}
      <div className="lg:col-span-2 flex gap-2">
        <Link
          href={`/products/${product.id}/edit`}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Edit
        </Link>
        <Link
          href={`/products/${product.id}`}
          className="px-2 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          View
        </Link>
      </div>
    </div>
  );
}

import type { UserSettings } from '@/types/settings';

function PriceRange({ product, settings }: { product: ProductListItem; settings: UserSettings }) {
  // Since ProductListItem doesn't have variants, we'll just show the base price
  return <span className="font-medium text-sm">{formatPrice(product.basePrice, settings)}</span>;
}

function ProductStatusBadge({ status }: { status: ProductListItem['status'] }) {
  const variants = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    private: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ProductTypeBadge({ type }: { type: ProductListItem['type'] }) {
  const variants = {
    simple: 'bg-blue-100 text-blue-800',
    variable: 'bg-purple-100 text-purple-800',
    grouped: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${variants[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
