'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  ProcessedSearchParams,
  serializeSearchParams,
  parseSearchParams,
  normalizeParams,
} from '../params';

/**
 * Hook for managing URL-based state for products page
 *
 * Provides synchronized URL state management with browser history
 * and proper type safety.
 */
export function useUrlState(initialParams: ProcessedSearchParams) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Stable reference to initial params
  const stableInitialParams = useMemo(() => initialParams, []);

  // Use initial params as base and only re-parse when URL actually changes
  const params = useMemo(() => {
    const urlString = searchParams.toString();

    // Return initial params if URL is empty to prevent unnecessary updates
    if (!urlString) {
      return stableInitialParams;
    }

    // Parse current URL params
    const current = Object.fromEntries(searchParams.entries());
    const parsed = normalizeParams(parseSearchParams(current));

    return parsed;
  }, [searchParams.toString(), stableInitialParams]); // Only depend on URL string and stable initial params

  // Update parameters
  const updateParams = useCallback(
    (updates: Partial<ProcessedSearchParams>) => {
      const newParams = { ...params, ...updates };

      // Reset pagination when filters change
      if (
        updates.search !== undefined ||
        updates.status !== undefined ||
        updates.type !== undefined ||
        updates.brandIds !== undefined ||
        updates.categoryIds !== undefined ||
        updates.sortBy !== undefined ||
        updates.sortOrder !== undefined
      ) {
        newParams.page = 1;
        newParams.cursor = undefined;
      }

      const serialized = serializeSearchParams(newParams);
      const urlParams = new URLSearchParams(serialized);

      // Remove empty parameters
      const cleanParams = new URLSearchParams();
      urlParams.forEach((value, key) => {
        if (value && value !== 'undefined' && value !== 'null') {
          cleanParams.set(key, value);
        }
      });

      const newUrl = cleanParams.toString() ? `?${cleanParams.toString()}` : '';
      router.push(`/products${newUrl}`, { scroll: false });
    },
    [params, router]
  );

  // Reset to defaults
  const resetParams = useCallback(() => {
    router.push('/products', { scroll: false });
  }, [router]);

  // Update single parameter
  const updateParam = useCallback(
    <K extends keyof ProcessedSearchParams>(
      key: K,
      value: ProcessedSearchParams[K]
    ) => {
      updateParams({ [key]: value });
    },
    [updateParams]
  );

  return {
    params,
    updateParams,
    updateParam,
    resetParams,
  };
}
