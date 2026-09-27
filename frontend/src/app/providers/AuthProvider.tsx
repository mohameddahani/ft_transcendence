// app/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
};

const MOCK_ADMIN: User = {
  id: 999,
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);
      
      setTimeout(() => {
        let userData: User;
        
        if (email === 'admin@example.com') {
          userData = MOCK_ADMIN;
        } else if (email && password) {
          userData = MOCK_USER;
        } else {
          reject(new Error('Invalid credentials'));
          setIsLoading(false);
          return;
        }
        
        setUser(userData);
        localStorage.setItem('access_token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoading(false);
        resolve();
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}