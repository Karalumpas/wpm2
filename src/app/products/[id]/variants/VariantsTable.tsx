'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

type VariantRow = {
  id: string;
  sku: string;
  image?: string;
  price?: string;
  stockStatus: string;
};

export default function VariantsTable({
  variants,
}: {
  variants: VariantRow[];
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const allSelected = useMemo(
    () => variants.length > 0 && variants.every((v) => selected[v.id]),
    [variants, selected]
  );
  const selectedCount = useMemo(
    () => variants.filter((v) => selected[v.id]).length,
    [variants, selected]
  );

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      for (const v of variants) next[v.id] = true;
      setSelected(next);
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const onBulk = async (action: 'edit' | 'sync' | 'export') => {
    const ids = variants.filter((v) => selected[v.id]).map((v) => v.id);
    if (!ids.length) return;
    try {
      if (action === 'sync') {
        await fetch('/api/variants/bulk/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        alert(`Synkroniserede ${ids.length} varianter`);
      } else if (action === 'export') {
        await fetch('/api/variants/bulk/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        alert(`Eksporterede ${ids.length} varianter (kø ved backend)`);
      } else if (action === 'edit') {
        const price = prompt('Ny pris (tom for at springe over)');
        const stockStatus = prompt('Ny lagerstatus (instock/outofstock/onbackorder)');
        await fetch('/api/variants/bulk/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: ids.map((id) => ({ id, price: price || undefined, stockStatus: stockStatus || undefined })),
          }),
        });
        alert(`Opdaterede ${ids.length} varianter`);
      }
    } catch (e) {
      console.error(e);
      alert('Handling fejlede');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Vælg alle ({selectedCount}/{variants.length})
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onBulk('edit')}
            disabled={!selectedCount}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Rediger valgte
          </button>
          <button
            onClick={() => onBulk('sync')}
            disabled={!selectedCount}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Synkronisér valgte
          </button>
          <button
            onClick={() => onBulk('export')}
            disabled={!selectedCount}
            className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-800 hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Eksportér til webshop
          </button>
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 border-b">
        <div className="col-span-1">Vælg</div>
        <div className="col-span-2">Billede</div>
        <div className="col-span-3">SKU</div>
        <div className="col-span-2">Pris</div>
        <div className="col-span-2">Lager</div>
        <div className="col-span-2">Handling</div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {variants.map((v) => (
          <div
            key={v.id}
            className="grid grid-cols-12 gap-4 px-4 py-3 items-center"
          >
            <div className="col-span-12 md:col-span-1">
              <input
                type="checkbox"
                checked={!!selected[v.id]}
                onChange={() => toggleOne(v.id)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-12 md:col-span-2">
              <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100">
                {v.image ? (
                  <Image
                    src={v.image}
                    alt={v.sku}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg
                      className="w-5 h-5"
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
            </div>
            <div className="col-span-12 md:col-span-3">
              <div className="font-medium text-gray-900">{v.sku}</div>
              <div className="text-xs text-gray-500">ID: {v.id}</div>
            </div>
            <div className="col-span-6 md:col-span-2 text-gray-800">
              {v.price ? `${Number(v.price).toFixed(2)}` : '-'}
            </div>
            <div className="col-span-6 md:col-span-2">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-50 border">
                {v.stockStatus}
              </span>
            </div>
            <div className="col-span-12 md:col-span-2 flex gap-2">
              <button
                onClick={() => onBulk('edit')}
                className="px-3 py-1.5 rounded-md bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
              >
                Rediger
              </button>
              <button
                onClick={() => onBulk('sync')}
                className="px-3 py-1.5 rounded-md bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:shadow-lg hover:brightness-110 transition-all"
              >
                Sync
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
