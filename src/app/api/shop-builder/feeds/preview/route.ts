import { NextRequest, NextResponse } from 'next/server';

function toCsv(headers: string[], rows: string[][]): string {
  const esc = (s: string) =>
    '"' + (s ?? '').toString().replace(/"/g, '""') + '"';
  return [
    headers.map(esc).join(','),
    ...rows.map((r) => r.map(esc).join(',')),
  ].join('\n');
}

type MappingRow = { target: string; source: string };

export async function POST(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const format = (sp.get('format') || 'json').toLowerCase();
    const platform = (sp.get('platform') || 'woocommerce').toLowerCase();
    const body = await request.json();

    // Accept either config-only (legacy) or explicit items+mapping
    const cfg = body?.config || {};
    const items: Array<Record<string, unknown>> = body?.items || [];
    const mapping: MappingRow[] = body?.mapping || [];

    let rows: Array<Record<string, unknown>> = [];
    if (items.length && mapping.length) {
      // Map provided items via mapping rows
      rows = items.map((it) => {
        const out: Record<string, unknown> = {};
        for (const m of mapping) {
          const raw = it[m.source as keyof typeof it];
          out[m.target] = Array.isArray(raw) ? raw.join('|') : (raw ?? '');
        }
        return out;
      });
    } else {
      // Fallback legacy behavior using config only
      const categories: Array<{ name: string; productIds: string[] }> =
        cfg.categories || [];
      const tags: string[] = cfg.tags || [];
      const productIds: string[] = cfg.products || [];
      rows = productIds.map((id: string) => ({
        id,
        sku: id,
        name: id,
        categories: categories
          .filter((c) => (c.productIds || []).includes(id))
          .map((c) => c.name),
        tags,
      }));
    }

    if (format === 'csv') {
      const headers = mapping.length
        ? mapping.map((m) => m.target)
        : Object.keys(rows[0] || {});
      const csv = toCsv(
        headers,
        rows.map((r) =>
          headers.map((h) => String((r as Record<string, unknown>)[h] ?? ''))
        )
      );
      return new NextResponse(csv, {
        status: 200,
        headers: { 'Content-Type': 'text/csv' },
      });
    }
    return NextResponse.json({ platform, items: rows });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to build preview' },
      { status: 400 }
    );
  }
}
