'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductListItem } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/formatters';
import { ExternalLink, Eye, Package, Edit3, Store } from 'lucide-react';
import { ShopLinksButton } from './ShopLinksButton';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(
    null
  );

  // Prepare image gallery
  const allImages = [product.featuredImage, ...(product.images || [])].filter(
    Boolean
  ) as string[];

  // Use hovered image if hovering, otherwise use selected image
  const currentImage =
    hoveredImageIndex !== null
      ? allImages[hoveredImageIndex]
      : allImages[currentImageIndex] || null;
  const hasMultipleImages = allImages.length > 1;

  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handleThumbnailHover = (index: number) => {
    setHoveredImageIndex(index);
  };

  const handleThumbnailLeave = () => {
    setHoveredImageIndex(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl group overflow-hidden">
      {/* Image Section - Square aspect ratio with enhanced styling */}
      <div className="relative">
        {/* Main Image - Square */}
        <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
              <Package className="w-16 h-16" />
            </div>
          )}

          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.isFeatured && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 shadow-lg">
                ⭐ Featured
              </Badge>
            )}
            <ProductStatusBadge status={product.status} />
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 right-3">
            <ProductTypeBadge type={product.type} />
          </div>
        </div>

        {/* Image Thumbnails - Redesigned for better UX */}
        {hasMultipleImages && (
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  onMouseEnter={() => handleThumbnailHover(index)}
                  onMouseLeave={handleThumbnailLeave}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                    index === currentImageIndex
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  title={`View image ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Information - Redesigned for better UX */}
      <div className="p-5 space-y-4">
        {/* Header: Title, SKU and Variants */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 line-clamp-2 text-base leading-tight flex-1">
              {product.name}
            </h3>
            {product.variantCount && product.variantCount > 0 && (
              <span className="text-xs bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                {product.variantCount} variants
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        {/* Price Section */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl text-blue-600">
            {formatPrice(product.basePrice)}
          </span>
          {product.type === 'variable' &&
            product.variantCount &&
            product.variantCount > 0 && (
              <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded">
                from
              </span>
            )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {product.description}
            </p>
          </div>
        )}

        {/* Action Buttons - Enhanced Design */}
        <div className="space-y-3 pt-2">
          {/* Primary Action Row */}
          <div className="flex gap-2">
            <Link
              href={`/products/${product.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Link>

            <ShopLinksButton product={product} />
          </div>

          {/* Secondary Action Row */}
          <div className="flex gap-2">
            <Link
              href={`/products/${product.id}/edit`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Edit Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductStatusBadge({ status }: { status: ProductListItem['status'] }) {
  const variants = {
    published:
      'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg',
    draft:
      'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg',
    private: 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg',
  };

  const icons = {
    published: '✓',
    draft: '⚠',
    private: '🔒',
  };

  return (
    <Badge className={`text-xs px-2 py-1 ${variants[status]}`}>
      {icons[status]} {status}
    </Badge>
  );
}

function ProductTypeBadge({ type }: { type: ProductListItem['type'] }) {
  const variants = {
    simple: 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg',
    variable:
      'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg',
    grouped: 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg',
  };

  const icons = {
    simple: '●',
    variable: '◆',
    grouped: '▲',
  };

  return (
    <Badge className={`text-xs px-2 py-1 ${variants[type]}`}>
      {icons[type]} {type}
    </Badge>
  );
}
