// app/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          ft_transcendence
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome to the ultimate gym management platform
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-200 font-medium"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="block w-full bg-white text-indigo-600 border-2 border-indigo-600 py-3 px-4 rounded-lg hover:bg-indigo-50 transition duration-200 font-medium"
          >
            Register
          </Link>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>Demo credentials:</p>
          <p className="mt-1">
            Email: demo@example.com
            <br />
            Password: password123
          </p>
        </div>
      </div>
    </div>
  );
}