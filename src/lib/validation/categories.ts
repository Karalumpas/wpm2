import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

