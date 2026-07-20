// app/providers/ThemeProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = {
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  accent: string;
  gradient: string;
};

export const themes: Record<string, ThemeColor> = {
  red: {
    name: 'Red',
    primary: '#DC2626',
    primaryLight: '#F87171',
    primaryDark: '#991B1B',
    background: '#FEF2F2',
    surface: '#FFFFFF',
    accent: '#EF4444',
    gradient: 'from-red-500 to-rose-600',
  },
  teal: {
    name: 'Teal',
    primary: '#0D9488',
    primaryLight: '#2DD4BF',
    primaryDark: '#0F766E',
    background: '#F0FDFA',
    surface: '#FFFFFF',
    accent: '#14B8A6',
    gradient: 'from-teal-500 to-cyan-600',
  },
  rose: {
    name: 'Rose',
    primary: '#E11D48',
    primaryLight: '#FB7185',
    primaryDark: '#BE123C',
    background: '#FFF1F2',
    surface: '#FFFFFF',
    accent: '#F43F5E',
    gradient: 'from-rose-500 to-pink-600',
  },
  orange: {
    name: 'Orange',
    primary: '#EA580C',
    primaryLight: '#FB923C',
    primaryDark: '#C2410C',
    background: '#FFF7ED',
    surface: '#FFFFFF',
    accent: '#F97316',
    gradient: 'from-orange-500 to-amber-600',
  },
  emerald: {
    name: 'Emerald',
    primary: '#059669',
    primaryLight: '#34D399',
    primaryDark: '#047857',
    background: '#ECFDF5',
    surface: '#FFFFFF',
    accent: '#10B981',
    gradient: 'from-emerald-500 to-green-600',
  },
  purple: {
    name: 'Purple',
    primary: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#5B21B6',
    background: '#F5F3FF',
    surface: '#FFFFFF',
    accent: '#8B5CF6',
    gradient: 'from-purple-500 to-violet-600',
  },
};

interface ThemeContextType {
  theme: ThemeColor;
  themeKey: string;
  setTheme: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState('red');
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(themes.red); // ✅ Renamed to currentTheme

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'red';
    setThemeKey(savedTheme);
    setCurrentTheme(themes[savedTheme] || themes.red);
  }, []);

  // ✅ Renamed the function to handleThemeChange
  const handleThemeChange = (key: string) => {
    if (themes[key]) {
      setThemeKey(key);
      setCurrentTheme(themes[key]);
      localStorage.setItem('theme', key);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, themeKey, setTheme: handleThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}