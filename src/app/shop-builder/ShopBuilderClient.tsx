'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  FolderPlus,
  Download,
  Settings,
  Package,
  Folder,
  Tag,
  Layout,
  ListChecks,
  SlidersHorizontal,
  Layers,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import DraggableWindow from '@/components/ui/DraggableWindow';
import ProductWindow from '@/components/shop-builder/ProductWindow';

type Product = {
  id: string;
  name: string;
  sku: string;
  basePrice?: string | null;
  status?: string;
  type?: string;
  featuredImage?: string | null;
  updatedAt?: string;
};

type ApiProducts = {
  items: Array<{
    id: string;
    name: string;
    sku: string;
    basePrice?: string | null;
    status?: string;
    type?: string;
    featuredImage?: string | null;
    updatedAt?: string;
  }>;
};

type Shop = { id: string; name: string; count?: number };

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

type BuilderCategory = { id: string; name: string; productIds: string[] };
type Rule = {
  field: 'name' | 'sku' | 'price' | 'status' | 'type' | 'builderCategory';
  op: 'contains' | 'equals' | 'lt' | 'gt';
  value: string;
};
type Collection = {
  id: string;
  name: string;
  rules: Rule[];
  logic?: 'all' | 'any';
  limit?: number;
  sortBy?: 'name' | 'price' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};
type LayoutBlock = {
  id: string;
  type: 'hero' | 'grid' | 'carousel';
  title?: string;
  source?: { type: 'collection' | 'category' | 'selected'; id?: string };
  columns?: number;
};

