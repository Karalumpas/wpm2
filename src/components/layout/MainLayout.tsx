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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white/95 backdrop-blur-md border-r border-gray-200/50">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <Sidebar collapsed={false} onToggleCollapse={() => {}} />
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
        style={{ width: rightCollapsed ? '4rem' : '20rem' }}
      >
        <SyncSidebar
          collapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed((c) => !c)}
        />
      </div>

      <div
        className={cn(
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64',
          rightCollapsed ? 'lg:pr-16' : 'lg:pr-80'
        )}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
          <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-between">
              <div className="flex flex-1">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-4 lg:ml-0">
                  WooCommerce Product Manager
                </h1>
              </div>
              <div className="ml-4 flex items-center md:ml-6" ref={profileRef}>
                {session?.user && (
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      aria-haspopup="menu"
                      aria-expanded={profileOpen}
                    >
                      <User className="h-5 w-5" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-xl shadow-xl py-2 z-50">
                        <Link
                          href="/profile"
                          className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-900 transition-colors rounded-lg mx-2"
                        >
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-900 transition-colors rounded-lg mx-2"
                        >
                          Settings
                        </Link>
                        <div className="h-px bg-gray-200 my-2 mx-2"></div>
                        <button
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors rounded-lg mx-2"
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
    <div className="flex flex-1 flex-col min-h-0 bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-lg">
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 pb-4">
        <div className="flex items-center justify-between flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                WPM v2
              </span>
            )}
          </div>
          <button
            className="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>
        <nav className="mt-8 flex-1 space-y-2 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-900'
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={cn(
                    collapsed
                      ? 'h-5 w-5 flex-shrink-0'
                      : 'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 group-hover:text-blue-600'
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
