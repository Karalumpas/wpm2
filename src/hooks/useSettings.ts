'use client';

import { useState, useEffect } from 'react';
import { UserSettings } from '@/types/settings';

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'DKK',
  currencySymbol: 'kr',
  currencyPosition: 'right_space',
  productsPerPage: 24,
  defaultViewMode: 'grid',
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false); // Changed to false initially
  const [error, setError] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings/user');
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          // User not authenticated or not found - use defaults silently
          setSettings(DEFAULT_SETTINGS);
          setIsLoading(false);
          return;
        }
        // Don't throw for server errors, just use defaults
        console.warn(`Settings API returned ${response.status}, using defaults`);
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      // Silently handle all errors and use defaults
      console.warn('Failed to fetch settings, using defaults:', err);
      setSettings(DEFAULT_SETTINGS);
      // Don't set error state as this is not critical for app functionality
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update settings');
      }
      
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      
      return updatedSettings;
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}
