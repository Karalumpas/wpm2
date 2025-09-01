'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Type,
  Zap,
  Minimize2,
  Check,
} from 'lucide-react';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview: string[];
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Cool blues and clean whites',
    colors: {
      primary: '#2563eb',
      secondary: '#93c5fd',
      accent: '#dbeafe',
    },
    preview: ['#2563eb', '#60a5fa', '#93c5fd'],
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges and golden tones',
    colors: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fed7aa',
    },
    preview: ['#ea580c', '#fb923c', '#fed7aa'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens and earth tones',
    colors: {
      primary: '#16a34a',
      secondary: '#34d399',
      accent: '#bbf7d0',
    },
    preview: ['#16a34a', '#34d399', '#bbf7d0'],
  },
  {
    id: 'royal',
    name: 'Royal',
    description: 'Rich purples and regal violets',
    colors: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#ddd6fe',
    },
    preview: ['#7c3aed', '#a78bfa', '#ddd6fe'],
  },
  {
    id: 'neutral',
    name: 'Neutral',
    description: 'Clean grays and professional tones',
    colors: {
      primary: '#3f3f46',
      secondary: '#a1a1aa',
      accent: '#e4e4e7',
    },
    preview: ['#3f3f46', '#a1a1aa', '#e4e4e7'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark navy with bright accents',
    colors: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      accent: '#1e40af',
    },
    preview: ['#0f0f23', '#1e1e2e', '#3b82f6'],
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Deep emerald with luminous greens',
    colors: {
      primary: '#10b981',
      secondary: '#34d399',
      accent: '#059669',
    },
    preview: ['#064e3b', '#065f46', '#10b981'],
  },
];

const COLOR_MODE_OPTIONS = [
  {
    id: 'light',
    name: 'Light',
    description: 'Always use light mode',
    icon: Sun,
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Always use dark mode',
    icon: Moon,
  },
  {
    id: 'auto',
    name: 'Auto',
    description: 'Follow system preference',
    icon: Monitor,
  },
];

const FONT_OPTIONS = [
  {
    id: 'sans',
    name: 'Sans-serif',
    description: 'Clean and modern',
    preview: 'The quick brown fox',
  },
  {
    id: 'serif',
    name: 'Serif',
    description: 'Traditional and elegant',
    preview: 'The quick brown fox',
  },
  {
    id: 'mono',
    name: 'Monospace',
    description: 'Code-friendly spacing',
    preview: 'The quick brown fox',
  },
];

export function AppearanceSettings() {
  const { settings, updateSettings } = useSettings();
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdateSetting = async (key: string, value: unknown) => {
    try {
      setSaving(key);
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error('Failed to update setting:', error);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white mb-4">
          <Palette className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appearance</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Customize your interface with colors, themes, and visual preferences
          that match your style.
        </p>
      </div>

      {/* Color Themes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Color Theme</h3>
            <p className="text-sm text-gray-600">
              Choose your preferred color scheme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleUpdateSetting('theme', theme.id)}
              disabled={saving === 'theme'}
              className={`group relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                settings.theme === theme.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Color Preview */}
              <div className="flex gap-1 mb-3">
                {theme.preview.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme Info */}
              <div className="mb-3">
                <div className="font-medium text-gray-900 text-sm">
                  {theme.name}
                </div>
                <div className="text-xs text-gray-500">{theme.description}</div>
              </div>

              {/* Selection Indicator */}
              {settings.theme === theme.id && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}

              {saving === 'theme' && settings.theme === theme.id && (
                <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Mode */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Light & Dark Mode
            </h3>
            <p className="text-sm text-gray-600">
              Control when to use light or dark interface
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {COLOR_MODE_OPTIONS.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => handleUpdateSetting('colorMode', mode.id)}
                disabled={saving === 'colorMode'}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  settings.colorMode === mode.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`p-2 rounded-lg ${
                      settings.colorMode === mode.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="font-medium text-gray-900">{mode.name}</div>
                </div>
                <div className="text-sm text-gray-600">{mode.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Typography */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <Type className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
            <p className="text-sm text-gray-600">
              Customize fonts and text size
            </p>
          </div>
        </div>

        {/* Font Family */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Font Family
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id}
                onClick={() => handleUpdateSetting('font', font.id)}
                disabled={saving === 'font'}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  settings.font === font.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  {font.name}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {font.description}
                </div>
                <div
                  className="text-sm text-gray-800"
                  style={{
                    fontFamily:
                      font.id === 'sans'
                        ? 'var(--font-sans)'
                        : font.id === 'serif'
                          ? 'serif'
                          : 'monospace',
                  }}
                >
                  {font.preview}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Text Size */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Text Size
          </label>
          <label className="inline-flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={!!settings.largeText}
              onChange={(e) =>
                handleUpdateSetting('largeText', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Large text</div>
              <div className="text-sm text-gray-600">
                Increase base font size for better readability
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Advanced</h3>
            <p className="text-sm text-gray-600">Fine-tune your experience</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Reduced Motion */}
          <label className="inline-flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={!!settings.reducedMotion}
              onChange={(e) =>
                handleUpdateSetting('reducedMotion', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Reduce motion</div>
              <div className="text-sm text-gray-600">
                Minimize animations and transitions
              </div>
            </div>
          </label>

          {/* Compact Mode */}
          <label className="inline-flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={!!settings.compactMode}
              onChange={(e) =>
                handleUpdateSetting('compactMode', e.target.checked)
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <Minimize2 className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium text-gray-900">Compact mode</div>
                <div className="text-sm text-gray-600">
                  Reduce spacing for more content density
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
