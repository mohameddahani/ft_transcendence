
// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/app/providers/AuthProvider';

fetch("https://api-generator.retool.com/81rBia/data")
.then(Response => Response.json())
.then(Response => console.log(Response))

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Welcome back,</h3>
          <p className="text-xl font-semibold text-gray-800 mt-1">{user?.name}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Members</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">42</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Plans</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">3</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Revenue</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">$12,430</p>
        </div>
      </div>
    </div>
  );
}