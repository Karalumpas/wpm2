'use client';

import { useState, useEffect } from 'react';

export interface Shop {
  id: string;
  name: string;
  url: string;
  status: string;
  isConnected?: boolean;
}

export function useShop(shopId?: string) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }

    const fetchShop = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/shops/${shopId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shop: ${response.statusText}`);
        }
        
        const shopData = await response.json();
        setShop(shopData);
        setError(null);
      } catch (err) {
        console.error('Error fetching shop:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch shop');
        setShop(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [shopId]);

  return { shop, isLoading, error };
}

export function useShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/shops');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shops: ${response.statusText}`);
        }
        
        const data = await response.json();
        setShops(data.shops || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching shops:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch shops');
        setShops([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShops();
  }, []);

  return { shops, isLoading, error };
}
