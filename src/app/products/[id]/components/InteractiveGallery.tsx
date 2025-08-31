'use client';

import SwipeCarousel from '@/components/ui/SwipeCarousel';
import { useCallback, useMemo, useRef, useState } from 'react';

type Props = {
  images: string[];
  alt: string;
};

export default function InteractiveGallery({ images, alt }: Props) {
  const unique = useMemo(
    () => Array.from(new Set(images)).filter(Boolean),
    [images]
  );
  const [index, setIndex] = useState(0);
  // lightbox removed

  const clamp = useCallback(
    (n: number) => (unique.length ? (n + unique.length) % unique.length : 0),
    [unique.length]
  );

  // Use unified SwipeCarousel to match list card style

  // no keyboard lightbox handlers

  const main = unique[index] || '';
  // shimmer removed

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Main image */}
      <div className="relative aspect-square bg-gray-100 group">
        {unique.length > 0 ? (
          <>
            <SwipeCarousel
              images={unique}
              alt={alt}
              index={index}
              onIndexChange={(i) => setIndex(i)}
              priority
            />
            <div className="absolute bottom-3 right-3 hidden sm:flex items-center gap-2 text-xs text-white/90 bg-black/40 backdrop-blur px-2 py-1 rounded-full">
              <span>{index + 1}</span>
              <span className="opacity-70">/</span>
              <span className="opacity-90">{unique.length}</span>
            </div>
          </>
        ) : (
          <EmptyImagePlaceholder />
        )}
      </div>

      {/* Thumbnails */}
      {unique.length > 1 && (
        <ThumbRow
          images={unique}
          activeIndex={index}
          onPick={(i) => setIndex(i)}
          alt={alt}
        />
      )}

      {/* Lightbox removed */}
    </div>
  );
}

function EmptyImagePlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
      <svg
        className="w-16 h-16"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 7v10a2 2 0 002 2h14"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 17V7a2 2 0 00-2-2H7"
        />
        <circle cx="9" cy="9" r="2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 15l-5-5L5 21"
        />
      </svg>
    </div>
  );
}

function ThumbRow({
  images,
  activeIndex,
  onPick,
  alt,
}: {
  images: string[];
  activeIndex: number;
  onPick: (i: number) => void;
  alt: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (delta: number) =>
    scroller.current?.scrollBy({ left: delta, behavior: 'smooth' });

  return (
    <div
      className="relative border-t"
      role="region"
      aria-label="Produktbilleder, miniaturer"
    >
      <div className="flex items-center">
        <button
          onClick={() => scrollBy(-240)}
          className="hidden sm:inline-flex ml-2 my-3 p-2 rounded-md border bg-white hover:bg-gray-50"
          aria-label="Prev thumbs"
        >
          ‹
        </button>
        <div
          ref={scroller}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory p-3"
          role="listbox"
          aria-label="Billedgalleri"
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => onPick(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 snap-start focus:outline-none ${
                i === activeIndex
                  ? 'ring-2 ring-indigo-500 border-indigo-300'
                  : 'border-gray-200'
              }`}
              title={`Billede ${i + 1}`}
              role="option"
              aria-selected={i === activeIndex}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <button
          onClick={() => scrollBy(240)}
          className="hidden sm:inline-flex mr-2 my-3 p-2 rounded-md border bg-white hover:bg-gray-50"
          aria-label="Next thumbs"
        >
          ›
        </button>
      </div>
    </div>
  );
}
