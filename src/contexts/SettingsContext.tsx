'use client';

import { createContext, useContext, useCallback } from 'react';
import useSWR from 'swr';
import { UserSettings } from '@/types/settings';

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'DKK',
  currencySymbol: 'kr',
  currencyPosition: 'right_space',
  productsPerPage: 24,
  defaultViewMode: 'grid',
};

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<UserSettings>;
  refetch: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Fetcher function for SWR
async function settingsFetcher(): Promise<UserSettings> {
  try {
    const response = await fetch('/api/settings/user');

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        // User not authenticated or not found - use defaults silently
        return DEFAULT_SETTINGS;
      }
      // Don't throw for server errors, just use defaults
      console.warn(`Settings API returned ${response.status}, using defaults`);
      return DEFAULT_SETTINGS;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    // Silently handle all errors and use defaults
    console.warn('Failed to fetch settings, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const {
    data: settings,
    error,
    isLoading,
    mutate,
  } = useSWR<UserSettings>('/api/settings/user', settingsFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 30000, // Cache for 30 seconds
    errorRetryCount: 1,
    fallbackData: DEFAULT_SETTINGS,
  });

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      try {
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

        // Update SWR cache
        mutate(updatedSettings, false);

        return updatedSettings;
      } catch (err) {
        console.error('Failed to update settings:', err);
        throw err;
      }
    },
    [mutate]
  );

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  const contextValue: SettingsContextType = {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error: error
      ? error instanceof Error
        ? error.message
        : 'Failed to load settings'
      : null,
    updateSettings,
    refetch,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
