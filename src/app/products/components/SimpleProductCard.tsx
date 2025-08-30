'use client';

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
  
  const displayImage = product.featuredImage || 
                      (product.images && product.images.length > 0 ? product.images[0] : null);

  return (
    <div className="bg-white rounded-lg border hover:shadow-md transition-shadow duration-200 p-4">
      <Link href={`/products/${product.id}`} className="block">
        {/* Product Image */}
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              width={200}
              height={200}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, hide it and show placeholder
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
          ) : (
            <span className="text-gray-400 text-sm">No Image</span>
          )}
          {displayImage && (
            <span className="text-gray-400 text-sm hidden">No Image</span>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
          
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
