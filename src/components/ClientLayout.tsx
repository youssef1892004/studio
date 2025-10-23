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
              position="top-left" 
              containerStyle={{ 
                top: 60,
              }} 
            />
          </PHProvider>
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  );
}