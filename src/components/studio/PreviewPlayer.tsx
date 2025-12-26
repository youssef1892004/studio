import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Volume2, Move } from 'lucide-react';
import Moveable from 'react-moveable';

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
    activeTextItems?: { id: string; content: string; style: any; animation?: any; start?: number; duration?: number }[];
    onTextUpdate?: (id: string, newStyle: any) => void;
    aspectRatio?: number;
    activeTransform?: { scale: number; x: number; y: number; rotation: number };
    onTransformUpdate?: (transform: { scale: number; x: number; y: number; rotation: number }) => void;
    onEditItem?: (id: string, type: 'text' | 'media') => void;
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
    onTransformUpdate,
    onEditItem
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const moveableRef = useRef<any>(null); // Ref for Moveable to force updateRect
    const [target, setTarget] = useState<HTMLElement | SVGElement | null>(null);

    // Backward compatibility: If no layers passed but activeMedia exists, create a temp layer
    const displayLayers = layers.length > 0 ? layers : (activeMedia ? [{
        ...activeMedia,
        id: activeMedia.id || 'temp',
        transform: activeTransform,
        opacity: 1,
        visible: true
    }] : []);

    useEffect(() => {
        if (activeId) {
            // Give React time to render the ID
            setTimeout(() => {
                const el = document.getElementById(`layer-${activeId}`);
                setTarget(el);
            }, 0);
        } else {
            setTarget(null);
        }
    }, [activeId, displayLayers, activeTextItems]);

    // Force Moveable to recalculate rect when items change (especially texts)
    useEffect(() => {
        if (moveableRef.current) {
            setTimeout(() => {
                moveableRef.current.updateRect();
            }, 50); // Small delay to allow DOM to settle
        }
    }, [activeTextItems, activeTransform, activeId]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
        else document.exitFullscreen();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!onTransformUpdate) return;
        e.stopPropagation();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, Math.min(5, activeTransform.scale + delta));
        onTransformUpdate({ ...activeTransform, scale: newScale });
    };

    return (
        <div className="flex-1 w-full bg-black/20 flex flex-col items-center justify-center relative p-4 min-h-[300px]">
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
                                cursor: 'default'
                            };

                            return (
                                <div
                                    key={layer.id || index}
                                    id={`layer-${layer.id}`}
                                    style={containerStyle}
                                    onMouseDown={(e) => {
                                        // Allow selection on click
                                        e.stopPropagation();
                                        onEditItem?.(layer.id, layer.type || 'media');
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        onEditItem?.(layer.id, layer.type || 'media');
                                    }}
                                >
                                    <MediaLayer
                                        item={layer}
                                        currentTime={currentTime}
                                        isPlaying={isPlaying}
                                        playbackRate={layer.playbackRate || playbackRate}
                                        onMouseDown={() => { }}
                                        isActive={!!isActive}
                                    />
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
                {activeTextItems?.map((text, idx) => {
                    const getAnimationStyle = () => {
                        if (!text.animation || !text.start || !text.duration) return {};
                        const localTime = currentTime - text.start;
                        const { in: animIn, out: animOut } = text.animation;
                        let transform = '';
                        let opacity = 1;

                        if (animIn && animIn.type !== 'none') {
                            const duration = animIn.duration || 0.5;
                            if (localTime < duration) {
                                const t = Math.max(0, Math.min(1, localTime / duration));
                                const eased = 1 - (1 - t) * (1 - t);
                                if (animIn.type === 'fade') opacity = eased;
                                else if (animIn.type === 'slide') {
                                    const offset = 50 * (1 - eased);
                                    if (animIn.direction === 'up') transform += ` translateY(${offset}px)`;
                                    if (animIn.direction === 'down') transform += ` translateY(-${offset}px)`;
                                    if (animIn.direction === 'left') transform += ` translateX(${offset}px)`;
                                    if (animIn.direction === 'right') transform += ` translateX(-${offset}px)`;
                                    opacity = eased;
                                } else if (animIn.type === 'scale') { transform += ` scale(${eased})`; opacity = eased; }
                                else if (animIn.type === 'pop') {
                                    const pop = t < 0.8 ? t * 1.1 : 1.1 - (t - 0.8) * 0.5;
                                    transform += ` scale(${pop})`; opacity = eased;
                                }
                            }
                        }
                        if (animOut && animOut.type !== 'none') {
                            const duration = animOut.duration || 0.5;
                            const endTime = text.duration;
                            if (localTime > endTime - duration) {
                                const t = Math.max(0, Math.min(1, (localTime - (endTime - duration)) / duration));
                                const eased = t * t;
                                if (animOut.type === 'fade') opacity = 1 - eased;
                                else if (animOut.type === 'slide') {
                                    const offset = 50 * eased;
                                    if (animOut.direction === 'up') transform += ` translateY(-${offset}px)`;
                                    if (animOut.direction === 'down') transform += ` translateY(${offset}px)`;
                                    if (animOut.direction === 'left') transform += ` translateX(-${offset}px)`;
                                    if (animOut.direction === 'right') transform += ` translateX(${offset}px)`;
                                    opacity = 1 - eased;
                                } else if (animOut.type === 'scale') { transform += ` scale(${1 - eased})`; opacity = 1 - eased; }
                                else if (animOut.type === 'pop') { transform += ` scale(${1 + eased * 0.2})`; opacity = 1 - eased; }
                            }
                        }
                        return { opacity, transform };
                    };
                    const animStyle = getAnimationStyle();

                    return (
                        <div
                            key={idx}
                            id={`layer-${text.id}`}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                onEditItem?.(text.id, 'text');
                            }}
                            style={{
                                position: 'absolute',
                                top: `${text.style?.yPosition ?? 50}%`,
                                left: `${text.style?.xPosition ?? 50}%`,
                                transform: `translate(-50%, -50%) ${animStyle.transform || ''}`,
                                opacity: animStyle.opacity !== undefined ? animStyle.opacity : 1,
                                color: text.style?.color || 'white',
                                fontSize: `${(text.style?.fontSize || 24) * 1.5}px`,
                                fontWeight: text.style?.fontWeight || 'normal',
                                zIndex: 100 + idx,
                                cursor: 'default',
                                border: 'none',
                                padding: '4px',
                                userSelect: 'none',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {text.content}
                        </div>
                    );
                })}

                {/* Moveable Control for Text, Image, and Video */}
                <Moveable
                    ref={moveableRef}
                    target={target}
                    draggable={!!activeId}
                    resizable={!!activeId}
                    rotatable={!!activeId}
                    throttleDrag={0}
                    throttleResize={0}
                    throttleRotate={0}
                    keepRatio={true}
                    renderDirections={["nw", "ne", "sw", "se"]}
                    padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
                    origin={false}
                    onDragStart={() => {
                        if (isPlaying) onPlayPause?.();
                    }}
                    onDrag={({ target, beforeTranslate }) => {
                        if (!activeId || !containerRef.current) return;

                        const isText = activeTextItems.some(t => t.id === activeId);

                        if (isText) {
                            // Text uses generic transform logic in this viewer for drag visual
                            target!.style.transform = `translate(-50%, -50%) translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${activeTransform.rotation}deg) scale(${activeTransform.scale})`;
                        } else {
                            // Video/Image Optimistic Update (Visual Only)
                            // We don't want to commit until DragEnd to avoid performance hit on React State?
                            // But we need live preview.
                            // Since we map back to % on DragEnd, we can just move the element visually here?
                            // Actually, let's try to update state only on DragEnd for performance, 
                            // BUT we need visual feedback.
                            // Moveable manages target.style.transform automatically if we don't interfere?
                            // No, we must apply it.
                            target!.style.transform = `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) rotate(${activeTransform.rotation}deg) scale(${activeTransform.scale})`;
                        }
                    }}
                    onDragEnd={({ lastEvent, target }) => {
                        if (!lastEvent || !containerRef.current || !activeId) return;

                        const isText = activeTextItems.some(t => t.id === activeId);
                        const rect = containerRef.current.getBoundingClientRect();
                        const [tx, ty] = lastEvent.beforeTranslate;

                        // Convert px delta to % delta
                        const dxPercent = (tx / rect.width) * 100;
                        const dyPercent = (ty / rect.height) * 100;

                        if (isText && onTextUpdate) {
                            const textItem = activeTextItems.find(t => t.id === activeId);
                            if (textItem) {
                                const currentX = textItem.style?.xPosition ?? 50;
                                const currentY = textItem.style?.yPosition ?? 50;

                                const newX = currentX + dxPercent;
                                const newY = currentY + dyPercent;

                                // Optimistic
                                if (target) {
                                    target.style.left = `${newX}%`;
                                    target.style.top = `${newY}%`;
                                    target.style.transform = `translate(-50%, -50%) rotate(${activeTransform.rotation}deg) scale(${activeTransform.scale})`;
                                }

                                onTextUpdate(activeId, {
                                    ...textItem.style,
                                    xPosition: newX,
                                    yPosition: newY
                                });
                            }
                        } else if (onTransformUpdate && activeTransform) {
                            // Media (Video/Image)
                            onTransformUpdate({
                                ...activeTransform,
                                x: activeTransform.x + dxPercent,
                                y: activeTransform.y + dyPercent
                            });

                            // Reset transform style as React will re-render with new Top/Left/Transform
                            if (target) {
                                target.style.transform = '';
                                // Actually better to let React handle it or set to identity?
                                // Our render logic sets transform style.
                            }
                        }
                    }}
                    onScaleStart={() => {
                        if (isPlaying) onPlayPause?.();
                    }}
                    onScale={({ target, drag }) => {
                        target!.style.transform = drag.transform;
                    }}
                    onScaleEnd={({ lastEvent, target }) => {
                        if (!lastEvent || !target || !activeId) return;
                        const isText = activeTextItems.some(t => t.id === activeId);
                        const scaleFactor = lastEvent.scale[0];

                        if (isText && onTextUpdate) {
                            const textItem = activeTextItems.find(t => t.id === activeId);
                            if (textItem) {
                                const currentSize = textItem.style?.fontSize || 24;
                                const newSize = currentSize * scaleFactor;

                                if (target) {
                                    target.style.fontSize = `${newSize * 1.5}px`;
                                    target.style.transform = "translate(-50%, -50%)";
                                }
                                onTextUpdate(activeId, { ...textItem.style, fontSize: newSize });
                            }
                        } else if (onTransformUpdate && activeTransform) {
                            onTransformUpdate({
                                ...activeTransform,
                                scale: lastEvent.scale[0]
                            });
                        }
                    }}
                    onRotateStart={() => {
                        if (isPlaying) onPlayPause?.();
                    }}
                    onRotate={({ target, drag }) => {
                        target!.style.transform = drag.transform;
                    }}
                    onRotateEnd={({ lastEvent }) => {
                        if (!lastEvent || !activeId) return;
                        const isText = activeTextItems.some(t => t.id === activeId);

                        // Text Rotation not supported in Data Model yet? 
                        // Actually Text Item has no rotation prop in `textStyle` usually? 
                        // Checked `TimelineItem`: `transform` is on the Item. 
                        // But Text handles styles via `textStyle`.
                        // Let's assume generic transform update should handle text rotation if feasible, 
                        // but currently Text uses `textStyle` which has no rotation.
                        // So exclude Text from rotation update for now until Phase 5?

                        if (!isText && onTransformUpdate && activeTransform) {
                            onTransformUpdate({
                                ...activeTransform,
                                rotation: lastEvent.rotation
                            });
                        }
                    }}
                />

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
