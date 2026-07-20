// app/(dashboard)/page.tsx (Theme-Aware)
'use client';

import { useTheme } from '@/app/providers/ThemeProvider';
import { useAuth } from '@/app/providers/AuthProvider';
import { 
  UserIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const stats = [
    {
      title: 'Welcome back,',
      value: user?.name || 'Guest',
      icon: UserIcon,
    },
    {
      title: 'Total Members',
      value: '42',
      icon: UsersIcon,
    },
    {
      title: 'Active Plans',
      value: '3',
      icon: DocumentTextIcon,
    },
    {
      title: 'Revenue',
      value: '$12,430',
      icon: CurrencyDollarIcon,
    },
  ];

  const quickActions = [
    { title: 'Add Member', icon: UserIcon, href: '/members' },
    { title: 'Create Plan', icon: DocumentTextIcon, href: '/plans' },
    { title: 'View Reports', icon: ChartBarIcon, href: '/reports' },
    { title: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
  ];

  return (
    <div className="space-y-4 md:space-y-6" style={{ backgroundColor: theme.background }}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.primaryDark }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isWelcome = stat.title === 'Welcome back,';
          
          return (
            <div
              key={stat.title}
              className={`relative overflow-hidden rounded-xl shadow-lg p-4 md:p-6 transition hover:scale-[1.02] duration-200 ${
                isWelcome ? 'md:col-span-2' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              }}
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-white/5" />
              
              <div className="relative z-10 flex items-center gap-3 md:gap-4">
                <div className="p-2 md:p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-white/80 truncate">
                    {stat.title}
                  </p>
                  <p className={`font-bold text-white truncate ${
                    isWelcome ? 'text-base md:text-xl' : 'text-lg md:text-2xl'
                  }`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl shadow-sm border p-4 md:p-6" style={{ 
        backgroundColor: theme.surface,
        borderColor: `${theme.primaryLight}40`,
      }}>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.title}
                href={action.href}
                className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg transition group"
                style={{ 
                  backgroundColor: `${theme.primaryLight}15`,
                  '&:hover': { backgroundColor: `${theme.primaryLight}30` },
                } as React.CSSProperties}
              >
                <div className="p-2 md:p-3 rounded-full transition" style={{ 
                  backgroundColor: `${theme.primary}20`,
                  color: theme.primary,
                }}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-xs md:text-sm text-gray-700 font-medium text-center">
                  {action.title}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}