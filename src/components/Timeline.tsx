'use client';

import { Voice, StudioBlock } from '@/lib/types';
import { Play, Pause, ZoomIn, ZoomOut, Volume2, VolumeX, Eye, EyeOff, Lock, Unlock, Scissors, ChevronRight, ChevronLeft, Settings, SkipBack, SkipForward, Plus, Wand2, Trash2, Undo2, Redo2, MousePointer2, Layers } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { usePerformance } from '@/contexts/PerformanceContext';

// Import WaveformSegment dynamically
const WaveformSegment = dynamic(() => import('./WaveformSegment').then(mod => mod.default), { ssr: false });

// --- Types & Mock Data ---

type TrackType = 'image' | 'video' | 'scene' | 'voice' | 'effect' | 'text' | 'music';

interface Track {
    id: string;
    type: TrackType;
    name: string;
    isMuted?: boolean;
    isHidden?: boolean;
    isLocked?: boolean;
    items: TimelineItem[];
}

export interface TimelineItem {
    id: string;
    start: number;
    duration: number;
    content: string; // Text, Image URL, or Effect Name
    type: TrackType;
    mediaStartOffset?: number; // Offset into the media file (seconds)
    // For voice items, we link back to the StudioBlock
    blockId?: string;
    audioUrl?: string;
    isGenerating?: boolean; // Added loading state
    volume?: number; // 0-1
    playbackRate?: number;
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
    transform?: {
        scale: number;
        x: number;
        y: number;
        rotation: number;
    };
    // Multi-Layer Support
    layerIndex?: number; // 0 is background, higher is foreground
    opacity?: number; // 0.0 - 1.0
    visible?: boolean;
}

// --- Helper Components ---

