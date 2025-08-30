'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import ThumbsSlider from './ThumbsSlider';

export default function ProductImages({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const unique = useMemo(() => Array.from(new Set(images)), [images]);
  const [active, setActive] = useState(0);

  const main = unique[active] || unique[0] || '';

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="relative aspect-square bg-gray-100">
        {main ? (
          <Image src={main} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {unique.length > 0 && (
        <div className="p-4 border-t">
          <ThumbsSlider images={unique} altBase={alt} onSelect={(i) => setActive(i)} />
        </div>
      )}
    </div>
  );
}

