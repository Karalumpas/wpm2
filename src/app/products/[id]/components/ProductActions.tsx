'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  MoreVertical, 
  Eye,
  Share2,
  Download,
  Archive
} from 'lucide-react';

interface ProductActionsProps {
  productId: string;
  productName: string;
  shopUrl?: string;
  productUrl?: string;
}

export function ProductActions({
  productId,
  productName,
  shopUrl,
  productUrl,
}: ProductActionsProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleDuplicate = async () => {
    setIsLoading('duplicate');
    try {
      const response = await fetch(`/api/products/${productId}/duplicate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { newProductId } = await response.json();
        router.push(`/products/${newProductId}`);
      } else {
        throw new Error('Failed to duplicate product');
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      alert('Kunne ikke duplikere produktet. Prøv igen.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleSync = async () => {
    setIsLoading('sync');
    try {
      const response = await fetch(`/api/products/${productId}/sync`, {
        method: 'POST',
      });
      
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error('Failed to sync product');
      }
    } catch (error) {
      console.error('Error syncing product:', error);
      alert('Kunne ikke synkronisere produktet. Prøv igen.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Er du sikker på, at du vil slette "${productName}"? Dette kan ikke fortrydes.`)) {
      return;
    }

    setIsLoading('delete');
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/products');
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Kunne ikke slette produktet. Prøv igen.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleOpenInShop = () => {
    if (productUrl) {
      window.open(productUrl, '_blank');
    } else if (shopUrl) {
      window.open(shopUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link kopieret til udklipsholder');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Primary actions */}
      <button
        onClick={handleDuplicate}
        disabled={isLoading === 'duplicate'}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading === 'duplicate' ? (
          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Dupliker
      </button>

      {(productUrl || shopUrl) && (
        <button
          onClick={handleOpenInShop}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Se i shop
        </button>
      )}

      <button
        onClick={handleSync}
        disabled={isLoading === 'sync'}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isLoading === 'sync' ? (
          <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Synkroniser
      </button>

      {/* More actions dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={handleShare}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Del link
              </button>
              
              <button
                onClick={() => window.print()}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Eksporter
              </button>

              <button
                onClick={() => {/* Implement archive */}}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                Arkiver
              </button>

              <hr className="my-1" />
              
              <button
                onClick={handleDelete}
                disabled={isLoading === 'delete'}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading === 'delete' ? (
                  <div className="animate-spin h-4 w-4 border border-red-600 border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Slet produkt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