const TimeRuler = ({ duration, zoomLevel, currentTime, onSeek }: { duration: number, zoomLevel: number, currentTime: number, onSeek: (time: number) => void }) => {
    const rulerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!rulerRef.current) return;
        const rect = rulerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newTime = (x / zoomLevel);
        onSeek(Math.max(0, Math.min(duration, newTime)));
    };

    // Generate ticks
    const ticks = [];
    const totalWidth = duration * zoomLevel;

    // Adaptive tick density based on zoom
    const step = zoomLevel < 30 ? 5 : zoomLevel < 80 ? 1 : 0.5;

    for (let i = 0; i <= duration; i += step) {
        const position = i * zoomLevel;
        ticks.push(
            <div key={i} className="absolute top-0 bottom-0 border-l border-[#C2C1C1] opacity-50" style={{ left: `${position}px`, height: i % 5 === 0 ? '100%' : '30%' }}>
                {i % 5 === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] text-[#C2C1C1] font-mono font-bold select-none">
                        {formatTimeShort(i)}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            ref={rulerRef}
            className="h-8 bg-[#2A2A2A] border-b border-[#8E8D8D] relative cursor-pointer overflow-hidden"
            onMouseDown={handleMouseDown}
            style={{ width: `${Math.max(totalWidth, 100)}px` }}
        >
            {ticks}
            {/* Playhead Head */}
            <div
                className="absolute top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#F48969] z-20 transform -translate-x-1/2 pointer-events-none"
                style={{ left: `${currentTime * zoomLevel}px` }}
            />
        </div>
    );
};

const TrackHeader = ({ track, onToggleMute, onToggleHide, onToggleLock }: { track: Track, onToggleMute: () => void, onToggleHide: () => void, onToggleLock: () => void }) => {
    return (
        <div className="w-48 flex-shrink-0 bg-[#2A2A2A] border-r border-[#8E8D8D] border-b border-[#8E8D8D]/20 flex items-center justify-between px-3 h-20 group hover:bg-[#353535] transition-colors">
            <div className="flex flex-col">
                <span className="text-gray-300 font-medium text-sm truncate w-24" title={track.name}>{track.name}</span>
                <span className="text-xs text-gray-500 capitalize">{track.type}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onToggleHide} className={`p-1 rounded hover:bg-white/10 ${track.isHidden ? 'text-[#F48969]' : 'text-gray-400'}`}>
                    {track.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={onToggleMute} className={`p-1 rounded hover:bg-white/10 ${track.isMuted ? 'text-[#F48969]' : 'text-gray-400'}`}>
                    {track.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button onClick={onToggleLock} className={`p-1 rounded hover:bg-white/10 ${track.isLocked ? 'text-[#F48969]' : 'text-gray-400'}`}>
                    {track.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
            </div>
        </div>
    );
};

const formatTimeShort = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTimeFull = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00:00:00';
    const totalMilliseconds = Math.floor(time * 1000);
    const frames = Math.floor((totalMilliseconds % 1000) / 33); // Approx 30fps
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${seconds}:${frames.toString().padStart(2, '0')}`;
};

// --- Main Component ---

interface TimelineProps {
    cards: StudioBlock[];
    voices: Voice[];
    onCardsUpdate?: React.Dispatch<React.SetStateAction<StudioBlock[]>>;
    isBlocksProcessing: boolean;
    onBlockClick?: (blockId: string) => void;
    onAddBlock?: () => void;
    onGenerateAll?: () => void;
    videoTrackItems?: TimelineItem[];
    onVideoTrackUpdate?: (items: TimelineItem[] | ((prev: TimelineItem[]) => TimelineItem[]), commit?: boolean) => void;
    activeBlockId?: string | null;
    onActiveMediaChange: (media: { id: string, type: string, url: string, isPlaying?: boolean, start: number, volume?: number, mediaStartOffset?: number } | null) => void;
    onTimeUpdate?: (time: number) => void;
    onIsPlayingChange?: (isPlaying: boolean) => void;
    onPlaybackRateChange?: (rate: number) => void;
    activeVideoId?: string | null;
    onVideoClick?: (id: string) => void;
    activeTool?: 'select' | 'razor';
    onSplit?: (itemId: string, splitTime: number, trackType: TrackType) => void;
    onToolChange?: (tool: 'select' | 'razor') => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

export interface TimelineHandle {
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    togglePlayPause: () => void;
}

const Timeline = React.forwardRef<TimelineHandle, TimelineProps>(({ cards, voices, onCardsUpdate, isBlocksProcessing, onBlockClick, onAddBlock, onGenerateAll, videoTrackItems = [], onVideoTrackUpdate, activeBlockId, onActiveMediaChange, onTimeUpdate, onIsPlayingChange, activeVideoId, onVideoClick, onPlaybackRateChange, activeTool, onSplit, onToolChange, onDelete, onUndo, onRedo, canUndo, canRedo }, ref) => {

    const [isPlaying, setIsPlaying] = useState(false);
    const { settings } = usePerformance();
    const [currentTime, setCurrentTime] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(50); // Pixels per second
    const [totalDuration, setTotalDuration] = useState(30); // Default 30s
    const [scrollLeft, setScrollLeft] = useState(0);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Resizing State
    const [isResizing, setIsResizing] = useState(false);
    const [resizeItem, setResizeItem] = useState<TimelineItem | null>(null);
    const [resizeHandle, setResizeHandle] = useState<'start' | 'end' | null>(null);
    const [initialMouseX, setInitialMouseX] = useState(0);
    const [initialItemStart, setInitialItemStart] = useState(0);
    const [initialItemDuration, setInitialItemDuration] = useState(0);

    const [mouseTime, setMouseTime] = useState(0); // For razor cursor

    const audioRef = useRef<HTMLAudioElement>(null);
    const musicAudioRef = useRef<HTMLAudioElement>(null); // NEW: Music Player Ref
    const activeVoiceIdRef = useRef<string | null>(null);
    const activeMusicIdRef = useRef<string | null>(null);
    const timelineScrollRef = useRef<HTMLDivElement>(null);
    const headersScrollRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const lastActiveItemIdRef = useRef<string | null>(null);
    const lastActiveVolumeRef = useRef<number | undefined>(undefined);
    const lastTimestampRef = useRef<number>(0);

    // Imperative Handle
    React.useImperativeHandle(ref, () => ({
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),
        seek: (time) => handleSeek(time),
        togglePlayPause: () => setIsPlaying(prev => !prev)
    }));

    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);
    const [manualLayerCount, setManualLayerCount] = useState(2); // Default to 2 layers (0 and 1)

    // Resize State


    // --- Data Preparation ---

    const voiceTrackItems: TimelineItem[] = useMemo(() => {
        let currentStart = 0;
        return cards
            // .filter(c => c.audioUrl) // Show all cards, even if not generated yet
            .map(card => {
                const duration = card.duration || 5; // Default 5s for ungenerated blocks
                const item: TimelineItem = {
                    id: card.id,
                    start: currentStart,
                    duration: duration,
                    content: (card.content && typeof card.content === 'object' && 'blocks' in card.content && Array.isArray((card.content as any).blocks))
                        ? ((card.content as any).blocks.map((b: any) => b.data?.text || '').join(' ').substring(0, 30) + '...')
                        : (typeof card.content === 'string' ? card.content : 'No content'),
                    type: 'voice',
                    blockId: card.id,
                    audioUrl: card.audioUrl,
                    isGenerating: card.isGenerating, // Map loading state
                    volume: card.volume,
                    playbackRate: card.playbackRate,
                    mediaStartOffset: card.trimStart || 0
                };
                currentStart += duration;
                return item;
            });
    }, [cards]);

    // Compute display items with reordering preview
    const displayVoiceItems = useMemo(() => {
        if (!draggingItemId || dragTargetIndex === null) return voiceTrackItems;

        const items = [...voiceTrackItems];
        const draggedIndex = items.findIndex(i => (i.blockId || i.id) === draggingItemId);
        if (draggedIndex === -1) return voiceTrackItems;

        const [draggedItem] = items.splice(draggedIndex, 1);

        let insertIndex = dragTargetIndex;
        if (draggedIndex < insertIndex) {
            insertIndex--;
        }

        insertIndex = Math.max(0, Math.min(insertIndex, items.length));
        items.splice(insertIndex, 0, draggedItem);

        // Recalculate start times
        let currentStart = 0;
        return items.map(item => {
            const newItem = { ...item, start: currentStart };
            currentStart += item.duration;
            return newItem;
        });
    }, [voiceTrackItems, draggingItemId, dragTargetIndex]);

    // Update total duration based on tracks
    // Calculate total duration (Master Source of Truth)
    // Calculate total duration (Master Source of Truth)
    const maxContentTime = useMemo(() => {
        let max = 0;
        voiceTrackItems.forEach(item => max = Math.max(max, item.start + item.duration));
        videoTrackItems.forEach(item => max = Math.max(max, item.start + item.duration));
        // Stop exactly at the end of the content.
        // We use a small epsilon (0.1) just to ensure the last frame renders fully if it falls on the edge.
        return max > 0 ? max + 0.1 : 30;
    }, [voiceTrackItems, videoTrackItems]);

    // Sync state for UI
    useEffect(() => {
        setTotalDuration(maxContentTime);
    }, [maxContentTime]);

    // Tracks configuration
    // Tracks configuration
    const tracks: Track[] = useMemo(() => {
        const visualItems = videoTrackItems.filter(i => i.type === 'image' || i.type === 'scene' || i.type === 'video');

        let maxLayer = 0;
        visualItems.forEach(i => maxLayer = Math.max(maxLayer, i.layerIndex || 0));

        // Ensure at least manual count, or cover all existing items
        const layerCount = Math.max(maxLayer + 1, manualLayerCount);

        const videoTracks: Track[] = [];
        // Loop is 0-indexed. If layerCount is 2, we want loops for 1 and 0.
        for (let i = layerCount - 1; i >= 0; i--) {
            videoTracks.push({
                id: `t-video-${i}`,
                type: 'video',
                name: `Video ${i + 1}`,
                items: visualItems.filter(item => (item.layerIndex || 0) === i)
            });
        }

        return [
            {
                id: 't-text',
                type: 'text',
                name: 'Text / Titles',
                items: videoTrackItems.filter(i => i.type === 'text')
            },
            ...videoTracks,
            {
                id: 't-voice',
                type: 'voice',
                name: 'Voiceover',
                items: displayVoiceItems // Use the display (reordered) items
            },
            {
                id: 't-music',
                type: 'music',
                name: 'Music / SFX',
                items: videoTrackItems.filter(i => i.type === 'music')
            }
        ];
    }, [displayVoiceItems, videoTrackItems]);

    // --- Drag and Drop Handlers ---
    // --- Drag and Drop Handlers ---



    const handleDragStart = (e: React.DragEvent, id: string, type: TrackType) => {
        setDraggingItemId(id);
        e.dataTransfer.effectAllowed = 'move';
        const actionType = type === 'voice' ? 'reorder' : 'move-video';
        e.dataTransfer.setData('application/json', JSON.stringify({ type: actionType, id, trackType: type }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();

        if (draggingItemId) {
            e.dataTransfer.dropEffect = 'move';
            const rect = timelineScrollRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = e.clientX - rect.left + scrollLeft;
            const dropTime = Math.max(0, x / zoomLevel);

            // Calculate simple index based on time
            let index = voiceTrackItems.length;
            for (let i = 0; i < voiceTrackItems.length; i++) {
                const item = voiceTrackItems[i];
                if (dropTime < item.start + item.duration / 2) {
                    index = i;
                    break;
                }
            }
            setDragTargetIndex(index);
        } else {
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDrop = async (e: React.DragEvent, trackType?: string, trackId?: string) => {
        e.preventDefault();
        e.stopPropagation();

        const dataStr = e.dataTransfer.getData('application/json');

        // Finalize Reorder
        if (draggingItemId && onCardsUpdate && dragTargetIndex !== null) {
            const items = [...voiceTrackItems];
            const draggedIndex = items.findIndex(i => (i.blockId || i.id) === draggingItemId);

            if (draggedIndex !== -1) {
                // We re-perform the logic to get the final card order
                // Note: voiceTrackItems maps to cards. We need to reorder cards.
                // Cards might be a different array from voiceTrackItems if filtering happen, but here it's direct map.
                // We can reorder cards based on IDs.

                onCardsUpdate(prev => {
                    const activeCardIndex = prev.findIndex(c => c.id === draggingItemId);
                    if (activeCardIndex === -1) return prev;

                    const newCards = [...prev];
                    const [removed] = newCards.splice(activeCardIndex, 1);

                    let insertIndex = dragTargetIndex;
                    // We need to map "voice track index" to "card index".
                    // Assuming cards == voiceTrackItems 1:1.
                    // But wait, cards array is the source of truth.

                    if (activeCardIndex < insertIndex) insertIndex--;
                    insertIndex = Math.max(0, Math.min(insertIndex, newCards.length));

                    newCards.splice(insertIndex, 0, removed);
                    return newCards.map((c, i) => ({ ...c, block_index: i.toString() }));
                });
            }
        }

        setDraggingItemId(null);
        setDragTargetIndex(null);

        if (!dataStr) return;

        try {
            const { validateMediaItem } = await import('@/lib/wasm-loader');
            // Validate integrity via WASM
            const isValid = await validateMediaItem(dataStr);
            console.log("crab 🦀 WASM Check:", isValid);

            if (!isValid) return;

            const data = JSON.parse(dataStr);

            // Handle Audio Drop on Music Track
            if (trackType === 'music' && data.type?.startsWith('audio') && onVideoTrackUpdate) {
                const rect = timelineScrollRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left + scrollLeft;
                const dropTime = Math.max(0, x / zoomLevel);

                const newItem: TimelineItem = {
                    id: uuidv4(),
                    start: dropTime,
                    duration: 5, // Default placeholder
                    content: data.name,
                    type: 'music',
                    audioUrl: data.url,
                    volume: 1
                };

                // Optimistically add
                onVideoTrackUpdate(prev => [...prev, newItem]);

                // Fetch actual duration if it's music/audio
                if (data.url) {
                    const tempAudio = new Audio(data.url);
                    tempAudio.onloadedmetadata = () => {
                        onVideoTrackUpdate(current => current.map(i =>
                            i.id === newItem.id ? { ...i, duration: tempAudio.duration } : i
                        ));
                    };
                }
                return;
            }

            // Handle Audio Drop on Voice Track
            if (trackType === 'voice' && data.type?.startsWith('audio') && onCardsUpdate) {
                const rect = timelineScrollRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left + scrollLeft;
                const dropTime = Math.max(0, x / zoomLevel);

                // Find insertion index based on time
                let currentDuration = 0;
                let insertIndex = voiceTrackItems?.length || 0;

                if (voiceTrackItems) {
                    for (let i = 0; i < voiceTrackItems.length; i++) {
                        const itemDuration = voiceTrackItems[i].duration;
                        if (dropTime < currentDuration + itemDuration / 2) {
                            insertIndex = i;
                            break;
                        }
                        currentDuration += itemDuration;
                    }
                }

                // Create new Audio Card
                const newCard: any = {
                    id: uuidv4(),
                    content: { blocks: [{ type: 'paragraph', data: { text: `Audio: ${data.name}` } }] },
                    voice: 'Imported',
                    provider: 'audio-file',
                    audioUrl: data.url,
                    duration: 5, // Default, waveform will adjust
                    block_index: insertIndex.toString(),
                    created_at: new Date().toISOString(),
                    isGenerating: false,
                    project_id: 'temp' // Will be ignored/overwritten on save?
                };

                onCardsUpdate(prev => {
                    const newCards = [...prev];
                    newCards.splice(insertIndex, 0, newCard);
                    return newCards.map((c, i) => ({ ...c, block_index: i.toString() }));
                });

                toast.success('Audio added to timeline');
                return;
            }

            if (data.type !== 'reorder' && onVideoTrackUpdate && data.url) {
                const rect = timelineScrollRef.current?.getBoundingClientRect();
                if (!rect) return;

                const x = e.clientX - rect.left + scrollLeft;
                let dropTime = Math.max(0, x / zoomLevel);

                // Auto-Snap Logic on Drop
                const snapThreshold = 0.5; // 0.5s snapping
                let closestEnd = 0;
                let minDiff = Infinity;

                if (videoTrackItems && videoTrackItems.length > 0) {
                    for (const item of videoTrackItems) {
                        const end = item.start + item.duration;
                        const diff = Math.abs(dropTime - end);
                        if (diff < minDiff) {
                            minDiff = diff;
                            closestEnd = end;
                        }
                    }
                    if (minDiff < snapThreshold) {
                        dropTime = closestEnd;
                    }
                }

                const targetLayer = (trackId && trackId.startsWith('t-video-')) ? parseInt(trackId.replace('t-video-', '')) : 0;

                // Update item with new layerIndex if valid
                if (trackType === 'video' || trackType === 'image') {
                    // Check if item is changing layer
                    // If so, we need to check collisions only on the TARGET layer
                }

                const newItem: TimelineItem = {
                    id: uuidv4(),
                    start: dropTime,
                    duration: 5, // Placeholder
                    content: data.name,
                    type: data.type?.startsWith('audio') ? 'music' : (data.type?.startsWith('video') ? 'scene' : 'image'),
                    audioUrl: data.url,
                    layerIndex: (trackType === 'video' || trackType === 'image') ? targetLayer : 0,
                    transform: { scale: 1, x: 0, y: 0, rotation: 0 }
                };

                // 1. Add item immediately
                onVideoTrackUpdate(prev => [...prev, newItem]);

                // 2. Async fetch duration for music/videeo
                if (data.url && (newItem.type === 'music' || newItem.type === 'scene')) {
                    const tempMedia = new Audio();
                    // Removed crossOrigin to avoid potential CORS blocking for simple metadata/duration
                    tempMedia.src = data.url;

                    tempMedia.onloadedmetadata = () => {
                        const actualDuration = tempMedia.duration;
                        console.log("Audio Metadata Loaded:", actualDuration);
                        if (actualDuration && isFinite(actualDuration)) {
                            onVideoTrackUpdate(current =>
                                current.map(i => i.id === newItem.id ? { ...i, duration: actualDuration } : i)
                            );
                        }
                    };

                    tempMedia.onerror = (e) => {
                        console.warn("Failed to load metadata for duration check", data.url, e);
                        toast.error("Could not detect audio duration automatically");
                    };

                    tempMedia.load();
                }
            } else if (data.type === 'move-video' && onVideoTrackUpdate) {
                const rect = timelineScrollRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left + scrollLeft;
                let dropTime = Math.max(0, x / zoomLevel);

                // Collision Detection & Snapping
                const movingItem = videoTrackItems.find(i => i.id === data.id);
                if (movingItem) {
                    const targetLayer = (trackId && trackId.startsWith('t-video-'))
                        ? parseInt(trackId.replace('t-video-', ''))
                        : (movingItem.layerIndex || 0);

                    const duration = movingItem.duration;

                    // Filter others based on track type AND LAYER
                    const isTextItem = movingItem.type === 'text';
                    const isMusicItem = movingItem.type === 'music';
                    const isVisual = !isTextItem && !isMusicItem;

                    const others = videoTrackItems.filter(i =>
                        i.id !== movingItem.id &&
                        (isTextItem ? i.type === 'text' :
                            isMusicItem ? i.type === 'music' :
                                (i.type !== 'text' && i.type !== 'music' && (i.layerIndex || 0) === targetLayer))
                    );

                    // Sort others by start time for consistent checking
                    others.sort((a, b) => a.start - b.start);

                    for (const other of others) {
                        const otherEnd = other.start + other.duration;
                        // If overlap:
                        if (dropTime < otherEnd && (dropTime + duration) > other.start) {
                            // Snap to closest edge
                            const distToLeft = Math.abs((dropTime + duration) - other.start);
                            const distToRight = Math.abs(dropTime - otherEnd);

                            if (distToLeft < distToRight) {
                                dropTime = Math.max(0, other.start - duration);
                            } else {
                                dropTime = otherEnd;
                            }
                        }
                    }
                    onVideoTrackUpdate(videoTrackItems.map(item => {
                        if (item.id === data.id) {
                            const canHaveLayer = item.type === 'image' || item.type === 'scene' || item.type === 'video';
                            return {
                                ...item,
                                start: dropTime,
                                layerIndex: canHaveLayer ? targetLayer : item.layerIndex
                            };
                        }
                        return item;
                    }));
                }
            }
        } catch (err) { console.error(err); }


    };

    // --- Audio Playback Logic ---



    // --- Master Clock Playback Engine ---

    // 1. Sync Audio to Clock (Replaces old Sync)
    useEffect(() => {
        // --- Sync Voice Track ---
        const activeAudioItem = voiceTrackItems.find(item =>
            currentTime >= item.start && currentTime < (item.start + item.duration)
        );

        if (activeAudioItem && activeAudioItem.audioUrl) {
            const targetSrc = activeAudioItem.audioUrl.startsWith('http')
                ? `/api/proxy-audio?url=${encodeURIComponent(activeAudioItem.audioUrl)}`
                : activeAudioItem.audioUrl;

            if (audioRef.current) {
                // Switch source if needed (Check ID first for stability)
                if (activeVoiceIdRef.current !== activeAudioItem.id || !audioRef.current.src) {
                    activeVoiceIdRef.current = activeAudioItem.id;
                    audioRef.current.src = targetSrc;
                    if (isPlaying) {
                        audioRef.current.play().catch(() => { });
                    }
                }

                // Sync Time
                const itemOffset = activeAudioItem.mediaStartOffset || 0;
                const trackOffset = Math.max(0, currentTime - activeAudioItem.start + itemOffset);
                // Only seek if drift > 0.25s
                if (Math.abs(audioRef.current.currentTime - trackOffset) > 0.25) {
                    audioRef.current.currentTime = trackOffset;
                }

                // Sync Volume
                const vol = activeAudioItem.volume !== undefined ? activeAudioItem.volume : 1;
                if (Math.abs(audioRef.current.volume - vol) > 0.01) {
                    audioRef.current.volume = vol;
                }

                // Sync Speed
                const itemSpeed = activeAudioItem.playbackRate ?? 1;
                const finalRate = playbackRate * itemSpeed;
                if (Math.abs(audioRef.current.playbackRate - finalRate) > 0.01) {
                    audioRef.current.playbackRate = finalRate;
                }

                if (isPlaying && audioRef.current.paused) {
                    audioRef.current.play().catch(e => { });
                } else if (!isPlaying && !audioRef.current.paused) {
                    audioRef.current.pause();
                }
            }
        } else {
            // Gap: Pause audio
            activeVoiceIdRef.current = null;
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }

        // --- NEW: Sync Music Track ---
        // Find active music item (filtered from videoTrackItems)
        const activeMusicItem = videoTrackItems.find(item =>
            item.type === 'music' &&
            currentTime >= item.start && currentTime < (item.start + item.duration)
        );

        if (activeMusicItem && activeMusicItem.audioUrl) {
            const musicSrc = activeMusicItem.audioUrl.startsWith('http')
                ? `/api/proxy-audio?url=${encodeURIComponent(activeMusicItem.audioUrl)}`
                : activeMusicItem.audioUrl;

            if (musicAudioRef.current) {
                // Check if Src changed (ID Check)
                if (activeMusicIdRef.current !== activeMusicItem.id || !musicAudioRef.current.src) {
                    activeMusicIdRef.current = activeMusicItem.id;
                    musicAudioRef.current.src = musicSrc;
                    // musicAudioRef.current.load(); // Not strictly needed if src set
                    if (isPlaying) musicAudioRef.current.play().catch(() => { });
                }

                const musicOffset = Math.max(0, currentTime - activeMusicItem.start);

                // Sync Time
                if (Math.abs(musicAudioRef.current.currentTime - musicOffset) > 0.25) {
                    musicAudioRef.current.currentTime = musicOffset;
                }

                // Play/Pause
                if (isPlaying && musicAudioRef.current.paused) {
                    musicAudioRef.current.play().catch(() => { });
                } else if (!isPlaying && !musicAudioRef.current.paused) {
                    musicAudioRef.current.pause();
                }

                // Sync Volume
                if (activeMusicItem.volume !== undefined) {
                    musicAudioRef.current.volume = activeMusicItem.volume;
                }
            }
        } else {
            // No active music
            activeMusicIdRef.current = null;
            musicAudioRef.current?.pause();
        }

    }, [isPlaying, currentTime, voiceTrackItems, videoTrackItems, playbackRate]); // Added videoTrackItems dependency

    // Update loop
    // 2. Master Clock Loop
    useEffect(() => {
        let animationFrame: number;

        const loop = (timestamp: number) => {
            if (!isPlaying) return;

            if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;

            const rawDelta = (timestamp - lastTimestampRef.current) / 1000;
            const delta = rawDelta * playbackRate; // Apply Speed
            const clampedDelta = Math.min(delta, 0.1 * playbackRate); // Scale clamp too?

            lastTimestampRef.current = timestamp;

            setCurrentTime(prev => {
                const newTime = prev + clampedDelta;
                // Stop if we exceed total duration
                if (newTime >= maxContentTime) {
                    setIsPlaying(false);
                    return 0; // Reset to start
                }

                // Auto Scroll
                if (timelineScrollRef.current) {
                    const currentPos = newTime * zoomLevel;
                    const containerWidth = timelineScrollRef.current.clientWidth;
                    const sl = timelineScrollRef.current.scrollLeft;

                    if (currentPos > sl + containerWidth * 0.85) {
                        timelineScrollRef.current.scrollLeft = currentPos - containerWidth * 0.15;
                    }
                }

                return newTime;
            });

            animationFrame = requestAnimationFrame(loop);
        };

        if (isPlaying) {
            lastTimestampRef.current = performance.now();
            animationFrame = requestAnimationFrame(loop);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isPlaying, maxContentTime, zoomLevel, playbackRate]);

    // Notify Rate Change
    useEffect(() => {
        onPlaybackRateChange?.(playbackRate);
    }, [playbackRate, onPlaybackRateChange]);

    // Sync Active Media Item (Image or Video)
    useEffect(() => {
        // Find specifically Visual items (Image/Video), ignoring Text
        const currentVideoItem = videoTrackItems.find(item =>
            item.type !== 'text' &&
            currentTime >= item.start && currentTime < (item.start + item.duration)
        );

        const currentId = currentVideoItem?.id || null;
        const currentVolume = currentVideoItem?.volume;

        // Check ID or Volume change
        const idChanged = currentId !== lastActiveItemIdRef.current;
        const volChanged = Math.abs((currentVolume ?? 1) - (lastActiveVolumeRef.current ?? 1)) > 0.01;

        if (idChanged || volChanged) {
            lastActiveItemIdRef.current = currentId;
            lastActiveVolumeRef.current = currentVolume;
            if (currentVideoItem && currentVideoItem.audioUrl) {
                onActiveMediaChange?.({
                    id: currentVideoItem.id,
                    url: currentVideoItem.audioUrl,
                    type: currentVideoItem.type === 'scene' || (currentVideoItem.content && (currentVideoItem.content.toLowerCase().endsWith('.mp4') || currentVideoItem.content.toLowerCase().endsWith('.mov'))) ? 'video' : 'image',
                    start: currentVideoItem.start,
                    volume: currentVideoItem.volume ?? 1,
                    mediaStartOffset: currentVideoItem.mediaStartOffset
                });
            } else {
                onActiveMediaChange?.(null);
            }
        }

        // Sync Time
        onTimeUpdate?.(currentTime);
    }, [currentTime, videoTrackItems, onActiveMediaChange, onTimeUpdate]);


    // --- Interaction Handlers ---

    // Unified Mouse Move
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!timelineScrollRef.current) return;
        const rect = timelineScrollRef.current.getBoundingClientRect();
        // Mouse X relative to the visible viewport
        const relativeX = e.clientX - rect.left;
        // Absolute X in the scrollable content
        const absoluteX = relativeX + scrollLeft;

        // Update Razor Cursor
        if (activeTool === 'razor') {
            setMouseTime(absoluteX / zoomLevel);
        }
    }, [activeTool, zoomLevel, scrollLeft]);

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        handleMouseMove(e);
    };

    const handleContainerClick = (e: React.MouseEvent) => {
        if (activeTool === 'razor' && onSplit) {
            if (!timelineScrollRef.current) return;
            const rect = timelineScrollRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left + scrollLeft;
            const clickTime = Math.max(0, x / zoomLevel);

            // Find which item was clicked
            for (const track of tracks) {
                for (const item of track.items) {
                    if (clickTime >= item.start && clickTime <= item.start + item.duration) {
                        // Only split if the item is currently selected
                        const isSelected = (track.type === 'voice' && activeBlockId === item.blockId) ||
                            (track.type !== 'voice' && activeVideoId === item.id);

                        if (isSelected) {
                            onSplit(item.blockId || item.id, clickTime, track.type);
                            return;
                        }
                    }
                }
            }
        }
    };

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    // Sync Play State
    useEffect(() => {
        onIsPlayingChange?.(isPlaying);
    }, [isPlaying, onIsPlayingChange]);

    const handleSeek = (time: number) => {
        setCurrentTime(time);

        const index = voiceTrackItems.findIndex(item => time >= item.start && time < item.start + item.duration);
        if (index !== -1) {
            setCurrentCardIndex(index);
        }
    };

    const handleZoom = (direction: 'in' | 'out') => {
        setZoomLevel(prev => Math.max(10, Math.min(200, direction === 'in' ? prev * 1.2 : prev / 1.2)));
    };

    const toggleSpeed = () => {
        const rates = [0.5, 1, 1.5, 2];
        const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(next);
    };

    const handleResizeStart = (e: React.MouseEvent, item: TimelineItem, handle: 'start' | 'end') => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeItem(item);
        setResizeHandle(handle);
        setInitialMouseX(e.clientX);
        setInitialItemStart(item.start);
        setInitialItemDuration(item.duration);
    };

    const handleResize = useCallback((e: MouseEvent) => {
        if (!isResizing || !resizeItem || !resizeHandle || !onVideoTrackUpdate) return;

        const deltaX = (e.clientX - initialMouseX) / zoomLevel; // Convert pixel delta to time delta

        onVideoTrackUpdate(prevItems => prevItems.map(item => {
            if (item.id === resizeItem.id) {
                let newStart = initialItemStart;
                let newDuration = initialItemDuration;

                if (resizeHandle === 'start') {
                    newStart = Math.max(0, initialItemStart + deltaX);
                    newDuration = initialItemDuration - (newStart - initialItemStart);
                    if (newDuration < 0.1) { // Minimum duration
                        newDuration = 0.1;
                        newStart = initialItemStart + initialItemDuration - newDuration;
                    }
                } else { // 'end' handle
                    newDuration = Math.max(0.1, initialItemDuration + deltaX);
                }

                return { ...item, start: newStart, duration: newDuration };
            }
            return item;
        }), false); // Do not commit to history during drag
    }, [isResizing, resizeItem, resizeHandle, initialMouseX, initialItemStart, initialItemDuration, zoomLevel, onVideoTrackUpdate]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        setResizeItem(null);
        setResizeHandle(null);
        if (onVideoTrackUpdate) {
            onVideoTrackUpdate(videoTrackItems, true); // Commit final state to history
        }
    }, [videoTrackItems, onVideoTrackUpdate]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('mouseup', handleResizeEnd);
        } else {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, handleResize, handleResizeEnd]);


    const handleTrim = useCallback((segmentId: string, startTime: number, endTime: number) => {
        if (!onCardsUpdate) return;
        onCardsUpdate(prevCards => prevCards.map(card => {
            if (card.id === segmentId) {
                const newDuration = endTime - startTime;
                return {
                    ...card,
                    duration: newDuration,
                    trimStart: startTime,
                    trimEnd: endTime
                };
            }
            return card;
        }));
        // setIsPlaying(false); // This state is not defined in this component
        alert(`✅ Trimmed: ${(endTime - startTime).toFixed(2)}s`);
    }, [onCardsUpdate]);

    const handleDelete = useCallback((segmentId: string) => {
        if (!onCardsUpdate) return;
        onCardsUpdate(prevCards => prevCards.filter(card => card.id !== segmentId));
        // setIsPlaying(false); // This state is not defined in this component
        // alert(`🗑️ Deleted segment.`);
    }, [onCardsUpdate]);

    const handleDeleteVideoItem = useCallback((itemId: string) => {
        if (!onVideoTrackUpdate) return;
        if (confirm('Delete this clip?')) {
            const newItems = videoTrackItems.filter(i => i.id !== itemId);
            onVideoTrackUpdate(newItems);
        }
    }, [videoTrackItems, onVideoTrackUpdate]);

    const handleDurationLoad = useCallback((blockId: string, duration: number) => {
        if (!onCardsUpdate) return;
        onCardsUpdate(prevCards => {
            const index = prevCards.findIndex(c => c.id === blockId);
            if (index === -1) return prevCards;

            const card = prevCards[index];
            const currentDuration = card.duration || 0;

            // Logic: 
            // - If uninitialized (0), align with file duration.
            // - If current > duration (file is shorter than block), snap to file length.
            // - If current < duration (block is shorter than file), assume USER TRIMMED it. Do not extend.

            const shouldUpdate = currentDuration === 0 ||
                (Math.abs(currentDuration - duration) > 0.2 && currentDuration > duration);

            if (shouldUpdate) {
                const newCards = [...prevCards];
                newCards[index] = { ...card, duration: duration };
                return newCards;
            }
            return prevCards;
        });
    }, [onCardsUpdate]);

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowRight':
                    handleSeek(Math.min(totalDuration, currentTime + 1));
                    break;
                case 'ArrowLeft':
                    handleSeek(Math.max(0, currentTime - 1));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, currentTime, totalDuration, handlePlayPause, handleSeek]);


    // --- Render ---

    return (
        <div className="flex flex-col h-full bg-[#1E1E1E] text-gray-300 select-none" dir="ltr">
            {/* Hidden Audio Players */}
            <audio ref={audioRef} className="hidden" />
            <audio ref={musicAudioRef} className="hidden" />

            {/* Toolbar */}
            <div className="h-16 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-4 z-30 shadow-md relative">

                {/* Left: Tools & History */}
                <div className="flex items-center gap-4">
                    {/* History Group */}
                    <div className="flex items-center gap-1 bg-[#252525] p-1 rounded-lg border border-[#333]">
                        <button onClick={onUndo} disabled={!canUndo} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30 transition-colors" title="Undo (Ctrl+Z)">
                            <Undo2 size={18} />
                        </button>
                        <button onClick={onRedo} disabled={!canRedo} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30 transition-colors" title="Redo (Ctrl+Y)">
                            <Redo2 size={18} />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-[#333]" />

                    {/* Tools Group */}
                    <div className="flex items-center gap-1 bg-[#252525] p-1 rounded-lg border border-[#333]">
                        <button
                            onClick={() => onToolChange?.('select')}
                            className={`p-2 rounded-md transition-all flex items-center justify-center ${activeTool === 'select' || !activeTool ? 'bg-[#333] text-white shadow-inner' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title="Select Tool (V)"
                        >
                            <MousePointer2 size={18} />
                        </button>
                        <button
                            onClick={() => onToolChange?.('razor')}
                            className={`p-2 rounded-md transition-all flex items-center justify-center ${activeTool === 'razor' ? 'bg-[#F48969] text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title="Split Tool (C)"
                        >
                            <Scissors size={18} />
                        </button>
                        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors flex items-center justify-center" title="Delete (Del)">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-[#333]" />

                    {/* Layer Tools */}
                    <div className="flex items-center gap-1 bg-[#252525] p-1 rounded-lg border border-[#333]">
                        <button
                            onClick={() => setManualLayerCount(prev => prev + 1)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center justify-center gap-2"
                            title="Add Layer"
                        >
                            <Layers size={18} />
                            <Plus size={12} className="-ml-1" />
                        </button>
                    </div>
                </div>

                {/* Center: Playback (Absolute Centered) */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-white/5 text-gray-300 hover:text-white" onClick={() => handleSeek(0)}>
                        <SkipBack size={22} className="fill-current" />
                    </Button>
                    <button
                        onClick={handlePlayPause}
                        className="h-12 w-12 flex items-center justify-center rounded-full bg-[#F48969] hover:bg-[#E07858] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    >
                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                    </button>
                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full hover:bg-white/5 text-gray-300 hover:text-white" onClick={() => handleSeek(totalDuration)}>
                        <SkipForward size={22} className="fill-current" />
                    </Button>
                </div>

                {/* Right: Info & Zoom */}
                <div className="flex items-center gap-4">
                    <div className="bg-[#151515] px-3 py-1.5 rounded-md font-mono text-[#F48969] border border-[#F48969]/20 shadow-inner text-sm tracking-wider">
                        {formatTimeFull(currentTime)}
                    </div>
                    <Button variant="ghost" size="sm" onClick={toggleSpeed} title="Playback Speed" className="text-xs font-bold text-gray-400 hover:text-white">
                        {playbackRate}x
                    </Button>
                    <div className="hidden md:flex items-center gap-1 bg-[#252525] rounded-lg p-1 border border-[#333]">
                        <button
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center justify-center p-0"
                            onClick={() => handleZoom('out')}
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="text-xs w-10 text-center text-gray-500 font-medium select-none">{Math.round(zoomLevel)}%</span>
                        <button
                            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center justify-center p-0"
                            onClick={() => handleZoom('in')}
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar (Headers) */}
                <div
                    ref={headersScrollRef}
                    className="w-48 flex-shrink-0 bg-[#2A2A2A] border-r border-[#8E8D8D] z-20 flex flex-col pt-8 shadow-xl overflow-hidden"
                >
                    {tracks.map(track => (
                        <TrackHeader
                            key={track.id}
                            track={track}
                            onToggleMute={() => { }}
                            onToggleHide={() => { }}
                            onToggleLock={() => { }}
                        />
                    ))}
                </div>

                {/* Right Scrollable Area (Tracks) */}
                <div
                    ref={timelineScrollRef}
                    className="flex-1 overflow-auto relative custom-scrollbar bg-[#1E1E1E]"
                    onScroll={(e) => {
                        setScrollLeft(e.currentTarget.scrollLeft);
                        if (headersScrollRef.current) {
                            headersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                        }
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onMouseMove={handleContainerMouseMove}
                    onMouseLeave={() => setMouseTime(-1)}
                    onClick={handleContainerClick}
                >
                    {/* Time Ruler */}
                    <div className="sticky top-0 z-10">
                        <TimeRuler
                            duration={totalDuration}
                            zoomLevel={zoomLevel}
                            currentTime={currentTime}
                            onSeek={handleSeek}
                        />
                    </div>

                    {/* Tracks Container */}
                    <div className="relative min-h-full" style={{ width: `${Math.max(totalDuration * zoomLevel, 1000)}px`, minWidth: '100%' }}>

                        {/* Global Playhead Line */}
                        <div
                            className="absolute top-0 bottom-0 w-px bg-[#F48969] z-30 pointer-events-none shadow-[0_0_10px_rgba(244,137,105,0.5)]"
                            style={{ left: `${currentTime * zoomLevel}px` }}
                        />

                        {/* Razor Cursor */}
                        {activeTool === 'razor' && mouseTime >= 0 && (
                            <div
                                className="absolute top-0 bottom-0 border-l border-dashed border-red-500/70 pointer-events-none z-50 flex flex-col items-center"
                                style={{ left: `${mouseTime * zoomLevel}px` }}
                            >
                                <div className="absolute -top-4 text-red-500 bg-white dark:bg-black rounded-full p-0.5 shadow-sm border border-red-500/20">
                                    <Scissors size={14} />
                                </div>
                            </div>
                        )}

                        {/* Tracks */}
                        <div className="flex flex-col">
                            {tracks.map(track => (
                                <div
                                    key={track.id}
                                    className="h-20 border-b border-[#8E8D8D]/20 relative bg-[#2F2F2F] group"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, track.type, track.id)}
                                >
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 pointer-events-none opacity-5"
                                        style={{
                                            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px)',
                                            backgroundSize: `${zoomLevel}px 100%`
                                        }}
                                    />

                                    {/* Items */}
                                    {track.items.map(item => {
                                        const width = item.duration * zoomLevel;
                                        const left = item.start * zoomLevel;
                                        const isSelected = activeBlockId && item.blockId === activeBlockId;

                                        return (
                                            <div
                                                key={item.id}
                                                draggable={activeTool !== 'razor'} // Disable drag if razor tool is active
                                                onDragStart={(e) => activeTool !== 'razor' && handleDragStart(e, item.blockId || item.id, track.type)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (activeTool === 'razor' && onSplit) {
                                                        const isSelected = (track.type === 'voice' && activeBlockId === item.blockId) ||
                                                            ((track.type === 'video' || track.type === 'image' || track.type === 'text' || track.type === 'music') && activeVideoId === item.id);

                                                        if (isSelected) {
                                                            if (!timelineScrollRef.current) return;
                                                            const rect = timelineScrollRef.current.getBoundingClientRect();
                                                            const x = e.clientX - rect.left + scrollLeft;
                                                            const clickTime = Math.max(0, x / zoomLevel);

                                                            onSplit(item.blockId || item.id, clickTime, track.type);
                                                        }
                                                    } else {
                                                        if (track.type === 'video' || track.type === 'image' || track.type === 'text' || track.type === 'music') onVideoClick?.(item.id);
                                                        else if (track.type === 'voice') onBlockClick?.(item.blockId!);
                                                    }
                                                }}
                                                className={`absolute top-1 bottom-1 rounded-md overflow-hidden cursor-move group select-none transition-all ${(track.type === 'voice' && activeBlockId === item.blockId) || ((track.type === 'video' || track.type === 'image' || track.type === 'text' || track.type === 'music') && activeVideoId === item.id)
                                                    ? 'ring-2 ring-white z-20 shadow-xl'
                                                    : 'hover:ring-1 hover:ring-white/50 z-10'
                                                    } ${draggingItemId === (item.blockId || item.id) ? 'opacity-50' : ''} ${activeTool === 'razor' ? 'cursor-crosshair' : ''}`}
                                                style={{
                                                    left: `${left}px`,
                                                    width: `${width}px`,
                                                    backgroundColor: track.type === 'voice' ? '#4A4A4A' : (track.type === 'music' ? '#3B5360' : '#333'),
                                                }}
                                            >
                                                {/* Item Content */}
                                                <div className="h-full w-full relative">
                                                    {/* Delete Button for Video Items */}
                                                    {track.type !== 'voice' && (
                                                        <button
                                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover/item:opacity-100 transition-opacity z-20 hover:bg-red-600"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteVideoItem(item.id);
                                                            }}
                                                            title="Delete Clip"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                    {track.type === 'voice' || track.type === 'music' ? (
                                                        item.audioUrl ? (
                                                            // Use Real WaveformSegment
                                                            <WaveformSegment
                                                                audioUrl={item.audioUrl}
                                                                duration={item.duration}
                                                                isPlaying={isPlaying && currentTime >= item.start && currentTime < item.start + item.duration}
                                                                color={isPlaying && currentTime >= item.start && currentTime < item.start + item.duration ? '#F48969' : '#8E8D8D'}
                                                                progressColor="#F48969"
                                                                zoomLevel={zoomLevel}
                                                                playbackTime={Math.max(0, currentTime - item.start)}
                                                                onSeek={(t) => handleSeek(item.start + t)}
                                                                onTrim={handleTrim}
                                                                onDelete={handleDelete}
                                                                segmentId={item.blockId}
                                                                onClick={() => onBlockClick?.(item.blockId!)}
                                                                onDurationLoaded={(dur) => handleDurationLoad(item.blockId!, dur)}
                                                                quality={settings.waveformQuality}
                                                            />
                                                        ) : (
                                                            // Placeholder for ungenerated voice block
                                                            <div
                                                                className="w-full h-full flex items-center justify-center bg-[#706F6F]/50 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:bg-[#706F6F]/70 transition-colors"
                                                                onClick={() => onBlockClick?.(item.blockId!)}
                                                            >
                                                                <span className="text-xs text-gray-300 flex items-center gap-2">
                                                                    {item.isGenerating ? (
                                                                        <>
                                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                            جاري التوليد...
                                                                        </>
                                                                    ) : (
                                                                        'Waiting for generation...'
                                                                    )}
                                                                </span>
                                                            </div>
                                                        )
                                                    ) : (track.type === 'image' || track.type === 'video') ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-black/20 overflow-hidden relative">
                                                            {item.audioUrl ? (
                                                                <>
                                                                    {item.type === 'scene' || (item.content && (item.content.toLowerCase().endsWith('.mp4') || item.content.toLowerCase().endsWith('.mov'))) ? (
                                                                        <video
                                                                            src={`/api/asset-proxy?url=${encodeURIComponent(item.audioUrl)}#t=0.1`}
                                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                            draggable={false}
                                                                            muted
                                                                            preload="metadata"
                                                                        />
                                                                    ) : (
                                                                        <img
                                                                            src={`/api/asset-proxy?url=${encodeURIComponent(item.audioUrl)}`}
                                                                            alt={item.content}
                                                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                            draggable={false}
                                                                        />
                                                                    )}

                                                                    <div className="absolute bottom-1 left-1 flex flex-col max-w-full pointer-events-none">
                                                                        {item.type === 'scene' && (
                                                                            <span className="text-[9px] bg-blue-600/80 text-white px-1 rounded mb-0.5 w-fit">VIDEO</span>
                                                                        )}
                                                                        <span className="text-[10px] text-white/90 truncate bg-black/50 px-1 rounded">{item.content}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-xs truncate px-2">{item.content}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 text-xs truncate text-gray-300">
                                                            {item.content}
                                                        </div>
                                                    )}

                                                    {/* Loading Overlay for Generating Blocks (Even if they have audioUrl, e.g. re-generating) */}
                                                    {item.isGenerating && item.audioUrl && (
                                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-20">
                                                            <div className="flex items-center gap-2 text-white text-xs font-bold">
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                <span>جاري التحديث...</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Handles (Visual only for non-voice for now) */}
                                                    {track.type !== 'voice' && (
                                                        <>
                                                            <div
                                                                className="absolute left-0 top-0 bottom-0 w-3 hover:bg-white/20 cursor-w-resize z-20 group-hover:opacity-100 opacity-0 transition-opacity"
                                                                onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, item, 'start'); }}
                                                            />
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-3 hover:bg-white/20 cursor-e-resize z-20 group-hover:opacity-100 opacity-0 transition-opacity"
                                                                onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, item, 'end'); }}
                                                            />
                                                        </>
                                                    )}

                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Add Block Button (Only for Voice Track) */}
                                    {track.type === 'voice' && onAddBlock && (
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 z-10"
                                            style={{
                                                left: `${(track.items.length > 0
                                                    ? (track.items[track.items.length - 1].start + track.items[track.items.length - 1].duration)
                                                    : 0) * zoomLevel + 20}px`
                                            }}
                                        >
                                            <button
                                                onClick={onAddBlock}
                                                className="w-8 h-8 rounded-full bg-[#F48969]/20 border border-[#F48969] flex items-center justify-center text-[#F48969] hover:bg-[#F48969] hover:text-white transition-all shadow-lg hover:shadow-[#F48969]/50 hover:scale-110"
                                                title="Add Voice Block"
                                            >
                                                <Plus size={18} strokeWidth={3} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <audio ref={audioRef} className="hidden" />
        </div>
    );
});

export default Timeline;