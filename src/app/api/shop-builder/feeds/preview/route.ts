import { NextRequest, NextResponse } from 'next/server';

function toCsv(headers: string[], rows: string[][]): string {
  const esc = (s: string) => '"' + s.replace(/"/g, '""') + '"';
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const format = (sp.get('format') || 'json').toLowerCase();
    const platform = (sp.get('platform') || 'woocommerce').toLowerCase();
    const body = await request.json();
    const cfg = body?.config || body;

    const categories: Array<{ name: string; productIds: string[] }> = cfg.categories || [];
    const tags: string[] = cfg.tags || [];
    const productIds: string[] = cfg.products || [];

    // Map to a flat list with metadata (category list & tags)
    const rows = productIds.map((id: string) => ({
      id,
      sku: id, // placeholder: real SKU can be joined by client if provided
      name: id,
      categories: categories.filter((c) => (c.productIds || []).includes(id)).map((c) => c.name),
      tags,
    }));

    if (format === 'csv') {
      const csv = toCsv(['id', 'sku', 'name', 'categories', 'tags'], rows.map((r) => [r.id, r.sku, r.name, r.categories.join('|'), r.tags.join('|')]));
      return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv' } });
    }
    return NextResponse.json({ platform, items: rows });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to build preview' }, { status: 400 });
  }
}

