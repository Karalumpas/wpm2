import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import ProductEditor from '../components/ProductEditor';

type PageProps = {
  params: { id: string };
};

export default async function EditProductPage({ params }: PageProps) {
  const id = params.id;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return notFound();

  const dimensions = (product.dimensions || {}) as {
    length?: string;
    width?: string;
    height?: string;
  };

  const initial = {
    id: product.id,
    sku: product.sku,
    name: product.name,
    basePrice: product.basePrice ? String(product.basePrice) : null,
    regularPrice: product.regularPrice ? String(product.regularPrice) : null,
    salePrice: product.salePrice ? String(product.salePrice) : null,
    status: product.status as 'published' | 'draft' | 'private',
    type: product.type as 'simple' | 'variable' | 'grouped',
    stockStatus: product.stockStatus ?? null,
    dimensions,
    description: product.description ?? null,
    shortDescription: product.shortDescription ?? null,
  } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Rediger produkt
            </h1>
            <p className="mt-1 text-gray-500">SKU: {product.sku}</p>
          </div>
          <Link
            href={`/products/${product.id}`}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
          >
            Tilbage
          </Link>
        </div>

        <ProductEditor initial={initial} />
      </div>
    </div>
  );
}

