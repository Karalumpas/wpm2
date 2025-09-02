/**
 * Product Types for Frontend
 *
 * Shared type definitions for product-related data structures
 */

export interface Shop {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'inactive' | 'error';
  lastConnectionCheckAt?: string;
  lastConnectionOk?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  description?: string;
  price: string; // Decimal as string
  compareAtPrice?: string; // Decimal as string
  stockQuantity: number;
  lowStockThreshold?: number;
  weight?: string; // Decimal as string
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
  attributes?: Record<string, unknown>;
  images?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  type: 'simple' | 'variable' | 'grouped';
  status: 'published' | 'draft' | 'private';

  // Pricing (for simple products or base price for variable)
  basePrice: string; // Decimal as string
  compareAtPrice?: string; // Decimal as string

  // Stock (for simple products)
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackStock: boolean;

  // Physical properties
  weight?: string; // Decimal as string
  dimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };

  // Relationships
  shopId?: string;
  shop?: Shop;
  brandId?: string;
  brand?: Brand;
  categoryIds: string[];
  categories?: Category[];

  // Media
  images: string[];
  featuredImage?: string;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  // Variants (for variable products)
  variants?: ProductVariant[];

  // Custom attributes
  attributes?: Record<string, unknown>;

  // Status
  isActive: boolean;
  isFeatured: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Product list item for display purposes - simplified version that matches API response
 */
export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  basePrice: string;
  status: 'published' | 'draft' | 'private';
  type: 'simple' | 'variable' | 'grouped';
  updatedAt: string;
  variantCount?: number;
  variantImages?: string[];

  // Optional fields that may or may not be present
  slug?: string;
  description?: string;
  featuredImage?: string;
  images?: string[];
  categoryIds?: string[];
  brandId?: string;
  shopId?: string;
  shop?: Shop;
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
}

/**
 * Original extended product list item - keep for backward compatibility
 */
export interface ExtendedProductListItem extends Omit<Product, 'variants'> {
  variantCount?: number;
  minPrice?: string;
  maxPrice?: string;
  totalStock?: number;
}

/**
 * Product filters for API calls
 */
export interface ProductFilters {
  search?: string;
  status?: Product['status'];
  type?: Product['type'];
  brandIds?: string[];
  categoryIds?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * Product sorting options
 */
export interface ProductSort {
  sortBy: 'name' | 'basePrice' | 'sku' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  cursor?: string;
  nextCursor?: string;
}
