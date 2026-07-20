// app/components/ThemeSwitcher.tsx
'use client';

import { useTheme, themes } from '@/app/providers/ThemeProvider';
import { CheckIcon } from '@heroicons/react/24/outline';

export function ThemeSwitcher() {
  const { themeKey, setTheme, theme } = useTheme();

  const colorOptions = [
    { key: 'red', bg: 'bg-red-500' },
    { key: 'teal', bg: 'bg-teal-500' },
    { key: 'rose', bg: 'bg-rose-500' },
    { key: 'orange', bg: 'bg-orange-500' },
    { key: 'emerald', bg: 'bg-emerald-500' },
    { key: 'purple', bg: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {colorOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => setTheme(option.key)}
          className={`
            relative w-8 h-8 rounded-full transition-all duration-200
            ${option.bg}
            ${themeKey === option.key ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}
          `}
          aria-label={`Switch to ${themes[option.key].name} theme`}
          title={themes[option.key].name}
        >
          {themeKey === option.key && (
            <CheckIcon className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
          )}
        </button>
      ))}
    </div>
  );
}