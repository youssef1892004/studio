'use client';

import { Voice, StudioBlock, TimelineItem, TimelineLayer } from '@/lib/types';
import { Play, Pause, ZoomIn, ZoomOut, Volume2, VolumeX, Eye, EyeOff, Lock, Unlock, Scissors, ChevronRight, ChevronLeft, Settings, SkipBack, SkipForward, Plus, Wand2, Trash2, Undo2, Redo2, MousePointer2, Layers } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { usePerformance } from '@/contexts/PerformanceContext';

// Import WaveformSegment dynamically
const WaveformSegment = dynamic(() => import('./WaveformSegment').then(mod => mod.default), { ssr: false });

const TRACK_HEIGHT = 80;

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



// --- Helper Components ---

const toProxiedUrl = (url: string, kind: 'audio' | 'video') => {
    if (!url) return url;

    // blob/local/relative
    if (!url.startsWith('http')) return url;

    return kind === 'audio'
        ? `/api/proxy-audio?url=${encodeURIComponent(url)}`
        : `/api/asset-proxy?url=${encodeURIComponent(url)}`;
};

const resolveMediaDuration = (url: string, kind: 'audio' | 'video'): Promise<number> => {
    return new Promise((resolve, reject) => {
        const el = kind === 'video' ? document.createElement('video') : document.createElement('audio');

        el.preload = 'metadata';
        el.muted = true;
        // @ts-ignore
        el.playsInline = true;

        const cleanup = () => {
            el.onloadedmetadata = null;
            el.onerror = null;
            try {
                el.pause();
            } catch { }
            el.removeAttribute('src');
            el.load();
            el.remove();
        };

        const timer = setTimeout(() => {
            cleanup();
            reject(new Error('Timeout loading metadata'));
        }, 15000);

        el.onloadedmetadata = () => {
            clearTimeout(timer);
            const d = el.duration;
            cleanup();

            // Safari sometimes returns Infinity initially
            if (!Number.isFinite(d) || d <= 0 || d >= 36000) {
                reject(new Error(`Invalid duration: ${d}`));
                return;
            }
            resolve(d);
        };

        el.onerror = () => {
            clearTimeout(timer);
            cleanup();
            reject(new Error('Media load error'));
        };

        // Use proxy for metadata
        el.src = toProxiedUrl(url, kind);
        el.load();
    });
};

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
            <div key={i} className="absolute top-0 bottom-0 border-l border-white/20 opacity-50" style={{ left: `${position}px`, height: i % 5 === 0 ? '100%' : '30%' }}>
                {i % 5 === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] text-muted-foreground font-mono font-bold select-none">
                        {formatTimeShort(i)}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            ref={rulerRef}
            className="h-8 bg-black/40 border-b border-white/10 relative cursor-pointer overflow-hidden backdrop-blur-sm"
            onMouseDown={handleMouseDown}
            style={{ width: `${Math.max(totalWidth, 100)}px` }}
        >
            {ticks}
            {/* Playhead Head */}
            <div
                className="absolute top-0 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary z-20 transform -translate-x-1/2 pointer-events-none"
                style={{ left: `${currentTime * zoomLevel}px` }}
            />
        </div>
    );
};

