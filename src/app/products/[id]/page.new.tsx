import { notFound } from 'next/navigation';
import Link from 'next/link';
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
import { SwipeableMediaGallery } from './components/SwipeableMediaGallery';
import { InlineEditor, RichTextInlineEditor } from './components/InlineEditor';
import { ProductActions } from './components/ProductActions';
import VariantsTable from './variants/VariantsTable';
import { ArrowLeft, Package, Calendar, DollarSign, BarChart3 } from 'lucide-react';

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

  // Prepare media gallery
  const featured = product.featuredImage || undefined;
  const gallery: string[] = Array.isArray(product.galleryImages)
    ? (product.galleryImages as unknown as string[])
    : [];

  const variantImages: string[] = vars
    .map((v) => (v.image ? String(v.image) : ''))
    .filter(Boolean);

  const allImages = [featured, ...gallery, ...variantImages].filter(Boolean) as string[];
  
  const mediaItems = allImages.map(url => ({
    url,
    type: 'image' as const,
    alt: product.name,
  }));

  // Dummy save functions - to be implemented with actual API calls
  const handleSaveField = async (field: string, value: string) => {
    console.log(`Saving ${field}:`, value);
    // TODO: Implement API call to update product
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/products"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Tilbage til produkter
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="mb-2">
                <InlineEditor
                  value={product.name}
                  onSave={(value) => handleSaveField('name', value)}
                  placeholder="Produktnavn"
                  displayClassName="text-3xl font-bold text-gray-900"
                />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  SKU: {product.sku}
                </span>
                <StatusBadge status={product.status} />
                <TypeBadge type={product.type} />
              </div>
            </div>
            
            <ProductActions
              productId={product.id}
              productName={product.name}
              shopUrl={undefined}
              productUrl={undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Media Gallery */}
          <div>
            <SwipeableMediaGallery
              media={mediaItems}
              className="w-full h-96 lg:h-[500px]"
            />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Priser
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basispris
                  </label>
                  <InlineEditor
                    value={product.basePrice ? formatPrice(product.basePrice) : ''}
                    onSave={(value) => handleSaveField('basePrice', value)}
                    type="text"
                    placeholder="0,00 DKK"
                    displayClassName="text-lg font-medium text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Almindelig pris
                  </label>
                  <InlineEditor
                    value={product.regularPrice ? formatPrice(product.regularPrice) : ''}
                    onSave={(value) => handleSaveField('regularPrice', value)}
                    type="text"
                    placeholder="0,00 DKK"
                    displayClassName="text-gray-900"
                  />
                </div>
                
                {product.salePrice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tilbudspris
                    </label>
                    <InlineEditor
                      value={formatPrice(product.salePrice)}
                      onSave={(value) => handleSaveField('salePrice', value)}
                      type="text"
                      placeholder="0,00 DKK"
                      displayClassName="text-green-600 font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status & Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Status & Indstillinger
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <InlineEditor
                    value={product.status}
                    onSave={(value) => handleSaveField('status', value)}
                    type="select"
                    options={[
                      { value: 'published', label: 'Udgivet' },
                      { value: 'draft', label: 'Kladde' },
                      { value: 'private', label: 'Privat' },
                    ]}
                    displayClassName="text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <InlineEditor
                    value={product.type}
                    onSave={(value) => handleSaveField('type', value)}
                    type="select"
                    options={[
                      { value: 'simple', label: 'Simpelt' },
                      { value: 'variable', label: 'Variabelt' },
                      { value: 'grouped', label: 'Grupperet' },
                    ]}
                    displayClassName="text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lagerstatus
                  </label>
                  <InlineEditor
                    value={product.stockStatus || 'instock'}
                    onSave={(value) => handleSaveField('stockStatus', value)}
                    type="select"
                    options={[
                      { value: 'instock', label: 'På lager' },
                      { value: 'outofstock', label: 'Udsolgt' },
                      { value: 'onbackorder', label: 'Restordre' },
                    ]}
                    displayClassName="text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            {cats.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Kategorier
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => (
                    <span
                      key={c.id}
                      className="px-3 py-1 text-sm rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Oprettet:</span>
                  <span className="text-gray-900">
                    {product.createdAt ? formatDateTime(product.createdAt) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sidst opdateret:</span>
                  <span className="text-gray-900">
                    {product.updatedAt ? formatDateTime(product.updatedAt) : '-'}
                  </span>
                </div>
                {product.dimensions && typeof product.dimensions === 'object' && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensioner:</span>
                    <span className="text-gray-900">
                      {formatDimensions(
                        (product.dimensions as any)?.length,
                        (product.dimensions as any)?.width,
                        (product.dimensions as any)?.height
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kort beskrivelse
            </h3>
            <InlineEditor
              value={product.shortDescription || ''}
              onSave={(value) => handleSaveField('shortDescription', value)}
              type="textarea"
              placeholder="Tilføj en kort beskrivelse..."
              multiline
              displayClassName="text-gray-700"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fuldstændig beskrivelse
            </h3>
            <RichTextInlineEditor
              value={product.description || ''}
              onSave={(value) => handleSaveField('description', value)}
              placeholder="Tilføj en detaljeret beskrivelse..."
            />
          </div>
        </div>

        {/* Variants */}
        {vars.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Produktvarianter ({vars.length})
            </h3>
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
