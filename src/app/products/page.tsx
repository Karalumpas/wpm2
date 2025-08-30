import { Suspense } from 'react';
import { parseSearchParams, normalizeParams } from './params';
import { ProductsPage } from './components/ProductsPage';
import { ProductsPageSkeleton } from './components/ProductsPageSkeleton';

/**
 * Products List Page - Server Component
 * 
 * This is the main page for browsing products with filtering, sorting,
 * search, and pagination. Uses App Router and URL-based state management.
 */

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: ProductsPageProps) {
  // Parse and normalize search parameters
  const resolvedSearchParams = await searchParams;
  const params = normalizeParams(parseSearchParams(resolvedSearchParams));

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<ProductsPageSkeleton />}>
        <ProductsPage initialParams={params} />
      </Suspense>
    </div>
  );
}

/**
 * Metadata for the page
 */
export const metadata = {
  title: 'Products - WooCommerce Product Manager',
  description: 'Browse and manage your product catalog',
};
