import Link from 'next/link';
import { 
  Edit, 
  ArrowLeft, 
  Package, 
  DollarSign, 
  Tag, 
  Ruler, 
  Calendar, 
  ExternalLink,
  Share2,
  RefreshCw,
  MoreHorizontal,
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShoppingCart
} from 'lucide-react';
import { formatDateTime, formatPrice, formatDimensions } from '@/lib/formatters';
import InteractiveGallery from './InteractiveGallery';
import CopyButton from './CopyButton';
import VariantsTable from '../variants/VariantsTable';

interface Product {
  id: string;
  sku: string;
  name: string;
  status: string;
  type: string;
  basePrice?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string;
  dimensions?: Record<string, unknown>;
  description?: string | null;
  shortDescription?: string | null;
  featuredImage?: string | null;
  galleryImages?: unknown;
  updatedAt?: string;
  createdAt?: string;
  lastSyncedAt?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug?: string | null;
}

interface Variant {
  id: string;
  sku: string;
  image?: string | null;
  price?: string | null;
  stockStatus?: string | null;
  attributes?: Record<string, unknown>;
}

interface ImprovedProductDetailsProps {
  product: Product;
  categories: Category[];
  variants: Variant[];
  allImages: string[];
}

export default function ImprovedProductDetails({
  product,
  categories,
  variants,
  allImages,
}: ImprovedProductDetailsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <ProductHeader product={product} />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
          {/* Image Gallery */}
          <div className="xl:col-span-7">
            <ProductImageGallery images={allImages} productName={product.name} />
          </div>

          {/* Product Info Sidebar */}
          <div className="xl:col-span-5 space-y-6">
            <ProductInfoCard product={product} />
            <ProductActions product={product} />
            {categories.length > 0 && <ProductCategories categories={categories} />}
            <ProductMetadata product={product} />
          </div>
        </div>

        {/* Full-width sections */}
        <div className="mt-12 space-y-8">
          {product.description && (
            <ProductDescription description={product.description} />
          )}
          
          {variants.length > 0 && (
            <ProductVariants variants={variants} />
          )}

          <ProductAnalytics />
        </div>
      </div>
    </div>
  );
}

function ProductHeader({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">SKU:</span>
                <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-900">
                  {product.sku}
                </code>
                <CopyButton value={product.sku} label="Copy SKU" />
              </div>
              <div className="hidden lg:flex items-center gap-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Updated {formatDateTime(product.updatedAt || '')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProductStatusBadge status={product.status} />
          <ProductTypeBadge type={product.type} />
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductImageGallery({ images, productName }: { images: string[], productName: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Product Gallery</h2>
          <span className="text-sm text-gray-500">{images.length} images</span>
        </div>
        <InteractiveGallery images={images} alt={productName} />
      </div>
    </div>
  );
}

function ProductInfoCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 sticky top-8">
      <div className="space-y-6">
        {/* Pricing */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Pricing
          </h3>
          <div className="space-y-2">
            {product.salePrice ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-emerald-600">
                  {formatPrice(product.salePrice)}
                </span>
                {product.regularPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(product.regularPrice)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-2xl font-bold text-gray-900">
                {product.basePrice ? formatPrice(product.basePrice) : 'No price set'}
              </span>
            )}
          </div>
        </div>

        {/* Stock Status */}
        {product.stockStatus && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Inventory
            </h3>
            <StockStatusBadge status={product.stockStatus} size="large" />
          </div>
        )}

        {/* Dimensions */}
        {product.dimensions && Object.values(product.dimensions).some(Boolean) && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600" />
              Dimensions
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-gray-700 font-mono">
                {formatDimensions(
                  (product.dimensions as any)?.length,
                  (product.dimensions as any)?.width,
                  (product.dimensions as any)?.height
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductActions({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
      <div className="space-y-3">
        <Link
          href={`/products/${product.id}/edit`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
        >
          <Edit className="h-4 w-4" />
          Edit Product
        </Link>
        
        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
          <RefreshCw className="h-4 w-4" />
          Sync Now
        </button>
        
        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
          <ExternalLink className="h-4 w-4" />
          View in Shop
        </button>
      </div>
    </div>
  );
}

function ProductCategories({ categories }: { categories: Category[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-blue-600" />
        Categories
      </h3>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category.id}
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium"
          >
            {category.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProductMetadata({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
      <dl className="space-y-3">
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Created</dt>
          <dd className="text-sm text-gray-900">
            {product.createdAt ? formatDateTime(product.createdAt) : '-'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Last Updated</dt>
          <dd className="text-sm text-gray-900">
            {product.updatedAt ? formatDateTime(product.updatedAt) : '-'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Last Synced</dt>
          <dd className="text-sm text-gray-900">
            {product.lastSyncedAt ? formatDateTime(product.lastSyncedAt) : 'Never'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm text-gray-500">Product ID</dt>
          <dd className="text-sm text-gray-900 font-mono">{product.id}</dd>
        </div>
      </dl>
    </div>
  );
}

function ProductDescription({ description }: { description: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Description</h2>
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

function ProductVariants({ variants }: { variants: Variant[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Product Variants</h2>
          <span className="text-sm text-gray-500">{variants.length} variants</span>
        </div>
      </div>
      <div className="p-6">
        <VariantsTable
          variants={variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            image: v.image || undefined,
            price: v.price || undefined,
            stockStatus: v.stockStatus || '-',
          }))}
        />
      </div>
    </div>
  );
}

function ProductAnalytics() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        Product Analytics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500">Page Views</p>
        </div>
        
        <div className="text-center">
          <div className="bg-emerald-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500">Orders</p>
        </div>
        
        <div className="text-center">
          <div className="bg-purple-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">DKK 0</p>
          <p className="text-sm text-gray-500">Revenue</p>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Analytics data will be available once the product has activity
        </p>
      </div>
    </div>
  );
}

function ProductStatusBadge({ status }: { status: string }) {
  const styles = {
    published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    draft: 'bg-amber-100 text-amber-700 border-amber-200',
    private: 'bg-gray-100 text-gray-700 border-gray-200',
  } as Record<string, string>;

  const icons = {
    published: CheckCircle2,
    draft: Clock,
    private: Eye,
  } as Record<string, React.ComponentType<{ className?: string }>>;

  const Icon = icons[status] || Clock;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium text-sm ${styles[status] || styles.private}`}>
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );
}

function ProductTypeBadge({ type }: { type: string }) {
  const styles = {
    simple: 'bg-blue-100 text-blue-700 border-blue-200',
    variable: 'bg-purple-100 text-purple-700 border-purple-200',
    grouped: 'bg-orange-100 text-orange-700 border-orange-200',
  } as Record<string, string>;

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border font-medium text-sm ${styles[type] || styles.simple}`}>
      {type}
    </span>
  );
}

function StockStatusBadge({ status, size = 'normal' }: { status: string, size?: 'normal' | 'large' }) {
  const styles = {
    instock: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    outofstock: 'bg-red-100 text-red-700 border-red-200',
    onbackorder: 'bg-amber-100 text-amber-700 border-amber-200',
  } as Record<string, string>;

  const icons = {
    instock: CheckCircle2,
    outofstock: AlertTriangle,
    onbackorder: Clock,
  } as Record<string, React.ComponentType<{ className?: string }>>;

  const Icon = icons[status] || CheckCircle2;
  const sizeClasses = size === 'large' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border font-medium ${sizeClasses} ${styles[status] || styles.instock}`}>
      <Icon className="h-4 w-4" />
      {status}
    </span>
  );
}