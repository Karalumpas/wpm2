'use client';

import Image from 'next/image';
import { useRef } from 'react';

export default function ThumbsSlider({
  images,
  altBase,
}: {
  images: string[];
  altBase: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (delta: number) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pr-8"
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="w-16 h-16 rounded-lg overflow-hidden border hover:scale-105 transition-transform duration-150 flex-shrink-0 snap-start"
            title={`Image ${i + 1}`}
          >
            <Image
              src={src}
              alt={`${altBase} ${i + 1}`}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {/* Controls */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <div className="flex gap-2 bg-white/70 backdrop-blur px-1 py-1 rounded-md border">
          <button
            onClick={() => scrollBy(-160)}
            className="w-7 h-7 rounded-md bg-white border text-gray-700 hover:bg-gray-50 active:scale-95 transition"
            aria-label="Scroll left"
          >
            ◀
          </button>
          <button
            onClick={() => scrollBy(160)}
            className="w-7 h-7 rounded-md bg-white border text-gray-700 hover:bg-gray-50 active:scale-95 transition"
            aria-label="Scroll right"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

