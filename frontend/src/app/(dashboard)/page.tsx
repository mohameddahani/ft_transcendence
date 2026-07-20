// app/(dashboard)/page.tsx
'use client';

import { useAuth } from '@/app/providers/AuthProvider';
import { 
  UserIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();

  // Stats data
  const stats = [
    {
      title: 'Welcome back,',
      value: user?.name || 'Guest',
      icon: UserIcon,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Total Members',
      value: '42',
      icon: UsersIcon,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Active Plans',
      value: '3',
      icon: DocumentTextIcon,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'Revenue',
      value: '$12,430',
      icon: CurrencyDollarIcon,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  // Quick actions
  const quickActions = [
    { title: 'Add Member', icon: UserIcon, href: '/members' },
    { title: 'Create Plan', icon: DocumentTextIcon, href: '/plans' },
    { title: 'View Reports', icon: ChartBarIcon, href: '/reports' },
    { title: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
  ];

  // Recent activity
  const recentActivity = [
    { user: 'John Doe', action: 'joined the gym', time: '2 hours ago' },
    { user: 'Jane Smith', action: 'upgraded to Pro Plan', time: '5 hours ago' },
    { user: 'Mike Johnson', action: 'cancelled membership', time: '1 day ago' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
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
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 transition hover:shadow-md ${
                isWelcome ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2 md:p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </p>
                  <p className={`font-bold truncate ${
                    isWelcome ? 'text-base md:text-xl' : 'text-lg md:text-2xl'
                  } text-gray-800`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
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
                className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="p-2 md:p-3 rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition">
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

      {/* Recent Activity & Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Recent Activity
            </h2>
            <button className="text-xs md:text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </button>
          </div>
          <div className="space-y-3 md:space-y-4">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm md:text-base text-gray-800 truncate">
                    <span className="font-semibold">{activity.user}</span>
                    {' '}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth / Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">
            Growth Overview
          </h2>
          <div className="space-y-3 md:space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Member Growth</span>
                <span className="font-semibold text-green-600">+12%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Revenue Growth</span>
                <span className="font-semibold text-green-600">+8%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Plan Upgrades</span>
                <span className="font-semibold text-amber-600">+5%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div className="pt-2 md:pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Active Members</span>
                <span className="text-lg md:text-xl font-bold text-gray-800">42</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-500">Total Revenue</span>
                <span className="text-lg md:text-xl font-bold text-gray-800">$12,430</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}