
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


// --- Timeline & Layer Architecture (V2) ---

export interface TimelineItem {
  id: string;
  type: 'video' | 'image' | 'text' | 'audio' | 'scene' | 'voice' | 'effect' | 'music';
  // Layer Logic
  layerIndex?: number; // @deprecated in V2 (UI only, derived from Layer.order)
  layerId?: string;    // Link to Parent Layer

  // Timing
  start: number;
  duration: number;

  // Content
  content: string; // Text, Image URL, or Effect Name
  audioUrl?: string; // For Voice/Audio

  // Properties
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    width?: number; // Original width
    height?: number; // Original height
  };
  opacity?: number;
  volume?: number;
  playbackRate?: number;
  mediaStartOffset?: number; // Trimming offset

  // Text specific
  textStyle?: {
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    backgroundOpacity?: number;
    yPosition?: number; // % from top
    xPosition?: number; // % from left
  };

  // Linkage
  blockId?: string; // Link to Voice Block
  isGenerating?: boolean; // UI State
  visible?: boolean;
  sourceDuration?: number;
}

export interface TimelineLayer {
  id: string; // UUID
  type: 'visual' | 'audio';
  order: number; // 0-indexed (Bottom to Top)
  name?: string;
  isLocked: boolean;
  isVisible: boolean;
  clips: TimelineItem[];
}

export interface ProjectDataV2 {
  version: 2;
  kind: "projectData";
  layers: TimelineLayer[];
  settings?: {
    activePresetId?: string;
  };
}

export interface MuejamProjectFile {
  version: string;
  metadata: {
    title: string;
    description: string;
    createdAt: string;
    exportedAt: string;
  };
  settings: {
    activePresetId: string;
  };
  content: {
    voiceBlocks: StudioBlock[];
    timelineItems: TimelineItem[];
  };
}
