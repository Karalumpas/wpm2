'use client';

import Image from 'next/image';
import { useState, useMemo, useRef } from 'react';
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
  const clamp = (n: number) =>
    unique.length ? (n + unique.length) % unique.length : 0;
  // Swipe support
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const deltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const threshold = 40;
  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY };
    deltaRef.current = { x: 0, y: 0 };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current) return;
    deltaRef.current = {
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
    };
  }
  function onPointerUp(e: React.PointerEvent) {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const dx = deltaRef.current.x;
    if (Math.abs(dx) > threshold)
      setActive((i) => clamp(i + (dx < 0 ? 1 : -1)));
    startRef.current = null;
    deltaRef.current = { x: 0, y: 0 };
  }

  const main = unique[active] || unique[0] || '';

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div
        className="relative aspect-square bg-gray-100"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {main ? (
          <Image
            src={main}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {unique.length > 0 && (
        <div className="p-4 border-t">
          <ThumbsSlider
            images={unique}
            altBase={alt}
            onSelect={(i) => setActive(i)}
          />
          {unique.length > 1 && (
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setActive((i) => clamp(i - 1))}
                className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50"
              >
                Prev
              </button>
              <div className="flex gap-1">
                {unique.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-1.5 w-4 rounded-full cursor-pointer ${i === active ? 'bg-gray-800' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setActive((i) => clamp(i + 1))}
                className="px-3 py-1.5 text-xs rounded border hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
