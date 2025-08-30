'use client';

import { useState } from 'react';
import { ExternalLink, ChevronDown, Store } from 'lucide-react';
import { ProductListItem } from '@/types/product';
import { useShops } from '../hooks/useShops';

interface ShopLinksButtonProps {
  product: ProductListItem;
}

export function ShopLinksButton({ product }: ShopLinksButtonProps) {
  const { shops, isLoading } = useShops();
  const [showDropdown, setShowDropdown] = useState(false);

  if (isLoading) {
    return (
      <button
        disabled
        className="px-4 py-3 border-2 border-gray-200 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
      >
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  const connectedShops = shops.filter((shop) => shop.isConnected);

  if (connectedShops.length === 0) {
    return (
      <button
        disabled
        className="px-4 py-3 border-2 border-gray-200 text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2 min-w-[100px]"
        title="No connected shops available"
      >
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline">No Shops</span>
      </button>
    );
  }

  // Single shop - direct link
  if (connectedShops.length === 1) {
    const shop = connectedShops[0];

    const handleShopClick = () => {
      // Generate product URL for the shop
      // This is a placeholder - in real implementation, you'd have proper URL generation
      const productUrl = `${shop.url.replace(/\/$/, '')}/product/${product.slug || product.sku}`;
      window.open(productUrl, '_blank', 'noopener,noreferrer');
    };

    return (
      <button
        onClick={handleShopClick}
        className="px-4 py-3 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-lg hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 min-w-[100px] shadow-sm hover:shadow-md"
        title={`View on ${shop.name}`}
      >
        <ExternalLink className="w-4 h-4" />
        <span className="hidden sm:inline">Visit Shop</span>
      </button>
    );
  }

  // Multiple shops - dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="px-4 py-3 border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 rounded-lg hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 min-w-[100px] shadow-sm hover:shadow-md"
        title="View on shop"
      >
        <Store className="w-4 h-4" />
        <span className="hidden sm:inline">{connectedShops.length} Shops</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
        />
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border-2 border-gray-100 shadow-xl z-20 overflow-hidden">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Choose Shop
              </div>
              {connectedShops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => {
                    const productUrl = `${shop.url.replace(/\/$/, '')}/product/${product.slug || product.sku}`;
                    window.open(productUrl, '_blank', 'noopener,noreferrer');
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform duration-200">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 group-hover:text-blue-700">
                      {shop.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {shop.url}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
