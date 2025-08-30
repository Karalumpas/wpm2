'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductListItem } from '@/types/product';
import { useSettings } from '@/hooks/useSettings';
import { formatPrice } from '@/lib/utils/currency';

interface SimpleProductCardProps {
  product: ProductListItem;
}

export function SimpleProductCard({ product }: SimpleProductCardProps) {
  const { settings } = useSettings();

  const displayImage =
    product.featuredImage ||
    (product.images && product.images.length > 0 ? product.images[0] : null);
  const variantImages = product.variantImages || [];

  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow duration-200 p-4">
      <Link href={`/products/${product.id}`} className="block">
        {/* Product Image (square) */}
        <div className="relative aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {displayImage && !imageError ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImageError(true)}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <svg
                className="w-12 h-12 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* Variant thumbnails (for variable products) */}
        {product.type === 'variable' && variantImages.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto">
              {variantImages.map((img, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-md overflow-hidden border border-gray-200 flex-shrink-0"
                  title={`Variant ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} variant ${i + 1}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-500">SKU: {product.sku}</p>

          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(product.basePrice, settings)}
            </span>

            {/* Status Badge */}
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                product.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : product.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {product.status}
            </span>
          </div>

          {/* Type Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                product.type === 'simple'
                  ? 'bg-blue-100 text-blue-800'
                  : product.type === 'variable'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'
              }`}
            >
              {product.type}
            </span>

            {/* Variant Count */}
            {product.variantCount && product.variantCount > 0 && (
              <span className="text-sm text-gray-500">
                {product.variantCount} variants
              </span>
            )}
          </div>

          {/* Last Updated */}
          <p className="text-xs text-gray-400">
            Updated: {new Date(product.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </Link>
    </div>
  );
}
