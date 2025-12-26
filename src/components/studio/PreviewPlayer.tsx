import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Volume2 } from 'lucide-react';

interface PreviewPlayerProps {
    // Multi-layer support
    layers?: any[];
    activeId?: string | null;

    // Legacy/Single Item support
    activeMedia?: { id?: string; url: string; type: string; start: number; volume?: number; mediaStartOffset?: number } | null;

    isPlaying?: boolean;
    currentTime?: number;
    onPlayPause?: () => void;
    onSeek?: (time: number) => void;
    onVolumeChange?: (volume: number) => void;
    playbackRate?: number;
    activeTextItems?: { id: string; content: string; style: any }[];
    onTextUpdate?: (id: string, newStyle: any) => void;
    aspectRatio?: number;
    activeTransform?: { scale: number; x: number; y: number; rotation: number };
    onTransformUpdate?: (transform: { scale: number; x: number; y: number; rotation: number }) => void;
}

const MediaLayer: React.FC<{
    item: any;
    currentTime: number;
    isPlaying: boolean;
    playbackRate: number;
    onMouseDown: (e: React.MouseEvent) => void;
    isActive: boolean;
}> = ({ item, currentTime, isPlaying, playbackRate, onMouseDown, isActive }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Sync Logic for Video
    useEffect(() => {
        if (item.type === 'video' || item.type === 'scene') {
            const vid = videoRef.current;
            if (!vid) return;

            const offset = item.mediaStartOffset || 0;
            const targetTime = Math.max(0, currentTime - item.start + offset);

            if (Math.abs(vid.currentTime - targetTime) > 0.25) {
                vid.currentTime = targetTime;
            }

            if (isPlaying && vid.paused) vid.play().catch(() => { });
            else if (!isPlaying && !vid.paused) vid.pause();

            if (Math.abs(vid.playbackRate - playbackRate) > 0.01) {
                vid.playbackRate = playbackRate;
            }

            vid.volume = item.volume ?? 1;
        }
    }, [item, currentTime, isPlaying, playbackRate]);

    const style: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none'
    };

    const src = item.audioUrl || item.url || (item.source);
    const proxySrc = src ? `/api/asset-proxy?url=${encodeURIComponent(src)}` : '';

    if (item.type === 'video' || item.type === 'scene') {
        return (
            <video
                ref={videoRef}
                src={proxySrc}
                style={style}
                muted={false}
                playsInline
                preload="auto"
            />
        );
    }

    if (item.type === 'image') {
        return (
            <img
                src={proxySrc}
                alt="Layer"
                style={style}
                draggable={false}
            />
        );
    }

    return null;
};

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
    activeMedia,
    layers = [],
    activeId,
    isPlaying = false,
    currentTime = 0,
    onPlayPause,
    onSeek,
    onVolumeChange,
    playbackRate = 1,
    activeTextItems = [],
    onTextUpdate,
    aspectRatio = 16 / 9,
    activeTransform = { scale: 1, x: 0, y: 0, rotation: 0 },
    onTransformUpdate
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    // Backward compatibility: If no layers passed but activeMedia exists, create a temp layer
    const displayLayers = layers.length > 0 ? layers : (activeMedia ? [{
        ...activeMedia,
        id: activeMedia.id || 'temp',
        transform: activeTransform,
        opacity: 1,
        visible: true
    }] : []);

    const [dragState, setDragState] = useState<{
        type: 'pan' | 'resize' | null;
        startX: number;
        startY: number;
        startValX: number;
        startValY: number;
        startDist?: number;
    }>({ type: null, startX: 0, startY: 0, startValX: 0, startValY: 0 });

    const handleTextMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        setDraggingId(id);
    };

    const handleLayerMouseDown = (e: React.MouseEvent, layer: any) => {
        // Only drag if active
        if (activeId && layer.id !== activeId) return;

        if (e.button !== 0 || !onTransformUpdate) return;
        e.preventDefault();
        e.stopPropagation();

        const tf = layer.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
        // const op = layer.opacity ?? 1;

        setDragState({
            type: 'pan',
            startX: e.clientX,
            startY: e.clientY,
            startValX: tf.x,
            startValY: tf.y
        });
    };

    const handleResizeStart = (e: React.MouseEvent, layer: any) => {
        if (e.button !== 0 || !onTransformUpdate || !containerRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const tf = layer.transform || { x: 0, y: 0, scale: 1, rotation: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));

        setDragState({
            type: 'resize',
            startX: e.clientX,
            startY: e.clientY,
            startValX: tf.scale,
            startValY: 0,
            startDist: dist
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        if (draggingId && onTextUpdate) {
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const item = activeTextItems.find(i => i.id === draggingId);
            if (item) {
                onTextUpdate(draggingId, { ...item.style, xPosition: x, yPosition: y });
            }
            return;
        }

        if (!dragState.type || !onTransformUpdate) return;

        if (dragState.type === 'pan') {
            const dx = e.clientX - dragState.startX;
            const dy = e.clientY - dragState.startY;
            const dxPercent = (dx / rect.width) * 100;
            const dyPercent = (dy / rect.height) * 100;

            // Update Active Transform (passed to parent)
            onTransformUpdate({
                ...activeTransform, // Use activeTransform from props as base since we are editing Active Item
                x: dragState.startValX + dxPercent,
                y: dragState.startValY + dyPercent
            });
        }

        if (dragState.type === 'resize' && dragState.startDist) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const currentDist = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
            const scaleFactor = currentDist / dragState.startDist;
            const newScale = Math.max(0.1, Math.min(10, dragState.startValX * scaleFactor));

            onTransformUpdate({
                ...activeTransform,
                scale: newScale
            });
        }
    };

    const handleMouseUp = () => {
        setDraggingId(null);
        setDragState({ type: null, startX: 0, startY: 0, startValX: 0, startValY: 0 });
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!onTransformUpdate) return;
        e.stopPropagation();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, Math.min(5, activeTransform.scale + delta));
        onTransformUpdate({ ...activeTransform, scale: newScale });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className="flex-1 w-full bg-black/20 flex flex-col items-center justify-center relative p-4 min-h-[300px]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div
                ref={containerRef}
                className="w-full max-w-4xl bg-black rounded-lg shadow-2xl overflow-hidden relative flex items-center justify-center border border-border group select-none"
                style={{ aspectRatio: aspectRatio, maxHeight: '80vh' }}
                onWheel={handleWheel}
            >
                <div className="absolute inset-0 overflow-hidden">
                    {displayLayers.length > 0 ? (
                        displayLayers.map((layer, index) => {
                            const isActive = activeId && layer.id === activeId;
                            // Use activeTransform PROP if this is the active layer, otherwise use stored transform
                            const tf = isActive ? activeTransform : (layer.transform || { scale: 1, x: 0, y: 0, rotation: 0 });

                            const containerStyle: React.CSSProperties = {
                                transform: `translate(${tf.x}%, ${tf.y}%) scale(${tf.scale}) rotate(${tf.rotation}deg)`,
                                transformOrigin: 'center',
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: layer.opacity ?? 1,
                                visibility: (layer.visible === false) ? 'hidden' : 'visible',
                                zIndex: layer.layerIndex || (index + 10),
                                cursor: isActive ? (dragState.type === 'pan' ? 'grabbing' : 'grab') : 'default'
                            };

                            return (
                                <div
                                    key={layer.id || index}
                                    style={containerStyle}
                                    onMouseDown={(e) => isActive && handleLayerMouseDown(e, layer)}
                                >
                                    <MediaLayer
                                        item={layer}
                                        currentTime={currentTime}
                                        isPlaying={isPlaying}
                                        playbackRate={layer.playbackRate || playbackRate}
                                        onMouseDown={(e) => isActive && handleLayerMouseDown(e, layer)}
                                        isActive={!!isActive}
                                    />

                                    {/* Handles for Active Layer */}
                                    {isActive && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute inset-0 border-2 border-primary/70"></div>
                                            {['nw', 'ne', 'sw', 'se'].map((pos) => (
                                                <div
                                                    key={pos}
                                                    className={`absolute w-4 h-4 bg-white border-2 border-primary rounded-full hover:scale-125 transition-transform pointer-events-auto shadow-sm z-20`}
                                                    style={{
                                                        top: pos.includes('n') ? -8 : 'auto',
                                                        bottom: pos.includes('s') ? -8 : 'auto',
                                                        left: pos.includes('w') ? -8 : 'auto',
                                                        right: pos.includes('e') ? -8 : 'auto',
                                                        cursor: `${pos}-resize`,
                                                        transform: `scale(${1 / Math.max(0.1, tf.scale)})`
                                                    }}
                                                    onMouseDown={(e) => handleResizeStart(e, layer)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex items-center justify-center h-full pointer-events-none">
                            <div className="text-center opacity-50">
                                <Play className="w-12 h-12 mx-auto mb-2 text-primary" />
                                <p>No media selected</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Text Layer */}
                {activeTextItems?.map((text, idx) => (
                    <div
                        key={idx}
                        onMouseDown={(e) => handleTextMouseDown(e, text.id)}
                        style={{
                            position: 'absolute',
                            top: `${text.style?.yPosition ?? 50}%`,
                            left: `${text.style?.xPosition ?? 50}%`,
                            transform: 'translate(-50%, -50%)',
                            color: text.style?.color || 'white',
                            fontSize: `${(text.style?.fontSize || 24) * 1.5}px`,
                            fontWeight: text.style?.fontWeight || 'normal',
                            zIndex: 100 + idx,
                            cursor: 'move',
                            border: draggingId === text.id ? '1px dashed var(--primary)' : 'none',
                            padding: '4px',
                            userSelect: 'none'
                        }}
                    >
                        {text.content}
                    </div>
                ))}

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto z-[9999]">
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button onClick={() => onSeek?.(Math.max(0, currentTime - 5))}><SkipBack className="w-5 h-5" /></button>
                            <button onClick={onPlayPause}>
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </button>
                            <button onClick={() => onSeek?.(currentTime + 5)}><SkipForward className="w-5 h-5" /></button>
                            <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <input type="range" min="0" max="1" step="0.1"
                                value={activeMedia?.volume ?? 1}
                                onChange={e => onVolumeChange?.(parseFloat(e.target.value))}
                                className="w-20 h-1 accent-primary"
                            />
                            <button onClick={toggleFullscreen}><Maximize className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewPlayer;
