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
    <div className="space-y-8">
      {/* Stats */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                href={stat.href}
                className="relative bg-white pt-5 px-4 pb-4 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
              >
                <div>
                  <div className="absolute bg-indigo-600 rounded-md p-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-700 truncate">
                    {stat.name}
                  </p>
                </div>
                <div className="ml-16 mt-2 flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-3 text-sm text-gray-700">
          <span className="inline-flex items-center mr-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 mr-1" />{' '}
            Published: {data.counts.published}
          </span>
          <span className="inline-flex items-center">
            <Clock className="h-4 w-4 text-gray-500 mr-1" /> Drafts:{' '}
            {data.counts.drafts}
          </span>
        </div>
      </div>

      {/* Activity and lists */}
      <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sync Activity */}
        <div className="bg-white rounded-lg shadow border border-gray-200 xl:col-span-2">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">
              Sync Activity
            </h3>
            <Link
              href="#"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Open Sync Panel
            </Link>
          </div>
          <div className="p-4">
            {data.jobs.length === 0 ? (
              <div className="text-sm text-gray-700">No recent sync jobs.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.jobs.map((j) => (
                  <li
                    key={j.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {j.shopName || j.shopId.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-700 truncate">
                        {j.message ||
                          (j.status === 'running' ? 'Running…' : j.status)}
                      </div>
                    </div>
                    <div>
                      {j.status === 'completed' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Completed
                        </span>
                      ) : j.status === 'failed' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Failed
                        </span>
                      ) : j.status === 'paused' ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          Paused
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {j.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Shops Health */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Shops Health
            </h3>
          </div>
          <div className="p-4">
            {data.shops.length === 0 ? (
              <div className="text-sm text-gray-700">No shops connected.</div>
            ) : (
              <ul className="space-y-3">
                {data.shops.map((s) => (
                  <li key={s.id} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {s.name}
                    </span>
                    {s.lastConnectionOk ? (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Check
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Products & Quick Actions */}
      <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Recently Updated Products
            </h3>
          </div>
          <div className="p-4">
            {data.recentProducts.length === 0 ? (
              <div className="text-sm text-gray-700">No products yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.recentProducts.map((p) => (
                  <li
                    key={p.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-700">SKU: {p.sku}</div>
                    </div>
                    <Link
                      href={`/products/${p.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="relative group bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div>
                    <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-gray-900">
                      {action.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-700">
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
  );
}
