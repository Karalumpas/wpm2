import { z } from 'zod';

// Helper function to normalize URLs
function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Force HTTPS
  if (normalized.startsWith('http://')) {
    normalized = normalized.replace('http://', 'https://');
  }

  // Ensure https:// prefix
  if (!normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  return normalized;
}

const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .refine(
    (url) => {
      try {
        const normalized = normalizeUrl(url);
        new URL(normalized);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid URL format' }
  )
  .transform(normalizeUrl);

export const createShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(255, 'Shop name too long'),
  url: urlSchema,
  consumerKey: z
    .string()
    .min(10, 'Consumer key must be at least 10 characters')
    .max(500, 'Consumer key too long'),
  consumerSecret: z
    .string()
    .min(10, 'Consumer secret must be at least 10 characters')
    .max(500, 'Consumer secret too long'),
});

export const updateShopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(255, 'Shop name too long').optional(),
  url: urlSchema.optional(),
  status: z.enum(['active', 'inactive', 'error']).optional(),
  consumerKey: z
    .string()
    .min(10, 'Consumer key must be at least 10 characters')
    .max(500, 'Consumer key too long')
    .optional(),
  consumerSecret: z
    .string()
    .min(10, 'Consumer secret must be at least 10 characters')
    .max(500, 'Consumer secret too long')
    .optional(),
});

export const shopResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  status: z.enum(['active', 'inactive', 'error']),
  lastConnectionOk: z.boolean().nullable(),
  lastConnectionCheckAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const connectionTestResponseSchema = z.object({
  reachable: z.boolean(),
  auth: z.boolean(),
  details: z.object({
    wpOk: z.boolean(),
    wcOk: z.boolean(),
    productsOk: z.boolean().nullable(),
    httpStatus: z.number().nullable(),
    elapsedMs: z.number(),
    error: z.string().nullable(),
  }),
});

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
export type ShopResponse = z.infer<typeof shopResponseSchema>;
export type ConnectionTestResponse = z.infer<typeof connectionTestResponseSchema>;
