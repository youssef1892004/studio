
import React from 'react';
import {
    Play, Pause, ZoomIn, ZoomOut,
    Scissors, MousePointer2, Trash2,
    Undo2, Redo2, Layers, Plus,
    SkipBack, Settings
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface StudioToolbarProps {
    isPlaying: boolean;
    onPlayPause: () => void;
    onSeekStart: () => void;

    // Zoom
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;

    // Tools
    activeTool: 'select' | 'razor';
    onToolChange: (tool: 'select' | 'razor') => void;

    // Edit Actions
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onDelete: () => void;
    onSplit: () => void; // Trigger split action (if cursor is set)

    // Layers
    onAddLayer: () => void;

    // Time Display
    currentTime: number;
}

const formatTimeFull = (time: number) => {
    if (isNaN(time) || time < 0) return '00:00:00:00';
    const totalMilliseconds = Math.floor(time * 1000);
    const frames = Math.floor((totalMilliseconds % 1000) / 33);
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${seconds}:${frames.toString().padStart(2, '0')}`;
};

const StudioToolbar: React.FC<StudioToolbarProps> = ({
    isPlaying,
    onPlayPause,
    onSeekStart,
    zoomLevel,
    onZoomIn,
    onZoomOut,
    activeTool,
    onToolChange,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onDelete,
    onAddLayer,
    currentTime
}) => {
    return (
        <div className="h-12 bg-studio-bg dark:bg-[#151515] border-t border-b border-studio-border flex items-center justify-between px-4 z-30 select-none" dir="ltr">

            {/* Left: Edit Tools & History */}
            <div className="flex items-center gap-4">
                {/* History */}
                <div className="flex items-center gap-1">
                    <button onClick={onUndo} disabled={!canUndo} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30 transition-colors" title="Undo">
                        <Undo2 size={16} />
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30 transition-colors" title="Redo">
                        <Redo2 size={16} />
                    </button>
                </div>

                <div className="w-px h-6 bg-studio-border" />

                {/* Main Tools (Split / Select) */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onToolChange('select')}
                        className={`p-1.5 rounded-md transition-all flex items-center justify-center ${activeTool === 'select' || !activeTool ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Select Tool (V)"
                    >
                        <MousePointer2 size={18} />
                    </button>
                    <button
                        onClick={() => onToolChange('razor')}
                        className={`p-1.5 rounded-md transition-all flex items-center justify-center ${activeTool === 'razor' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Split Tool (C)"
                    >
                        <Scissors size={18} />
                    </button>
                    <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors flex items-center justify-center" title="Delete (Del)">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Center: Playback Controls */}
            <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
                <button
                    onClick={onSeekStart}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Go to Start"
                >
                    <SkipBack size={18} />
                </button>

                <button
                    onClick={onPlayPause}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                    {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>

                {/* Time Display */}
                <div className="bg-[#252525] px-2 py-1 rounded text-xs font-mono text-primary min-w-[80px] text-center tracking-widest border border-white/5">
                    {formatTimeFull(currentTime)}
                </div>
            </div>

            {/* Right: Zoom & Layers */}
            <div className="flex items-center gap-4">
                {/* Layer Tools */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onAddLayer}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
                        title="Add Layer"
                    >
                        <Layers size={14} />
                        <Plus size={10} />
                        <span>Add Track</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-studio-border" />

                <div className="flex items-center gap-1">
                    <button
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center justify-center"
                        onClick={onZoomOut}
                        title="Zoom Out"
                    >
                        <ZoomOut size={16} />
                    </button>
                    <span className="text-xs w-8 text-center text-gray-500 font-medium select-none">{Math.round(zoomLevel)}%</span>
                    <button
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center justify-center"
                        onClick={onZoomIn}
                        title="Zoom In"
                    >
                        <ZoomIn size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudioToolbar;
