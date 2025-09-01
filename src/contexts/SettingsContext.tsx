'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { useCallback } from 'react';
import { UserSettings } from '@/types/settings';

// Use isomorphic layout effect to prevent hydration mismatches
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const DEFAULT_SETTINGS: UserSettings = {
  currency: 'DKK',
  currencySymbol: 'kr',
  currencyPosition: 'right_space',
  productsPerPage: 24,
  defaultViewMode: 'grid',
  theme: 'ocean',
  colorMode: 'auto',
  font: 'sans',
  largeText: false,
  reducedMotion: false,
  compactMode: false,
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
    const settings = { ...DEFAULT_SETTINGS, ...data } as UserSettings;
    
    // Store in localStorage for next time (client-side only)
    setStoredSettings(settings);
    
    return settings;
  } catch (err) {
    // Silently handle all errors and use defaults
    console.warn('Failed to fetch settings, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

// Helper function to apply settings to DOM
function applySettingsToDOM(settings: UserSettings) {
  if (typeof window === 'undefined' || !document?.documentElement) return;
  
  try {
    const root = document.documentElement;
    
    // theme
    root.setAttribute('data-theme', settings.theme || 'ocean');
    
    // color mode
    const colorMode = settings.colorMode || 'auto';
    if (colorMode === 'auto') {
      // Use system preference - safely check for matchMedia support
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        root.setAttribute('data-color-mode', mediaQuery.matches ? 'dark' : 'light');
      } else {
        // Fallback for browsers without matchMedia support
        root.setAttribute('data-color-mode', 'light');
      }
    } else {
      root.setAttribute('data-color-mode', colorMode);
    }
    
    // font
    root.setAttribute('data-font', settings.font || 'sans');
    
    // text scale
    if (settings.largeText) root.classList.add('text-scale-lg');
    else root.classList.remove('text-scale-lg');
    
    // reduced motion
    if (settings.reducedMotion) root.classList.add('motion-reduce');
    else root.classList.remove('motion-reduce');
    
    // compact mode
    if (settings.compactMode) root.classList.add('compact-mode');
    else root.classList.remove('compact-mode');
  } catch (err) {
    console.warn('Failed to apply settings to DOM:', err);
  }
}

// Helper to safely get localStorage only on client
function getStoredSettings(): UserSettings | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('user-settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse stored settings:', err);
  }
  
  return null;
}

// Helper to safely set localStorage only on client
function setStoredSettings(settings: UserSettings) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('user-settings', JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to store settings:', err);
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  
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
    fallbackData: DEFAULT_SETTINGS, // Always use defaults as fallback to prevent hydration mismatch
  });

  // Track hydration state
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Debouncing refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<UserSettings>>({});

  // Initialize with stored settings on client-side only (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    
    const stored = getStoredSettings();
    if (stored && !settings) {
      mutate(stored, false);
    }
  }, [mutate, settings, isHydrated]);

  // Debounced save function
  const debouncedSave = useCallback(async (updates: Partial<UserSettings>) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Merge with pending updates
    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      const toSave = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {}; // Clear pending updates

      console.debug('💾 Saving batched settings:', Object.keys(toSave));

      try {
        const response = await fetch('/api/settings/user', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(toSave),
        });

        if (!response.ok) {
          console.warn('Failed to save settings to server');
          // Don't revert optimistic updates for better UX
          return;
        }

        console.debug('✅ Settings saved successfully');
        // Revalidate from server
        mutate();
      } catch (err) {
        console.error('Failed to save settings:', err);
      }
    }, 750); // 750ms debounce delay for better batching
  }, [mutate]);

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>): Promise<UserSettings> => {
      const current = settings || DEFAULT_SETTINGS;
      const updated = { ...current, ...newSettings };
      
      // Immediate optimistic update
      mutate(updated, false);
      
      // Update localStorage immediately (client-side only)
      setStoredSettings(updated);
      
      // Apply to DOM immediately
      applySettingsToDOM(updated);
      
      // Debounced server save
      debouncedSave(newSettings);
      
      // Return the updated settings for compatibility
      return updated;
    },
    [mutate, settings, debouncedSave]
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

  // Apply theme + font to document root (only after hydration)
  useIsomorphicLayoutEffect(() => {
    if (!isHydrated) return;
    
    const s = settings || DEFAULT_SETTINGS;
    applySettingsToDOM(s);
    
    // Set up listener for auto color mode changes
    if (s.colorMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const root = document.documentElement;
        root.setAttribute('data-color-mode', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings, isHydrated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
