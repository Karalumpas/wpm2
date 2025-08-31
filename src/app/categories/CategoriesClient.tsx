'use client';

import useSWR from 'swr';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderPlus, Save, X, Search, Layers } from 'lucide-react';
import useSWRImmutable from 'swr/immutable';

type Category = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  parentId: string | null;
  productCount: number;
};

type ApiList = { success: true; categories: Category[] };
type Shop = { id: string; name: string; count?: number };

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CategoriesClient() {
  const [query, setQuery] = useState('');
  const [shopId, setShopId] = useState<string | ''>('');
  const { data: shopsData } = useSWRImmutable<{ shops: Shop[] }>('/api/shops', fetcher);
  const { data, error, mutate, isLoading } = useSWR<ApiList>(
    `/api/categories${shopId || query ? `?${new URLSearchParams({ ...(shopId ? { shopId } : {}), ...(query ? { q: query } : {}) }).toString()}` : ''}`,
    fetcher,
    { refreshInterval: 0 }
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [creatingRoot, setCreatingRoot] = useState(false);
  const [rootForm, setRootForm] = useState({ name: '', description: '' });

  const categories = data?.categories || [];
  const byParent = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const c of categories) {
      const k = c.parentId as string | null;
      const arr = map.get(k) || [];
      arr.push(c);
      map.set(k, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [categories]);

  async function createCategory(parentId: string | null, name: string, description?: string) {
    const payload = { name, description, parentId };
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create category');
    await mutate();
  }

  async function updateCategory(id: string, patch: Partial<Pick<Category, 'name' | 'description' | 'slug' | 'parentId'>>) {
    const res = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update category');
    await mutate();
  }

  async function deleteCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete category');
    await mutate();
  }

  // Drag & Drop state
  const [dragId, setDragId] = useState<string | null>(null);

  function Node({ cat, depth = 0 }: { cat: Category; depth?: number }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: cat.name, slug: cat.slug || '', description: cat.description || '' });
    const [addingChild, setAddingChild] = useState(false);
    const [childName, setChildName] = useState('');
    const [childDesc, setChildDesc] = useState('');

    const hasChildren = (byParent.get(cat.id) || []).length > 0;
    const isOpen = expanded[cat.id] || depth === 0;

    return (
      <div
        className="border rounded-lg p-3 bg-white"
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', cat.id);
          setDragId(cat.id);
        }}
        onDragEnd={() => setDragId(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          const srcId = e.dataTransfer.getData('text/plain');
          if (!srcId || srcId === cat.id) return;
          // Reparent: set parentId of src to this cat.id
          try {
            await updateCategory(srcId, { parentId: cat.id });
            setExpanded((ex) => ({ ...ex, [cat.id]: true }));
          } catch (err: any) {
            alert(err?.message || 'Failed to move category');
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <button
              aria-label={isOpen ? 'Collapse' : 'Expand'}
              onClick={() => setExpanded((e) => ({ ...e, [cat.id]: !isOpen }))}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-gray-100"
              disabled={!hasChildren}
              title={hasChildren ? (isOpen ? 'Collapse' : 'Expand') : 'No children'}
            >
              {hasChildren ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : <span className="inline-block w-4" />}
            </button>
            <div>
              {!editing ? (
                <div>
                  <div className="text-sm font-semibold text-gray-900">{cat.name}</div>
                  <div className="text-xs text-gray-700">{cat.slug || slugify(cat.name)} • {cat.productCount} products</div>
                  {cat.description && <div className="text-xs text-gray-700 mt-1">{cat.description}</div>}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input className="flex-1 border rounded px-2 py-1 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
                    <input className="flex-1 border rounded px-2 py-1 text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
                  </div>
                  <textarea className="w-full border rounded px-2 py-1 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setAddingChild((v) => !v)} title="Add subcategory">
                  <FolderPlus className="h-3.5 w-3.5" /> Subcategory
                </button>
                <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setEditing(true)} title="Edit">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50 text-rose-700 border-rose-200"
                  onClick={async () => {
                    if (cat.productCount > 0) {
                      const target = prompt('Category is used by products. Enter target category ID to move products before delete, or leave empty to cancel.');
                      if (!target) return;
                      await fetch(`/api/categories/${cat.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moveToCategoryId: target }) });
                      await mutate();
                      return;
                    }
                    if (confirm('Delete this category? Children will be reparented to the parent.')) {
                      await deleteCategory(cat.id);
                    }
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            ) : (
              <>
                <button
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-indigo-600 text-white border-indigo-600 hover:brightness-110"
                  onClick={async () => {
                    await updateCategory(cat.id, { name: form.name, slug: form.slug || slugify(form.name), description: form.description });
                    setEditing(false);
                  }}
                >
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {addingChild && (
          <div className="mt-3 pl-8">
            <div className="text-xs font-medium text-gray-900 mb-1">Add subcategory</div>
            <div className="flex flex-wrap gap-2 items-center">
              <input className="flex-1 min-w-[220px] border rounded px-2 py-1 text-sm" value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Name" />
              <input className="flex-1 min-w-[220px] border rounded px-2 py-1 text-sm" value={childDesc} onChange={(e) => setChildDesc(e.target.value)} placeholder="Description (optional)" />
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-indigo-600 text-white border-indigo-600 hover:brightness-110"
                onClick={async () => {
                  if (!childName.trim()) return;
                  await createCategory(cat.id, childName.trim(), childDesc.trim() || undefined);
                  setChildName('');
                  setChildDesc('');
                  setAddingChild(false);
                  setExpanded((e) => ({ ...e, [cat.id]: true }));
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
              <button className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50" onClick={() => setAddingChild(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}

        {isOpen && hasChildren && (
          <div className="mt-3 space-y-2 pl-6">
            {(byParent.get(cat.id) || []).map((ch) => (
              <Node key={ch.id} cat={ch} depth={(depth || 0) + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="pl-7 pr-2 py-2 border rounded-md text-sm w-64"
              placeholder="Search categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className="px-2 py-2 border rounded-md text-sm" value={shopId} onChange={(e) => setShopId(e.target.value)}>
            <option value="">All shops</option>
            {(shopsData?.shops || []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
            onClick={() => {
              // Expand all roots
              const roots = byParent.get(null) || [];
              const ex: Record<string, boolean> = {};
              roots.forEach((r) => (ex[r.id] = true));
              setExpanded(ex);
            }}
          >
            Expand all
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
            onClick={() => setExpanded({})}
          >
            Collapse all
          </button>
          {!creatingRoot ? (
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110" onClick={() => setCreatingRoot(true)}>
              <Plus className="h-4 w-4" /> New category
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input className="border rounded px-2 py-1 text-sm" value={rootForm.name} onChange={(e) => setRootForm({ ...rootForm, name: e.target.value })} placeholder="Category name" />
              <input className="border rounded px-2 py-1 text-sm" value={rootForm.description} onChange={(e) => setRootForm({ ...rootForm, description: e.target.value })} placeholder="Description (optional)" />
              <button
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110"
                onClick={async () => {
                  if (!rootForm.name.trim()) return;
                  await createCategory(null, rootForm.name.trim(), rootForm.description.trim() || undefined);
                  setRootForm({ name: '', description: '' });
                  setCreatingRoot(false);
                }}
              >
                <Save className="h-4 w-4" /> Save
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50" onClick={() => setCreatingRoot(false)}>
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-rose-700">Failed to load categories</div>}
      {isLoading && <div className="text-sm text-gray-700">Loading…</div>}

      {/* Root drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-md p-3 text-xs text-gray-600"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          const srcId = e.dataTransfer.getData('text/plain');
          if (!srcId) return;
          try { await updateCategory(srcId, { parentId: null as any }); await mutate(); } catch (err: any) { alert(err?.message || 'Failed to move'); }
        }}
      >
        Drop here to move as root category
      </div>

      <div className="grid gap-2">
        {(byParent.get(null) || []).map((cat) => (
          <Node key={cat.id} cat={cat} depth={0} />
        ))}
        {categories.length === 0 && <div className="text-sm text-gray-700">No categories yet. Create the first one.</div>}
      </div>
      {/* Bulk merge panel */}
      <BulkMergePanel categories={categories} onMerged={mutate} />
    </div>
  );
}

function BulkMergePanel({ categories, onMerged }: { categories: Category[]; onMerged: () => Promise<any> | void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [targetId, setTargetId] = useState<string>('');

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const canMerge = selectedIds.length >= 1 && targetId && !selected[targetId];

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Bulk merge</div>
        <div className="flex items-center gap-2">
          <select className="px-2 py-1 border rounded text-sm" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">Merge into…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-600 text-white disabled:opacity-60"
            disabled={!canMerge}
            onClick={async () => {
              const res = await fetch('/api/categories/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sourceIds: selectedIds, targetId }) });
              const json = await res.json();
              if (!res.ok) { alert(json.error || 'Merge failed'); return; }
              setSelected({});
              setTargetId('');
              await onMerged();
              alert('Merge completed');
            }}
          >
            Merge
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-auto">
        {categories.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-xs text-gray-800">
            <input type="checkbox" checked={!!selected[c.id]} onChange={(e) => setSelected((s) => ({ ...s, [c.id]: e.target.checked }))} />
            <span className="truncate">{c.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
