// app/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  CreditCardIcon, 
  Cog6ToothIcon, 
  UserGroupIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/app/providers/AuthProvider';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Members', href: '/dashboard/members', icon: UsersIcon },
  { name: 'Plans', href: '/dashboard/plans', icon: UserGroupIcon },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCardIcon },
  { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: SparklesIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, isAdmin } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">FT</span>
        </div>
        <span className="text-lg font-semibold text-gray-800">ft_transcendence</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          // Skip admin-only items for non-admin users
          if (item.adminOnly && !isAdmin) return null;

          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}