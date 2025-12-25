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
    const userToken: string = data.accessToken;

    localStorage.setItem('user', JSON.stringify(userData));

    // --- Robust Cookie Setting ---

    // 1. Force clear any existing cookies to avoid conflicts/stale data
    const cookieDomains = [window.location.hostname, `.${window.location.hostname}`, ''];
    const cookiePaths = ['/', '/api', '/studio']; // Add other potential paths if needed

    cookieDomains.forEach(domain => {
      cookiePaths.forEach(path => {
        // Attempt to clear with and without domain/secure flags
        document.cookie = `token=; path=${path}; ${domain ? `domain=${domain};` : ''} expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `token=; path=${path}; ${domain ? `domain=${domain};` : ''} Secure; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    });

    // 2. Set new cookie
    const isSecure = window.location.protocol === 'https:';
    const newCookie = `token=${userToken}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    document.cookie = newCookie;

    // 3. Verify cookie was set
    const verifyToken = getCookie('token');
    if (verifyToken !== userToken) {
      console.error("CRITICAL: Failed to set auth cookie client-side!");
      console.error("Attempted to set:", newCookie);
      console.error("Read back:", verifyToken);
      // Optional: Force reload or show user alert if needed
    } else {
      console.log("Auth cookie set successfully.");
    }

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