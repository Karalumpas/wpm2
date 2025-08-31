'use client';

import { ProcessedSearchParams } from '../params';
import { ProductsPage } from './ProductsPage';
import { ImprovedProductsPage } from './ImprovedProductsPage';
import { VersionSelector, useUIVersion } from '@/components/ui/version-selector';

interface ProductsPageWithVersionSelectorProps {
  initialParams: ProcessedSearchParams;
}

export function ProductsPageWithVersionSelector({ 
  initialParams 
}: ProductsPageWithVersionSelectorProps) {
  const { version, changeVersion } = useUIVersion();

  return (
    <>
      {version === 'original' ? (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <ProductsPage initialParams={initialParams} />
        </div>
      ) : (
        <ImprovedProductsPage initialParams={initialParams} />
      )}
      
      <VersionSelector 
        currentVersion={version} 
        onVersionChange={changeVersion} 
      />
    </>
  );
}