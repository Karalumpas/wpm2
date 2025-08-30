'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface MultiSelectFilterProps {
  label?: string;
  options: FilterOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
  compact?: boolean;
}

export function MultiSelectFilter({
  label,
  options,
  selectedIds,
  onSelectionChange,
  placeholder = "Select...",
  isLoading = false,
  compact = false,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));

  const handleOptionToggle = (optionId: string) => {
    const newSelection = selectedIds.includes(optionId)
      ? selectedIds.filter(id => id !== optionId)
      : [...selectedIds, optionId];
    
    onSelectionChange(newSelection);
  };

  const handleRemoveSelection = (optionId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== optionId));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      {/* Selected items display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedOptions.map(option => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {option.name}
              {option.count !== undefined && (
                <span className="text-blue-600">({option.count})</span>
              )}
              <button
                onClick={() => handleRemoveSelection(option.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={isLoading}
      >
        <span className="block truncate text-sm">
          {selectedOptions.length > 0
            ? `${selectedOptions.length} selected`
            : placeholder
          }
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>

      {/* Dropdown content */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            <div className="py-1">
              {options.map(option => (
                <label
                  key={option.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(option.id)}
                    onChange={() => handleOptionToggle(option.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-900 flex-1">
                    {option.name}
                  </span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-500">
                      ({option.count})
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
