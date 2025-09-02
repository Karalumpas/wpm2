'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductListItem } from '@/types/product';
import { formatPrice } from '@/lib/formatters';
import { 
  ExternalLink, 
  Eye, 
  Package, 
  Edit3, 
  Store, 
  Heart,
  ShoppingCart,
  MoreVertical,
  Star,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';

interface ModernProductCardProps {
  product: ProductListItem;
  viewMode?: 'grid' | 'list';
}

export function ModernProductCard({ product, viewMode = 'grid' }: ModernProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Prepare image gallery
  const allImages = [product.featuredImage, ...(product.images || [])].filter(Boolean) as string[];
  const currentImage = hoveredImageIndex !== null ? allImages[hoveredImageIndex] : allImages[currentImageIndex] || null;
  const hasMultipleImages = allImages.length > 1;

  const handleImageHover = (index: number) => {
    setHoveredImageIndex(index);
  };

  const handleImageLeave = () => {
    setHoveredImageIndex(null);
  };

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
      <div 
        className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center p-4 gap-4">
          {/* Image */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
              {currentImage ? (
                <Image
                  src={currentImage}
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
              </div>

              {/* Price and Status */}
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <div className="font-bold text-lg text-gray-900">
                    {formatPrice(product.basePrice)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(product.status)}`}>
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
    <div 
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}

        {/* Image Gallery Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              {allImages.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  onMouseEnter={() => handleImageHover(index)}
                  onMouseLeave={handleImageLeave}
                  className={`w-2 h-2 rounded-full transition-all ${
                    (hoveredImageIndex !== null ? hoveredImageIndex : currentImageIndex) === index
                      ? 'bg-white shadow-md'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
              {allImages.length > 5 && (
                <span className="text-white text-xs bg-black/50 px-1 rounded">
                  +{allImages.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(product.status)}`}>
            {getTypeIcon(product.type)}
            {product.status}
          </span>
        </div>

        {/* Quick Actions - Show on Hover */}
        <div className={`absolute top-3 right-3 flex flex-col gap-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          <button className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all hover:scale-105">
            <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
          </button>
          <Link
            href={`/products/${product.id}`}
            className="p-2 bg-white/90 hover:bg-white rounded-lg shadow-md transition-all hover:scale-105"
          >
            <Eye className="h-4 w-4 text-gray-600 hover:text-blue-500" />
          </Link>
        </div>

        {/* Sale Badge */}
        {product.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              FEATURED
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Product Name */}
        <Link href={`/products/${product.id}`} className="group">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description}
        </p>

        {/* Metadata Row */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          {product.brandId && (
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              Brand {product.brandId}
            </span>
          )}
          {product.categoryIds && product.categoryIds.length > 0 && (
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {product.categoryIds.length} categories
            </span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="h-3 w-3" />
            <span>Updated {new Date(product.updatedAt).toLocaleDateString()}</span>
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
                {product.variantCount} variant{product.variantCount !== 1 ? 's' : ''}
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
          
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">4.0</span>
          </div>
        </div>
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
}
