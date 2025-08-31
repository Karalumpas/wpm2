'use client';

import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Search } from 'lucide-react';

type Brand = { id: string; name: string; productCount: number };
type ApiList = { success: true; brands: Brand[] };

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function BrandsClient() {
  const [query, setQuery] = useState('');
  const { data, error, mutate, isLoading } = useSWR<ApiList>(
    `/api/brands${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    fetcher
  );

  const brands = data?.brands || [];
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  async function createBrand(name: string) {
    const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create brand');
    await mutate();
  }
  async function updateBrand(id: string, name: string) {
    const res = await fetch(`/api/brands/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update brand');
    await mutate();
  }
  async function deleteBrand(id: string, moveToBrandId?: string) {
    const res = await fetch(`/api/brands/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moveToBrandId }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete brand');
    await mutate();
  }
  async function mergeBrands(sourceIds: string[], targetId: string) {
    const res = await fetch('/api/brands/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceIds, targetId }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Merge failed');
    await mutate();
  }

  function Row({ b }: { b: Brand }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(b.name);
    const used = b.productCount > 0;
    return (
      <div className="border rounded-lg p-3 bg-white flex items-center justify-between">
        {!editing ? (
          <div>
            <div className="text-sm font-semibold text-gray-900">{b.name}</div>
            <div className="text-xs text-gray-700">{b.productCount} products</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <input className="flex-1 border rounded px-2 py-1 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50 text-rose-700 border-rose-200"
                onClick={async () => {
                  if (used) {
                    const target = prompt('Brand is used by products. Enter target brand ID to move product associations before delete, or leave empty to cancel.');
                    if (!target) return;
                    await deleteBrand(b.id, target);
                  } else {
                    if (confirm('Delete this brand?')) {
                      await deleteBrand(b.id);
                    }
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </>
          ) : (
            <>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-indigo-600 text-white border-indigo-600 hover:brightness-110" onClick={async () => { await updateBrand(b.id, name.trim()); setEditing(false); }}>
                <Save className="h-3.5 w-3.5" /> Save
              </button>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => { setName(b.name); setEditing(false); }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Brands</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="pl-7 pr-2 py-2 border rounded-md text-sm w-64" placeholder="Search brands…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {!creating ? (
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New brand
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input className="border rounded px-2 py-1 text-sm" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Brand name" />
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110" onClick={async () => { if (!newName.trim()) return; await createBrand(newName.trim()); setNewName(''); setCreating(false); }}>
                <Save className="h-4 w-4" /> Save
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50" onClick={() => setCreating(false)}>
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-rose-700">Failed to load brands</div>}
      {isLoading && <div className="text-sm text-gray-700">Loading…</div>}

      <div className="grid gap-2">
        {brands.map((b) => (
          <Row key={b.id} b={b} />
        ))}
        {brands.length === 0 && <div className="text-sm text-gray-700">No brands yet. Create the first one.</div>}
      </div>

      {/* Bulk merge */}
      <BulkMerge brands={brands} onMerged={mergeBrands} />
    </div>
  );
}

function BulkMerge({ brands, onMerged }: { brands: Brand[]; onMerged: (sourceIds: string[], targetId: string) => Promise<void> }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [target, setTarget] = useState('');
  const sources = Object.keys(selected).filter((k) => selected[k]);
  const canMerge = target && sources.length > 0 && !selected[target];

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Bulk merge</div>
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 border rounded text-sm" value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Merge into…</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-60" disabled={!canMerge} onClick={async () => { await onMerged(sources, target); setSelected({}); setTarget(''); alert('Merge completed'); }}>
            Merge
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-auto">
        {brands.map((b) => (
          <label key={b.id} className="flex items-center gap-2 text-xs text-gray-800">
            <input type="checkbox" checked={!!selected[b.id]} onChange={(e) => setSelected((s) => ({ ...s, [b.id]: e.target.checked }))} />
            <span className="truncate">{b.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

