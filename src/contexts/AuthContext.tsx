// File path: src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback, useMemo } from 'react';
import { User, Subscription } from '@/lib/types';

// --- START: Define the shape of the context data ---
interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
}
// --- END: Define the shape of the context data ---

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCookie = (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSubscription = useCallback(async () => {
    const currentToken = getCookie('token');
    if (!currentToken) return;

    try {
      const res = await fetch('/api/user/subscription', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const { subscription: subData } = await res.json();
        console.log("Subscription data:", subData);
        setSubscription(subData);
      }
    } catch (error) {
      console.error("Failed to refresh subscription:", error);
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = getCookie('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Fetch subscription data after loading user
          await refreshSubscription();
        }
      } catch (error) {
        console.error("Failed to parse auth data from localStorage", error);
        localStorage.clear();
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthData();
  }, [refreshSubscription]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'فشل تسجيل الدخول.');
    }

    const userData: User = data.user;
    const userToken: string = data.accessToken; // FIX: API returns accessToken, not token

    localStorage.setItem('user', JSON.stringify(userData));
    document.cookie = `token=${userToken};path=/;max-age=86400;SameSite=Lax`; // 1 day expiry
    
    setUser(userData);
    setToken(userToken);

    // Fetch subscription after logging in
    await refreshSubscription();
  }, [refreshSubscription]);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    setToken(null);
    setSubscription(null);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    subscription,
    isLoading,
    login,
    logout,
    refreshSubscription
  }), [user, token, subscription, isLoading, login, logout, refreshSubscription]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};