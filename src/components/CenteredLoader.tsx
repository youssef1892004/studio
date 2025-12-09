// src/components/CenteredLoader.tsx
'use client';

import { LoaderCircle } from 'lucide-react';

interface CenteredLoaderProps {
  message: string;
}

export default function CenteredLoader({ message }: CenteredLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-studio-bg dark:bg-studio-bg transition-colors duration-200">
      <div className="flex flex-col items-center p-8 transition-colors duration-200 space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-studio-accent/20 border-t-studio-accent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-studio-accent rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-lg font-medium text-studio-text dark:text-studio-text animate-pulse">{message}</p>
      </div>
    </div>
  );
}