'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

export type SwipeCarouselProps = {
  images: string[];
  alt: string;
  index?: number;
  onIndexChange?: (i: number) => void;
  aspect?: 'square' | 'landscape' | 'portrait';
  draggable?: boolean;
  priority?: boolean;
  className?: string;
};

export default function SwipeCarousel({
  images,
  alt,
  index,
  onIndexChange,
  aspect = 'square',
  draggable = true,
  priority = false,
  className = '',
}: SwipeCarouselProps) {
  const slides = useMemo(
    () => Array.from(new Set(images)).filter(Boolean),
    [images]
  );
  const [internalIdx, setInternalIdx] = useState(0);
  const active = index ?? internalIdx;
  const setActive = (i: number) =>
    onIndexChange ? onIndexChange(i) : setInternalIdx(i);
  const clamp = (n: number) =>
    slides.length ? (n + slides.length) % slides.length : 0;

  // Drag state
  const startX = useRef<number | null>(null);
  const dx = useRef(0);
  const [drag, setDrag] = useState(0); // for rendering
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const threshold = 60; // px to swipe

  function onPointerDown(e: React.PointerEvent) {
    if (!draggable) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    dx.current = 0;
    setIsDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!draggable || startX.current === null) return;
    dx.current = e.clientX - startX.current;
    setDrag(dx.current);
    if (Math.abs(dx.current) > 3) {
      // Avoid page scroll on horizontal swipes
      e.preventDefault();
    }
  }
  function finishPointer() {
    const dist = dx.current;
    setIsDragging(false);
    setDrag(0);
    startX.current = null;
    if (Math.abs(dist) > threshold) {
      setActive(clamp(active + (dist < 0 ? 1 : -1)));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!draggable) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    finishPointer();
  }
  function onPointerCancel() {
    if (!draggable) return;
    finishPointer();
  }

  // Keyboard support
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActive(clamp(active + 1));
      if (e.key === 'ArrowLeft') setActive(clamp(active - 1));
    };
    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [active, clamp, setActive]);

  const aspectClass =
    aspect === 'portrait'
      ? 'aspect-[3/4]'
      : aspect === 'landscape'
        ? 'aspect-[4/3]'
        : 'aspect-square';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 ${aspectClass} ${className} touch-pan-y select-none`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="group"
      aria-label="Billedgalleri"
    >
      {/* Track */}
      <div
        className="absolute inset-0 flex will-change-transform"
        style={{
          transform: `translateX(calc(${(-active * 100).toFixed(2)}% + ${drag}px))`,
          transition: isDragging ? 'none' : 'transform 250ms ease',
        }}
      >
        {slides.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative shrink-0 grow-0 basis-full"
          >
            <Image
              src={src}
              alt={`${alt} ${i + 1}`}
              fill
              className="object-cover select-none"
              sizes="(max-width: 768px) 100vw, 50vw"
              draggable={false}
              priority={priority && i === 0}
            />
          </div>
        ))}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Gå til billede ${i + 1}`}
              aria-current={i === active}
              className={`h-2 w-2 rounded-full transition border border-white/40 ${
                i === active
                  ? 'bg-white shadow'
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
