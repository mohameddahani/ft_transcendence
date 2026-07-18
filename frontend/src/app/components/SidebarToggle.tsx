// app/components/SidebarToggle.tsx
'use client';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface SidebarToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SidebarToggle({ isOpen, onClick }: SidebarToggleProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition md:hidden"
      aria-label="Toggle sidebar"
    >
      {isOpen ? (
        <XMarkIcon className="w-6 h-6 text-gray-700" />
      ) : (
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      )}
    </button>
  );
}