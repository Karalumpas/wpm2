'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ProductListItem } from '@/types/product';
import { formatPrice } from '@/lib/formatters';
import { SwipeableMediaGallery } from '../[id]/components/SwipeableMediaGallery';
import {
  ExternalLink,
  Eye,
  Package,
  Edit3,
  Store,
  MoreVertical,
  Clock,
  TrendingUp,
  Zap,
  Link as LinkIcon,
} from 'lucide-react';

interface ModernProductCardProps {
  product: ProductListItem;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  onSelectionChange?: (productId: string, selected: boolean) => void;
}

export function ModernProductCard({
  product,
  viewMode = 'grid',
  isSelected = false,
  onSelectionChange,
}: ModernProductCardProps) {
  // Prepare image gallery for SwipeableMediaGallery
  const allImages = [product.featuredImage, ...(product.images || [])].filter(
    Boolean
  ) as string[];
  
  const mediaItems = allImages.map(url => ({
    url,
    type: 'image' as const,
    alt: product.name,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'private':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'variable':
        return <Zap className="h-3 w-3" />;
      case 'grouped':
        return <Package className="h-3 w-3" />;
      case 'external':
        return <ExternalLink className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center p-4 gap-4">
          {/* Image */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
              {mediaItems.length > 0 ? (
                <Image
                  src={mediaItems[0].url}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <Link href={`/products/${product.id}`} className="group">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {product.description}
                </p>
                {product.shop && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      product.shop.status === 'active' 
                        ? 'bg-blue-50 text-blue-700' 
                        : product.shop.status === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      <LinkIcon className="h-3 w-3" />
                      {product.shop.name}
                      {product.shop.status === 'error' && (
                        <span className="w-1 h-1 bg-red-500 rounded-full ml-1"></span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Price and Status */}
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">
                    {formatPrice(product.basePrice)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}
                  >
                    {getTypeIcon(product.type)}
                    {product.status}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Link
                    href={`/products/${product.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Edit Product"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl group overflow-hidden h-full flex flex-col">
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden flex-shrink-0">
        {mediaItems.length > 0 ? (
          <SwipeableMediaGallery
            media={mediaItems}
            className="w-full h-full"
            showArrows={false}
            showIndicators={true}
            showThumbnailGrid={false}
            compact={true}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(product.status)}`}
          >
            {getTypeIcon(product.type)}
            {product.status}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Product Name */}
        <Link href={`/products/${product.id}`} className="group">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 h-12 flex items-start">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">
          {product.description}
        </p>

        {/* Metadata Row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          {product.shop && (
            <span className={`px-2 py-1 rounded-full flex items-center gap-1 ${
              product.shop.status === 'active' 
                ? 'bg-blue-50 text-blue-700' 
                : product.shop.status === 'error'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-700'
            }`}>
              <LinkIcon className="h-3 w-3" />
              {product.shop.name}
              {product.shop.status === 'error' && (
                <span className="w-1 h-1 bg-red-500 rounded-full ml-1"></span>
              )}
            </span>
          )}
          {product.brandId && (
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              Brand {product.brandId}
            </span>
          )}
          {product.categoryIds && product.categoryIds.length > 0 && (
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {product.categoryIds?.length || 0} categories
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            <span>
              Updated {new Date(product.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-900">
                {formatPrice(product.basePrice)}
              </span>
            </div>
            {product.variantCount && (
              <span className="text-xs text-gray-500">
                {product.variantCount} variant
                {product.variantCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Link
              href={`/products/${product.id}/edit`}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Edit Product"
            >
              <Edit3 className="h-4 w-4" />
            </Link>

            <button
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
              title="View Shops"
            >
              <Store className="h-4 w-4" />
            </button>

            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
              title="More Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{Math.floor(Math.random() * 100) + 10} views</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{Math.floor(Math.random() * 50) + 5} sales</span>
            </div>
          </div>

          {/* Selection Checkbox */}
          {onSelectionChange && (
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelectionChange(product.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-xs text-gray-600">Select</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
