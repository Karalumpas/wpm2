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
import { useEffect, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import SyncSidebar from '@/components/sync/SyncSidebar';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Shop Builder', href: '/shop-builder', icon: Building2 },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: session } = useSession();

  // close profile menu on outside click
  const profileRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

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

      {/* Desktop left sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-[width]',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      {/* Main content */}
      {/* Right sync sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:right-0 lg:flex lg:flex-col transition-[width]'
        )}
        style={{ width: rightCollapsed ? '4rem' : '16rem' }}
      >
        <SyncSidebar collapsed={rightCollapsed} onToggleCollapse={() => setRightCollapsed((c) => !c)} />
      </div>

      <div className={cn(sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64', rightCollapsed ? 'lg:pr-16' : 'lg:pr-64')}>
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
              <div className="ml-4 flex items-center md:ml-6" ref={profileRef}>
                {session?.user && (
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border bg-white hover:bg-gray-50"
                      aria-haspopup="menu"
                      aria-expanded={profileOpen}
                    >
                      <User className="h-5 w-5 text-gray-700" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        <Link
                          href="/profile"
                          className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">{children}</main>
        {/* Right sidebar handles sync UI */}
      </div>
    </div>
  );
}

function Sidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <div className="flex items-center justify-between flex-shrink-0 px-3">
          <div className="flex items-center">
            <Package className="h-7 w-7 text-indigo-600" />
            {!collapsed && (
              <span className="ml-2 text-xl font-bold text-gray-900">
                WPM v2
              </span>
            )}
          </div>
          <button
            className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white hover:bg-gray-50"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="mt-6 flex-1 space-y-1 px-2">
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
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    collapsed
                      ? 'h-5 w-5 flex-shrink-0'
                      : 'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-indigo-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {!collapsed && item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