const TrackHeader = ({ track, onToggleMute, onToggleHide, onToggleLock, onRename, isActive }: { track: Track, onToggleMute: () => void, onToggleHide: () => void, onToggleLock: () => void, onRename: (name: string) => void, isActive?: boolean }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(track.name);

    useEffect(() => {
        setEditName(track.name);
    }, [track.name]);

    const handleSave = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== track.name) {
            onRename(trimmed);
        } else {
            setEditName(track.name); // Revert
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setEditName(track.name);
            setIsEditing(false);
        }
    };

    return (
        <div
            className={`w-48 flex-shrink-0 bg-card/50 backdrop-blur-sm border-r border-white/10 border-b border-white/5 flex items-center justify-between px-3 group hover:bg-white/5 transition-colors ${isActive ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
            style={{ height: TRACK_HEIGHT }}
        >
            <div className="flex flex-col flex-1 mr-2">
                {isEditing ? (
                    <input
                        autoFocus
                        className="bg-black/50 text-white text-sm px-1 py-0.5 rounded border border-primary/50 outline-none w-full"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        // Stop propagation to prevent drag start on input?
                        // Actually parent is draggable.
                        // We must prevent drag start if clicking on input.
                        onMouseDown={e => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className="text-gray-200 font-medium text-sm truncate w-full cursor-text hover:text-white transition-colors select-none"
                        title={track.name}
                        onDoubleClick={() => setIsEditing(true)}
                    >
                        {track.name}
                    </span>
                )}
                <span className="text-xs text-muted-foreground capitalize mt-0.5">{track.type}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onToggleHide} className={`p-1 rounded hover:bg-white/10 ${track.isHidden ? 'text-primary' : 'text-gray-400'}`}>
                    {track.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={onToggleMute} className={`p-1 rounded hover:bg-white/10 ${track.isMuted ? 'text-primary' : 'text-gray-400'}`}>
                    {track.isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <button onClick={onToggleLock} className={`p-1 rounded hover:bg-white/10 ${track.isLocked ? 'text-primary' : 'text-gray-400'}`}>
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

const resolveCollision = (
    itemsOnLayer: TimelineItem[],
    desiredStart: number,
    duration: number,
    ignoreId: string | null
): number => {
    const sorted = itemsOnLayer
        .filter(i => i.id !== ignoreId)
        .sort((a, b) => a.start - b.start);

    const desiredEnd = desiredStart + duration;

    // Check for overlaps
    for (const item of sorted) {
        const itemEnd = item.start + (item.duration || 0);

        // Check Intersect
        if (desiredStart < itemEnd && desiredEnd > item.start) {
            // Overlap detected
            // Determine which side is closer
            // Dist to Left: Math.abs(desiredEnd - item.start) -> shift left to item.start - duration
            // Dist to Right: Math.abs(desiredStart - itemEnd) -> shift right to itemEnd

            // However, we must ensure the NEW position doesn't overlap another item.
            // This could be recursive.
            // For Phase 3, let's just clamp to the nearest edge of the *first* collision (sorted?)
            // Actually, sorting by start helps.

            // Simple heuristic: 
            // If the midpoint of dropped item is before midpoint of existing item -> Go Left.
            // Else -> Go Right.

            const myMid = desiredStart + duration / 2;
            const itemMid = item.start + (item.duration || 0) / 2;

            if (myMid < itemMid) {
                // Push Left (to item.start - duration)
                return Math.max(0, item.start - duration);
            } else {
                // Push Right (to itemEnd)
                return itemEnd;
            }
        }
    }

    return desiredStart;
};

// --- Snap Engine Helpers ---

type SnapPoint = {
    time: number;
    type: 'clip-start' | 'clip-end' | 'playhead';
};

const SNAP_THRESHOLD_PX = 15;

const getSnapPoints = (
    items: TimelineItem[],
    draggedItemId: string | null,
    playheadTime: number
): SnapPoint[] => {
    const points: SnapPoint[] = [{ time: playheadTime, type: 'playhead' }];
    items.forEach(item => {
        if (item.id === draggedItemId) return;
        points.push({ time: item.start, type: 'clip-start' });
        // Assuming undefined duration handled elsewhere or defaulting
        points.push({ time: item.start + (item.duration || 0), type: 'clip-end' });
    });
    return points;
};

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
    selectedItemIds?: string[];
    onVideoClick?: (id: string, e: React.MouseEvent) => void;
    activeTool?: 'select' | 'razor';
    onSplit?: (itemId: string, splitTime: number, trackType: TrackType) => void;
    onToolChange?: (tool: 'select' | 'razor') => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    // New Props
    zoomLevel?: number;
    manualLayerCount?: number;
    layers?: TimelineLayer[];
    onLayerUpdate?: (layerId: string, updates: Partial<TimelineLayer>) => void;
    onRequestAddLayer?: () => void;
    onLayerReorder?: (fromIndex: number, toIndex: number) => void;
    onDeleteLayer?: (layerId: string) => void;
    onClearLayer?: (layerId: string) => void;
    onDuplicateLayer?: (layerId: string) => void;
}

export interface TimelineHandle {
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    togglePlayPause: () => void;
}

const calculateDropTime = (
    e: React.DragEvent,
    opts: {
        zoom: number;
        scrollLeft: number;
        container: HTMLDivElement;
        items: TimelineItem[];
        draggedId: string | null;
        playhead: number;
    }
): { time: number; snapped: boolean } => {
    const rect = opts.container.getBoundingClientRect();
    const rawX = e.clientX - rect.left + opts.scrollLeft;
    const rawTime = Math.max(0, rawX / opts.zoom);

    // 1. Clamp (optional, but good for safety)
    let time = rawTime;
    let snapped = false;

    // 2. Snap
    const threshold = SNAP_THRESHOLD_PX / opts.zoom;
    const points = getSnapPoints(opts.items, opts.draggedId, opts.playhead);

    for (const p of points) {
        if (Math.abs(p.time - rawTime) < threshold) {
            time = p.time;
            snapped = true;
            break;
        }
    }

    return { time, snapped };
};

const Timeline = React.forwardRef<TimelineHandle, TimelineProps>(({
    cards, voices, onCardsUpdate, isBlocksProcessing, onBlockClick,
    onAddBlock, onGenerateAll, videoTrackItems = [], onVideoTrackUpdate,
    activeBlockId, onActiveMediaChange, onTimeUpdate, onIsPlayingChange,
    selectedItemIds = [], onVideoClick, onPlaybackRateChange, activeTool,
    onSplit, onToolChange, onDelete, onUndo, onRedo, canUndo, canRedo,
    zoomLevel = 50, manualLayerCount = 2, layers, onLayerUpdate, onRequestAddLayer, onLayerReorder,
    onDeleteLayer, onClearLayer, onDuplicateLayer
}, ref) => {

    const [isPlaying, setIsPlaying] = useState(false);
    // --- Data Sanitization (Self-Healing) ---
    useEffect(() => {
        if (!videoTrackItems || !onVideoTrackUpdate) return;

        videoTrackItems.forEach(item => {
            const isMedia = item.type === 'video' || item.type === 'scene' || item.type === 'music' || item.type === 'image';
            const isBroken = !Number.isFinite(item.duration) || item.duration > 36000 || item.duration <= 0;
            // Treat undefined isDurationResolved as needing update (Legacy Migration)
            const needsSource = isMedia && (item.sourceDuration === undefined || item.isDurationResolved === undefined);

            if (needsSource || isBroken) {
                console.log("Sanitizer: fixing item", item.id, { isBroken, needsSource });
                // 1. Try to resolve URL
                const url = item.audioUrl || (item.content.startsWith('http') ? item.content : null);

                if (url && !isBroken) { // Only try to resolve if duration is plausible, otherwise hard reset first?
                    const kind = (item.type === 'music') ? 'audio' : 'video';
                    resolveMediaDuration(url, kind)
                        .then(dur => {
                            onVideoTrackUpdate(prev => {
                                const currentItem = prev.find(i => i.id === item.id);
                                if (!currentItem) return prev;

                                const layerItems = prev.filter(i =>
                                    i.id !== item.id &&
                                    (i.layerIndex || 0) === (currentItem.layerIndex || 0) &&
                                    (i.type === 'video' || i.type === 'scene' || i.type === 'image')
                                );
                                const safeStart = resolveCollision(layerItems, currentItem.start, dur, item.id);

                                return prev.map(i =>
                                    i.id === item.id
                                        ? { ...i, duration: dur, sourceDuration: dur, isDurationResolved: true, start: safeStart }
                                        : i
                                );
                            });
                        })
                        .catch(() => {
                            // Fallback to 5s
                            onVideoTrackUpdate(prev => prev.map(i =>
                                i.id === item.id
                                    ? { ...i, duration: 5, sourceDuration: 5, isDurationResolved: true }
                                    : i
                            ));
                        });
                } else {
                    // Hard reset for broken items or items without URL
                    const safeDur = (item.duration > 0 && item.duration < 36000) ? item.duration : 5;
                    onVideoTrackUpdate(prev => prev.map(i =>
                        i.id === item.id
                            ? { ...i, duration: safeDur, sourceDuration: safeDur, isDurationResolved: true }
                            : i
                    ));
                }
            }
        });
    }, [videoTrackItems]);

    // --- Layer Context Menu ---
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, trackId: string } | null>(null);
    const [snapLineTime, setSnapLineTime] = useState<number | null>(null);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleHeaderContextMenu = (e: React.MouseEvent, trackId: string) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            trackId
        });
    };

    const { settings } = usePerformance();
    // Zoom/Layer state lifted to parent
    // const [zoomLevel, setZoomLevel] = useState(50); 
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0); // Default 0 for visual fit
    const [scrollLeft, setScrollLeft] = useState(0);
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
    // const headersScrollRef = useRef<HTMLDivElement>(null); // No longer needed? Wait, headers sync is usually good.
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
    // const [manualLayerCount, setManualLayerCount] = useState(2); // Lifted


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
        const allItems = [...voiceTrackItems, ...videoTrackItems];

        // 🔍 Debug: Identifies corrupted items causing infinite timeline
        // Removed from useMemo to avoid performance hit

        allItems.forEach(item => {
            if (!Number.isFinite(item.start)) return;
            if (!Number.isFinite(item.duration)) return;
            if (item.duration <= 0) return;

            max = Math.max(max, item.start + item.duration);
        });

        return max > 0 ? max + 0.1 : 30;
    }, [voiceTrackItems, videoTrackItems]);

    // Calculate Visual-Only Duration (For Grid & Zoom focus)
    const visualMaxTime = useMemo(() => {
        let max = 0;
        videoTrackItems.forEach(item => {
            if (item.type === 'scene' || item.type === 'video' || item.type === 'image' || item.type === 'text') {
                if (Number.isFinite(item.start) && Number.isFinite(item.duration) && item.duration > 0) {
                    max = Math.max(max, item.start + item.duration);
                }
            }
        });
        return max;
    }, [videoTrackItems]);

    // Sync state for UI
    useEffect(() => {
        const base = visualMaxTime > 0 ? visualMaxTime : maxContentTime;
        // Add 20s buffer so user can drop items after the end
        setTotalDuration(Math.max(base + 20, 20));
    }, [maxContentTime, visualMaxTime]);

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
            // Match layer by order (which equals index)
            const layer = layers?.find(l => l.order === i);
            videoTracks.push({
                id: `t-video-${i}`,
                type: 'video',
                name: layer?.name || `Video ${i + 1}`,
                isLocked: layer?.isLocked,
                isHidden: layer ? !layer.isVisible : false, // UI prop is isHidden, data is isVisible
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
    }, [displayVoiceItems, videoTrackItems, manualLayerCount, layers]);

    // --- Drag and Drop Handlers ---
    // --- Drag and Drop Handlers ---



    const handleDragStart = (e: React.DragEvent, id: string, type: TrackType) => {
        setDraggingItemId(id);
        e.dataTransfer.effectAllowed = 'move';
        const actionType = type === 'voice' ? 'reorder' : 'move-video';
        e.dataTransfer.setData('application/json', JSON.stringify({ type: actionType, id, trackType: type }));
    };

    const getSnapItemsForTrack = (
        trackType: TrackType | undefined,
        allItems: TimelineItem[]
    ): TimelineItem[] => {
        // Voice: No Snap
        if (trackType === 'voice') return [];

        // Music: Snap only to Music
        if (trackType === 'music') {
            return allItems.filter(i => i.type === 'music');
        }

        // Visual Tracks: Video / Image / Scene / Text
        return allItems.filter(i =>
            i.type === 'video' ||
            i.type === 'scene' ||
            i.type === 'image' ||
            i.type === 'text'
        );
    };

    const handleDragOver = (e: React.DragEvent, trackType?: TrackType) => {
        // 1. Layer Drag -> ignore everything
        if (e.dataTransfer.types.includes('application/layer-index')) {
            e.preventDefault();
            setSnapLineTime(null);
            setDragTargetIndex(null);
            return;
        }

        e.preventDefault();

        // 2. Determine Action Type
        // Internal Move: draggingItemId set
        // External Add: No draggingItemId but 'application/json' in types
        const isInternalMove = !!draggingItemId;
        const isExternalAdd = !draggingItemId && e.dataTransfer.types.includes('application/json');

        if (!isInternalMove && !isExternalAdd) {
            setSnapLineTime(null);
            setDragTargetIndex(null);
            return;
        }

        e.dataTransfer.dropEffect = isInternalMove ? 'move' : 'copy';
        if (!timelineScrollRef.current) return;

        // --- SNAP (Context Aware) ---
        const snapItems = getSnapItemsForTrack(trackType, videoTrackItems);

        // Voice Track -> No Snap
        if (trackType === 'voice') {
            setSnapLineTime(null);
        } else {
            const { time, snapped } = calculateDropTime(e, {
                zoom: zoomLevel,
                scrollLeft: scrollLeft,
                container: timelineScrollRef.current,
                items: snapItems,
                draggedId: draggingItemId,
                playhead: currentTime
            });

            setSnapLineTime(snapped ? time : null);
        }

        // --- VOICE REORDER (Internal Voice Only) ---
        if (isInternalMove) {
            const isVoiceMove = voiceTrackItems.some(i => i.id === draggingItemId);
            if (isVoiceMove) {
                const rect = timelineScrollRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left + scrollLeft;
                const rawTime = Math.max(0, x / zoomLevel);

                let index = voiceTrackItems.length;
                for (let i = 0; i < voiceTrackItems.length; i++) {
                    const item = voiceTrackItems[i];
                    if (rawTime < item.start + item.duration / 2) {
                        index = i;
                        break;
                    }
                }
                setDragTargetIndex(index);
            } else {
                setDragTargetIndex(null);
            }
        } else {
            setDragTargetIndex(null);
        }

    };

    const handleDrop = async (e: React.DragEvent, trackType?: string, trackId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSnapLineTime(null);

        if (!timelineScrollRef.current) return;

        // Use Unified Calculation
        // Use Unified Calculation, but prioritize Visual Snap (Golden Rule)
        const { time: rawDrop } = calculateDropTime(e, {
            zoom: zoomLevel,
            scrollLeft: scrollLeft,
            container: timelineScrollRef.current,
            items: videoTrackItems,
            draggedId: draggingItemId,
            playhead: currentTime
        });

        // If we had a visual snap line, USE IT. Otherwise use the raw drop calculation.
        // This prevents the "Timing Desync" where drop time differs from what the user saw.
        const dropTime = snapLineTime !== null ? snapLineTime : rawDrop;

        const dataStr = e.dataTransfer.getData('application/json');

        // Finalize Reorder (Voice)
        if (draggingItemId && onCardsUpdate && dragTargetIndex !== null) {
            const items = [...voiceTrackItems];
            const draggedIndex = items.findIndex(i => (i.blockId || i.id) === draggingItemId);

            if (draggedIndex !== -1) {
                onCardsUpdate(prev => {
                    const activeCardIndex = prev.findIndex(c => c.id === draggingItemId);
                    if (activeCardIndex === -1) return prev;

                    const newCards = [...prev];
                    const [removed] = newCards.splice(activeCardIndex, 1);
                    console.log(activeCardIndex);
                    let insertIndex = dragTargetIndex;
                    if (activeCardIndex < insertIndex) insertIndex--;
                    insertIndex = Math.max(0, Math.min(insertIndex, newCards.length));
                    console.log(insertIndex);
                    newCards.splice(insertIndex, 0, removed);
                    return newCards.map((c, i) => ({ ...c, block_index: i.toString() }));
                });
            }
        }

        setDraggingItemId(null);
        setDragTargetIndex(null);

        if (!dataStr) return;

        let data: any = {};
        try {
            data = JSON.parse(dataStr);
            if (data.payload) data = { ...data, ...data.payload };
        } catch (e) {
            console.error("Failed to parse drop data", e);
            return;
        }

        // --- 1. HANDLE ADD ACTION (New Assets) ---
        if (data.action === 'add') {
            const isVideo = data.type === 'video' || data.type?.startsWith('video/');
            const isImage = data.type === 'image' || data.type?.startsWith('image/');
            const isAudio = data.type === 'audio' || data.type?.startsWith('audio/');
            const isScene = data.type === 'scene';

            // Use unified dropTime
            const dropAt = dropTime;

            // Resolve target layer from trackId if dropping on a video track
            const targetLayer =
                trackId?.startsWith('t-video-')
                    ? parseInt(trackId.replace('t-video-', ''), 10)
                    : (layers?.length ? Math.max(...layers.map(l => l.order || 0)) : 0);

            // 1) Visual add
            if ((isVideo || isImage || isScene) && onVideoTrackUpdate) {
                const normalizedType: TimelineItem['type'] =
                    isScene ? 'scene' : (isVideo ? 'video' : 'image');

                const newItem: TimelineItem = {
                    id: uuidv4(),
                    start: dropAt,
                    duration: 5,
                    type: normalizedType,
                    layerIndex: targetLayer,
                    mediaStartOffset: 0,
                    isDurationResolved: false,
                    sourceDuration: 0,
                    // ✅ Store URL in both fields so system works universally
                    audioUrl: data.url,
                    content: data.url || data.name || 'New Item',
                    transform: { scale: 1, x: 0, y: 0, rotation: 0 },
                };

                onVideoTrackUpdate(prev => [...prev, newItem]);

                if (data.url && (normalizedType === 'video' || normalizedType === 'scene')) {
                    resolveMediaDuration(data.url, 'video')
                        .then(d => {
                            onVideoTrackUpdate(prev =>
                                prev.map(i => i.id === newItem.id ? { ...i, duration: d, sourceDuration: d, isDurationResolved: true } : i)
                            );
                        })
                        .catch(() => toast.error('Could not load video duration'));
                }

                return;
            }

            // 2) Audio add to music track only
            if (isAudio && trackType === 'music' && onVideoTrackUpdate) {
                const newItem: TimelineItem = {
                    id: uuidv4(),
                    start: dropAt,
                    duration: 5,
                    type: 'music',
                    audioUrl: data.url,
                    content: data.name || 'Audio',
                    volume: 1,
                    isDurationResolved: false,
                    sourceDuration: 0
                };

                onVideoTrackUpdate(prev => [...prev, newItem]);

                if (data.url) {
                    resolveMediaDuration(data.url, 'audio')
                        .then(d => {
                            onVideoTrackUpdate(prev =>
                                prev.map(i => i.id === newItem.id ? { ...i, duration: d, sourceDuration: d, isDurationResolved: true } : i)
                            );
                        })
                        .catch(() => { /* fallback ok */ });
                }

                return;
            }

            return;
        }

        // --- 2. HANDLE MOVE / VALIDATION (Existing Items) ---
        try {
            const { validateMediaItem } = await import('@/lib/wasm-loader');
            const isValid = await validateMediaItem(dataStr);
            if (!isValid) return; // Only validate existing timeline items or strict moves
        } catch (e) { console.warn("WASM validation skipped/failed", e); }

        // Implicit Layer Creation for Visual Items (Fallback or Move?)
        // Note: The previous logic combined add/move here. We've handled ADD above. 
        // If we are here, it might be a move that mimics implicit creation (unlikely for internal moves usually)
        // We keep the logic for safety or specific internal drag types not marked as 'add'.
        const isVideo = data.type === 'video' || data.type?.startsWith('video/');
        const isImage = data.type === 'image' || data.type?.startsWith('image/');
        const isScene = data.type === 'scene';

        if (!trackType && onRequestAddLayer && onVideoTrackUpdate && (isVideo || isImage || isScene)) {
            // ... this logic might be redundant if all ADDS are caught above, but keeping for safety if 'action' is missing
            // For now, let's assume if it falls through here, we treat it similarly but maybe it was an internal drag?
            // But internal drags usually have specific types like 'move-video'.
            // We will leave the rest of the function as is, but it should be noted that 'add' exits early.
        }

        // Handle Audio Drop on Music Track
        if (trackType === 'music' && data.type?.startsWith('audio') && onVideoTrackUpdate) {



            const newItem: TimelineItem = {
                id: uuidv4(),
                start: dropTime,
                duration: 5, // Placeholder
                content: data.name,
                type: 'music',
                audioUrl: data.url,
                volume: 1,
                isDurationResolved: false // Initialize as unresolved
            };

            onVideoTrackUpdate(prev => [...prev, newItem]);

            if (data.url) {
                resolveMediaDuration(data.url, 'audio')
                    .then(duration => {
                        onVideoTrackUpdate(prev => prev.map(i =>
                            i.id === newItem.id
                                ? { ...i, duration, sourceDuration: duration, isDurationResolved: true }
                                : i
                        ));
                    })
                    .catch((err) => {
                        console.warn("Audio duration fallback:", err);
                        onVideoTrackUpdate(prev => prev.map(i =>
                            i.id === newItem.id
                                ? { ...i, duration: 5, sourceDuration: 5, isDurationResolved: true, durationFallback: true }
                                : i
                        ));
                    });
            }
            return;
        }

        // Handle Audio Drop on Voice Track

        if (trackType === 'voice' && data.type?.startsWith('audio') && onCardsUpdate) {
            // dropTime available from outer scope

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

            // Determine Target Layer
            const targetLayer = (trackId && trackId.startsWith('t-video-')) ? parseInt(trackId.replace('t-video-', '')) : 0;

            // dropTime available from outer scope

            // ... Existing logic ...
            const initialDuration = 5;
            const layerItems = videoTrackItems.filter(i => (i.layerIndex || 0) === targetLayer && (
                i.type === 'video' || i.type === 'image' || i.type === 'scene'
            ));

            const safeTime = resolveCollision(layerItems, dropTime, initialDuration, null);

            const newItem: TimelineItem = {
                id: uuidv4(),
                start: safeTime,
                duration: initialDuration,
                content: data.name,
                type: data.type?.startsWith('audio') ? 'music' : (data.type?.startsWith('video') ? 'scene' : 'image'),
                audioUrl: data.url,
                layerIndex: (trackType === 'video' || trackType === 'image') ? targetLayer : 0,
                transform: { scale: 1, x: 0, y: 0, rotation: 0 },
                isDurationResolved: false
            };

            // 1. Add item immediately
            onVideoTrackUpdate(prev => [...prev, newItem]);

            // 2. Async fetch duration
            if (data.url && (newItem.type === 'music' || newItem.type === 'scene' || newItem.type === 'video')) {
                // ... same async duration logic ...
                const kind = (newItem.type === 'scene' || newItem.type === 'video') ? 'video' : 'audio';
                resolveMediaDuration(data.url, kind)
                    .then(duration => {
                        onVideoTrackUpdate(prev => {
                            const item = prev.find(i => i.id === newItem.id);
                            if (!item) return prev;

                            const layerItems = prev.filter(i =>
                                i.id !== item.id && (i.layerIndex || 0) === (item.layerIndex || 0) &&
                                (i.type === 'video' || i.type === 'scene' || i.type === 'image')
                            );
                            const safeStart = resolveCollision(layerItems, item.start, duration, item.id);
                            return prev.map(i => i.id === newItem.id ? { ...i, duration, sourceDuration: duration, isDurationResolved: true, start: safeStart } : i);
                        });
                    })
                    .catch((err) => {
                        // ... fallback ...
                        console.warn("Media duration fallback:", err);
                        onVideoTrackUpdate(prev => prev.map(i => i.id === newItem.id ? { ...i, duration: 5, sourceDuration: 5, isDurationResolved: true, durationFallback: true } : i));
                    });
            }

        } else if (data.type === 'move-video' && onVideoTrackUpdate) {
            const movingItem = videoTrackItems.find(i => i.id === data.id);
            if (movingItem) {
                const targetLayer = (trackId && trackId.startsWith('t-video-')) ? parseInt(trackId.replace('t-video-', '')) : (movingItem.layerIndex || 0);

                // Use unified dropTime (Already includes Snap calculation)
                const clampedTime = dropTime;

                const layerItems = videoTrackItems.filter(i => {
                    const iLayer = i.layerIndex || 0;
                    const isVisual = i.type === 'image' || i.type === 'scene' || i.type === 'video' || i.type === 'text';
                    return isVisual && iLayer === targetLayer && i.id !== movingItem.id;
                });

                // STRICT COLLISION CHECK (Rejection Strategy)
                // If the desired time causes an overlap, we REJECT the move entirely.
                // We do NOT clamp or shift. This ensures "What You See Is What You Get".
                const hasOverlap = layerItems.some(item => {
                    const itemEnd = item.start + item.duration;
                    const thisEnd = clampedTime + movingItem.duration;
                    return (clampedTime < itemEnd && thisEnd > item.start);
                });

                if (hasOverlap) {
                    toast.error('Cannot overlap clips');
                    return;
                }

                const safeTime = clampedTime;

                onVideoTrackUpdate(videoTrackItems.map(item => {
                    if (item.id === data.id) {
                        return { ...item, start: safeTime, layerIndex: targetLayer };
                    }
                    return item;
                }));
            }
        }
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
                // Stop if we exceed total duration (Audio OR Video)
                const globalMax = Math.max(maxContentTime, visualMaxTime);
                if (newTime >= globalMax) {
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
            (item.type === 'scene' || item.type === 'video' || item.type === 'image') &&
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
                            (track.type !== 'voice' && selectedItemIds.includes(item.id));

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

        // Removed setCurrentCardIndex as it was local state and not used
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


    const resolveResizeCollision = (
        targetItem: TimelineItem,
        candidateStart: number,
        candidateDuration: number,
        items: TimelineItem[]
    ): { start: number; duration: number } => {
        let newStart = candidateStart;
        let newDuration = candidateDuration;
        const candidateEnd = newStart + newDuration;

        // Find neighbors on the same layer
        const layerIndex = targetItem.layerIndex || 0;
        const potentialCollisions = items.filter(i =>
            i.id !== targetItem.id &&
            (i.layerIndex || 0) === layerIndex &&
            (i.type === 'video' || i.type === 'image' || i.type === 'scene' || i.type === 'text') // Assuming collision mostly matters for visual track
        );

        // Check for overlaps
        for (const other of potentialCollisions) {
            const otherEnd = other.start + other.duration;

            // Collision Case 1: Dragging Start (Left Handle)
            // If we moved start to the left, check if we hit a clip to the left
            if (candidateStart < targetItem.start) { // If expanding left
                if (otherEnd <= targetItem.start && candidateStart < otherEnd) {
                    // We are expanding into `other`. Clamp to `other.end`
                    newStart = otherEnd;
                    newDuration = (targetItem.start + targetItem.duration) - newStart;
                }
            }

            // Collision Case 2: Dragging End (Right Handle)
            // If we moved end to the right, check if we hit a clip to the right
            if (candidateEnd > (targetItem.start + targetItem.duration)) { // If expanding right
                if (other.start >= (targetItem.start + targetItem.duration) && candidateEnd > other.start) {
                    // We are expanding into `other`. Clamp to `other.start`
                    newDuration = other.start - newStart;
                }
            }

            // Note: General overlapping check for safety (e.g. fast drag)
            // This is harder to genericize without knowing "direction". 
            // The above directional checks usually suffice for resize handles.
        }

        return { start: newStart, duration: newDuration };
    };

    const handleResize = useCallback((e: MouseEvent) => {
        if (!isResizing || !resizeItem || !resizeHandle || !onVideoTrackUpdate) return;

        const deltaX = (e.clientX - initialMouseX) / zoomLevel;

        onVideoTrackUpdate(prevItems => prevItems.map(item => {
            if (item.id === resizeItem.id) {
                let newStart = initialItemStart;
                let newDuration = initialItemDuration;

                const sourceMaxDuration = (item.type === 'video' || item.type === 'scene' || item.type === 'music') && item.sourceDuration
                    ? item.sourceDuration
                    : Infinity;

                if (resizeHandle === 'start') {
                    newStart = Math.max(0, initialItemStart + deltaX);
                    // Standard Resize: Start moves, End stays fixed (so duration changes)
                    // The "End Time" of the clip should remain constant: (initialStart + initialDuration)
                    const originalEndTime = initialItemStart + initialItemDuration;

                    // Clamp Start to End (min duration)
                    if (newStart > originalEndTime - 0.1) {
                        newStart = originalEndTime - 0.1;
                    }

                    newDuration = originalEndTime - newStart;

                    // Check Source constraints (cannot expand start beyond 0 offset if we tracked offset)
                    // (Assuming simplistic resize for now)

                } else { // 'end'
                    newDuration = Math.max(0.1, initialItemDuration + deltaX);
                    if (newDuration > sourceMaxDuration) {
                        newDuration = sourceMaxDuration;
                    }
                }

                // Apply Collision Logic
                // We pass the "Proposed" new state to the resolver
                const safeState = resolveResizeCollision(
                    item,
                    newStart,
                    newDuration,
                    prevItems // Check against current state of other items
                );

                return { ...item, start: safeState.start, duration: safeState.duration };
            }
            return item;
        }), false);
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

    // 🔍 Debug Logger (Development Only)
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') {
            console.log("Timeline Debug:", { maxContentTime, totalDuration });
            console.table(videoTrackItems.map(i => ({
                id: i.id,
                type: i.type,
                start: i.start,
                duration: i.duration,
                end: i.start + i.duration,
                sourceDuration: i.sourceDuration,
                isResolved: i.isDurationResolved
            })));
        }
    }, [videoTrackItems, maxContentTime, totalDuration]);

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
                case 'Delete':
                case 'Backspace':
                    // Delete selected items
                    if (selectedItemIds.length > 0) {
                        if (confirm(`Delete ${selectedItemIds.length} items?`)) {
                            const newItems = videoTrackItems.filter(i => !selectedItemIds.includes(i.id));
                            // Should also handle voice cards deletion if selected?
                            // Currently voice deletion propagates via blockId.
                            // But 'videoTrackItems' passed here includes generic items.
                            // `onVideoTrackUpdate` handles the list.
                            onVideoTrackUpdate?.(newItems);
                        }
                    }
                    // Handle Active Block (Voice) - Handled separately via onDelete?
                    // actually if activeBlockId is set, we might want to delete it too.
                    if (activeBlockId && onDelete) {
                        onDelete();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, currentTime, totalDuration, handlePlayPause, handleSeek]);



    const handleToggleLock = (trackId: string) => {
        if (!onLayerUpdate || !layers) return;
        const match = trackId.match(/^t-video-(\d+)$/);
        if (match) {
            const index = parseInt(match[1]);
            const layer = layers.find(l => l.order === index);
            if (layer) {
                onLayerUpdate(layer.id, { isLocked: !layer.isLocked });
            }
        }
    };

    const handleToggleVisibility = (trackId: string) => {
        if (!onLayerUpdate || !layers) return;
        const match = trackId.match(/^t-video-(\d+)$/);
        if (match) {
            const index = parseInt(match[1]);
            const layer = layers.find(l => l.order === index);
            if (layer) {
                onLayerUpdate(layer.id, { isVisible: !layer.isVisible });
            }
        }
    };


    const handleLayerDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('application/layer-index', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleLayerDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndexStr = e.dataTransfer.getData('application/layer-index');
        if (!dragIndexStr) return;

        const dragIndex = parseInt(dragIndexStr);
        if (isNaN(dragIndex) || dragIndex === dropIndex) return;

        if (onLayerReorder) {
            onLayerReorder(dragIndex, dropIndex);
        }
    };

    const handleRenameLayer = (trackId: string, newName: string) => {
        if (!onLayerUpdate || !layers) return;
        const match = trackId.match(/^t-video-(\d+)$/);
        if (match) {
            const index = parseInt(match[1]);
            const layer = layers.find(l => l.order === index);
            if (layer) {
                onLayerUpdate(layer.id, { name: newName });
            }
        }
    };

    // --- Render ---

    return (
        <div className="flex flex-col h-full bg-[var(--timeline-bg)] text-[var(--foreground)] select-none" dir="ltr">
            {/* Hidden Audio Players */}
            <audio ref={audioRef} className="hidden" />
            <audio ref={musicAudioRef} className="hidden" />

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-[var(--popover)] border border-[var(--border)] rounded shadow-2xl py-1 min-w-[160px] flex flex-col"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="px-4 py-2 text-left text-sm hover:bg-white/10 text-gray-200 transition-colors"
                        onClick={() => {
                            const match = contextMenu.trackId.match(/^t-video-(\d+)$/);
                            if (match && onLayerUpdate && layers) {
                                const index = parseInt(match[1]);
                                const layer = layers.find(l => l.order === index);
                                if (layer) {
                                    const newName = prompt("Rename Layer", layer.name);
                                    if (newName && newName.trim()) {
                                        onLayerUpdate(layer.id, { name: newName.trim() });
                                    }
                                }
                            }
                            setContextMenu(null);
                        }}
                    >
                        Rename
                    </button>
                    <button
                        className="px-4 py-2 text-left text-sm hover:bg-white/10 text-gray-200 transition-colors"
                        onClick={() => {
                            const match = contextMenu.trackId.match(/^t-video-(\d+)$/);
                            if (match && onDuplicateLayer && layers) {
                                // Need Layer ID
                                const index = parseInt(match[1]);
                                const layer = layers.find(l => l.order === index);
                                if (layer) onDuplicateLayer(layer.id);
                            }
                            setContextMenu(null);
                        }}
                    >
                        Duplicate Layer
                    </button>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                        className="px-4 py-2 text-left text-sm hover:bg-white/10 text-gray-200 transition-colors"
                        onClick={() => {
                            const match = contextMenu.trackId.match(/^t-video-(\d+)$/);
                            if (match && onClearLayer && layers) {
                                const index = parseInt(match[1]);
                                const layer = layers.find(l => l.order === index);
                                if (layer) onClearLayer(layer.id);
                            }
                            setContextMenu(null);
                        }}
                    >
                        Clear Contents
                    </button>
                    <button
                        className="px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                        onClick={() => {
                            const match = contextMenu.trackId.match(/^t-video-(\d+)$/);
                            if (match && onDeleteLayer && layers) {
                                const index = parseInt(match[1]);
                                const layer = layers.find(l => l.order === index);
                                if (layer) onDeleteLayer(layer.id);
                            }
                            setContextMenu(null);
                        }}
                    >
                        Delete Layer
                    </button>
                </div>
            )}

            {/* Toolbar Removed (Lifted to Parent) */}


            {/* Timeline Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar (Headers) */}
                <div
                    ref={headersScrollRef}
                    className="w-48 flex-shrink-0 bg-[var(--card)] border-r border-[var(--border)] z-20 flex flex-col pt-8 shadow-xl overflow-hidden"
                >
                    {
                        tracks.map(track => {
                            const match = track.id.match(/^t-video-(\d+)$/);
                            const layerIndex = match ? parseInt(match[1]) : -1;
                            const isActive = track.items.some(i => selectedItemIds.includes(i.id));

                            return (
                                <div
                                    key={track.id}
                                    draggable={layerIndex !== -1}
                                    onDragStart={(e) => handleLayerDragStart(e, layerIndex)}
                                    // Use shared handler for consisten snap/drop support
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleLayerDrop(e, layerIndex)}
                                    onContextMenu={(e) => handleHeaderContextMenu(e, track.id)}
                                    className="relative cursor-grab active:cursor-grabbing"
                                >
                                    {/* Drop Indicator Logic could go here (border-top?) */}
                                    <TrackHeader
                                        track={track}
                                        isActive={isActive}
                                        onToggleMute={() => { }}
                                        onToggleHide={() => handleToggleVisibility(track.id)}
                                        onToggleLock={() => handleToggleLock(track.id)}
                                        onRename={(name) => handleRenameLayer(track.id, name)}
                                    />
                                </div>
                            );
                        })
                    }
                </div>

                {/* Right Scrollable Area (Tracks) */}
                <div
                    ref={timelineScrollRef}
                    className="flex-1 overflow-auto relative custom-scrollbar bg-background/50"
                    onScroll={(e) => {
                        setScrollLeft(e.currentTarget.scrollLeft);
                        if (headersScrollRef.current) {
                            headersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                        }
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setSnapLineTime(null)}
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
                            className="absolute top-0 bottom-0 w-px bg-[var(--playhead)] z-30 pointer-events-none shadow-[0_0_10px_rgba(78,86,192,0.5)]"
                            style={{ left: `${currentTime * zoomLevel}px` }}
                        />

                        {/* Snap Guide Line */}
                        {snapLineTime !== null && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-[var(--snap-line)] z-40 pointer-events-none shadow-[0_0_10px_rgba(255,209,102,0.5)]"
                                style={{ left: `${snapLineTime * zoomLevel}px` }}
                            />
                        )}

                        {/* Razor Cursor */}
                        {
                            activeTool === 'razor' && mouseTime >= 0 && (
                                <div
                                    className="absolute top-0 bottom-0 border-l border-dashed border-red-500/70 pointer-events-none z-50 flex flex-col items-center"
                                    style={{ left: `${mouseTime * zoomLevel}px` }}
                                >
                                    <div className="absolute -top-4 text-red-500 bg-white dark:bg-black rounded-full p-0.5 shadow-sm border border-red-500/20">
                                        <Scissors size={14} />
                                    </div>
                                </div>
                            )
                        }

                        {/* Tracks */}
                        <div className="flex flex-col">
                            {tracks.map(track => (
                                <div
                                    key={track.id}
                                    className="border-b border-[var(--timeline-grid-strong)] relative bg-[var(--timeline-grid)] hover:bg-[var(--timeline-grid-strong)] transition-colors group overflow-hidden"
                                    style={{ height: TRACK_HEIGHT }}
                                    onDragOver={(e) => handleDragOver(e, track.type)}
                                    onDragLeave={() => setSnapLineTime(null)}
                                    onDrop={(e) => handleDrop(e, track.type, track.id)}
                                >
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 pointer-events-none opacity-5"
                                        style={{
                                            backgroundImage: 'linear-gradient(to right, var(--timeline-grid-strong) 1px, transparent 1px)',
                                            backgroundSize: `${zoomLevel}px 100%`
                                        }}
                                    />

                                    {/* Items */}
                                    {track.items.map(item => {
                                        const isVisual = item.type === 'video' || item.type === 'scene' || item.type === 'image';
                                        // Standard Width Calculation (Reverted Strict Guard)
                                        const safeDuration = (Number.isFinite(item.duration) && item.duration > 0) ? item.duration : 5;
                                        const width = Math.max(1, safeDuration * zoomLevel);
                                        const left = item.start * zoomLevel;
                                        const isSelected = activeBlockId && item.blockId === activeBlockId;
                                        const isDimmed = track.isHidden; // Visibility dimming

                                        return (
                                            <div
                                                key={item.id}
                                                className={`absolute top-1 bottom-1 group/item z-10 ${isSelected ? 'z-20' : ''} ${isDimmed ? 'opacity-50' : ''} ${track.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                style={{ left: `${left}px`, width: `${width}px` }}
                                                // Removed overflow-hidden from parent to allow handles to show
                                                draggable={activeTool !== 'razor' && !track.isLocked} // Disable drag if locked
                                                onDragStart={(e) => activeTool !== 'razor' && !track.isLocked && handleDragStart(e, item.blockId || item.id, track.type)}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (activeTool === 'razor' && onSplit) {
                                                        if (track.isLocked) return;

                                                        const isSelected = (track.type === 'voice' && activeBlockId === item.blockId) ||
                                                            ((track.type === 'video' || track.type === 'image' || track.type === 'text' || track.type === 'music') && selectedItemIds.includes(item.id));

                                                        if (isSelected) {
                                                            if (!timelineScrollRef.current) return;
                                                            const rect = timelineScrollRef.current.getBoundingClientRect();
                                                            const x = e.clientX - rect.left + scrollLeft;
                                                            const clickTime = Math.max(0, x / zoomLevel);

                                                            onSplit(item.blockId || item.id, clickTime, track.type);
                                                        }
                                                    } else {
                                                        if (track.type === 'voice') {
                                                            onBlockClick?.(item.blockId!);
                                                        } else {
                                                            onVideoClick?.(item.id, e);
                                                        }
                                                    }
                                                }}
                                            >
                                                {/* Item Content */}
                                                <div className="h-full w-full relative">
                                                    {/* Delete Button for Video Items */}
                                                    {track.type !== 'voice' && !track.isLocked && (
                                                        <button
                                                            className="absolute top-1 right-1 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-md opacity-0 group-hover/item:opacity-100 transition-all z-30 shadow-sm backdrop-blur-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteVideoItem(item.id);
                                                            }}
                                                            title="Delete Clip"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                    {track.type === 'voice' || track.type === 'music' ? (
                                                        item.audioUrl ? (
                                                            // Use Real WaveformSegment
                                                            <WaveformSegment
                                                                audioUrl={item.audioUrl}
                                                                duration={item.duration}
                                                                isPlaying={isPlaying && currentTime >= item.start && currentTime < item.start + item.duration}
                                                                color={isPlaying && currentTime >= item.start && currentTime < item.start + item.duration ? '#00A6FB' : '#475569'}
                                                                progressColor="#00A6FB"
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
                                                    ) : (track.type === 'image' || track.type === 'video' || track.type === 'text') ? (
                                                        <div className={`w-full h-full flex items-center justify-center overflow-hidden relative rounded-sm ${track.type === 'text' ? 'bg-primary/20 border-primary/50 text-primary-foreground' : 'bg-muted border-white/10'}`}>
                                                            {track.type === 'text' ? (
                                                                // Text Item Preview
                                                                <div className="w-full h-full flex px-2 items-center overflow-hidden">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className="flex-shrink-0 w-4 h-4 rounded bg-primary text-[10px] uppercase font-bold text-white flex items-center justify-center">T</span>
                                                                        <span className="truncate text-xs font-medium text-white/90 drop-shadow-md">
                                                                            {item.content || 'Text'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (item.audioUrl || item.content?.startsWith('http')) ? (
                                                                <>
                                                                    {item.type === 'video' || item.type === 'scene' || (item.content && (item.content.toLowerCase().endsWith('.mp4') || item.content.toLowerCase().endsWith('.mov'))) ? (
                                                                        // Filmstrip for Video
                                                                        // Since we can't easily extract frames in CSS, we'll repeat the video element carefully 
                                                                        // or just show it once with object-cover.
                                                                        // Ideally, we'd generate a sprite sheet.
                                                                        // For now, let's use a single video element that covers, 
                                                                        // but we can simulate filmstrip holes with a CSS overlay?
                                                                        // User asked for "Repeat thumbnail". 
                                                                        // If we don't have a thumbnail, we can't repeat.
                                                                        // We will rely on validity of `audioUrl` or `content` as source.
                                                                        // Let's use a CLIP PATH or Mask to look like filmstrip?
                                                                        // Or just repeat the video rendering if width allows? No, performance.
                                                                        // Let's stick to single video fitting nicely, but maybe adding film sprocket holes overlay?
                                                                        <div className="w-full h-full relative overflow-hidden bg-black">
                                                                            <video
                                                                                src={item.audioUrl || item.content}
                                                                                className="h-full w-auto max-w-none object-cover opacity-80"
                                                                                // To simulate filmstrip, we might just center it, 
                                                                                // or repeat it if we could.
                                                                                // Let's just make it fill nicely.
                                                                                style={{ width: '100%', objectFit: 'cover' }}
                                                                            />
                                                                            {/* Filmstrip Overlay */}
                                                                            <div
                                                                                className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none opacity-30"
                                                                                style={{
                                                                                    backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.5) 50%)',
                                                                                    backgroundSize: '80px 100%' // Perforations look
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        // Filmstrip for Image
                                                                        // Use background-repeat
                                                                        <div
                                                                            className="w-full h-full opacity-80"
                                                                            style={{
                                                                                backgroundImage: `url(${item.audioUrl || (item.content?.startsWith('http') ? item.content : '')})`,
                                                                                backgroundRepeat: 'repeat-x',
                                                                                backgroundSize: 'auto 100%', // Fit height, repeat horizontal
                                                                                backgroundPosition: 'left center'
                                                                            }}
                                                                        />
                                                                    )}

                                                                    <div className="absolute bottom-1 left-1 flex flex-col max-w-full pointer-events-none z-10">
                                                                        {item.type === 'scene' && (
                                                                            <span className="text-[9px] bg-blue-600/80 text-white px-1 rounded mb-0.5 w-fit">VIDEO</span>
                                                                        )}
                                                                        <span className="text-[10px] text-white/90 truncate bg-black/50 px-1 rounded">{item.content.split('/').pop()}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                // Fallback / Loading
                                                                <div className="animate-pulse bg-white/5 w-full h-full" />
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
                                                            {/* Left Handle */}
                                                            <div
                                                                className="absolute -left-2 top-0 bottom-0 w-4 hover:bg-primary/20 cursor-w-resize z-20 group/handle flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                                                                onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, item, 'start'); }}
                                                            >
                                                                <div className="w-1 h-6 bg-white/80 rounded-full shadow-sm" />
                                                            </div>

                                                            {/* Right Handle */}
                                                            <div
                                                                className="absolute -right-2 top-0 bottom-0 w-4 hover:bg-primary/20 cursor-e-resize z-20 group/handle flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
                                                                onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(e, item, 'end'); }}
                                                            >
                                                                <div className="w-1 h-6 bg-white/80 rounded-full shadow-sm" />
                                                            </div>
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
                                                className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-lg hover:shadow-primary/50 hover:scale-110"
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
        </div >
    );
});

export default Timeline;