'use client';

import { useState } from 'react';

type ProductData = {
  id: string;
  sku: string;
  name: string;
  basePrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  status: 'published' | 'draft' | 'private';
  type: 'simple' | 'variable' | 'grouped';
  stockStatus?: string | null;
  dimensions?: { length?: string; width?: string; height?: string } | null;
  description?: string | null;
  shortDescription?: string | null;
};

export default function ProductEditor({ initial }: { initial: ProductData }) {
  const [form, setForm] = useState<ProductData>(initial);
  const [saving, setSaving] = useState(false);

  const onChange = <K extends keyof ProductData>(
    key: K,
    value: ProductData[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/products/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || 'Kunne ikke gemme ændringer');
      }
      alert('Produkt opdateret');
    } catch (e) {
      console.error(e);
      alert('Kunne ikke gemme ændringer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Navn">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </Field>
        <Field label="SKU">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.sku}
            onChange={(e) => onChange('sku', e.target.value)}
          />
        </Field>
        <Field label="Pris (base)">
          <input
            className="w-full border rounded-md px-3 py-2"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.basePrice ?? ''}
            onChange={(e) => onChange('basePrice', e.target.value)}
          />
        </Field>
        <Field label="Pris (normal)">
          <input
            className="w-full border rounded-md px-3 py-2"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.regularPrice ?? ''}
            onChange={(e) => onChange('regularPrice', e.target.value)}
          />
        </Field>
        <Field label="Pris (tilbud)">
          <input
            className="w-full border rounded-md px-3 py-2"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.salePrice ?? ''}
            onChange={(e) => onChange('salePrice', e.target.value)}
          />
        </Field>
        <Field label="Status">
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.status}
            onChange={(e) =>
              onChange('status', e.target.value as ProductData['status'])
            }
          >
            <option value="published">published</option>
            <option value="draft">draft</option>
            <option value="private">private</option>
          </select>
        </Field>
        <Field label="Type">
          <select
            className="w-full border rounded-md px-3 py-2"
            value={form.type}
            onChange={(e) =>
              onChange('type', e.target.value as ProductData['type'])
            }
          >
            <option value="simple">simple</option>
            <option value="variable">variable</option>
            <option value="grouped">grouped</option>
          </select>
        </Field>
        <Field label="Lagerstatus">
          <input
            className="w-full border rounded-md px-3 py-2"
            value={form.stockStatus ?? ''}
            onChange={(e) => onChange('stockStatus', e.target.value)}
            placeholder="instock / outofstock / onbackorder"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Længde">
          <input
            className="w-full border rounded-md px-3 py-2"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={form.dimensions?.length ?? ''}
            onChange={(e) =>
              onChange('dimensions', {
                ...(form.dimensions ?? {}),
                length: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Bredde">
          <input
            className="w-full border rounded-md px-3 py-2"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={form.dimensions?.width ?? ''}
            onChange={(e) =>
              onChange('dimensions', {
                ...(form.dimensions ?? {}),
                width: e.target.value,
              })
            }
          />
        </Field>
        <Field label="Højde">
          <input
            className="w-full border rounded-md px-3 py-2"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={form.dimensions?.height ?? ''}
            onChange={(e) =>
              onChange('dimensions', {
                ...(form.dimensions ?? {}),
                height: e.target.value,
              })
            }
          />
        </Field>
      </div>

      <Field label="Kort beskrivelse">
        <textarea
          className="w-full border rounded-md px-3 py-2"
          rows={3}
          value={form.shortDescription ?? ''}
          onChange={(e) => onChange('shortDescription', e.target.value)}
        />
      </Field>
      <Field label="Beskrivelse (HTML understøttet)">
        <textarea
          className="w-full border rounded-md px-3 py-2"
          rows={6}
          value={form.description ?? ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </Field>

      <div className="pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
        >
          {saving ? 'Gemmer…' : 'Gem ændringer'}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
