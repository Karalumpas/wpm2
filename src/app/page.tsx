'use client';

import Link from 'next/link';
import { Package, Tags, Building2, ShoppingCart, BarChart3, Database, Wifi } from 'lucide-react';

const stats = [
  { name: 'Total Products', value: '0', icon: Package, href: '/products' },
  { name: 'Categories', value: '0', icon: Tags, href: '/categories' },
  { name: 'Shop Connections', value: '1', icon: Wifi, href: '/connections' },
  { name: 'Orders', value: '0', icon: ShoppingCart, href: '/orders' },
];

const quickActions = [
  { name: 'Manage Shops', href: '/connections', icon: Wifi, description: 'Connect and sync WooCommerce shops' },
  { name: 'View Products', href: '/products', icon: Package, description: 'Browse synchronized product catalog' },
  { name: 'Manage Categories', href: '/categories', icon: Tags, description: 'Organize products into categories' },
  { name: 'View Brands', href: '/brands', icon: Building2, description: 'Manage product brands and manufacturers' },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'View sales and product analytics' },
];

export default function Home() {
  return (
    <div className="space-y-6">{/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to WooCommerce Product Manager v2. Manage your product catalog efficiently.
          </p>
        </div>
      </div>

      {/* Database Status */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-green-600" />
            <span className="ml-2 text-sm font-medium text-green-800">
              Connected to PostgreSQL Database
            </span>
          </div>
          <div className="mt-1 text-sm text-green-700">
            Host: 192.168.0.180:5432 | Database: wpm2 | Status: Active
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                href={stat.href}
                className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <dt>
                  <div className="absolute bg-indigo-500 rounded-md p-3">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </dd>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
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
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-gray-900">
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
