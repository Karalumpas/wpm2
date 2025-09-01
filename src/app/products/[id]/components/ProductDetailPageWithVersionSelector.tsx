'use client';

import {
  VersionSelector,
  useUIVersion,
} from '@/components/ui/version-selector';
import { OriginalProductDetailPage } from './OriginalProductDetailPage';
import ImprovedProductDetails from './ImprovedProductDetails';

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  type: string;
  basePrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string;
  dimensions?: Record<string, unknown>;
  description?: string | null;
  shortDescription?: string | null;
  featuredImage?: string | null;
  galleryImages?: unknown;
  updatedAt?: Date;
  createdAt?: Date;
  lastSyncedAt?: Date | null;
}

interface Category {
  id: string;
  name: string;
  slug?: string | null;
}

interface Variant {
  id: string;
  sku: string;
  image?: string | null;
  price?: string | null;
  stockStatus?: string | null;
  attributes?: Record<string, unknown>;
}

interface ProductDetailPageWithVersionSelectorProps {
  product: Product;
  categories: (Category | { id: null; name: null; slug: null })[];
  variants: Variant[];
  allImages: string[];
}

export function ProductDetailPageWithVersionSelector({
  product,
  categories,
  variants,
  allImages,
}: ProductDetailPageWithVersionSelectorProps) {
  const { version, changeVersion } = useUIVersion();

  // Filter out null categories and ensure proper typing
  const validCategories = categories.filter(
    (cat): cat is Category => cat.id !== null && cat.name !== null
  ) as Category[];

  return (
    <>
      {version === 'original' ? (
        <OriginalProductDetailPage
          product={product}
          categories={validCategories}
          variants={variants}
          allImages={allImages}
        />
      ) : (
        <ImprovedProductDetails
          product={{
            ...product,
            updatedAt: product.updatedAt?.toISOString(),
            createdAt: product.createdAt?.toISOString(),
            lastSyncedAt: product.lastSyncedAt?.toISOString() || null,
          }}
          categories={validCategories}
          variants={variants.map((v) => ({
            ...v,
            price: v.price ? String(v.price) : null,
          }))}
          allImages={allImages}
        />
      )}

      <VersionSelector
        currentVersion={version}
        onVersionChange={changeVersion}
      />
    </>
  );
}
