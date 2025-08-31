'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { Search, FolderPlus, Save, X, Download, Settings, Package, Folder, Tag } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  sku: string;
  featuredImage?: string | null;
};

type ApiProducts = {
  items: Array<{
    id: string;
    name: string;
    sku: string;
    featuredImage?: string | null;
  }>;
};

type Shop = { id: string; name: string; count?: number };

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

type BuilderCategory = { id: string; name: string; productIds: string[] };

export default function ShopBuilderClient() {
  // Catalog
  const [query, setQuery] = useState('');
  const { data: shopsData } = useSWR<{ shops: Shop[] }>('/api/shops', fetcher);
  const [shopId, setShopId] = useState<string | ''>('');
  const { data: productsData, mutate: reloadProducts } = useSWR<ApiProducts>(
    `/api/products?limit=60${query ? `&search=${encodeURIComponent(query)}` : ''}${shopId ? `&shopIds=${shopId}` : ''}`,
    fetcher
  );
  const products: Product[] = (productsData?.items || []).map((p) => ({ id: p.id, name: p.name, sku: p.sku, featuredImage: (p as any).featuredImage }));

  // Builder State
  const [builderName, setBuilderName] = useState('New Webshop');
  const [builderSlug, setBuilderSlug] = useState('new-webshop');
  const [currency, setCurrency] = useState('DKK');
  const [inventoryPolicy, setInventoryPolicy] = useState<'sync' | 'snapshot' | 'manual'>('snapshot');
  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    setBuilderSlug(
      builderName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
    );
  }, [builderName]);

  // DnD helpers
  function onDragStartProduct(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'product', id }));
  }
  function onDragStartCategory(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'category', id }));
  }
  async function onDropToCategory(e: React.DragEvent, catId: string) {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { type: 'product' | 'category'; id: string };
      if (data.type === 'product') {
        setCategories((cs) => cs.map((c) => (c.id === catId && !c.productIds.includes(data.id) ? { ...c, productIds: [...c.productIds, data.id] } : c)));
      }
    } catch {}
  }

  function createCategory() {
    const id = crypto.randomUUID();
    const name = prompt('Category name')?.trim();
    if (!name) return;
    setCategories((cs) => [...cs, { id, name, productIds: [] }]);
  }
  function renameCategory(id: string) {
    const name = prompt('New name')?.trim();
    if (!name) return;
    setCategories((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
  }
  function deleteCategory(id: string) {
    if (!confirm('Delete this builder category?')) return;
    setCategories((cs) => cs.filter((c) => c.id !== id));
  }

  function addTag() {
    const t = selectedTag.trim();
    if (!t) return;
    setTags((ts) => (ts.includes(t) ? ts : [...ts, t]));
    setSelectedTag('');
  }
  function removeTag(tag: string) {
    setTags((ts) => ts.filter((t) => t !== tag));
  }

  const config = useMemo(() => {
    return {
      name: builderName,
      slug: builderSlug,
      currency,
      inventoryPolicy,
      categories: categories.map((c) => ({ name: c.name, productIds: c.productIds })),
      tags,
      products: Array.from(
        new Set([...selectedProducts, ...categories.flatMap((c) => c.productIds)])
      ),
      sourceShopId: shopId || null,
    };
  }, [builderName, builderSlug, currency, inventoryPolicy, categories, tags, selectedProducts, shopId]);

  async function exportConfig() {
    const res = await fetch('/api/shop-builder/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    const blob = new Blob([await res.text()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${builderSlug || 'shop-build'}.json`;
    a.click();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Catalog (left) */}
        <div className="xl:col-span-3 bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Central Catalog</div>
            <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => reloadProducts()}>Refresh</button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="pl-7 pr-2 py-2 border rounded-md text-sm w-full" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select className="px-2 py-2 border rounded-md text-sm" value={shopId} onChange={(e) => setShopId(e.target.value)}>
              <option value="">All shops</option>
              {(shopsData?.shops || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 max-h-[60vh] overflow-auto">
            {products.map((p) => (
              <div key={p.id} className="border rounded-md p-2 hover:bg-gray-50 flex items-center gap-2" draggable onDragStart={(e) => onDragStartProduct(e, p.id)}>
                <div className="h-8 w-8 rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                  <Package className="h-4 w-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                  <div className="text-xs text-gray-700">SKU: {p.sku}</div>
                </div>
                <button className="ml-auto text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => setSelectedProducts((sp) => (sp.includes(p.id) ? sp : [...sp, p.id]))}>Select</button>
              </div>
            ))}
            {products.length === 0 && <div className="text-sm text-gray-700">No products match.</div>}
          </div>
        </div>

        {/* Canvas (center) */}
        <div className="xl:col-span-6 space-y-4">
          {/* Builder header */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <input className="flex-1 border rounded px-2 py-2 text-sm" value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Webshop name" />
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110" onClick={exportConfig}>
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Categories Board */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-gray-900"><Folder className="h-4 w-4" /> Categories</div>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={createCategory}><FolderPlus className="h-3.5 w-3.5" /> New</button>
            </div>
            {categories.length === 0 && <div className="text-sm text-gray-700">No builder categories yet. Create your structure and drag products into each list.</div>}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <div key={c.id} className="border rounded-md p-2" draggable onDragStart={(e) => onDragStartCategory(e, c.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropToCategory(e, c.id)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-900 truncate" title={c.name}>{c.name}</div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => renameCategory(c.id)}>Rename</button>
                      <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => deleteCategory(c.id)}>Delete</button>
                    </div>
                  </div>
                  <div className="min-h-[120px] rounded border border-dashed border-gray-300 p-2">
                    {c.productIds.length === 0 && (
                      <div className="text-xs text-gray-600">Drop products here…</div>
                    )}
                    <div className="space-y-1">
                      {c.productIds.map((pid) => {
                        const p = products.find((x) => x.id === pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="text-xs px-2 py-1 rounded bg-gray-50 border flex items-center justify-between">
                            <span className="truncate">{p.name}</span>
                            <button className="ml-2 text-[10px] px-1.5 py-0.5 rounded border" onClick={() => setCategories((cs) => cs.map((cc) => (cc.id === c.id ? { ...cc, productIds: cc.productIds.filter((id) => id !== pid) } : cc)))}>Remove</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold text-gray-900"><Tag className="h-4 w-4" /> Tags</div>
              <div className="flex items-center gap-2">
                <input className="border rounded px-2 py-1 text-sm" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} placeholder="Add tag" />
                <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={addTag}>Add</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-gray-50">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-rose-600" aria-label={`Remove ${t}`}>×</button>
                </span>
              ))}
              {tags.length === 0 && <div className="text-sm text-gray-700">No tags yet.</div>}
            </div>
          </div>
        </div>

        {/* Config (right) */}
        <div className="xl:col-span-3 bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2"><Settings className="h-4 w-4" /> Shop Config</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-700">Slug</label>
              <input className="w-full border rounded px-2 py-2 text-sm" value={builderSlug} onChange={(e) => setBuilderSlug(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-700">Currency</label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="DKK">DKK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-700">Inventory policy</label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={inventoryPolicy} onChange={(e) => setInventoryPolicy(e.target.value as any)}>
                <option value="snapshot">Snapshot (copy current stock)</option>
                <option value="sync">Sync (keep in sync)</option>
                <option value="manual">Manual (no stock sync)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-700">Selected products</label>
              <div className="max-h-40 overflow-auto border rounded p-2 text-xs bg-gray-50">
                {selectedProducts.length === 0 && <div className="text-gray-600">None. Use Select on catalog or drag into categories.</div>}
                {selectedProducts.map((pid) => {
                  const p = products.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="flex items-center justify-between">
                      <span className="truncate">{p.name}</span>
                      <button className="ml-2 text-[10px] px-1.5 py-0.5 rounded border" onClick={() => setSelectedProducts((sp) => sp.filter((id) => id !== pid))}>Remove</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110" onClick={exportConfig}>
              <Download className="h-4 w-4" /> Export configuration
            </button>
            <div className="text-[11px] text-gray-600">Export produces a JSON model you can import into a new WooCommerce shop via a future import tool.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

