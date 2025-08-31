'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductListItem } from '@/types/product';
import { useSettings } from '@/hooks/useSettings';
import { formatPrice } from '@/lib/utils/currency';
import { ExternalLink, Pencil, Copy, Store } from 'lucide-react';
import { ShopLinksButton } from './ShopLinksButton';

type Props = { product: ProductListItem };

export function EnhancedProductCard({ product }: Props) {
  const { settings } = useSettings();

  const images = useMemo(() => {
    const list: string[] = [];
    if (product.featuredImage) list.push(product.featuredImage);
    if (product.images && product.images.length) list.push(...product.images);
    const unique = Array.from(new Set(list));
    return unique.length ? unique : [];
  }, [product.featuredImage, product.images?.join(',')]);

  const [idx, setIdx] = useState(0);
  const clampIdx = (n: number) => (images.length ? (n + images.length) % images.length : 0);

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
    deltaRef.current = { x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y };
  }
  function onPointerUp(e: React.PointerEvent) {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const dx = deltaRef.current.x;
    if (Math.abs(dx) > threshold) {
      setIdx((i) => clampIdx(i + (dx < 0 ? 1 : -1)));
    }
    startRef.current = null;
    deltaRef.current = { x: 0, y: 0 };
  }

  const price = formatPrice(product.basePrice, settings);
  const statusClass =
    product.status === 'published'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : product.status === 'draft'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all">
      {/* Image carousel */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
        {images.length > 0 ? (
          <div
            className="absolute inset-0"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <Image
              key={images[idx]}
              src={images[idx]}
              alt={product.name}
              fill
              className="object-cover select-none"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              draggable={false}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
        )}

        {/* Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => clampIdx(i - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 border shadow"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx((i) => clampIdx(i + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 border shadow"
              aria-label="Next image"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 w-4 rounded-full cursor-pointer ${i === idx ? 'bg-white' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
            <div className="text-xs text-gray-500 mt-0.5">SKU: {product.sku}</div>
          </div>
          <span className={`px-2 py-1 text-[11px] rounded-full border ${statusClass}`}>{product.status}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">{price}</div>
          <div className="flex items-center gap-2">
            <Link href={`/products/${product.id}/edit`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" title="Edit">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Link>
            <Link href={`/products/${product.id}`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" title="Open">
              <ExternalLink className="w-3.5 h-3.5" /> View
            </Link>
          </div>
        </div>

        {/* Shops quick links */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Store className="w-3.5 h-3.5 text-gray-500" />
            <span>Available on shops</span>
          </div>
          <ShopLinksButton product={product} />
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => navigator.clipboard.writeText(product.id)}
            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
            title="Copy Product ID"
          >
            <Copy className="w-3.5 h-3.5" /> ID
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(product.sku)}
            className="text-xs px-2 py-1 rounded-md border hover:bg-gray-50 inline-flex items-center gap-1"
            title="Copy SKU"
          >
            <Copy className="w-3.5 h-3.5" /> SKU
          </button>
        </div>
      </div>
    </div>
  );
}

