'use client';

import { useState } from 'react';
import { Plus, Upload, Download, Settings, X } from 'lucide-react';
import Link from 'next/link';

export function ProductsFloatingActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Plus,
      label: 'Add Product',
      href: '/products/new',
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      icon: Upload,
      label: 'Import Products',
      href: '/products/import',
      color: 'bg-green-600 hover:bg-green-700 text-white',
    },
    {
      icon: Download,
      label: 'Export Products',
      href: '/products/export',
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      icon: Settings,
      label: 'Product Settings',
      href: '/settings/products',
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <div
        className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${action.color}`}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center ${
          isOpen
            ? 'bg-red-600 hover:bg-red-700 text-white rotate-45'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/10 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
