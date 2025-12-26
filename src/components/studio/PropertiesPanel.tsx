import React from 'react';
import { Trash2, Volume2, Gauge, Maximize2, RotateCcw, Eye, EyeOff, Type, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Check } from 'lucide-react';
import { TEXT_PRESETS, TEXT_COLORS } from '@/lib/constants';

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
    onApplyPreset?: (preset: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedItem, currentGlobalSpeed, onUpdateVolume, onUpdateSpeed, onDelete, onUpdateText, onUpdateTransform, onUpdateOpacity, onUpdateVisibility, onApplyPreset }) => {

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

                {/* Text Controls - Enhanced (Phase 4.5) */}
                {selectedItem.type === 'text' && onUpdateText && (
                    <div className="flex flex-col gap-6">
                        {/* Section 1: Presets Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-400">Presets</label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.keys(TEXT_PRESETS).map((key) => (
                                    <button
                                        key={key}
                                        onClick={() => onApplyPreset?.(key)}
                                        className="px-3 py-2 bg-[#2A2A2A] hover:bg-[#333] border border-[#3A3A3A] rounded text-sm font-medium capitalize transition-colors text-left text-gray-200"
                                    >
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-gray-400">Content</span>
                            <textarea
                                value={selectedItem.content || ''}
                                onChange={(e) => onUpdateText(e.target.value, selectedItem.textStyle)}
                                className="w-full bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:border-primary"
                                rows={2}
                            />
                        </div>

                        {/* Typography Section */}
                        <div className="space-y-4 border-t border-[#333] pt-4">
                            <label className="text-xs font-medium text-gray-400">Typography</label>

                            {/* Font Size */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Size</span>
                                    <span className="text-gray-200">{selectedItem.textStyle?.fontSize || 24}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="12"
                                    max="120"
                                    step="1"
                                    value={selectedItem.textStyle?.fontSize || 24}
                                    onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, fontSize: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>

                            {/* Font Weight */}
                            <div className="space-y-1">
                                <span className="text-xs text-gray-400">Weight</span>
                                <div className="flex bg-[#333] rounded-lg p-1 gap-1">
                                    {['normal', 'bold'].map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, fontWeight: w })}
                                            className={`flex-1 py-1.5 text-xs rounded-md transition-all ${selectedItem.textStyle?.fontWeight === w ? 'bg-primary text-white font-bold shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            {w === 'normal' ? 'Reg' : 'Bold'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Alignment */}
                            <div className="space-y-1">
                                <span className="text-xs text-gray-400">Align</span>
                                <div className="flex bg-[#333] rounded-lg p-1 gap-1">
                                    {[
                                        { val: 'left', icon: <AlignLeft size={14} /> },
                                        { val: 'center', icon: <AlignCenter size={14} /> },
                                        { val: 'right', icon: <AlignRight size={14} /> }
                                    ].map((opt) => (
                                        <button
                                            key={opt.val}
                                            onClick={() => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, textAlign: opt.val })}
                                            className={`flex-1 py-1.5 flex justify-center items-center rounded-md transition-all ${selectedItem.textStyle?.textAlign === opt.val ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            {opt.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Palette */}
                            <div className="space-y-2">
                                <span className="text-xs text-gray-400">Color</span>
                                <div className="flex flex-wrap gap-2">
                                    {TEXT_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, color })}
                                            className={`w-6 h-6 rounded-full border border-white/10 relative transition-transform hover:scale-110 ${selectedItem.textStyle?.color === color ? 'ring-2 ring-primary ring-offset-1 ring-offset-[#1E1E1E]' : ''}`}
                                            style={{ backgroundColor: color }}
                                        >
                                            {selectedItem.textStyle?.color === color && (
                                                <Check size={12} className="absolute inset-0 m-auto text-black/50 drop-shadow-sm" />
                                            )}
                                        </button>
                                    ))}
                                    {/* Custom Color Picker */}
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform cursor-pointer">
                                        <input
                                            type="color"
                                            value={selectedItem.textStyle?.color || '#ffffff'}
                                            onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, color: e.target.value })}
                                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 m-0 cursor-pointer border-none"
                                            title="Custom Color"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-gradient-to-br from-red-500 via-green-500 to-blue-500 opacity-80" />
                                    </div>
                                </div>
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

                {/* Speed Control (Hidden for Text) */}
                {selectedItem.type !== 'text' && (
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
                )}

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
