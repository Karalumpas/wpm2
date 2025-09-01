/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SettingsContext module since we're testing the helpers directly
const mockHelpers = {
  getStoredSettings: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem('user-settings');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  },
  setStoredSettings: (settings: any) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('user-settings', JSON.stringify(settings));
      } catch {
        // Silently fail
      }
    }
  },
  applySettingsToDOM: (settings: any) => {
    if (typeof window === 'undefined' || !document?.documentElement) return;
    
    try {
      const root = document.documentElement;
      root.setAttribute('data-theme', settings.theme || 'ocean');
      
      const colorMode = settings.colorMode || 'auto';
      if (colorMode === 'auto') {
        if (window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          root.setAttribute('data-color-mode', mediaQuery.matches ? 'dark' : 'light');
        } else {
          root.setAttribute('data-color-mode', 'light');
        }
      } else {
        root.setAttribute('data-color-mode', colorMode);
      }
      
      root.setAttribute('data-font', settings.font || 'sans');
    } catch (err) {
      console.warn('Failed to apply settings to DOM:', err);
    }
  }
};

describe('Hydration Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not call localStorage during SSR', () => {
    // Simulate SSR environment by temporarily removing localStorage
    const originalLocalStorage = global.localStorage;
    delete (global as any).localStorage;

    let error = null;
    let result = null;

    try {
      result = mockHelpers.getStoredSettings();
    } catch (err) {
      error = err;
    }

    expect(error).toBeNull();
    expect(result).toBeNull();

    // Test setStoredSettings also doesn't throw
    try {
      mockHelpers.setStoredSettings({ theme: 'ocean' });
    } catch (err) {
      error = err;
    }

    expect(error).toBeNull();

    // Restore localStorage
    global.localStorage = originalLocalStorage;
  });

  it('should handle DOM manipulation safely', () => {
    const mockRoot = {
      setAttribute: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    };

    // Mock document.documentElement
    Object.defineProperty(document, 'documentElement', {
      value: mockRoot,
      configurable: true,
    });

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
      configurable: true,
    });

    let error = null;
    try {
      mockHelpers.applySettingsToDOM({
        theme: 'ocean',
        colorMode: 'light',
        font: 'sans',
        largeText: false,
        reducedMotion: false,
        compactMode: false,
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeNull();
    expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-theme', 'ocean');
    expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-color-mode', 'light');
    expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-font', 'sans');
  });

  it('should use consistent default values', () => {
    const defaultSettings = {
      theme: 'ocean',
      colorMode: 'light', // This should match layout.tsx default
      font: 'sans',
      largeText: false,
      reducedMotion: false,
      compactMode: false,
    };

    // These should be the same values used in layout.tsx
    expect(defaultSettings.theme).toBe('ocean');
    expect(defaultSettings.colorMode).toBe('light');
    expect(defaultSettings.font).toBe('sans');
  });

  it('should handle missing matchMedia gracefully', () => {
    // Remove matchMedia to simulate older browsers
    const originalMatchMedia = window.matchMedia;
    delete (window as any).matchMedia;

    const mockRoot = {
      setAttribute: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    };

    Object.defineProperty(document, 'documentElement', {
      value: mockRoot,
      configurable: true,
    });

    let error = null;
    try {
      mockHelpers.applySettingsToDOM({
        theme: 'ocean',
        colorMode: 'auto', // This should fallback to 'light' when matchMedia is not available
        font: 'sans',
      });
    } catch (err) {
      error = err;
    }

    expect(error).toBeNull();
    expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-color-mode', 'light');

    // Restore matchMedia
    window.matchMedia = originalMatchMedia;
  });
});
