'use client';

import { Suspense } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import { Toaster } from 'react-hot-toast';
import { PHProvider, PostHogPageview } from '@/components/Providers';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <Suspense>
      <ThemeProvider>
        <AuthProvider>
          <PHProvider>
            <PostHogPageview />
            <Navbar />
            {children}
            <Toaster
              position="top-center"
              containerStyle={{
                zIndex: 9999999,
              }}
              toastOptions={{
                className: 'z-[9999999]',
                style: {
                  background: '#3A3A3A',
                  color: '#fff',
                  border: '1px solid #4B5563',
                  padding: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
                loading: {
                  iconTheme: {
                    primary: '#F48969', // Orange accent
                    secondary: '#fff',
                  },
                },
              }}
            />
          </PHProvider>
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  );
}