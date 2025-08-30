import { z } from 'zod';

/**
 * URL Search Parameters Schema for Products Page
 * 
 * Defines the structure and validation for all URL parameters
 * that control the products list view state.
 */

// Re-export enums from API validation for consistency
export const productStatusEnum = z.enum(['published', 'draft', 'private']);
export const productTypeEnum = z.enum(['simple', 'variable', 'grouped']);
export const sortByEnum = z.enum(['name', 'basePrice', 'sku', 'createdAt', 'updatedAt', 'status', 'type', 'stockQuantity', 'weight', 'variantCount']);
export const sortOrderEnum = z.enum(['asc', 'desc']);
export const viewModeEnum = z.enum(['grid', 'list']);
export const paginationModeEnum = z.enum(['pages', 'loadMore']);

/**
 * Base schema for URL search parameters
 */
export const productsSearchParamsSchema = z.object({
  // Search
  search: z.string().optional(),
  
  // Sorting
  sortBy: sortByEnum.default('updatedAt'),
  sortOrder: sortOrderEnum.default('desc'),
  
  // Filtering
  status: productStatusEnum.optional(),
  type: productTypeEnum.optional(),
  brandIds: z.string().optional(), // Will be split into array
  categoryIds: z.string().optional(), // Will be split into array
  shopIds: z.string().optional(), // Will be split into array
  
  // Display & Pagination
  limit: z.coerce.number().int().min(1).max(100).default(25),
  viewMode: viewModeEnum.default('grid'),
  paginationMode: paginationModeEnum.default('pages'),
  
  // Pagination state
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});

/**
 * Processed search parameters with arrays for multi-select filters
 */
export const processedSearchParamsSchema = productsSearchParamsSchema.extend({
  brandIds: z.array(z.string().uuid()).default([]),
  categoryIds: z.array(z.string().uuid()).default([]),
  shopIds: z.array(z.string().uuid()).default([]),
});

export type ProductsSearchParams = z.infer<typeof productsSearchParamsSchema>;
export type ProcessedSearchParams = z.infer<typeof processedSearchParamsSchema>;

/**
 * Parse and normalize search parameters from URL
 */
export function parseSearchParams(searchParams: Record<string, string | string[] | undefined>): ProcessedSearchParams {
  // Convert URLSearchParams to plain object and handle arrays
  const params: Record<string, any> = {};
  
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      params[key] = value[0]; // Take first value for non-array params
    } else {
      params[key] = value;
    }
  });

  // Parse base parameters
  const baseParams = productsSearchParamsSchema.parse(params);
  
  // Process array parameters
  const brandIds = baseParams.brandIds 
    ? baseParams.brandIds.split(',').filter(Boolean).filter(id => {
        try {
          z.string().uuid().parse(id);
          return true;
        } catch {
          return false;
        }
      })
    : [];
    
  const categoryIds = baseParams.categoryIds 
    ? baseParams.categoryIds.split(',').filter(Boolean).filter(id => {
        try {
          z.string().uuid().parse(id);
          return true;
        } catch {
          return false;
        }
      })
    : [];

  const shopIds = baseParams.shopIds 
    ? baseParams.shopIds.split(',').filter(Boolean).filter(id => {
        try {
          z.string().uuid().parse(id);
          return true;
        } catch {
          return false;
        }
      })
    : [];

  return {
    ...baseParams,
    brandIds,
    categoryIds,
    shopIds,
  };
}

/**
 * Convert processed parameters back to URL search params
 */
export function serializeSearchParams(params: Partial<ProcessedSearchParams>): Record<string, string> {
  const result: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    
    if (key === 'brandIds' || key === 'categoryIds' || key === 'shopIds') {
      if (Array.isArray(value) && value.length > 0) {
        result[key] = value.join(',');
      }
    } else if (typeof value === 'string' && value.length > 0) {
      result[key] = value;
    } else if (typeof value === 'number') {
      result[key] = String(value);
    } else if (typeof value === 'boolean') {
      result[key] = String(value);
    }
  });
  
  return result;
}

/**
 * Get default parameters from environment variables
 */
export function getDefaultParams(): Partial<ProcessedSearchParams> {
  return {
    viewMode: (process.env.NEXT_PUBLIC_DEFAULT_VIEW_MODE as 'grid' | 'list') || 'grid',
    paginationMode: process.env.NEXT_PUBLIC_ENABLE_INFINITE_SCROLL === 'true' ? 'loadMore' : 'pages',
    limit: parseInt(process.env.NEXT_PUBLIC_PRODUCTS_PER_PAGE || '25', 10),
  };
}

/**
 * Merge parameters with defaults and environment overrides
 */
export function normalizeParams(params: Partial<ProcessedSearchParams>): ProcessedSearchParams {
  const defaults = getDefaultParams();
  const merged = { ...defaults, ...params };
  
  return processedSearchParamsSchema.parse(merged);
}
