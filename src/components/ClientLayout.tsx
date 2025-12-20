'use client';

import { Suspense } from 'react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from '@/contexts/ThemeContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import { PHProvider, PostHogPageview } from '@/components/Providers';
import { usePathname } from 'next/navigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isStudio = pathname?.startsWith('/studio');

  return (
    <ThemeProvider>
      <AuthProvider>
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>
          <Navbar />
          {children}
          {!isStudio && <Footer />}
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
  );
}