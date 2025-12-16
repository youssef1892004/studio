import React from 'react';
import { Trash2, Volume2, Gauge } from 'lucide-react';

interface PropertiesPanelProps {
    selectedItem: {
        id: string;
        type: 'video' | 'voice' | 'image' | 'text'; // Simplified type
        volume?: number;
        playbackRate?: number; // Though currently rate is global in Timeline, per-clip speed might be future. But layout request implies per-clip controls? 
        // Wait, current Timeline has GLOBAL playback rate. But user request implies properties for selected item.
        // If speed is global, it shouldn't be in properties of a clip? 
        // Or user wants per-clip speed? The prompt said "Speed Buttons (0.5x, 1x, 2x)".
        // If it's per-clip speed, I'd need to add `playbackRate` to TimelineItem.
        // BUT, for now let's assume global speed OR duplicate the toggle from toolbar to here?
        // The prompt said "Speed Buttons (0.5x, 1x, 2x)" in the properties panel.
        // Let's stick to what's possible now: Volume is per clip. Speed is currently global. 
        // I will put global speed here for now if no item selected? Or just put it here anyway.
        // Actually, if I look at the screenshot, "Speed" is next to volume.
        // I will implement it as global speed control for now, but placed in this panel.
        name?: string;
    } | null;
    currentGlobalSpeed: number;
    onUpdateVolume: (val: number) => void;
    onUpdateSpeed: (val: number) => void;
    onDelete: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem, currentGlobalSpeed, onUpdateVolume, onUpdateSpeed, onDelete }) => {

    // If no item selected, what to show? Maybe "Project Settings" or empty state.
    // For now, let's show "Project Properties" if nothing selected, or just empty.

    if (!selectedItem) {
        return (
            <div className="h-full w-full bg-[#1E1E1E] border-l border-[#333] p-4 flex flex-col items-center justify-center text-gray-500">
                <p>Select an item to edit</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#1E1E1E] border-l border-[#333] flex flex-col animate-in slide-in-from-right-5 duration-200">
            {/* Header */}
            <div className="h-12 border-b border-[#333] flex items-center px-4 justify-between">
                <h3 className="text-white font-medium text-sm">تعديل (Properties)</h3>
                <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded capitalize">{selectedItem.type}</span>
            </div>

            <div className="p-4 flex flex-col gap-6">

                {/* Volume Control */}
                {(selectedItem.type === 'video' || selectedItem.type === 'voice') && (
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Volume2 size={14} />
                                <span>مستوى الصوت (Volume)</span>
                            </div>
                            <span>{Math.round((selectedItem.volume ?? 1) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={selectedItem.volume ?? 1}
                            onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#F48969]"
                        />
                    </div>
                )}

                {/* Speed Control (Global for now, or per clip if supported later) */}
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <Gauge size={14} />
                            <span>السرعة (Speed)</span>
                        </div>
                    </div>
                    <div className="flex bg-[#333] rounded-lg p-1">
                        {[0.5, 1, 1.5, 2].map(rate => (
                            <button
                                key={rate}
                                onClick={() => onUpdateSpeed(rate)}
                                className={`flex-1 text-xs py-1.5 rounded transition-all ${currentGlobalSpeed === rate
                                        ? 'bg-[#F48969] text-white font-medium shadow-sm'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {rate}x
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-px bg-[#333] my-2" />

                {/* Actions */}
                <button
                    onClick={onDelete}
                    className="w-full py-2 flex items-center justify-center gap-2 text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                >
                    <Trash2 size={14} />
                    <span>حذف العنصر (Delete)</span>
                </button>

            </div>
        </div>
    );
};

export default PropertiesPanel;
