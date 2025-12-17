import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Volume2 } from 'lucide-react';

interface PreviewPlayerProps {
    activeMedia?: { id?: string; url: string; type: string; start: number; volume?: number; mediaStartOffset?: number } | null;
    isPlaying?: boolean;
    currentTime?: number;
    onPlayPause?: () => void;
    onSeek?: (time: number) => void;
    onSeek?: (time: number) => void;
    onVolumeChange?: (volume: number) => void;
    playbackRate?: number;
    activeTextItems?: { id: string; content: string; style: any }[];
    onTextUpdate?: (id: string, newStyle: any) => void;
}

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ activeMedia, isPlaying = false, currentTime = 0, onPlayPause, onSeek, onVolumeChange, playbackRate = 1, activeTextItems = [], onTextUpdate }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const handleTextMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingId || !containerRef.current || !onTextUpdate) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const item = activeTextItems.find(i => i.id === draggingId);
        if (item) {
            onTextUpdate(draggingId, { ...item.style, xPosition: x, yPosition: y });
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };


    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Sync video player
    useEffect(() => {
        if (activeMedia?.type === 'video' && videoRef.current) {
            const vid = videoRef.current;
            // Calculate local time within the clip (timeline time - clip start + clip internal offset)
            const offset = activeMedia.mediaStartOffset || 0;
            const targetTime = Math.max(0, currentTime - activeMedia.start + offset);

            // Sync play state
            if (isPlaying && vid.paused) {
                vid.play().catch(e => {
                    // Autoplay policy might block unmuted
                    console.warn("Autoplay blocked", e);
                });
            } else if (!isPlaying && !vid.paused) {
                vid.pause();
            }

            // Sync time if drift > 0.2s (allow some rubber banding)
            // Or if we just seeked (large jump)
            if (Math.abs(vid.currentTime - targetTime) > 0.2) {
                vid.currentTime = targetTime;
            }

            // Sync Volume
            if (activeMedia.volume !== undefined) {
                vid.volume = activeMedia.volume;
            } else {
                vid.volume = 1;
            }

            // Sync Speed
            if (activeMedia?.type === 'video' && Math.abs(vid.playbackRate - playbackRate) > 0.01) {
                vid.playbackRate = playbackRate;
            }
        }
    }, [activeMedia, isPlaying, currentTime, playbackRate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="flex-1 bg-black/20 flex flex-col items-center justify-center relative p-4 min-h-[300px]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Main Preview Area */}
            <div ref={containerRef} className="w-full h-full max-w-4xl bg-studio-panel dark:bg-studio-panel rounded-lg shadow-2xl overflow-hidden relative aspect-video flex items-center justify-center border border-studio-border dark:border-studio-border group">
                {/* Media Preview */}
                {activeMedia ? (
                    activeMedia.type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={`/api/asset-proxy?url=${encodeURIComponent(activeMedia.url)}`}
                            className="w-full h-full object-contain bg-black"
                            muted={false} // Enable audio mixing
                            playsInline
                            preload="auto"
                        />
                    ) : (
                        <img
                            src={`/api/asset-proxy?url=${encodeURIComponent(activeMedia.url)}`}
                            alt="Preview"
                            className="w-full h-full object-contain bg-black"
                        />
                    )
                ) : (
                    /* Placeholder Content */
                    <div className="text-center">
                        <div className="w-16 h-16 bg-studio-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play className="w-8 h-8 text-studio-accent fill-current ml-1" />
                        </div>
                        <p className="text-studio-text-light dark:text-studio-text opacity-50">No preview available</p>
                    </div>
                )}

                {/* Text Layer */}
                {activeTextItems?.map((text, idx) => (
                    <div
                        key={idx}
                        onMouseDown={(e) => handleTextMouseDown(e, text.id)}
                        style={{
                            position: 'absolute',
                            top: `${text.style?.yPosition !== undefined ? text.style.yPosition : 50}%`,
                            left: `${text.style?.xPosition !== undefined ? text.style.xPosition : 50}%`,
                            transform: 'translate(-50%, -50%)',
                            color: text.style?.color || 'white',
                            fontSize: `${(text.style?.fontSize || 24) * 1.5}px`,
                            fontWeight: text.style?.fontWeight || 'normal',
                            textAlign: text.style?.textAlign || 'center',
                            fontFamily: text.style?.fontFamily || 'sans-serif',
                            zIndex: 30,
                            cursor: 'move',
                            pointerEvents: 'auto', // Enable interaction
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            whiteSpace: 'pre-wrap',
                            border: draggingId === text.id ? '1px dashed #F48969' : 'none',
                            padding: '4px'
                        }}
                    >
                        {text.content}
                    </div>
                ))}

                {/* Overlay Controls (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto z-10">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button className="hover:text-studio-accent transition-colors" onClick={() => onSeek?.(Math.max(0, currentTime - 5))}><SkipBack className="w-5 h-5" /></button>
                            <button className="hover:text-studio-accent transition-colors" onClick={onPlayPause}>
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                            <button className="hover:text-studio-accent transition-colors" onClick={() => onSeek?.(currentTime + 5)}><SkipForward className="w-5 h-5" /></button>
                            <span className="text-xs font-mono opacity-80">{formatTime(currentTime)} / 00:00</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={activeMedia?.volume ?? 1}
                                    onChange={(e) => onVolumeChange?.(parseFloat(e.target.value))}
                                    className="w-20 h-1 accent-studio-accent bg-white/30 rounded-lg cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                            <button className="hover:text-studio-accent transition-colors" onClick={toggleFullscreen}><Maximize className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewPlayer;
