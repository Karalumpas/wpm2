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
import { formatDateTime, formatDimensions, formatPrice } from '@/lib/formatters';

type PageProps = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: PageProps) {
  const id = params.id;

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
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                {featured ? (
                  <Image
                    src={featured}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {allThumbs.length > 0 && (
                <div className="p-4 border-t">
                  <div className="flex gap-3 overflow-x-auto">
                    {allThumbs.map((thumb, i) => (
                      <div
                        key={`${thumb}-${i}`}
                        className="w-16 h-16 rounded-lg overflow-hidden border hover:scale-105 transition-transform duration-150 flex-shrink-0"
                        title={`Image ${i + 1}`}
                      >
                        <Image
                          src={thumb}
                          alt={`${product.name} ${i + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                      (product.dimensions as unknown as { length?: string; width?: string; height?: string })
                        ?.length,
                      (product.dimensions as unknown as { length?: string; width?: string; height?: string })
                        ?.width,
                      (product.dimensions as unknown as { length?: string; width?: string; height?: string })
                        ?.height
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

            {/* Variants */}
            {vars.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Varianter
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vars.map((v) => (
                    <div
                      key={v.id}
                      className="flex gap-3 p-3 rounded-lg border hover:border-blue-300 transition-colors duration-150"
                    >
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        {v.image ? (
                          <Image
                            src={v.image}
                            alt={v.sku}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{v.sku}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-gray-50">
                            {v.stockStatus}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {v.price ? formatPrice(v.price as unknown as string) : '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
