'use client';

import Link from 'next/link';
import { VersionSelector, useUIVersion } from '@/components/ui/version-selector';
import ProductEditor from '../components/ProductEditor';
import ImprovedProductEditor from '../components/ImprovedProductEditor';

type ProductData = {
  id: string;
  sku: string;
  name: string;
  basePrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  status: 'published' | 'draft' | 'private';
  type: 'simple' | 'variable' | 'grouped';
  stockStatus?: string | null;
  dimensions?: { length?: string; width?: string; height?: string } | null;
  description?: string | null;
  shortDescription?: string | null;
};

interface ProductEditPageWithVersionSelectorProps {
  initial: ProductData;
}

export function ProductEditPageWithVersionSelector({
  initial,
}: ProductEditPageWithVersionSelectorProps) {
  const { version, changeVersion } = useUIVersion();

  return (
    <>
      {version === 'original' ? (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Rediger produkt
                </h1>
                <p className="mt-1 text-gray-500">SKU: {initial.sku}</p>
              </div>
              <Link
                href={`/products/${initial.id}`}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
              >
                Tilbage
              </Link>
            </div>

            <ProductEditor initial={initial} />
          </div>
        </div>
      ) : (
        <ImprovedProductEditor initial={initial} />
      )}
      
      <VersionSelector 
        currentVersion={version} 
        onVersionChange={changeVersion} 
      />
    </>
  );
}