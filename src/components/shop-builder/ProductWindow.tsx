'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error('Failed');
  return r.json();
});

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  basePrice?: string | null;
  status: 'published' | 'draft' | 'private';
  type: 'simple' | 'variable' | 'grouped';
  featuredImage?: string | null;
  galleryImages?: string[] | null;
  updatedAt: string;
};

export default function ProductWindow({ id }: { id: string }) {
  const { data, error, isLoading, mutate } = useSWR<ProductRow>(`/api/products/${id}` as const, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 20000,
  });

  if (isLoading) return <div className="text-sm text-gray-700">Loading product…</div>;
  if (error || !data)
    return <div className="text-sm text-rose-700">Failed to load product.</div>;

  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-semibold text-gray-900">{data.name}</div>
        <div className="text-xs text-gray-600">SKU: {data.sku} • {data.type} • {data.status}</div>
      </div>
      {data.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={String(data.featuredImage)} alt={data.name} className="w-full max-h-40 object-cover rounded border" />
      )}
      {data.basePrice && (
        <div className="text-sm"><span className="text-gray-600">Base price:</span> {data.basePrice}</div>
      )}
      {data.description && (
        <div className="text-xs text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: data.description }} />
      )}
      <div className="pt-1">
        <button className="text-xs px-2 py-1 rounded border hover:bg-gray-50" onClick={() => mutate()}>Refresh</button>
      </div>
    </div>
  );
}

