'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Brain,
  Share2,
  Shield,
  Bell,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'General',
    href: '/profile',
    icon: User,
    description: 'Basic account information',
  },
  {
    name: 'AI Integrations',
    href: '/profile/ai',
    icon: Brain,
    description: 'Configure AI providers',
  },
  {
    name: 'Social Media',
    href: '/profile/social',
    icon: Share2,
    description: 'Connect social accounts',
  },
  {
    name: 'Security',
    href: '/profile/security',
    icon: Shield,
    description: 'Password and security',
  },
  {
    name: 'Notifications',
    href: '/profile/notifications',
    icon: Bell,
    description: 'Email and push settings',
  },
  {
    name: 'Billing',
    href: '/profile/billing',
    icon: CreditCard,
    description: 'Subscription and usage',
  },
  {
    name: 'Analytics',
    href: '/profile/analytics',
    icon: BarChart3,
    description: 'AI usage statistics',
  },
  {
    name: 'Advanced',
    href: '/profile/advanced',
    icon: Settings,
    description: 'Developer settings',
  },
];

export default function ProfileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-start gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0 mt-0.5',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{item.name}</div>
                <div
                  className={cn(
                    'text-xs mt-0.5',
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  )}
                >
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
