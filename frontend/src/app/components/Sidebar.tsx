// app/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  UsersIcon, 
  CreditCardIcon, 
  Cog6ToothIcon, 
  UserGroupIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/app/providers/AuthProvider';
import { useEffect, useRef } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Members', href: '/members', icon: UsersIcon },
  { name: 'Plans', href: '/plans', icon: UserGroupIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'AI Assistant', href: '/ai-assistant', icon: SparklesIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAdmin } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const previousPathname = useRef(pathname);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ✅ Close sidebar when route changes (only when pathname actually changes)
  useEffect(() => {
    // Only close if the pathname actually changed
    if (previousPathname.current !== pathname && isOpen) {
      onClose();
    }
    previousPathname.current = pathname;
  }, [pathname, isOpen, onClose]);

  const handleLogout = () => {
    logout();
    router.push('/');
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Close button (mobile only) */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="text-lg font-semibold text-gray-800">ft_transcendence</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Logo (desktop only) */}
        <div className="hidden md:flex items-center gap-2 px-6 h-16 border-b border-gray-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">FT</span>
          </div>
          <span className="text-lg font-semibold text-gray-800">ft_transcendence</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
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

        {/* Logout */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-500" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}