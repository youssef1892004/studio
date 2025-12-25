import React from 'react';
import { Trash2, Volume2, Gauge, Maximize2, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface PropertiesPanelProps {
    selectedItem: {
        id: string;
        type: 'video' | 'voice' | 'image' | 'text'; // Simplified type
        volume?: number;
        playbackRate?: number;
        name?: string;
        content?: string;
        textStyle?: any;
        transform?: { scale: number; x: number; y: number; rotation: number };
        opacity?: number;
        visible?: boolean;
    } | null;
    currentGlobalSpeed: number;
    onUpdateVolume: (val: number) => void;
    onUpdateSpeed: (val: number) => void;
    onDelete: () => void;
    onUpdateText?: (content: string, style: any) => void;
    onUpdateTransform?: (transform: { scale: number; x: number; y: number; rotation: number }) => void;
    onUpdateOpacity?: (val: number) => void;
    onUpdateVisibility?: (visible: boolean) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem, currentGlobalSpeed, onUpdateVolume, onUpdateSpeed, onDelete, onUpdateText, onUpdateTransform, onUpdateOpacity, onUpdateVisibility }) => {

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
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded capitalize">{selectedItem.type}</span>
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
                            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                )}

                {/* Text Controls */}
                {selectedItem.type === 'text' && onUpdateText && (
                    <div className="flex flex-col gap-4">
                        {/* Content */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-gray-400">Content</span>
                            <textarea
                                value={selectedItem.content || ''}
                                onChange={(e) => onUpdateText(e.target.value, selectedItem.textStyle)}
                                className="w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:border-primary"
                                rows={3}
                            />
                        </div>

                        {/* Font Size */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Font Size</span>
                                <span>{selectedItem.textStyle?.fontSize || 24}px</span>
                            </div>
                            <input
                                type="range"
                                min="12"
                                max="120"
                                value={selectedItem.textStyle?.fontSize || 24}
                                onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, fontSize: parseInt(e.target.value) })}
                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Color & Position */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-400">Color</span>
                                <input
                                    type="color"
                                    value={selectedItem.textStyle?.color || '#ffffff'}
                                    onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, color: e.target.value })}
                                    className="w-full h-8 bg-transparent cursor-pointer rounded overflow-hidden"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-400">X ({selectedItem.textStyle?.xPosition !== undefined ? Math.round(selectedItem.textStyle.xPosition) : 50}%)</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={selectedItem.textStyle?.xPosition !== undefined ? selectedItem.textStyle.xPosition : 50}
                                    onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, xPosition: parseInt(e.target.value) })}
                                    className="w-full h-8 bg-transparent cursor-pointer accent-primary"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-400">Y ({selectedItem.textStyle?.yPosition !== undefined ? Math.round(selectedItem.textStyle.yPosition) : 50}%)</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={selectedItem.textStyle?.yPosition || 50}
                                    onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, yPosition: parseInt(e.target.value) })}
                                    className="w-full h-8 bg-transparent cursor-pointer accent-primary"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Visual Transform Controls */}
                {(selectedItem.type === 'video' || selectedItem.type === 'image') && onUpdateTransform && (
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Maximize2 size={14} />
                                <span>التحجيم (Scale & Position)</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onUpdateTransform({ scale: 1, x: 0, y: 0, rotation: 0 })}
                                    className="p-1 hover:bg-white/10 rounded text-xs"
                                    title="Reset"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Scale Slider */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">Scale ({Math.round((selectedItem.transform?.scale || 1) * 100)}%)</span>
                            <input
                                type="range"
                                min="0.1"
                                max="5"
                                step="0.1"
                                value={selectedItem.transform?.scale || 1}
                                onChange={(e) => onUpdateTransform({ ...(selectedItem.transform || { x: 0, y: 0, rotation: 0 }), scale: parseFloat(e.target.value) })}
                                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Opacity Control */}
                        {onUpdateOpacity && (
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500 flex justify-between">
                                    <span>Opacity</span>
                                    <span>{Math.round((selectedItem.opacity ?? 1) * 100)}%</span>
                                </span>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={selectedItem.opacity ?? 1}
                                    onChange={(e) => onUpdateOpacity(parseFloat(e.target.value))}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        )}

                        {/* Visibility Control */}
                        {onUpdateVisibility && (
                            <div className="flex flex-col gap-1 mt-2">
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Visibility</span>
                                    <button
                                        onClick={() => onUpdateVisibility(!(selectedItem.visible ?? true))}
                                        className={`p-1 rounded ${selectedItem.visible !== false ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {selectedItem.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Speed Control */}
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
                                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
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
                    className="w-full py-2 flex items-center justify-center gap-2 text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 rounded-lg transition-colors text-sm"
                >
                    <Trash2 size={14} />
                    <span>حذف العنصر (Delete)</span>
                </button>

            </div>
        </div>
    );
};

export default PropertiesPanel;
