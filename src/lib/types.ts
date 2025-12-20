
import { OutputData } from "@editorjs/editorjs";

export interface Voice {
  name: string;
  voiceId: string;
  gender: 'Male' | 'Female' | 'Not specified';
  languageName: string;
  languageCode: string;
  countryName: string;
  countryCode: string;
  characterName: string;
  provider?: string;
  isPro?: boolean;
}

// Represents a single editor card/block in the studio UI
export interface StudioBlock {
  // Backend fields from Voice_Studio_blocks
  id: string;
  project_id: string;
  block_index: string; // Changed to string for database compatibility
  content: OutputData;
  s3_url?: string;
  created_at: string;
  voice?: string;
  provider?: string;
  speed?: number;
  pitch?: number;

  // Frontend-only state
  // voice: string; // Moved to backend
  audioUrl?: string;      // Temporary URL for client-side playback
  duration?: number;
  isGenerating?: boolean;
  job_id?: string;
  isArabic?: boolean;
  trimStart?: number;
  trimEnd?: number;
  // Require explicit user selection before generation
  voiceSelected?: boolean;
  error?: string;
  volume?: number;
  playbackRate?: number;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
}

export interface HasuraUser {
  id: string;
  displayName: string;
  email: string;
  passwordHash: string;
  roles: { role: string }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  crated_at: string;
  user_id: string;
  blocks_json?: any;
  image_url?: any;
}

export interface Subscription {
  id: string;
  active: boolean;
  remaining_chars: number;
  end_date: string;
  plan: {
    name: string;
    max_chars: number;
  };
}

export interface AspectRatioPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  ratio: number; // width / height
  description: string;
  icon?: string;
}

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  {
    id: 'youtube',
    name: 'YouTube / Widescreen',
    width: 1920,
    height: 1080,
    ratio: 16 / 9,
    description: '16:9 Landscape',
    icon: 'youtube'
  },
  {
    id: 'tiktok',
    name: 'TikTok / Reels',
    width: 1080,
    height: 1920,
    ratio: 9 / 16,
    description: '9:16 Vertical',
    icon: 'smartphone'
  },
  {
    id: 'instagram',
    name: 'Instagram Post',
    width: 1080,
    height: 1080,
    ratio: 1,
    description: '1:1 Square',
    icon: 'instagram'
  },
  {
    id: 'twitter',
    name: 'Twitter / LinkedIn',
    width: 1200,
    height: 675,
    ratio: 16 / 9,
    description: '16:9 Landscape',
    icon: 'twitter'
  }
];
