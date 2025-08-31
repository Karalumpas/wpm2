'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Package,
  Tags,
  Building2,
  ShoppingCart,
  BarChart3,
  Settings,
  Home,
  Menu,
  X,
  Globe,
  Images,
  Camera,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import SyncCenter from '@/components/sync/SyncCenter';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Brands', href: '/brands', icon: Building2 },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Media Library', href: '/media', icon: Images },
  { name: 'Photos', href: '/photos', icon: Camera },
  { name: 'Connections', href: '/connections', icon: Globe },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-between">
              <div className="flex flex-1">
                <h1 className="text-xl font-semibold text-gray-900 ml-4 lg:ml-0">
                  WooCommerce Product Manager
                </h1>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                {session?.user && (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      {session.user.email}
                    </span>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">{children}</main>
        {/* Global sync overlay + CTA */}
        <SyncCenter />
      </div>
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex items-center flex-shrink-0 px-4">
          <Package className="h-8 w-8 text-indigo-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">WPM v2</span>
        </div>
        <nav className="mt-8 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-gray-200">
          <Link
            href="/profile"
            className="flex items-center px-4 py-4 hover:bg-gray-50"
          >
            <User className="h-5 w-5 text-gray-400" />
            <span className="ml-3 text-sm font-medium text-gray-700">
              {session?.user?.email ?? 'Profile'}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
