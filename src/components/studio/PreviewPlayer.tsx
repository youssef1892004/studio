import React, { useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Volume2 } from 'lucide-react';

interface PreviewPlayerProps {
    activeMedia?: { url: string; type: string; start: number; volume?: number } | null;
    isPlaying?: boolean;
    currentTime?: number;
    onPlayPause?: () => void;
    onSeek?: (time: number) => void;
    playbackRate?: number;
}

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ activeMedia, isPlaying = false, currentTime = 0, onPlayPause, onSeek, playbackRate = 1 }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Sync video player
    useEffect(() => {
        if (activeMedia?.type === 'video' && videoRef.current) {
            const vid = videoRef.current;
            // Calculate local time within the clip
            const targetTime = Math.max(0, currentTime - activeMedia.start);

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
        <div className="flex-1 bg-black/20 flex flex-col items-center justify-center relative p-4 min-h-[300px]">
            {/* Main Preview Area */}
            <div className="w-full h-full max-w-4xl bg-studio-panel dark:bg-studio-panel rounded-lg shadow-2xl overflow-hidden relative aspect-video flex items-center justify-center border border-studio-border dark:border-studio-border">
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

                {/* Overlay Controls (Bottom) */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-auto z-10">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button className="hover:text-studio-accent transition-colors"><SkipBack className="w-5 h-5" /></button>
                            <button className="hover:text-studio-accent transition-colors" onClick={onPlayPause}>
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                            <button className="hover:text-studio-accent transition-colors"><SkipForward className="w-5 h-5" /></button>
                            <span className="text-xs font-mono opacity-80">{formatTime(currentTime)} / 00:00</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4" />
                                <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div className="w-2/3 h-full bg-studio-accent"></div>
                                </div>
                            </div>
                            <button className="hover:text-studio-accent transition-colors"><Maximize className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewPlayer;
