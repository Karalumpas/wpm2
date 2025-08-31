import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  products,
  productVariants,
  productCategories,
  categories,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProductDetailPageWithVersionSelector } from './components/ProductDetailPageWithVersionSelector';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(productCategories)
    .leftJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(eq(productCategories.productId, id));

  const vars = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      image: productVariants.image,
      price: productVariants.price,
      stockStatus: productVariants.stockStatus,
      attributes: productVariants.attributes,
    })
    .from(productVariants)
    .where(eq(productVariants.productId, id));

  const featured = product.featuredImage ?? undefined;
  const gallery: string[] = Array.isArray(product.galleryImages)
    ? (product.galleryImages as string[])
    : [];

  // Include variant images in gallery (unique and normalized)
  const variantImages: string[] = vars
    .map((v) => (v.image ? String(v.image) : ''))
    .filter(Boolean);

  function normalizeUrl(u: string): string {
    try {
      const url = new URL(u);
      // Strip querystring to avoid duplicates from WP size params, etc.
      const base = `${url.protocol}//${url.host}${url.pathname}`;
      // For MinIO, dedupe by object path (bucket/object)
      if (/:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(base))
        return base.toLowerCase();
      return base.toLowerCase();
    } catch {
      return u;
    }
  }

  const deduped = new Map<string, string>();
  const pushUnique = (src?: string) => {
    if (!src) return;
    const key = normalizeUrl(src);
    if (!deduped.has(key)) deduped.set(key, src);
  };

  pushUnique(featured);
  gallery.forEach((g) => pushUnique(g));
  variantImages.forEach((v) => pushUnique(v));

  const allThumbs = Array.from(deduped.values());

  // Coerce DB rows into expected shapes
  const safeProduct: {
    id: string;
    sku: string;
    name: string;
    status: string;
    type: string;
    basePrice?: string | null;
    featuredImage?: string | undefined;
    stockStatus?: string | undefined;
    regularPrice?: string | null;
    salePrice?: string | null;
    updatedAt?: Date | undefined;
    createdAt?: Date | undefined;
    lastSyncedAt?: Date | null;
  } = {
    ...product,
    stockStatus: product.stockStatus ?? undefined,
    basePrice: product.basePrice ?? null,
    featuredImage: featured,
    updatedAt: product.updatedAt ? new Date(product.updatedAt as unknown as string | Date) : undefined,
    createdAt: product.createdAt ? new Date(product.createdAt as unknown as string | Date) : undefined,
    lastSyncedAt: product.lastSyncedAt ? new Date(product.lastSyncedAt as unknown as string | Date) : null,
  } as const;

  const safeCats = cats.map((c) => ({ id: c.id as string, name: c.name as string, slug: c.slug ?? null }));
  const safeVars = vars.map((v) => ({
    id: v.id,
    sku: v.sku,
    image: v.image ?? null,
    price: v.price ? String(v.price) : null,
    stockStatus: v.stockStatus ?? undefined,
    attributes: (v.attributes as Record<string, unknown> | undefined) ?? undefined,
  }));

  return (
    <ProductDetailPageWithVersionSelector
      product={safeProduct}
      categories={safeCats}
      variants={safeVars}
      allImages={allThumbs}
    />
  );
}

