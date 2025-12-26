// src/components/studio/ProjectHeader.tsx
'use client';

import { ArrowRight, Download, Play, LoaderCircle, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Subscription } from '@/lib/types';
import SubscriptionStatus from '@/components/SubscriptionStatus';

interface ProjectHeaderProps {
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  projectDescription: string;
  setProjectDescription: (description: string) => void;
  isGenerating: boolean;
  isGenerateDisabled?: boolean;
  handleGenerate: () => void;
  handleDownloadAll: () => void;
  handleSave?: () => void;
  subscription: Subscription | null;
}

export default function ProjectHeader({
  projectTitle, setProjectTitle, projectDescription, setProjectDescription, isGenerating, isGenerateDisabled, handleGenerate, handleDownloadAll, handleSave, subscription
}: ProjectHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 h-full w-full overflow-x-auto">
      <div className="flex items-center gap-4 whitespace-nowrap">
        <button onClick={() => router.push('/projects')} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Back to projects">
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex flex-col">
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="text-h2 bg-transparent focus:outline-none focus:ring-0 border-0 p-0"
            placeholder="Project name"
          />
          <input
            type="text"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="text-helper bg-transparent focus:outline-none focus:ring-0 border-0 p-0"
            placeholder="Project description..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4 whitespace-nowrap">
        {subscription && <SubscriptionStatus subscription={subscription} />}

        {handleSave && (
          <button onClick={handleSave} className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors" title="Save Project">
            <Save className="w-5 h-5 text-foreground" />
          </button>
        )}

        <button onClick={handleGenerate} disabled={isGenerateDisabled ?? isGenerating} className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors disabled:bg-muted disabled:text-muted-foreground flex items-center gap-2">
          {isGenerating ? 'Generating...' : 'Generate'}
          {isGenerating ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 -scale-x-100" />}
        </button>

        <button onClick={handleDownloadAll} className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors" title="Download All">
          <Download className="w-5 h-5 text-foreground" />
        </button>

      </div>
    </div>
  );
}