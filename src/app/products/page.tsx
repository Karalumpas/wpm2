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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog with advanced filtering and search capabilities.
          </p>
        </div>
      </div>

      {/* Products Content */}
      <div className="px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<ProductsPageSkeleton />}>
          <ProductsPage initialParams={params} />
        </Suspense>
      </div>
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
