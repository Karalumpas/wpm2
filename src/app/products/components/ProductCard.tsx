'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductListItem } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/formatters';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const featuredImage = product.featuredImage || (product.images && product.images[0]) || null;
  const hasVariants = product.type === 'variable' && (product.variantCount && product.variantCount > 0);

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow duration-200">
      <Link href={`/products/${product.id}`} className="block">
        {/* Product Image */}
        <div className="aspect-square relative bg-gray-100 rounded-t-lg overflow-hidden">
          {featuredImage ? (
            <Image
              src={featuredImage}
              alt={product.name}
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          
          {/* Featured badge */}
          {product.isFeatured && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <Link 
            href={`/products/${product.id}`}
            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
          >
            {product.name}
          </Link>
          {product.brand && (
            <p className="text-sm text-gray-500 mt-1">{product.brand.name}</p>
          )}
        </div>

        {/* SKU */}
        <p className="text-xs text-gray-400 font-mono">{product.sku}</p>

        {/* Price */}
        <div className="flex items-center gap-2">
          {hasVariants ? (
            <PriceRange product={product} />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {formatPrice(product.basePrice)}
              </span>
              {product.compareAtPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stock info */}
        {product.trackStock && (
          <div className="text-sm">
            {product.stockQuantity !== undefined ? (
              <span className={`${
                product.stockQuantity > 0 
                  ? product.stockQuantity <= (product.lowStockThreshold || 0)
                    ? 'text-orange-600'
                    : 'text-green-600'
                  : 'text-red-600'
              }`}>
                {product.stockQuantity > 0 
                  ? `${product.stockQuantity} in stock`
                  : 'Out of stock'
                }
              </span>
            ) : hasVariants ? (
              <VariantStockInfo product={product} />
            ) : null}
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <ProductStatusBadge status={product.status} />
          <ProductTypeBadge type={product.type} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link
            href={`/products/${product.id}/edit`}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
          >
            Edit
          </Link>
          <Link
            href={`/products/${product.id}`}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

function PriceRange({ product }: { product: Product }) {
  if (!product.variants || product.variants.length === 0) {
    return <span className="font-semibold">{formatPrice(product.basePrice)}</span>;
  }

  const prices = product.variants.map(v => parseFloat(v.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return <span className="font-semibold">{formatPrice(minPrice.toString())}</span>;
  }

  return (
    <span className="font-semibold">
      {formatPrice(minPrice.toString())} - {formatPrice(maxPrice.toString())}
    </span>
  );
}

function VariantStockInfo({ product }: { product: Product }) {
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  const inStockVariants = product.variants.filter(v => v.stockQuantity > 0).length;

  if (totalStock === 0) {
    return <span className="text-red-600">All variants out of stock</span>;
  }

  return (
    <span className="text-green-600">
      {inStockVariants}/{product.variants.length} variants in stock
    </span>
  );
}

function ProductStatusBadge({ status }: { status: Product['status'] }) {
  const variants = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    private: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ProductTypeBadge({ type }: { type: Product['type'] }) {
  const variants = {
    simple: 'bg-blue-100 text-blue-800',
    variable: 'bg-purple-100 text-purple-800',
    grouped: 'bg-orange-100 text-orange-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[type]}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
