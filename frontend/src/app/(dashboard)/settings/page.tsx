// app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme, themes } from '@/app/providers/ThemeProvider';
import {
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  DevicePhoneMobileIcon,
  LanguageIcon,
  ShieldCheckIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,  // ✅ Added ClockIcon
} from '@heroicons/react/24/outline';

type TabType = 'profile' | 'theme' | 'notifications' | 'security';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, themeKey, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // --- Profile State ---
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+212 6 00 00 00 00',
    bio: 'Gym enthusiast and fitness lover 🏋️',
  });

  // --- Notification State ---
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    marketingEmails: false,
    pushNotifications: true,
    paymentReminders: true,
    memberActivity: false,
  });

  // --- Security State ---
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'theme', label: 'Theme', icon: MoonIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  ];

  return (
    <div className="space-y-4 md:space-y-6" style={{ backgroundColor: theme.background }}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: theme.primaryDark }}>
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage your account, preferences, and security
        </p>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border p-2" style={{ borderColor: theme.primaryLight }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={isActive ? { 
                    backgroundColor: theme.primary,
                    boxShadow: `0 2px 8px ${theme.primary}30`,
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = `${theme.primary}08`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-4 md:p-6" style={{ borderColor: theme.primaryLight }}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
                  Profile Information
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition"
                  style={{ 
                    color: theme.primary,
                    backgroundColor: `${theme.primary}10`,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}20`}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = `${theme.primary}10`}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl text-white font-bold flex-shrink-0"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400">Member since 2024</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border rounded-lg text-sm md:text-base disabled:bg-gray-50 disabled:text-gray-500"
                      style={{ 
                        borderColor: theme.primaryLight,
                        backgroundColor: isEditing ? 'white' : '#F9FAFB',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border rounded-lg text-sm md:text-base disabled:bg-gray-50 disabled:text-gray-500"
                      style={{ 
                        borderColor: theme.primaryLight,
                        backgroundColor: isEditing ? 'white' : '#F9FAFB',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border rounded-lg text-sm md:text-base disabled:bg-gray-50 disabled:text-gray-500"
                      style={{ 
                        borderColor: theme.primaryLight,
                        backgroundColor: isEditing ? 'white' : '#F9FAFB',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <input
                      type="text"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2.5 border rounded-lg text-sm md:text-base disabled:bg-gray-50 disabled:text-gray-500"
                      style={{ 
                        borderColor: theme.primaryLight,
                        backgroundColor: isEditing ? 'white' : '#F9FAFB',
                      }}
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: theme.primaryLight }}>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white rounded-lg transition"
                      style={{ backgroundColor: theme.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryDark}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
                Theme Preferences
              </h2>
              <p className="text-sm text-gray-500">
                Choose your preferred theme color for the application
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {Object.entries(themes).map(([key, themeOption]) => {
                  const isActive = themeKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                        isActive ? 'ring-2 ring-offset-2' : ''
                      }`}
                      style={{
                        borderColor: isActive ? themeOption.primary : '#E5E7EB',
                        backgroundColor: isActive ? `${themeOption.primary}10` : 'transparent',
                        '--tw-ring-color': themeOption.primary,
                      } as React.CSSProperties}
                    >
                      <div 
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: themeOption.primary }}
                      />
                      <span className={`text-xs font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                        {themeOption.name}
                      </span>
                      {isActive && (
                        <CheckIcon className="w-3 h-3" style={{ color: themeOption.primary }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
                Notifications
              </h2>
              <p className="text-sm text-gray-500">
                Manage your notification preferences
              </p>

              <div className="space-y-3">
                {[
                  { key: 'emailUpdates', label: 'Email Updates', desc: 'Receive updates via email' },
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Get promotional emails and offers' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications on your device' },
                  { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Get reminded about upcoming payments' },
                  { key: 'memberActivity', label: 'Member Activity', desc: 'Get notified about member activity' },
                ].map((item) => (
                  <div 
                    key={item.key}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: theme.primaryLight }}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({
                        ...notifications,
                        [item.key]: !notifications[item.key as keyof typeof notifications],
                      })}
                      className="relative w-11 h-6 rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor: notifications[item.key as keyof typeof notifications] ? theme.primary : '#D1D5DB',
                      }}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                          notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: theme.primaryDark }}>
                Security & Privacy
              </h2>
              <p className="text-sm text-gray-500">
                Manage your security settings and account privacy
              </p>

              <div className="space-y-4">
                {/* Change Password */}
                <div className="p-4 rounded-lg border" style={{ borderColor: theme.primaryLight }}>
                  <div className="flex items-center gap-3">
                    <KeyIcon className="w-5 h-5" style={{ color: theme.primary }} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Change Password</p>
                      <p className="text-sm text-gray-500">Update your password to keep your account secure</p>
                    </div>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
                      style={{ backgroundColor: theme.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.primaryDark}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primary}
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Two-Factor Auth */}
                <div className="p-4 rounded-lg border" style={{ borderColor: theme.primaryLight }}>
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-5 h-5" style={{ color: theme.primary }} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <button
                      onClick={() => setSecurity({
                        ...security,
                        twoFactorEnabled: !security.twoFactorEnabled,
                      })}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        security.twoFactorEnabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {security.twoFactorEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                </div>

                {/* Session Timeout */}
                <div className="p-4 rounded-lg border" style={{ borderColor: theme.primaryLight }}>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5" style={{ color: theme.primary }} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Session Timeout</p>
                      <p className="text-sm text-gray-500">Auto-logout after inactivity</p>
                    </div>
                    <select
                      value={security.sessionTimeout}
                      onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                      className="px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: theme.primaryLight }}
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center gap-3">
                    <TrashIcon className="w-5 h-5 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700">Delete Account</p>
                      <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                    </div>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
                          alert('Account deletion requested. (This is a demo)');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button (visible in all tabs) */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: theme.primaryLight }}>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition w-full md:w-auto"
              style={{ color: theme.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.primary}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}