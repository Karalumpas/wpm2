import { z } from 'zod';

// Product sort fields whitelist for security
export const productSortFields = [
  'name',
  'basePrice',
  'sku',
  'createdAt',
  'updatedAt',
  'status',
  'type',
  'stockQuantity',
  'weight',
  'variantCount',
] as const;

export const sortOrder = ['asc', 'desc'] as const;
export const productStatus = ['published', 'draft', 'private'] as const;
export const productType = ['simple', 'variable', 'grouped'] as const;

// Cursor pagination schema
export const cursorSchema = z.object({
  updatedAt: z.string().datetime(),
  id: z.string().uuid(),
});

// Main products query schema
export const getProductsQuerySchema = z.object({
  // Pagination
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(25),

  // Legacy pagination fallback
  page: z.coerce.number().min(1).optional(),

  // Search
  search: z.string().optional(),

  // Sorting
  sortBy: z.enum(productSortFields).default('updatedAt'),
  sortOrder: z.enum(sortOrder).default('desc'),

  // Filters
  status: z.enum(productStatus).optional(),
  type: z.enum(productType).optional(),
  brandIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  shopIds: z.array(z.string().uuid()).optional(),
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
export type CursorData = z.infer<typeof cursorSchema>;

// Product list item response schema
export const productListItemSchema = z.object({
  id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  basePrice: z.string().nullable(),
  status: z.enum(productStatus),
  type: z.enum(productType),
  updatedAt: z.string().datetime(),
  variantCount: z.number(),
  // Optional preview of variant attributes (for UI hints)
  variantPreview: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type ProductListItem = z.infer<typeof productListItemSchema>;

// Products list response schema
export const productsListResponseSchema = z.object({
  items: z.array(productListItemSchema),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
  total: z.number().optional(), // Total count for page-based pagination
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
      cursor: z.string().optional(),
      nextCursor: z.string().optional(),
    })
    .optional(),
});

export type ProductsListResponse = z.infer<typeof productsListResponseSchema>;

// Filter values response schema
export const categoryItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  parentId: z.string().uuid().nullable(),
});

export const brandItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const getFiltersResponseSchema = z.object({
  categories: z.array(categoryItemSchema),
  brands: z.array(brandItemSchema),
  statuses: z.array(z.enum(productStatus)),
  types: z.array(z.enum(productType)),
});

export type GetFiltersResponse = z.infer<typeof getFiltersResponseSchema>;
export type CategoryItem = z.infer<typeof categoryItemSchema>;
export type BrandItem = z.infer<typeof brandItemSchema>;

// Input validation for creating/updating products (for future use)
export const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  basePrice: z.number().positive().optional(),
  status: z.enum(productStatus).default('draft'),
  type: z.enum(productType).default('simple'),
  brandIds: z.array(z.string().uuid()).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
