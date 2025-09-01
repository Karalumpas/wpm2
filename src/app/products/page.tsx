import { Suspense } from 'react';
import { auth } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import { parseSearchParams, normalizeParams } from './params';
import { ImprovedProductsPage } from './components/ImprovedProductsPage';
import { ProductsPageSkeleton } from './components/ProductsPageSkeleton';

/**
 * Products List Page - Server Component
 *
 * Enhanced version with modern UI design featuring:
 * - Modern gradient backgrounds and improved visual hierarchy
 * - Better stats dashboard with quick insights
 * - Enhanced filtering and search capabilities
 * - Improved grid/list views with hover effects
 * - Better loading states and error handling
 */

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: ProductsPageProps) {
  // Require authentication; redirect to login if not signed in
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  // Parse and normalize search parameters
  const resolvedSearchParams = await searchParams;
  const params = normalizeParams(parseSearchParams(resolvedSearchParams));

  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ImprovedProductsPage initialParams={params} />
    </Suspense>
  );
}

/**
 * Metadata for the page
 */
export const metadata = {
  title: 'Products - Enhanced Product Manager',
  description:
    'Browse and manage your product catalog with an enhanced user experience',
};
