import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import {
  products,
  productVariants,
  productCategories,
  categories,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  formatDateTime,
  formatDimensions,
  formatPrice,
} from '@/lib/formatters';
import ProductImages from './components/ProductImages';
import VariantsTable from './variants/VariantsTable';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return notFound();

  const cats = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(productCategories)
    .leftJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(eq(productCategories.productId, id));

  const vars = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      image: productVariants.image,
      price: productVariants.price,
      stockStatus: productVariants.stockStatus,
      attributes: productVariants.attributes,
    })
    .from(productVariants)
    .where(eq(productVariants.productId, id));

  const featured = product.featuredImage || undefined;
  const gallery: string[] = Array.isArray(product.galleryImages)
    ? (product.galleryImages as unknown as string[])
    : [];

  const allThumbs = Array.from(
    new Set([...(featured ? [featured] : []), ...gallery])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {product.name}
            </h1>
            <p className="mt-1 text-gray-500">SKU: {product.sku}</p>
          </div>

          <div className="flex gap-2">
            <StatusBadge status={product.status} />
            <TypeBadge type={product.type} />
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-6">
            <ProductImages images={allThumbs} alt={product.name} />
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl font-bold text-blue-600">
                  {product.basePrice ? formatPrice(product.basePrice) : '-'}
                </span>
                {product.regularPrice && (
                  <span className="text-sm line-through text-gray-400">
                    {formatPrice(product.regularPrice)}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="text-gray-900 capitalize">{product.status}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-gray-900 capitalize">{product.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Lagerstatus</dt>
                  <dd className="text-gray-900">{product.stockStatus}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Vægt &amp; mål</dt>
                  <dd className="text-gray-900">
                    {formatDimensions(
                      (
                        product.dimensions as unknown as {
                          length?: string;
                          width?: string;
                          height?: string;
                        }
                      )?.length,
                      (
                        product.dimensions as unknown as {
                          length?: string;
                          width?: string;
                          height?: string;
                        }
                      )?.width,
                      (
                        product.dimensions as unknown as {
                          length?: string;
                          width?: string;
                          height?: string;
                        }
                      )?.height
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Sidst opdateret</dt>
                  <dd className="text-gray-900">
                    {product.updatedAt
                      ? formatDateTime(product.updatedAt)
                      : '-'}
                  </dd>
                </div>
              </dl>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/products"
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors duration-150"
                >
                  Tilbage
                </Link>
                <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow hover:shadow-lg hover:brightness-110 transition-all duration-200">
                  Rediger produkt
                </button>
                <button className="px-5 py-2 rounded-lg bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-800 transition-all duration-200">
                  Synkronisér nu
                </button>
              </div>
            </div>

            {/* Categories */}
            {cats.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Kategorier
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => (
                    <span
                      key={c.id}
                      className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Variants moved below to full width */}

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Beskrivelse
                </h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>

        {vars.length > 0 && (
          <div className="mt-8">
            <VariantsTable
              variants={vars.map((v) => ({
                id: v.id,
                sku: v.sku,
                image: v.image || undefined,
                price: v.price ? String(v.price) : undefined,
                stockStatus: v.stockStatus || '-',
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    published: 'bg-green-100 text-green-800 border-green-200',
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    private: 'bg-gray-100 text-gray-800 border-gray-200',
  } as Record<string, string>;
  return (
    <span
      className={`px-3 py-1 text-xs rounded-full border ${map[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const map = {
    simple: 'bg-blue-100 text-blue-800 border-blue-200',
    variable: 'bg-purple-100 text-purple-800 border-purple-200',
    grouped: 'bg-orange-100 text-orange-800 border-orange-200',
  } as Record<string, string>;
  return (
    <span
      className={`px-3 py-1 text-xs rounded-full border ${map[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
    >
      {type}
    </span>
  );
}
