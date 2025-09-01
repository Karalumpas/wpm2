import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth-utils';
import { db } from '@/db';
import { products, productVariants, categories, shops } from '@/db/schema';
import { sql, count, desc } from 'drizzle-orm';
import { backgroundSyncQueue } from '@/lib/sync/background';
import {
  Package,
  Tags,
  Building2,
  ShoppingCart,
  BarChart3,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

async function getDashboardData() {
  const [prodCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(products);
  const [varCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(productVariants);
  const [catCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(categories);
  const [shopCount] = await db.select({ c: sql<number>`count(*)` }).from(shops);
  const [draftCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(products)
    .where(sql`status = 'draft'`);
  const [publishedCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(products)
    .where(sql`status = 'published'`);

  const recentProducts = await db
    .select({
      id: products.id,
      name: products.name,
      sku: products.sku,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .orderBy(desc(products.updatedAt))
    .limit(5);

  const shopsList = await db
    .select({
      id: shops.id,
      name: shops.name,
      lastConnectionOk: shops.lastConnectionOk,
      status: shops.status,
    })
    .from(shops)
    .orderBy(desc(shops.updatedAt))
    .limit(5);

  // In-memory sync jobs
  const jobs = backgroundSyncQueue.list().slice(-5).reverse();

  return {
    counts: {
      products: Number(prodCount.c || 0),
      variants: Number(varCount.c || 0),
      categories: Number(catCount.c || 0),
      shops: Number(shopCount.c || 0),
      published: Number(publishedCount.c || 0),
      drafts: Number(draftCount.c || 0),
    },
    recentProducts,
    shops: shopsList,
    jobs,
  } as const;
}

const quickActions = [
  {
    name: 'Manage Shops',
    href: '/connections',
    icon: Wifi,
    description: 'Connect and sync WooCommerce shops',
  },
  {
    name: 'View Products',
    href: '/products',
    icon: Package,
    description: 'Browse synchronized product catalog',
  },
  {
    name: 'Manage Categories',
    href: '/categories',
    icon: Tags,
    description: 'Organize products into categories',
  },
  {
    name: 'View Brands',
    href: '/brands',
    icon: Building2,
    description: 'Manage product brands and manufacturers',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'View catalog analytics',
  },
] as const;

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = await getDashboardData();

  const statCards = [
    {
      name: 'Products',
      value: data.counts.products,
      icon: Package,
      href: '/products',
    },
    {
      name: 'Variants',
      value: data.counts.variants,
      icon: Package,
      href: '/products',
    },
    {
      name: 'Categories',
      value: data.counts.categories,
      icon: Tags,
      href: '/categories',
    },
    {
      name: 'Shops',
      value: data.counts.shops,
      icon: Wifi,
      href: '/connections',
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Product Manager Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Welcome to your WooCommerce product management system
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Link
                    key={stat.name}
                    href={stat.href}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100/50 hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className="text-sm text-gray-600">{stat.name}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Status Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50">
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Published: {data.counts.published}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 font-medium text-sm">
                  <Clock className="h-4 w-4" />
                  Drafts: {data.counts.drafts}
                </div>
              </div>
            </div>
          </div>

          {/* Activity and Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Sync Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 xl:col-span-2">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Sync Activity
                  </h3>
                  <Link
                    href="#"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Open Sync Panel
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {data.jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No recent sync jobs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.jobs.map((j) => (
                      <div
                        key={j.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {j.shopName || j.shopId.slice(0, 8)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {j.message ||
                              (j.status === 'running' ? 'Running…' : j.status)}
                          </div>
                        </div>
                        <div className="ml-4">
                          {j.status === 'completed' ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-sm">
                              <CheckCircle2 className="h-4 w-4" />
                              Completed
                            </span>
                          ) : j.status === 'failed' ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 border border-red-200 font-medium text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Failed
                            </span>
                          ) : j.status === 'paused' ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 font-medium text-sm">
                              <Clock className="h-4 w-4" />
                              Paused
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 font-medium text-sm">
                              <Clock className="h-4 w-4" />
                              {j.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shops Health */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  Shops Health
                </h3>
              </div>
              <div className="p-6">
                {data.shops.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Wifi className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No shops connected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.shops.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {s.name}
                        </span>
                        {s.lastConnectionOk ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 font-medium text-xs">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Check
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Products & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  Recently Updated Products
                </h3>
              </div>
              <div className="p-6">
                {data.recentProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No products yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.recentProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {p.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            SKU: {p.sku}
                          </div>
                        </div>
                        <Link
                          href={`/products/${p.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.name}
                        href={action.href}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {action.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
