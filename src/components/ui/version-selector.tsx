'use client';

import { useState, useEffect } from 'react';
import { Eye, Sparkles, Settings } from 'lucide-react';

type UIVersion = 'original' | 'improved';

interface VersionSelectorProps {
  onVersionChange: (version: UIVersion) => void;
  currentVersion: UIVersion;
}

export function VersionSelector({ onVersionChange, currentVersion }: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        title="Switch UI Version"
      >
        <Settings className="h-5 w-5 hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Version Options */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 min-w-72">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">UI Version</h3>
            <p className="text-xs text-gray-500">Choose your preferred interface design</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                onVersionChange('original');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                currentVersion === 'original'
                  ? 'bg-blue-50 border-2 border-blue-200 text-blue-900'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Eye className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Original UI</div>
                <div className="text-xs text-gray-500">Current production interface</div>
              </div>
              {currentVersion === 'original' && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                onVersionChange('improved');
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                currentVersion === 'improved'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-900'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm flex items-center gap-2">
                  Enhanced UI
                  <span className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full">
                    New
                  </span>
                </div>
                <div className="text-xs text-gray-500">Modern design with improved UX</div>
              </div>
              {currentVersion === 'improved' && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Your preference will be saved locally
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function useUIVersion() {
  const [version, setVersion] = useState<UIVersion>('original');

  useEffect(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('ui-version') as UIVersion;
    if (saved && ['original', 'improved'].includes(saved)) {
      setVersion(saved);
    }
  }, []);

  const changeVersion = (newVersion: UIVersion) => {
    setVersion(newVersion);
    localStorage.setItem('ui-version', newVersion);
  };

  return { version, changeVersion };
}