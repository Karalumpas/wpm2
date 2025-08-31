import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  products,
  productVariants,
  productCategories,
  categories,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import ImprovedProductDetails from './components/ImprovedProductDetails';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ImprovedProductDetailPage({ params }: PageProps) {
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

  const featured = product.featuredImage || undefined;
  const gallery: string[] = Array.isArray(product.galleryImages)
    ? (product.galleryImages as unknown as string[])
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

  const safeDimensions = product.dimensions as Record<string, unknown> | undefined;
  const safeGallery = Array.isArray(product.galleryImages)
    ? (product.galleryImages as string[])
    : [];

  return (
    <ImprovedProductDetails
      product={{
        id: product.id,
        sku: product.sku,
        name: product.name,
        status: product.status,
        type: product.type,
        basePrice: product.basePrice ? String(product.basePrice) : null,
        regularPrice: product.regularPrice ? String(product.regularPrice) : null,
        salePrice: product.salePrice ? String(product.salePrice) : null,
        stockStatus: product.stockStatus ?? undefined,
        dimensions: safeDimensions,
        description: product.description ?? undefined,
        shortDescription: product.shortDescription ?? undefined,
        featuredImage: product.featuredImage ?? undefined,
        galleryImages: safeGallery,
        updatedAt: product.updatedAt ? product.updatedAt.toISOString() : undefined,
        createdAt: product.createdAt ? product.createdAt.toISOString() : undefined,
        lastSyncedAt: product.lastSyncedAt ? product.lastSyncedAt.toISOString() : null,
      }}
      categories={cats.map((c) => ({
        id: c.id as string,
        name: c.name as string,
        slug: c.slug ?? null,
      }))}
      variants={vars.map((v) => ({
        id: v.id,
        sku: v.sku,
        image: v.image ?? null,
        price: v.price ? String(v.price) : null,
        stockStatus: v.stockStatus ?? undefined,
        attributes: (v.attributes as Record<string, unknown> | undefined) ?? undefined,
      }))}
      allImages={allThumbs}
    />
  );
}