export default function ShopBuilderClient() {
  // Catalog
  const [query, setQuery] = useState('');
  const { data: shopsData } = useSWR<{ shops: Shop[] }>('/api/shops', fetcher);
  const [shopId, setShopId] = useState<string | ''>('');
  const { data: productsData, mutate: reloadProducts } = useSWR<ApiProducts>(
    `/api/products?limit=60${query ? `&search=${encodeURIComponent(query)}` : ''}${shopId ? `&shopIds=${shopId}` : ''}`,
    fetcher
  );
  const products: Product[] = (productsData?.items || []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    basePrice: (p as unknown as Partial<Product>).basePrice ?? null,
    status: (p as unknown as Partial<Product>).status,
    type: (p as unknown as Partial<Product>).type,
    featuredImage: (p as unknown as Partial<Product>).featuredImage,
    updatedAt: (p as unknown as Partial<Product>).updatedAt,
  }));

  // Builder State
  const [builderName, setBuilderName] = useState('New Webshop');
  const [builderSlug, setBuilderSlug] = useState('new-webshop');
  const [currency, setCurrency] = useState('DKK');
  const [inventoryPolicy, setInventoryPolicy] = useState<
    'sync' | 'snapshot' | 'manual'
  >('snapshot');
  const [categories, setCategories] = useState<BuilderCategory[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  // Advanced tabs and features
  const [activeTab, setActiveTab] = useState<
    'structure' | 'collections' | 'layout' | 'feeds' | 'bulk'
  >('structure');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [layoutBlocks, setLayoutBlocks] = useState<LayoutBlock[]>([]);
  const [feedPlatform, setFeedPlatform] = useState<
    'woocommerce' | 'google' | 'facebook'
  >('woocommerce');
  const [feedFormat, setFeedFormat] = useState<'json' | 'csv'>('json');
  const [feedPreview, setFeedPreview] = useState<string>('');
  const [feedSource, setFeedSource] = useState<{
    type: 'selected' | 'category' | 'collection';
    id?: string;
  }>({ type: 'selected' });
  type MappingRow = {
    target: string;
    source: keyof Product | 'categories' | 'tags';
  };
  const [feedMapping, setFeedMapping] = useState<MappingRow[]>([
    { target: 'id', source: 'sku' },
    { target: 'title', source: 'name' },
    { target: 'price', source: 'basePrice' },
  ]);
  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleSuffix, setTitleSuffix] = useState('');
  const [pricePercent, setPricePercent] = useState<number>(0);
  // Collections preview modal
  const [previewColId, setPreviewColId] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewTargetCat, setPreviewTargetCat] = useState<string>('');
  // Persistence
  const { data: buildsData, mutate: reloadBuilds } = useSWR<{
    builds: Array<{ id: string; name: string; slug: string }>;
  }>('/api/shop-builder/builds', fetcher);
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null);

  // Floating canvas/windows state
  const [floatMode] = useState(true); // enable floating windows mode by default
  const [showCatalog, setShowCatalog] = useState(true);
  const [showBuilder, setShowBuilder] = useState(true);
  const [productWindows, setProductWindows] = useState<
    Array<{ id: string; pos: { x: number; y: number } }>
  >([]);
  // All windows are scaled with the canvas

  // Infinite canvas pan/zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const panningRef = useRef<null | {
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  }>(null);
  const spaceDownRef = useRef(false);

  function onBackgroundPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button === 1 || spaceDownRef.current) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      panningRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  }
  function onBackgroundPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!panningRef.current) return;
    const { startX, startY, panX, panY } = panningRef.current;
    setPan({ x: panX + (e.clientX - startX), y: panY + (e.clientY - startY) });
  }
  function onBackgroundPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    panningRef.current = null;
  }
  function onBackgroundDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }
  function onBackgroundDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('text/plain');
      const data = JSON.parse(raw) as { type?: string; id?: string };
      if (data?.type === 'product' && data.id) {
        const rect = (
          e.currentTarget as HTMLDivElement
        ).getBoundingClientRect();
        const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const worldX = (point.x - pan.x) / scale;
        const worldY = (point.y - pan.y) / scale;
        const pos = { x: worldX - 160 / scale, y: worldY - 40 / scale };
        setProductWindows((wins) => {
          const idStr = String(data.id);
          if (wins.some((w) => w.id === idStr)) return wins;
          return [
            ...wins,
            {
              id: idStr,
              pos: { x: Math.max(20, pos.x), y: Math.max(20, pos.y) },
            },
          ];
        });
      }
    } catch {}
  }
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') spaceDownRef.current = true;
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.code === 'Space') spaceDownRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.body.style.overflow = prev;
    };
  }, []);

  async function saveBuild() {
    const payload = {
      name: builderName,
      slug: builderSlug,
      currency,
      inventoryPolicy,
      sourceShopId: shopId || null,
      config,
    };
    if (!activeBuildId) {
      await fetch('/api/shop-builder/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`/api/shop-builder/builds/${activeBuildId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    await reloadBuilds();
  }

  async function loadBuild(id: string) {
    const res = await fetch(`/api/shop-builder/builds/${id}`);
    if (!res.ok) return;
    const { build } = await res.json();
    setActiveBuildId(build.id);
    setBuilderName(build.name);
    setBuilderSlug(build.slug);
    setCurrency(build.currency);
    setInventoryPolicy(build.inventoryPolicy);
    setShopId(build.sourceShopId || '');
    const cfg = build.config || {};
    type RawCat = { name: string; productIds?: string[] };
    const rawCats = (cfg.categories || []) as RawCat[];
    setCategories(
      rawCats.map((c) => ({
        id: crypto.randomUUID(),
        name: c.name,
        productIds: c.productIds || [],
      }))
    );
    setTags(cfg.tags || []);
    setSelectedProducts(cfg.products || []);
  }

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
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'product', id })
    );
  }
  function onDragStartCategory(e: React.DragEvent, id: string) {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'category', id })
    );
  }
  async function onDropToCategory(e: React.DragEvent, catId: string) {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as {
        type: 'product' | 'category';
        id: string;
      };
      if (data.type === 'product') {
        setCategories((cs) =>
          cs.map((c) =>
            c.id === catId && !c.productIds.includes(data.id)
              ? { ...c, productIds: [...c.productIds, data.id] }
              : c
          )
        );
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

  // Collections
  function addCollection() {
    const name = prompt('Collection name')?.trim();
    if (!name) return;
    setCollections((cs) => [
      ...cs,
      { id: crypto.randomUUID(), name, rules: [] },
    ]);
  }
  function addRule(colId: string) {
    setCollections((cs) =>
      cs.map((c) =>
        c.id === colId
          ? {
              ...c,
              rules: [...c.rules, { field: 'name', op: 'contains', value: '' }],
            }
          : c
      )
    );
  }
  function updateRule(colId: string, idx: number, patch: Partial<Rule>) {
    setCollections((cs) =>
      cs.map((c) =>
        c.id === colId
          ? {
              ...c,
              rules: c.rules.map((r, i) =>
                i === idx ? { ...r, ...patch } : r
              ),
            }
          : c
      )
    );
  }
  function removeRule(colId: string, idx: number) {
    setCollections((cs) =>
      cs.map((c) =>
        c.id === colId
          ? { ...c, rules: c.rules.filter((_, i) => i !== idx) }
          : c
      )
    );
  }
  function deleteCollection(colId: string) {
    if (!confirm('Delete this collection?')) return;
    setCollections((cs) => cs.filter((c) => c.id !== colId));
  }
  function matchCollection(c: Collection, ps: Product[]): Product[] {
    let matched = ps.filter((p) => {
      const evalRule = (r: Rule): boolean => {
        const val =
          r.field === 'name'
            ? p.name
            : r.field === 'sku'
              ? p.sku
              : r.field === 'price'
                ? p.basePrice
                  ? parseFloat(String(p.basePrice))
                  : NaN
                : r.field === 'status'
                  ? p.status || ''
                  : r.field === 'type'
                    ? p.type || ''
                    : '';
        if (r.field === 'builderCategory') {
          const cat = categories.find((cc) => cc.id === r.value);
          return cat ? cat.productIds.includes(p.id) : false;
        }
        if (r.field === 'price') {
          const num = typeof val === 'number' ? val : Number(val);
          if (Number.isNaN(num)) return false;
          const v = Number(r.value);
          if (r.op === 'lt') return num < v;
          if (r.op === 'gt') return num > v;
          if (r.op === 'equals') return num === v;
          return false;
        }
        const s = String(val).toLowerCase();
        const needle = r.value.toLowerCase();
        if (r.op === 'contains') return s.includes(needle);
        if (r.op === 'equals') return s === needle;
        return false;
      };
      if (!c.logic || c.logic === 'all') return c.rules.every(evalRule);
      return c.rules.some(evalRule);
    });
    if (c.sortBy) {
      const dir = c.sortOrder === 'asc' ? 1 : -1;
      matched = matched.slice().sort((a, b) => {
        const by = c.sortBy!;
        if (by === 'price') {
          const av = a.basePrice ? Number(a.basePrice) : 0;
          const bv = b.basePrice ? Number(b.basePrice) : 0;
          return (av - bv) * dir;
        }
        if (by === 'updatedAt') {
          const av = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const bv = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return (av - bv) * dir;
        }
        return a.name.localeCompare(b.name) * dir;
      });
    }
    if (c.limit && c.limit > 0) return matched.slice(0, c.limit);
    return matched;
  }

  const config = useMemo(() => {
    return {
      name: builderName,
      slug: builderSlug,
      currency,
      inventoryPolicy,
      categories: categories.map((c) => ({
        name: c.name,
        productIds: c.productIds,
      })),
      tags,
      collections,
      layout: layoutBlocks,
      transforms: { titlePrefix, titleSuffix, pricePercent },
      products: Array.from(
        new Set([
          ...selectedProducts,
          ...categories.flatMap((c) => c.productIds),
        ])
      ),
      sourceShopId: shopId || null,
    };
  }, [
    builderName,
    builderSlug,
    currency,
    inventoryPolicy,
    categories,
    tags,
    selectedProducts,
    shopId,
    collections,
    layoutBlocks,
    titlePrefix,
    titleSuffix,
    pricePercent,
  ]);

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
  async function previewFeed() {
    // Build item set from chosen source
    let list: Product[] = [];
    if (feedSource.type === 'selected') {
      list = products.filter((p) => selectedProducts.includes(p.id));
    } else if (feedSource.type === 'category') {
      const cat = categories.find((c) => c.id === feedSource.id);
      list = products.filter((p) => (cat?.productIds || []).includes(p.id));
    } else if (feedSource.type === 'collection') {
      const col = collections.find((c) => c.id === feedSource.id);
      if (col) list = matchCollection(col, products);
    }
    const items = list.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      basePrice: p.basePrice,
      image: p.featuredImage,
      status: p.status,
      type: p.type,
      categories: categories
        .filter((c) => c.productIds.includes(p.id))
        .map((c) => c.name),
      tags,
    }));
    const mapping = feedMapping.map((m) => ({
      target: m.target,
      source: m.source,
    }));
    const res = await fetch(
      `/api/shop-builder/feeds/preview?format=${feedFormat}&platform=${feedPlatform}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, items, mapping }),
      }
    );
    setFeedPreview(
      feedFormat === 'csv'
        ? await res.text()
        : JSON.stringify(await res.json(), null, 2)
    );
  }

  // Layout DnD handlers
  function onPaletteDragStart(e: React.DragEvent, type: LayoutBlock['type']) {
    e.dataTransfer.setData('application/x-layout-palette', type);
  }
  function onBlockDragStart(e: React.DragEvent, id: string) {
    e.dataTransfer.setData('application/x-layout-block', id);
  }
  function onCanvasDrop(e: React.DragEvent, index?: number) {
    e.preventDefault();
    const type = e.dataTransfer.getData(
      'application/x-layout-palette'
    ) as LayoutBlock['type'];
    const blkId = e.dataTransfer.getData('application/x-layout-block');
    if (type) {
      const nb: LayoutBlock = {
        id: crypto.randomUUID(),
        type,
        title: type.toUpperCase(),
        source: { type: 'selected' },
        columns: type === 'grid' ? 3 : undefined,
      };
      setLayoutBlocks((bs) => {
        const arr = [...bs];
        if (typeof index === 'number') arr.splice(index, 0, nb);
        else arr.push(nb);
        return arr;
      });
      return;
    }
    if (blkId) {
      setLayoutBlocks((bs) => {
        const arr = bs.slice();
        const from = arr.findIndex((b) => b.id === blkId);
        if (from === -1) return bs;
        const [moved] = arr.splice(from, 1);
        const to = typeof index === 'number' ? index : arr.length;
        arr.splice(to, 0, moved);
        return arr;
      });
    }
  }

  // Floating windows rendering
  if (floatMode) {
    return (
      <div className="relative h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div
          className="absolute inset-0 overflow-hidden"
          onPointerDown={onBackgroundPointerDown}
          onPointerMove={onBackgroundPointerMove}
          onPointerUp={onBackgroundPointerUp}
          onWheel={(e) => {
            e.preventDefault();
            const rect = (
              e.currentTarget as HTMLDivElement
            ).getBoundingClientRect();
            const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            const delta = -e.deltaY; // wheel up zooms in
            const zoomIntensity = 0.0015;
            const nextScale = Math.min(
              3,
              Math.max(0.25, scale * (1 + delta * zoomIntensity))
            );
            if (nextScale === scale) return;
            // keep cursor point stable
            const worldX = (point.x - pan.x) / scale;
            const worldY = (point.y - pan.y) / scale;
            setPan({
              x: point.x - worldX * nextScale,
              y: point.y - worldY * nextScale,
            });
            setScale(nextScale);
          }}
        >
          <div
            className="absolute"
            onDragOver={onBackgroundDragOver}
            onDrop={onBackgroundDrop}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: '0 0',
              width: '4000px',
              height: '3000px',
              backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {true && (
              <>
                {showBuilder && (
                  <DraggableWindow
                    id="builder"
                    title="Shop Builder"
                    initialPos={{ x: 320, y: 80 }}
                    initialSize={{ w: 900 }}
                    onClose={() => setShowBuilder(false)}
                    scale={scale}
                  >
                    <div className="mb-4 flex items-center gap-2">
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${activeTab === 'structure' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md' : 'hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                        onClick={() => setActiveTab('structure')}
                      >
                        <Folder className="h-4 w-4" /> Structure
                      </button>
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${activeTab === 'collections' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md' : 'hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                        onClick={() => setActiveTab('collections')}
                      >
                        <ListChecks className="h-4 w-4" /> Collections
                      </button>
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${activeTab === 'layout' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md' : 'hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                        onClick={() => setActiveTab('layout')}
                      >
                        <Layout className="h-4 w-4" /> Layout
                      </button>
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${activeTab === 'feeds' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md' : 'hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                        onClick={() => setActiveTab('feeds')}
                      >
                        <Layers className="h-4 w-4" /> Feeds
                      </button>
                      <button
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${activeTab === 'bulk' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-transparent shadow-md' : 'hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                        onClick={() => setActiveTab('bulk')}
                      >
                        <SlidersHorizontal className="h-4 w-4" /> Bulk
                      </button>
                    </div>
                    {/* Reuse the same content blocks as the fixed builder window; left intact below */}
                  </DraggableWindow>
                )}

                {showCatalog && (
                  <DraggableWindow
                    id="catalog"
                    title="Central Catalog"
                    initialPos={{ x: 40, y: 80 }}
                    initialSize={{ w: 320 }}
                    onClose={() => setShowCatalog(false)}
                    scale={scale}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">
                        Central Catalog
                      </div>
                      <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 text-xs font-medium shadow-sm"
                        onClick={() => reloadProducts()}
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative flex-1">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-300"
                          placeholder="Search products..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>
                      <select
                        className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-300 min-w-40"
                        value={shopId}
                        onChange={(e) => setShopId(e.target.value)}
                      >
                        <option value="">All shops</option>
                        {(shopsData?.shops || []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2 max-h-[60vh] overflow-auto">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className="border border-slate-200 rounded-2xl p-4 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center gap-3 group shadow-sm hover:shadow-md"
                          draggable
                          onDragStart={(e) => onDragStartProduct(e, p.id)}
                        >
                          <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shadow-sm">
                            <Package className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {p.name}
                            </div>
                            <div className="text-xs text-gray-700">
                              SKU: {p.sku}
                            </div>
                          </div>
                          <button
                            className="ml-auto px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-xs font-medium shadow-sm"
                            onClick={() =>
                              setSelectedProducts((sp) =>
                                sp.includes(p.id) ? sp : [...sp, p.id]
                              )
                            }
                          >
                            Select
                          </button>
                        </div>
                      ))}
                      {products.length === 0 && (
                        <div className="text-sm text-gray-700">
                          No products match.
                        </div>
                      )}
                    </div>
                  </DraggableWindow>
                )}

                {productWindows.map((w) => (
                  <DraggableWindow
                    key={`scaled-${w.id}`}
                    id={`product-${w.id}`}
                    title={`Product ${w.id.slice(0, 8)}`}
                    initialPos={w.pos}
                    initialSize={{ w: 420 }}
                    onClose={() =>
                      setProductWindows((wins) =>
                        wins.filter((x) => x.id !== w.id)
                      )
                    }
                    scale={scale}
                  >
                    <ProductWindow id={w.id} />
                  </DraggableWindow>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="absolute top-4 left-4 z-50 flex gap-3">
          {!showBuilder && (
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md text-sm font-medium"
              onClick={() => setShowBuilder(true)}
            >
              Open Builder
            </button>
          )}
          {!showCatalog && (
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md text-sm font-medium"
              onClick={() => setShowCatalog(true)}
            >
              Open Catalog
            </button>
          )}
          <button
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 text-sm font-medium shadow-md"
            title="Toggle whether windows scale with canvas"
          ></button>
        </div>

        {false && showBuilder && (
          <DraggableWindow
            id="builder"
            title="Shop Builder"
            initialPos={{ x: 320, y: 80 }}
            initialSize={{ w: 900 }}
            onClose={() => setShowBuilder(false)}
          >
            <div className="mb-3 flex items-center gap-2">
              <button
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'structure' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveTab('structure')}
              >
                <Folder className="h-4 w-4" /> Structure
              </button>
              <button
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'collections' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveTab('collections')}
              >
                <ListChecks className="h-4 w-4" /> Collections
              </button>
              <button
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'layout' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveTab('layout')}
              >
                <Layout className="h-4 w-4" /> Layout
              </button>
              <button
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'feeds' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveTab('feeds')}
              >
                <Layers className="h-4 w-4" /> Feeds
              </button>
              <button
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'bulk' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
                onClick={() => setActiveTab('bulk')}
              >
                <SlidersHorizontal className="h-4 w-4" /> Bulk
              </button>
            </div>

            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
              <input
                className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-300"
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                placeholder="Webshop name"
              />
              <select
                className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white hover:border-slate-300 min-w-48"
                value={activeBuildId || ''}
                onChange={(e) =>
                  e.target.value ? loadBuild(e.target.value) : null
                }
              >
                <option value="">Load build.</option>
                {(buildsData?.builds || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 shadow-sm font-medium"
                onClick={saveBuild}
              >
                Save
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-md font-medium"
                onClick={exportConfig}
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </div>

            {activeTab === 'structure' && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Folder className="h-4 w-4" /> Categories
                  </div>
                  <button
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                    onClick={createCategory}
                  >
                    <FolderPlus className="h-3.5 w-3.5" /> New
                  </button>
                </div>
                {categories.length === 0 && (
                  <div className="text-sm text-gray-700">
                    No builder categories yet. Create your structure and drag
                    products into each list.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="border rounded-md p-2"
                      draggable
                      onDragStart={(e) => onDragStartCategory(e, c.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropToCategory(e, c.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="text-sm font-semibold text-gray-900 truncate"
                          title={c.name}
                        >
                          {c.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all duration-200 text-xs font-medium shadow-sm"
                            onClick={() => renameCategory(c.id)}
                          >
                            Rename
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 hover:text-red-800 transition-all duration-200 text-xs font-medium shadow-sm"
                            onClick={() => deleteCategory(c.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="min-h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-3 transition-colors hover:border-slate-400 hover:bg-slate-100/50">
                        {c.productIds.length === 0 && (
                          <div className="text-xs text-gray-600">
                            Drop products here.
                          </div>
                        )}
                        <div className="space-y-1">
                          {c.productIds.map((pid) => {
                            const p = products.find((x) => x.id === pid);
                            if (!p) return null;
                            return (
                              <div
                                key={pid}
                                className="text-xs px-2 py-1 rounded bg-gray-50 border flex items-center justify-between"
                              >
                                <span className="truncate">{p.name}</span>
                                <button
                                  className="ml-2 text-[10px] px-1.5 py-0.5 rounded border"
                                  onClick={() =>
                                    setCategories((cs) =>
                                      cs.map((cc) =>
                                        cc.id === c.id
                                          ? {
                                              ...cc,
                                              productIds: cc.productIds.filter(
                                                (id) => id !== pid
                                              ),
                                            }
                                          : cc
                                      )
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 mt-4 shadow-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="text-sm font-semibold text-slate-900 mb-3">
                      Palette
                    </div>
                    {(['hero', 'grid', 'carousel'] as const).map((t) => (
                      <div
                        key={t}
                        className="border border-slate-200 rounded-xl p-3 mb-2 bg-white hover:bg-slate-50 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md"
                        draggable
                        onDragStart={(e) => onPaletteDragStart(e, t)}
                      >
                        {t.toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <div
                    className="md:col-span-2 border-2 border-dashed border-slate-300 rounded-xl p-4 min-h-52 bg-slate-50/30 hover:border-slate-400 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onCanvasDrop(e)}
                  >
                    {layoutBlocks.length === 0 && (
                      <div className="text-sm text-gray-700">
                        Drag blocks here from the palette.
                      </div>
                    )}
                    <div className="space-y-2">
                      {layoutBlocks.map((b, i) => (
                        <div
                          key={b.id}
                          className="border rounded p-2 bg-white"
                          draggable
                          onDragStart={(e) => onBlockDragStart(e, b.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => onCanvasDrop(e, i)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-gray-900">
                              {b.type.toUpperCase()}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                className="text-[11px] px-2 py-0.5 rounded border"
                                onClick={() =>
                                  setLayoutBlocks((bs) =>
                                    bs.filter((x) => x.id !== b.id)
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <input
                              className="border rounded px-2 py-1 text-xs"
                              value={b.title || ''}
                              onChange={(e) =>
                                setLayoutBlocks((bs) =>
                                  bs.map((x) =>
                                    x.id === b.id
                                      ? { ...x, title: e.target.value }
                                      : x
                                  )
                                )
                              }
                            />
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={b.source?.type || 'selected'}
                              onChange={(e) =>
                                setLayoutBlocks((bs) =>
                                  bs.map((x) =>
                                    x.id === b.id
                                      ? {
                                          ...x,
                                          source: {
                                            ...(x.source || {}),
                                            type: e.target.value as
                                              | 'selected'
                                              | 'collection'
                                              | 'category',
                                          },
                                        }
                                      : x
                                  )
                                )
                              }
                            >
                              <option value="selected">Selected</option>
                              <option value="collection">Collection</option>
                              <option value="category">Category</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feeds' && (
              <div className="mt-4">
                <textarea
                  className="w-full h-40 font-mono text-xs border rounded p-2"
                  value={feedPreview}
                  onChange={() => {}}
                />
              </div>
            )}

            {activeTab === 'bulk' && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    className="border rounded px-2 py-2 text-sm"
                    placeholder="Title prefix"
                    value={titlePrefix}
                    onChange={(e) => setTitlePrefix(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-2 text-sm"
                    placeholder="Title suffix"
                    value={titleSuffix}
                    onChange={(e) => setTitleSuffix(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-800">Price +/-%</label>
                    <input
                      type="number"
                      className="border rounded px-2 py-2 text-sm w-24"
                      value={pricePercent}
                      onChange={(e) => setPricePercent(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-gray-600">
                  Transforms stored in build config; apply during
                  export/import/feed gen.
                </div>
              </div>
            )}
          </DraggableWindow>
        )}

        {false && showCatalog && (
          <DraggableWindow
            id="catalog"
            title="Central Catalog"
            initialPos={{ x: 40, y: 80 }}
            initialSize={{ w: 320 }}
            onClose={() => setShowCatalog(false)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Central Catalog</div>
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                onClick={() => reloadProducts()}
              >
                Refresh
              </button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="pl-7 pr-2 py-2 border rounded-md text-sm w-full"
                  placeholder="Search products."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="px-2 py-2 border rounded-md text-sm"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
              >
                <option value="">All shops</option>
                {(shopsData?.shops || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 max-h-[60vh] overflow-auto">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="border rounded-md p-2 hover:bg-gray-50 flex items-center gap-2"
                  draggable
                  onDragStart={(e) => onDragStartProduct(e, p.id)}
                >
                  <div className="h-8 w-8 rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-gray-700">SKU: {p.sku}</div>
                  </div>
                  <button
                    className="ml-auto text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() =>
                      setSelectedProducts((sp) =>
                        sp.includes(p.id) ? sp : [...sp, p.id]
                      )
                    }
                  >
                    Select
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <div className="text-sm text-gray-700">No products match.</div>
              )}
            </div>
          </DraggableWindow>
        )}

        {false &&
          productWindows.map((w) => (
            <DraggableWindow
              key={w.id}
              id={`product-${w.id}`}
              title={`Product ${w.id.slice(0, 8)}`}
              initialPos={w.pos}
              initialSize={{ w: 420 }}
              onClose={() =>
                setProductWindows((wins) => wins.filter((x) => x.id !== w.id))
              }
            >
              <ProductWindow id={w.id} />
            </DraggableWindow>
          ))}

        {/* Collections Preview Modal (float mode) */}
        {previewColId && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setPreviewColId(null)}
            />
            <div className="absolute inset-0 p-6 flex items-center justify-center">
              <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">
                    Collection preview
                  </div>
                  <button
                    className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={() => setPreviewColId(null)}
                  >
                    Close
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {(() => {
                    const c = collections.find((x) => x.id === previewColId);
                    if (!c)
                      return (
                        <div className="text-sm text-gray-700">Not found</div>
                      );
                    const all = matchCollection(c, products);
                    const pageSize = 30;
                    const totalPages = Math.max(
                      1,
                      Math.ceil(all.length / pageSize)
                    );
                    const page = Math.min(previewPage, totalPages);
                    const slice = all.slice(
                      (page - 1) * pageSize,
                      page * pageSize
                    );
                    const addAllToSelected = () => {
                      setSelectedProducts((prev) =>
                        Array.from(new Set([...prev, ...all.map((p) => p.id)]))
                      );
                    };
                    const addAllToCategory = () => {
                      if (!previewTargetCat) return;
                      setCategories((cs) =>
                        cs.map((cc) =>
                          cc.id === previewTargetCat
                            ? {
                                ...cc,
                                productIds: Array.from(
                                  new Set([
                                    ...(cc.productIds || []),
                                    ...all.map((p) => p.id),
                                  ])
                                ),
                              }
                            : cc
                        )
                      );
                    };
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={previewTargetCat}
                            onChange={(e) =>
                              setPreviewTargetCat(e.target.value)
                            }
                          >
                            <option value="">Choose builder category.</option>
                            {categories.map((bc) => (
                              <option key={bc.id} value={bc.id}>
                                {bc.name}
                              </option>
                            ))}
                          </select>
                          <button
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                            onClick={addAllToSelected}
                          >
                            Add all to Selected
                          </button>
                          <button
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                            onClick={addAllToCategory}
                            disabled={!previewTargetCat}
                          >
                            Add all to Category
                          </button>
                        </div>
                        <div className="text-xs text-gray-700 mb-2">
                          Matched {all.length} products
                        </div>
                        <div className="max-h-72 overflow-auto border rounded">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-2 py-1">Name</th>
                                <th className="text-left px-2 py-1">SKU</th>
                                <th className="text-left px-2 py-1">Price</th>
                                <th className="text-left px-2 py-1">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {slice.map((p) => (
                                <tr key={p.id} className="border-t">
                                  <td className="px-2 py-1 truncate">
                                    {p.name}
                                  </td>
                                  <td className="px-2 py-1">{p.sku}</td>
                                  <td className="px-2 py-1">
                                    {p.basePrice ?? '-'}
                                  </td>
                                  <td className="px-2 py-1">
                                    {p.status ?? '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                            disabled={page <= 1}
                            onClick={() =>
                              setPreviewPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Prev
                          </button>
                          <div className="text-xs text-gray-700">
                            Page {page} / {totalPages}
                          </div>
                          <button
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                            disabled={page >= totalPages}
                            onClick={() =>
                              setPreviewPage((p) => Math.min(totalPages, p + 1))
                            }
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-3 flex items-center gap-2">
        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'structure' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
          onClick={() => setActiveTab('structure')}
        >
          <Folder className="h-4 w-4" /> Structure
        </button>
        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'collections' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
          onClick={() => setActiveTab('collections')}
        >
          <ListChecks className="h-4 w-4" /> Collections
        </button>
        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'layout' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
          onClick={() => setActiveTab('layout')}
        >
          <Layout className="h-4 w-4" /> Layout
        </button>
        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'feeds' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
          onClick={() => setActiveTab('feeds')}
        >
          <Layers className="h-4 w-4" /> Feeds
        </button>
        <button
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border ${activeTab === 'bulk' ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}
          onClick={() => setActiveTab('bulk')}
        >
          <SlidersHorizontal className="h-4 w-4" /> Bulk
        </button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Catalog (left) */}
        <div className="xl:col-span-3 bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900">Central Catalog</div>
            <button
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
              onClick={() => reloadProducts()}
            >
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="pl-7 pr-2 py-2 border rounded-md text-sm w-full"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="px-2 py-2 border rounded-md text-sm"
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
            >
              <option value="">All shops</option>
              {(shopsData?.shops || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 max-h-[60vh] overflow-auto">
            {products.map((p) => (
              <div
                key={p.id}
                className="border rounded-md p-2 hover:bg-gray-50 flex items-center gap-2"
                draggable
                onDragStart={(e) => onDragStartProduct(e, p.id)}
              >
                <div className="h-8 w-8 rounded bg-gray-200 overflow-hidden flex items-center justify-center">
                  <Package className="h-4 w-4 text-gray-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-gray-700">SKU: {p.sku}</div>
                </div>
                <button
                  className="ml-auto text-xs px-2 py-1 rounded border hover:bg-gray-50"
                  onClick={() =>
                    setSelectedProducts((sp) =>
                      sp.includes(p.id) ? sp : [...sp, p.id]
                    )
                  }
                >
                  Select
                </button>
              </div>
            ))}
            {products.length === 0 && (
              <div className="text-sm text-gray-700">No products match.</div>
            )}
          </div>
        </div>

        {/* Canvas (center) */}
        <div className="xl:col-span-6 space-y-4">
          {/* Builder header */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
            <input
              className="flex-1 border rounded px-2 py-2 text-sm"
              value={builderName}
              onChange={(e) => setBuilderName(e.target.value)}
              placeholder="Webshop name"
            />
            <select
              className="border rounded px-2 py-2 text-sm"
              value={activeBuildId || ''}
              onChange={(e) =>
                e.target.value ? loadBuild(e.target.value) : null
              }
            >
              <option value="">Load build…</option>
              {(buildsData?.builds || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-gray-50"
              onClick={saveBuild}
            >
              Save
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110"
              onClick={exportConfig}
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Categories Board */}
          {activeTab === 'structure' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Folder className="h-4 w-4" /> Categories
                </div>
                <button
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                  onClick={createCategory}
                >
                  <FolderPlus className="h-3.5 w-3.5" /> New
                </button>
              </div>
              {categories.length === 0 && (
                <div className="text-sm text-gray-700">
                  No builder categories yet. Create your structure and drag
                  products into each list.
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="border rounded-md p-2"
                    draggable
                    onDragStart={(e) => onDragStartCategory(e, c.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropToCategory(e, c.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="text-sm font-semibold text-gray-900 truncate"
                        title={c.name}
                      >
                        {c.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={() => renameCategory(c.id)}
                        >
                          Rename
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={() => deleteCategory(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="min-h-[120px] rounded border border-dashed border-gray-300 p-2">
                      {c.productIds.length === 0 && (
                        <div className="text-xs text-gray-600">
                          Drop products here…
                        </div>
                      )}
                      <div className="space-y-1">
                        {c.productIds.map((pid) => {
                          const p = products.find((x) => x.id === pid);
                          if (!p) return null;
                          return (
                            <div
                              key={pid}
                              className="text-xs px-2 py-1 rounded bg-gray-50 border flex items-center justify-between"
                            >
                              <span className="truncate">{p.name}</span>
                              <button
                                className="ml-2 text-[10px] px-1.5 py-0.5 rounded border"
                                onClick={() =>
                                  setCategories((cs) =>
                                    cs.map((cc) =>
                                      cc.id === c.id
                                        ? {
                                            ...cc,
                                            productIds: cc.productIds.filter(
                                              (id) => id !== pid
                                            ),
                                          }
                                        : cc
                                    )
                                  )
                                }
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Palette */}
                <div className="border rounded p-2">
                  <div className="text-xs font-semibold text-gray-900 mb-1">
                    Palette
                  </div>
                  {(['hero', 'grid', 'carousel'] as const).map((t) => (
                    <div
                      key={t}
                      className="border rounded p-2 mb-1 bg-gray-50"
                      draggable
                      onDragStart={(e) => onPaletteDragStart(e, t)}
                    >
                      {t.toUpperCase()}
                    </div>
                  ))}
                </div>
                {/* Canvas */}
                <div
                  className="md:col-span-2 border rounded p-2 min-h-[200px]"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onCanvasDrop(e)}
                >
                  {layoutBlocks.length === 0 && (
                    <div className="text-sm text-gray-700">
                      Drag blocks here from the palette.
                    </div>
                  )}
                  <div className="space-y-2">
                    {layoutBlocks.map((b, i) => (
                      <div
                        key={b.id}
                        className="border rounded p-2 bg-white"
                        draggable
                        onDragStart={(e) => onBlockDragStart(e, b.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onCanvasDrop(e, i)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-gray-900">
                            {b.type.toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              className="text-[11px] px-2 py-0.5 rounded border"
                              onClick={() =>
                                setLayoutBlocks((bs) =>
                                  bs.filter((x) => x.id !== b.id)
                                )
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <input
                            className="border rounded px-2 py-1 text-xs"
                            value={b.title || ''}
                            onChange={(e) =>
                              setLayoutBlocks((bs) =>
                                bs.map((x) =>
                                  x.id === b.id
                                    ? { ...x, title: e.target.value }
                                    : x
                                )
                              )
                            }
                            placeholder="Title"
                          />
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={b.source?.type || 'selected'}
                            onChange={(e) =>
                              setLayoutBlocks((bs) =>
                                bs.map((x) =>
                                  x.id === b.id
                                    ? {
                                        ...x,
                                        source: {
                                          type: e.target.value as
                                            | 'selected'
                                            | 'collection'
                                            | 'category',
                                        },
                                      }
                                    : x
                                )
                              )
                            }
                          >
                            <option value="selected">Selected</option>
                            <option value="collection">Collection</option>
                            <option value="category">Category</option>
                          </select>
                          {b.type === 'grid' && (
                            <input
                              type="number"
                              min={2}
                              max={6}
                              className="border rounded px-2 py-1 text-xs"
                              value={b.columns || 3}
                              onChange={(e) =>
                                setLayoutBlocks((bs) =>
                                  bs.map((x) =>
                                    x.id === b.id
                                      ? {
                                          ...x,
                                          columns: Number(e.target.value),
                                        }
                                      : x
                                  )
                                )
                              }
                              placeholder="Columns"
                            />
                          )}
                          {b.source?.type === 'collection' && (
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={b.source.id || ''}
                              onChange={(e) =>
                                setLayoutBlocks((bs) =>
                                  bs.map((x) =>
                                    x.id === b.id
                                      ? {
                                          ...x,
                                          source: {
                                            ...x.source!,
                                            id: e.target.value,
                                          },
                                        }
                                      : x
                                  )
                                )
                              }
                            >
                              <option value="">Choose collection…</option>
                              {collections.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {b.source?.type === 'category' && (
                            <select
                              className="border rounded px-2 py-1 text-xs"
                              value={b.source.id || ''}
                              onChange={(e) =>
                                setLayoutBlocks((bs) =>
                                  bs.map((x) =>
                                    x.id === b.id
                                      ? {
                                          ...x,
                                          source: {
                                            ...x.source!,
                                            id: e.target.value,
                                          },
                                        }
                                      : x
                                  )
                                )
                              }
                            >
                              <option value="">Choose builder category…</option>
                              {categories.map((bc) => (
                                <option key={bc.id} value={bc.id}>
                                  {bc.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        {/* Simple inline preview */}
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          {(() => {
                            let list: Product[] = [];
                            if (b.source?.type === 'selected') {
                              list = products.filter((p) =>
                                selectedProducts.includes(p.id)
                              );
                            } else if (b.source?.type === 'category') {
                              const cat = categories.find(
                                (c) => c.id === b.source?.id
                              );
                              list = products.filter((p) =>
                                (cat?.productIds || []).includes(p.id)
                              );
                            } else if (b.source?.type === 'collection') {
                              const col = collections.find(
                                (c) => c.id === b.source?.id
                              );
                              if (col) list = matchCollection(col, products);
                            }
                            return list
                              .slice(
                                0,
                                b.type === 'grid' ? (b.columns || 3) * 2 : 3
                              )
                              .map((p) => (
                                <div
                                  key={p.id}
                                  className="text-[11px] px-2 py-1 rounded bg-gray-50 border truncate"
                                >
                                  {p.name}
                                </div>
                              ));
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {activeTab === 'structure' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-semibold text-gray-900">
                  <Tag className="h-4 w-4" /> Tags
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    placeholder="Add tag"
                  />
                  <button
                    className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                    onClick={addTag}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border bg-gray-50"
                  >
                    {t}
                    <button
                      onClick={() => removeTag(t)}
                      className="hover:text-rose-600"
                      aria-label={`Remove ${t}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <div className="text-sm text-gray-700">No tags yet.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <div className="xl:col-span-6 bg-white border border-gray-200 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <ListChecks className="h-4 w-4" /> Collections
              </div>
              <button
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                onClick={addCollection}
              >
                <PlusCircle className="h-3.5 w-3.5" /> New collection
              </button>
            </div>
            {collections.length === 0 && (
              <div className="text-sm text-gray-700">
                No collections yet. Add rules to auto-match products.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {collections.map((c) => {
                const matched = matchCollection(c, products).slice(0, 6);
                return (
                  <div key={c.id} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {c.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={() => deleteCollection(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={c.logic || 'all'}
                          onChange={(e) =>
                            setCollections((cs) =>
                              cs.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      logic: e.target
                                        .value as Collection['logic'],
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <option value="all">Match ALL</option>
                          <option value="any">Match ANY</option>
                        </select>
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={c.sortBy || 'name'}
                          onChange={(e) =>
                            setCollections((cs) =>
                              cs.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      sortBy: e.target
                                        .value as Collection['sortBy'],
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <option value="name">Name</option>
                          <option value="price">Price</option>
                          <option value="updatedAt">Updated</option>
                        </select>
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={c.sortOrder || 'asc'}
                          onChange={(e) =>
                            setCollections((cs) =>
                              cs.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      sortOrder: e.target
                                        .value as Collection['sortOrder'],
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <option value="asc">Asc</option>
                          <option value="desc">Desc</option>
                        </select>
                        <input
                          className="border rounded px-2 py-1 text-xs w-20"
                          type="number"
                          min={0}
                          placeholder="Limit"
                          value={c.limit ?? ''}
                          onChange={(e) =>
                            setCollections((cs) =>
                              cs.map((x) =>
                                x.id === c.id
                                  ? {
                                      ...x,
                                      limit: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    }
                                  : x
                              )
                            )
                          }
                        />
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={() => {
                            setPreviewColId(c.id);
                            setPreviewPage(1);
                          }}
                        >
                          Preview
                        </button>
                      </div>
                      {c.rules.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={r.field}
                            onChange={(e) =>
                              updateRule(c.id, idx, {
                                field: e.target.value as Rule['field'],
                              })
                            }
                          >
                            <option value="name">Name</option>
                            <option value="sku">SKU</option>
                            <option value="price">Price</option>
                            <option value="status">Status</option>
                            <option value="type">Type</option>
                            <option value="builderCategory">
                              Builder Category
                            </option>
                          </select>
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={r.op}
                            onChange={(e) =>
                              updateRule(c.id, idx, {
                                op: e.target.value as Rule['op'],
                              })
                            }
                          >
                            <option value="contains">contains</option>
                            <option value="equals">equals</option>
                            <option value="lt">&lt;</option>
                            <option value="gt">&gt;</option>
                          </select>
                          {r.field === 'builderCategory' ? (
                            <select
                              className="flex-1 border rounded px-2 py-1 text-xs"
                              value={r.value}
                              onChange={(e) =>
                                updateRule(c.id, idx, { value: e.target.value })
                              }
                            >
                              <option value="">Choose category…</option>
                              {categories.map((bc) => (
                                <option key={bc.id} value={bc.id}>
                                  {bc.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              className="flex-1 border rounded px-2 py-1 text-xs"
                              value={r.value}
                              onChange={(e) =>
                                updateRule(c.id, idx, { value: e.target.value })
                              }
                              placeholder="value"
                            />
                          )}
                          <button
                            className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                            onClick={() => removeRule(c.id, idx)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() => addRule(c.id)}
                      >
                        Add rule
                      </button>
                      <div className="text-[11px] text-gray-600">
                        Matched: {matchCollection(c, products).length}
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {matched.map((p) => (
                          <div
                            key={p.id}
                            className="text-[11px] px-2 py-1 rounded bg-gray-50 border truncate"
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feeds / Bulk right column panels will still show Config on the right */}

        {/* Config (right) */}
        <div className="xl:col-span-3 bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-2 font-semibold text-gray-900 mb-2">
            <Settings className="h-4 w-4" /> Shop Config
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-700">Slug</label>
              <input
                className="w-full border rounded px-2 py-2 text-sm"
                value={builderSlug}
                onChange={(e) => setBuilderSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-700">Currency</label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="DKK">DKK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-700">Inventory policy</label>
              <select
                className="w-full border rounded px-2 py-2 text-sm"
                value={inventoryPolicy}
                onChange={(e) =>
                  setInventoryPolicy(
                    e.target.value as 'sync' | 'snapshot' | 'manual'
                  )
                }
              >
                <option value="snapshot">Snapshot (copy current stock)</option>
                <option value="sync">Sync (keep in sync)</option>
                <option value="manual">Manual (no stock sync)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-700">Selected products</label>
              <div className="max-h-40 overflow-auto border rounded p-2 text-xs bg-gray-50">
                {selectedProducts.length === 0 && (
                  <div className="text-gray-600">
                    None. Use Select on catalog or drag into categories.
                  </div>
                )}
                {selectedProducts.map((pid) => {
                  const p = products.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">{p.name}</span>
                      <button
                        className="ml-2 text-[10px] px-1.5 py-0.5 rounded border"
                        onClick={() =>
                          setSelectedProducts((sp) =>
                            sp.filter((id) => id !== pid)
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white shadow hover:brightness-110"
              onClick={exportConfig}
            >
              <Download className="h-4 w-4" /> Export configuration
            </button>
            <div className="text-[11px] text-gray-600">
              Export produces a JSON model you can import into a new WooCommerce
              shop via a future import tool.
            </div>
            {activeTab === 'feeds' && (
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={feedPlatform}
                    onChange={(e) =>
                      setFeedPlatform(
                        e.target.value as 'woocommerce' | 'google' | 'facebook'
                      )
                    }
                  >
                    <option value="woocommerce">WooCommerce</option>
                    <option value="google">Google Merchant</option>
                    <option value="facebook">Facebook/Meta</option>
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={feedFormat}
                    onChange={(e) =>
                      setFeedFormat(e.target.value as 'json' | 'csv')
                    }
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={feedSource.type}
                    onChange={(e) =>
                      setFeedSource({
                        type: e.target.value as
                          | 'selected'
                          | 'category'
                          | 'collection',
                      })
                    }
                  >
                    <option value="selected">Selected</option>
                    <option value="category">Builder Category</option>
                    <option value="collection">Collection</option>
                  </select>
                  {feedSource.type === 'category' && (
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={feedSource.id || ''}
                      onChange={(e) =>
                        setFeedSource({ type: 'category', id: e.target.value })
                      }
                    >
                      <option value="">Choose category…</option>
                      {categories.map((bc) => (
                        <option key={bc.id} value={bc.id}>
                          {bc.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {feedSource.type === 'collection' && (
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={feedSource.id || ''}
                      onChange={(e) =>
                        setFeedSource({
                          type: 'collection',
                          id: e.target.value,
                        })
                      }
                    >
                      <option value="">Choose collection…</option>
                      {collections.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50"
                    onClick={previewFeed}
                  >
                    Preview
                  </button>
                </div>
                {/* Mapping editor */}
                <div className="border rounded p-2">
                  <div className="text-xs font-semibold text-gray-900 mb-1">
                    Field Mapping
                  </div>
                  <div className="space-y-1">
                    {feedMapping.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          className="border rounded px-2 py-1 text-xs w-40"
                          value={m.target}
                          onChange={(e) =>
                            setFeedMapping((mm) =>
                              mm.map((x, i) =>
                                i === idx ? { ...x, target: e.target.value } : x
                              )
                            )
                          }
                          placeholder="target field"
                        />
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={m.source}
                          onChange={(e) =>
                            setFeedMapping((mm) =>
                              mm.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      source: e.target
                                        .value as MappingRow['source'],
                                    }
                                  : x
                              )
                            )
                          }
                        >
                          <option value="name">name</option>
                          <option value="sku">sku</option>
                          <option value="basePrice">price</option>
                          <option value="image">image</option>
                          <option value="status">status</option>
                          <option value="type">type</option>
                          <option value="categories">categories</option>
                          <option value="tags">tags</option>
                        </select>
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={() =>
                            setFeedMapping((mm) =>
                              mm.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() =>
                          setFeedMapping((mm) => [
                            ...mm,
                            { target: 'new_field', source: 'name' },
                          ])
                        }
                      >
                        Add mapping
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() =>
                          setFeedMapping([
                            { target: 'id', source: 'sku' },
                            { target: 'title', source: 'name' },
                            { target: 'price', source: 'basePrice' },
                          ])
                        }
                      >
                        Preset: Woo basic
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                        onClick={() =>
                          setFeedMapping([
                            { target: 'id', source: 'sku' },
                            { target: 'title', source: 'name' },
                            { target: 'price', source: 'basePrice' },
                            { target: 'image_link', source: 'featuredImage' },
                            {
                              target: 'google_product_category',
                              source: 'categories',
                            },
                          ])
                        }
                      >
                        Preset: Google basic
                      </button>
                    </div>
                  </div>
                </div>
                <textarea
                  className="w-full h-40 font-mono text-xs border rounded p-2"
                  value={feedPreview}
                  onChange={() => {}}
                />
              </div>
            )}
            {activeTab === 'bulk' && (
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    className="border rounded px-2 py-2 text-sm"
                    placeholder="Title prefix"
                    value={titlePrefix}
                    onChange={(e) => setTitlePrefix(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-2 text-sm"
                    placeholder="Title suffix"
                    value={titleSuffix}
                    onChange={(e) => setTitleSuffix(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-800">Price +/-%</label>
                    <input
                      type="number"
                      className="border rounded px-2 py-2 text-sm w-24"
                      value={pricePercent}
                      onChange={(e) => setPricePercent(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="text-[11px] text-gray-600">
                  Transforms stored in build config; apply during
                  export/import/feed gen.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Collections Preview Modal */}
      {previewColId && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setPreviewColId(null)}
          />
          <div className="absolute inset-0 p-6 flex items-center justify-center">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="p-3 border-b flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  Collection preview
                </div>
                <button
                  className="text-sm px-2 py-1 rounded border hover:bg-gray-50"
                  onClick={() => setPreviewColId(null)}
                >
                  Close
                </button>
              </div>
              <div className="p-3 space-y-2">
                {(() => {
                  const c = collections.find((x) => x.id === previewColId);
                  if (!c)
                    return (
                      <div className="text-sm text-gray-700">Not found</div>
                    );
                  const all = matchCollection(c, products);
                  const pageSize = 30;
                  const totalPages = Math.max(
                    1,
                    Math.ceil(all.length / pageSize)
                  );
                  const page = Math.min(previewPage, totalPages);
                  const slice = all.slice(
                    (page - 1) * pageSize,
                    page * pageSize
                  );
                  const addAllToSelected = () => {
                    setSelectedProducts((prev) =>
                      Array.from(new Set([...prev, ...all.map((p) => p.id)]))
                    );
                  };
                  const addAllToCategory = () => {
                    if (!previewTargetCat) return;
                    setCategories((cs) =>
                      cs.map((cc) =>
                        cc.id === previewTargetCat
                          ? {
                              ...cc,
                              productIds: Array.from(
                                new Set([
                                  ...(cc.productIds || []),
                                  ...all.map((p) => p.id),
                                ])
                              ),
                            }
                          : cc
                      )
                    );
                  };
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={previewTargetCat}
                          onChange={(e) => setPreviewTargetCat(e.target.value)}
                        >
                          <option value="">Choose builder category…</option>
                          {categories.map((bc) => (
                            <option key={bc.id} value={bc.id}>
                              {bc.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={addAllToSelected}
                        >
                          Add all to Selected
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          onClick={addAllToCategory}
                          disabled={!previewTargetCat}
                        >
                          Add all to Category
                        </button>
                      </div>
                      <div className="text-xs text-gray-700 mb-2">
                        Matched {all.length} products
                      </div>
                      <div className="max-h-72 overflow-auto border rounded">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-2 py-1">Name</th>
                              <th className="text-left px-2 py-1">SKU</th>
                              <th className="text-left px-2 py-1">Price</th>
                              <th className="text-left px-2 py-1">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {slice.map((p) => (
                              <tr key={p.id} className="border-t">
                                <td className="px-2 py-1 truncate">{p.name}</td>
                                <td className="px-2 py-1">{p.sku}</td>
                                <td className="px-2 py-1">
                                  {p.basePrice ?? '-'}
                                </td>
                                <td className="px-2 py-1">{p.status ?? '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          disabled={page <= 1}
                          onClick={() =>
                            setPreviewPage((p) => Math.max(1, p - 1))
                          }
                        >
                          Prev
                        </button>
                        <div className="text-xs text-gray-700">
                          Page {page} / {totalPages}
                        </div>
                        <button
                          className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
                          disabled={page >= totalPages}
                          onClick={() =>
                            setPreviewPage((p) => Math.min(totalPages, p + 1))
                          }
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
