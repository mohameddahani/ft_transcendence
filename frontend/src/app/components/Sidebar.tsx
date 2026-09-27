// app/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useTheme } from '@/app/providers/ThemeProvider';
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
  const { theme } = useTheme();
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

  // Close sidebar when route changes (only when pathname actually changes)
  useEffect(() => {
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 md:w-64 flex flex-col
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:relative md:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ 
          backgroundColor: theme.surface,
          borderRight: `1px solid ${theme.primaryLight}`,
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Decorative gradient line at the top */}
        <div 
          className="h-1 flex-shrink-0"
          style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }}
        />

        {/* Close button (mobile only) */}
        <div 
          className="flex items-center justify-between px-4 h-16 md:hidden"
          style={{ borderBottom: `1px solid ${theme.primaryLight}` }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: theme.primary }}
            >
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
              ft_transcendence
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition"
            style={{ color: theme.primary }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}15`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Logo (desktop only) */}
        <div 
          className="hidden md:flex items-center gap-2 px-6 h-16"
          style={{ borderBottom: `1px solid ${theme.primaryLight}` }}
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="text-white font-bold text-sm">FT</span>
          </div>
          <span className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
            ft_transcendence
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            if (item.adminOnly && !isAdmin) return null;

            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={isActive ? { 
                  backgroundColor: theme.primary,
                  color: 'white',
                  boxShadow: `0 2px 8px ${theme.primary}40`,
                } : {}}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = `${theme.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {/* Logout */}
        <div 
          className="p-4 mt-1"
          style={{ borderTop: `1px solid ${theme.primaryLight}` }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200"
            style={{ color: theme.primary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.primary}10`;
              e.currentTarget.style.color = theme.primaryDark;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.primary;
            }}
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" style={{ color: theme.primary }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}