'use client';

import { Voice, StudioBlock } from '@/lib/types';
import { Play, Pause, ZoomIn, ZoomOut, Volume2, VolumeX, Eye, EyeOff, Lock, Unlock, Scissors, ChevronRight, ChevronLeft, Settings, SkipBack, SkipForward, Plus, Wand2 } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';

// Import WaveformSegment dynamically
const WaveformSegment = dynamic(() => import('./WaveformSegment').then(mod => mod.default), { ssr: false });

// --- Types & Mock Data ---

type TrackType = 'image' | 'scene' | 'voice' | 'effect';

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
    // For voice items, we link back to the StudioBlock
    blockId?: string;
    audioUrl?: string;
    isGenerating?: boolean; // Added loading state
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
    onVideoTrackUpdate?: (items: TimelineItem[]) => void;
    activeBlockId?: string | null;
    onActiveImageChange?: (url: string | null) => void;
    onTimeUpdate?: (time: number) => void;
    onIsPlayingChange?: (isPlaying: boolean) => void;
}

export interface TimelineHandle {
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    togglePlayPause: () => void;
}

const Timeline = React.forwardRef<TimelineHandle, TimelineProps>(({ cards, voices, onCardsUpdate, isBlocksProcessing, onBlockClick, onAddBlock, onGenerateAll, videoTrackItems = [], onVideoTrackUpdate, activeBlockId, onActiveImageChange, onTimeUpdate, onIsPlayingChange }, ref) => {

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(50); // Pixels per second
    const [totalDuration, setTotalDuration] = useState(30); // Default 30s
    const [scrollLeft, setScrollLeft] = useState(0);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const timelineScrollRef = useRef<HTMLDivElement>(null);
    const headersScrollRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const lastActiveImageRef = useRef<string | null>(null);

    // Imperative Handle
    React.useImperativeHandle(ref, () => ({
        play: () => setIsPlaying(true),
        pause: () => setIsPlaying(false),
        seek: (time) => handleSeek(time),
        togglePlayPause: () => setIsPlaying(prev => !prev)
    }));

    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [dragTargetIndex, setDragTargetIndex] = useState<number | null>(null);

    // Resize State
    const [resizingItemId, setResizingItemId] = useState<string | null>(null);
    const [resizeDirection, setResizeDirection] = useState<'start' | 'end' | null>(null);
    const [resizeStartX, setResizeStartX] = useState<number>(0);
    const [resizeStartItem, setResizeStartItem] = useState<TimelineItem | null>(null);

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
                    content: (card.content?.blocks && Array.isArray(card.content.blocks))
                        ? card.content.blocks.map(b => b.data.text).join(' ').substring(0, 30) + '...'
                        : 'No content',
                    type: 'voice',
                    blockId: card.id,
                    audioUrl: card.audioUrl,
                    isGenerating: card.isGenerating, // Map loading state
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
    useEffect(() => {
        let maxDuration = 30;
        if (voiceTrackItems.length > 0) {
            const lastItem = voiceTrackItems[voiceTrackItems.length - 1];
            maxDuration = Math.max(maxDuration, lastItem.start + lastItem.duration + 5);
        }
        if (videoTrackItems.length > 0) {
            const lastItem = videoTrackItems.reduce((prev, current) => (prev.start + prev.duration > current.start + current.duration) ? prev : current);
            maxDuration = Math.max(maxDuration, lastItem.start + lastItem.duration + 5);
        }
        setTotalDuration(maxDuration);
    }, [voiceTrackItems, videoTrackItems]);

    // Tracks configuration
    const tracks: Track[] = useMemo(() => [
        {
            id: 't-images',
            type: 'image',
            name: 'Video / Images',
            items: videoTrackItems
        },
        {
            id: 't-voice',
            type: 'voice',
            name: 'Voiceover',
            items: displayVoiceItems // Use the display (reordered) items
        },
        // { id: 't-music', type: 'music', name: 'Background Music', items: [] },
    ], [displayVoiceItems, videoTrackItems]); // Update dependency

    // --- Drag and Drop Handlers ---
    // --- Drag and Drop Handlers ---

    // Resize Handler
    const handleResizeStart = (e: React.MouseEvent, item: TimelineItem, direction: 'start' | 'end') => {
        e.preventDefault();
        e.stopPropagation();
        setResizingItemId(item.id);
        setResizeDirection(direction);
        setResizeStartX(e.clientX);
        setResizeStartItem(item);
    };

    // Resize Effect
    useEffect(() => {
        if (!resizingItemId || !resizeStartItem || !resizeDirection || !onVideoTrackUpdate) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartX;
            const deltaSeconds = deltaX / zoomLevel;

            let newStart = resizeStartItem.start;
            let newDuration = resizeStartItem.duration;

            if (resizeDirection === 'end') {
                newDuration = Math.max(0.2, resizeStartItem.duration + deltaSeconds);
                // Optional: Snap to next item or total duration?
            } else {
                const originalEnd = resizeStartItem.start + resizeStartItem.duration;
                newStart = Math.max(0, resizeStartItem.start + deltaSeconds);
                newDuration = Math.max(0.2, originalEnd - newStart);
            }

            const updatedItems = videoTrackItems?.map(item =>
                item.id === resizingItemId
                    ? { ...item, start: newStart, duration: newDuration }
                    : item
            ) || [];
            onVideoTrackUpdate(updatedItems);
        };

        const handleMouseUp = () => {
            setResizingItemId(null);
            setResizeDirection(null);
            setResizeStartItem(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingItemId, resizeStartItem, resizeDirection, resizeStartX, zoomLevel, videoTrackItems, onVideoTrackUpdate]);

    const handleDragStart = (e: React.DragEvent, id: string, type: TrackType) => {
        setDraggingItemId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'reorder', id, trackType: type }));
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

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();

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

                const newItem: TimelineItem = {
                    id: uuidv4(),
                    start: dropTime,
                    duration: 5,
                    content: data.name,
                    type: data.type?.startsWith('video') ? 'scene' : 'image',
                    audioUrl: data.url
                };
                onVideoTrackUpdate([...videoTrackItems, newItem]);
            }
        } catch (err) { console.error(err); }


    };

    // --- Audio Playback Logic ---

    // Calculate actual content duration (without buffer)
    const maxContentTime = useMemo(() => {
        let max = 0;
        voiceTrackItems.forEach(item => max = Math.max(max, item.start + item.duration));
        videoTrackItems.forEach(item => max = Math.max(max, item.start + item.duration));
        return max > 0 ? max : 30; // Default to 30s if empty
    }, [voiceTrackItems, videoTrackItems]);

    // Handle audio ending and moving to next segment
    const handlePlayNext = useCallback(() => {
        if (currentCardIndex < voiceTrackItems.length - 1) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            setIsPlaying(false);
            setCurrentCardIndex(0);
            setCurrentTime(0); // Reset to start
        }
    }, [currentCardIndex, voiceTrackItems.length]);

    // Sync audio element with current segment
    useEffect(() => {
        let isCancelled = false;

        const playCurrentSegment = async () => {
            const currentItem = voiceTrackItems[currentCardIndex];
            if (isPlaying && currentItem?.audioUrl && audioRef.current) {
                // Use proxy for playback to avoid CORS/403 issues
                const targetSrc = currentItem.audioUrl.startsWith('http')
                    ? `/api/proxy-audio?url=${encodeURIComponent(currentItem.audioUrl)}`
                    : currentItem.audioUrl;

                // Check if we need to update (compare decoded to handle browser URL encoding)
                if (!audioRef.current.src.includes(encodeURIComponent(currentItem.audioUrl))) {
                    console.log("🎵 Switching audio source to proxy:", targetSrc);
                    audioRef.current.src = targetSrc;
                    audioRef.current.load(); // Ensure it loads
                }

                const localTime = Math.max(0, currentTime - currentItem.start);

                if (localTime < currentItem.duration) {
                    // Only seek if significantly off
                    if (Math.abs(audioRef.current.currentTime - localTime) > 0.2) {
                        audioRef.current.currentTime = localTime;
                    }

                    if (audioRef.current.paused && !isCancelled) {
                        try {
                            await audioRef.current.play();
                        } catch (e: any) {
                            if (e.name !== 'AbortError') {
                                console.error("Play failed", e);
                            }
                        }
                    }

                    // --- Preloading Logic ---
                    // If we are within 5 seconds of the end, preload the next track
                    if (currentItem.duration - localTime < 5) {
                        const nextItem = voiceTrackItems[currentCardIndex + 1];
                        if (nextItem && nextItem.audioUrl) {
                            const nextSrc = nextItem.audioUrl.startsWith('http')
                                ? `/api/proxy-audio?url=${encodeURIComponent(nextItem.audioUrl)}`
                                : nextItem.audioUrl;

                            // Check if already preloaded (simple cache check via global or ref could be added, 
                            // but browser cache handles repeated new Audio() calls well if url is same)
                            // We use a simple check to avoid spamming logs/objects in this loop
                            if (!(window as any)._preloadedUrls?.includes(nextSrc)) {
                                console.log("🚀 Preloading next track:", nextSrc);
                                const preloadAudio = new Audio(nextSrc);
                                preloadAudio.load(); // Trigger browser cache
                                (window as any)._preloadedUrls = [...((window as any)._preloadedUrls || []), nextSrc];
                            }
                        }
                    }

                } else {
                    handlePlayNext();
                }
            }
        };

        if (isPlaying) {
            playCurrentSegment();
        } else {
            if (audioRef.current && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }

        return () => {
            isCancelled = true;
        };
    }, [isPlaying, currentCardIndex, voiceTrackItems, currentTime, handlePlayNext]);

    // Update loop
    useEffect(() => {
        let animationFrame: number;

        const loop = () => {
            if (isPlaying) {
                setCurrentTime(prev => {
                    let nextTime = prev;

                    // If audio is playing, sync with it
                    if (audioRef.current && !audioRef.current.paused) {
                        const currentItem = voiceTrackItems[currentCardIndex];
                        if (currentItem) {
                            const newTime = currentItem.start + audioRef.current.currentTime;
                            // Prevent jumping back if audio loops slightly or lags
                            nextTime = Math.max(prev, newTime);
                        }
                    } else {
                        // Fallback or for non-audio tracks: increment by delta time
                        nextTime = prev + 0.016; // 60fps approx
                    }

                    // Stop if we exceed content time
                    if (nextTime >= maxContentTime) {
                        setIsPlaying(false);
                        return maxContentTime;
                    }
                    return nextTime;
                });

                // Auto scroll
                if (timelineScrollRef.current) {
                    const currentPos = currentTime * zoomLevel;
                    const containerWidth = timelineScrollRef.current.clientWidth;
                    if (currentPos > scrollLeft + containerWidth * 0.8) {
                        timelineScrollRef.current.scrollLeft = currentPos - containerWidth * 0.2;
                    }
                }

                animationFrame = requestAnimationFrame(loop);
            }
        };

        if (isPlaying) {
            animationFrame = requestAnimationFrame(loop);
        }

        return () => {
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [isPlaying, currentCardIndex, voiceTrackItems, maxContentTime]);

    // Sync Active Image
    useEffect(() => {
        const currentVideoItem = videoTrackItems.find(item =>
            currentTime >= item.start && currentTime < (item.start + item.duration)
        );
        const newUrl = currentVideoItem?.audioUrl || null;
        if (newUrl !== lastActiveImageRef.current) {
            lastActiveImageRef.current = newUrl;
            onActiveImageChange?.(newUrl);
        }

        // Sync Time
        onTimeUpdate?.(currentTime);
    }, [currentTime, videoTrackItems, onActiveImageChange, onTimeUpdate]);


    // --- Interaction Handlers ---

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    // Sync Play State
    useEffect(() => {
        onIsPlayingChange?.(isPlaying);
    }, [isPlaying, onIsPlayingChange]);

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        // Find corresponding card index
        const index = voiceTrackItems.findIndex(item => time >= item.start && time < item.start + item.duration);
        if (index !== -1) {
            setCurrentCardIndex(index);
        }
    };

    const handleZoom = (direction: 'in' | 'out') => {
        setZoomLevel(prev => Math.max(10, Math.min(200, direction === 'in' ? prev * 1.2 : prev / 1.2)));
    };



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
        setIsPlaying(false);
        alert(`✅ Trimmed: ${(endTime - startTime).toFixed(2)}s`);
    }, [onCardsUpdate]);

    const handleDelete = useCallback((segmentId: string) => {
        if (!onCardsUpdate) return;
        onCardsUpdate(prevCards => prevCards.filter(card => card.id !== segmentId));
        setIsPlaying(false);
        alert(`🗑️ Deleted segment.`);
    }, [onCardsUpdate]);

    const handleDurationLoad = useCallback((blockId: string, duration: number) => {
        if (!onCardsUpdate) return;
        onCardsUpdate(prevCards => {
            const index = prevCards.findIndex(c => c.id === blockId);
            if (index === -1) return prevCards;

            const card = prevCards[index];
            // Only update if difference > 0.2s to prevent infinite loops from micro-adjustments
            if (Math.abs((card.duration || 0) - duration) > 0.2) {
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
    }, [isPlaying, currentTime, totalDuration]);


    // --- Render ---

    return (
        <div className="flex flex-col h-full bg-[#1E1E1E] text-gray-300 select-none" dir="ltr">
            {/* Hidden Audio Element */}
            <audio ref={audioRef} className="hidden" onEnded={handlePlayNext} />

            {/* Toolbar */}
            <div className="h-12 bg-[#2A2A2A] border-b border-[#8E8D8D] flex items-center justify-between px-4 z-30 shadow-md">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-full" onClick={() => handleSeek(0)}>
                            <SkipBack size={24} />
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-12 w-12 p-0 rounded-full bg-[#F48969] hover:bg-[#E07858] text-white shadow-lg shadow-[#F48969]/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                            onClick={handlePlayPause}
                        >
                            {isPlaying ? (
                                <Pause size={28} fill="currentColor" className="text-white" />
                            ) : (
                                <Play size={28} fill="currentColor" className="ml-1 text-white" />
                            )}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-gray-300 hover:text-white hover:bg-white/10 rounded-full" onClick={() => handleSeek(totalDuration)}>
                            <SkipForward size={24} />
                        </Button>
                    </div>
                    <div className="bg-black/30 px-3 py-1 rounded text-xs font-mono text-[#F48969] border border-[#F48969]/20 shadow-inner">
                        {formatTimeFull(currentTime)}
                    </div>
                    {onGenerateAll && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-[#F48969] hover:text-[#F48969] hover:bg-[#F48969]/10"
                            onClick={onGenerateAll}
                            title="توليد الكل (Generate All)"
                        >
                            <Wand2 size={16} />
                            <span className="text-xs font-bold">توليد الكل</span>
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleZoom('out')}><ZoomOut size={14} /></Button>
                        <span className="text-xs w-12 text-center">{Math.round(zoomLevel)}%</span>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleZoom('in')}><ZoomIn size={14} /></Button>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                        <Settings size={18} />
                    </Button>
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

                        {/* Tracks */}
                        <div className="flex flex-col">
                            {tracks.map(track => (
                                <div key={track.id} className="h-20 border-b border-[#8E8D8D]/20 relative bg-[#2F2F2F] group">
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
                                                draggable={true}
                                                onDragStart={(e) => handleDragStart(e, item.blockId || item.id, track.type)}
                                                className={`absolute top-2 bottom-2 rounded-lg overflow-hidden transition-all border cursor-move ${isSelected ? 'border-[#F48969] ring-2 ring-[#F48969] z-10' : 'border-[#8E8D8D] hover:border-gray-400'
                                                    } ${track.type === 'voice' ? 'bg-[#706F6F]' :
                                                        track.type === 'image' ? 'bg-[#4A4A4A]' :
                                                            track.type === 'scene' ? 'bg-[#3D3D3D]' : 'bg-[#555555]'
                                                    } ${draggingItemId === (item.blockId || item.id) ? 'opacity-50' : ''}`}
                                                style={{ left: `${left}px`, width: `${width}px` }}
                                            >
                                                {/* Item Content */}
                                                <div className="h-full w-full relative">
                                                    {track.type === 'voice' ? (
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
                                                    ) : track.type === 'image' ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-black/20 overflow-hidden relative">
                                                            {item.audioUrl ? (
                                                                <>
                                                                    <img
                                                                        src={`/api/asset-proxy?url=${encodeURIComponent(item.audioUrl)}`}
                                                                        alt={item.content}
                                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                                        draggable={false}
                                                                    />
                                                                    <span className="absolute bottom-1 left-1 text-[10px] text-white/90 truncate bg-black/50 px-1 rounded max-w-full">{item.content}</span>
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
        </div>
    );
});

export default Timeline;