import React, { useState, useEffect } from 'react';
import { Trash2, Volume2, Gauge, Maximize2, RotateCcw, Eye, EyeOff, Type, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Check, Sparkles, MousePointerClick } from 'lucide-react';
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
        animation?: { // Added for Phase 5
            in?: any;
            out?: any;
        };
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
    onUpdateAnimation?: (animationArg: { in?: any; out?: any }) => void;
}

// Helper Accordion Component
const AccordionItem = ({ title, isOpen, onToggle, children, icon: Icon }: any) => (
    <div className="border-b border-[#333]/50 last:border-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-3 px-1 hover:bg-white/5 transition-colors rounded-sm"
        >
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-200 uppercase tracking-wider">
                {Icon && <Icon size={14} className="text-gray-400 group-hover:text-primary transition-colors" />}
                <span>{title}</span>
            </div>
            <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-500">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </button>
        {isOpen && (
            <div className="pb-4 pt-2 px-1 animate-in slide-in-from-top-1 duration-200">
                {children}
            </div>
        )}
    </div>
);

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedItem, currentGlobalSpeed, onUpdateVolume, onUpdateSpeed, onDelete,
    onUpdateText, onUpdateTransform, onUpdateOpacity, onUpdateVisibility,
    onApplyPreset, onUpdateAnimation
}) => {

    // Internal state
    const [animationTab, setAnimationTab] = React.useState<'in' | 'out'>('in');

    // Accordion State
    const [openSections, setOpenSections] = React.useState<string[]>(['content', 'typography', 'transform', 'adjustments']);

    const toggleSection = (section: string) => {
        setOpenSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    // --- CASE 1: EMPTY STATE (Inspector Mode) ---
    // Focus Handler for Double Click
    useEffect(() => {
        const handleFocus = () => {
            const input = document.getElementById('properties-text-editor');
            if (input) {
                input.focus();
                (input as HTMLTextAreaElement).select();
                // Ensure the accordion section is open
                if (!openSections.includes('content')) {
                    setOpenSections(prev => [...prev, 'content']);
                }
            }
        };
        window.addEventListener('studio:focus-text', handleFocus);
        return () => window.removeEventListener('studio:focus-text', handleFocus);
    }, [openSections]);

    if (!selectedItem) {
        return (
            <div className="h-full w-full bg-[#1E1E1E] border-l border-[#333] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-[#2A2A2A] flex items-center justify-center mb-4">
                    <MousePointerClick size={24} className="text-gray-500" />
                </div>
                <h3 className="text-gray-300 font-medium text-sm mb-2">No Selection</h3>
                <p className="text-xs text-gray-600 max-w-[200px]">
                    Select an item on the timeline or canvas to edit its properties.
                </p>
            </div>
        );
    }

    // --- CASE 2: EDIT MODE (Contextual) ---
    return (
        <div className="h-full w-full bg-[#1E1E1E] border-l border-[#333] flex flex-col animate-in slide-in-from-right-5 duration-200">
            {/* Header */}
            <div className="h-12 border-b border-[#333] flex items-center px-4 justify-between bg-[#252525]">
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                    {selectedItem.type === 'text' ? <Type size={14} className="text-primary" /> : <Maximize2 size={14} className="text-blue-500" />}
                    Editor
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-[#333] px-2 py-0.5 rounded">{selectedItem.type}</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col">

                {/* --- MEDIA TYPE SPECIFIC CONTROLS --- */}

                {/* 1. TEXT CONTROLS */}
                {selectedItem.type === 'text' && onUpdateText && (
                    <>
                        {/* Content Group */}
                        <AccordionItem
                            title="Content"
                            isOpen={openSections.includes('content')}
                            onToggle={() => toggleSection('content')}
                            icon={Type}
                        >
                            <div className="space-y-3">
                                <textarea
                                    id="properties-text-editor"
                                    value={selectedItem.content || ''}
                                    onChange={(e) => onUpdateText(e.target.value, selectedItem.textStyle)}
                                    className="w-full bg-[#1E1E1E] border border-[#333] rounded-lg p-3 text-sm text-gray-100 focus:outline-none focus:border-primary resize-none"
                                    rows={3}
                                    placeholder="Enter text..."
                                />
                            </div>
                        </AccordionItem>

                        {/* Typography Group */}
                        <AccordionItem
                            title="Typography"
                            isOpen={openSections.includes('typography')}
                            onToggle={() => toggleSection('typography')}
                            icon={Heading1}
                        >
                            {/* ... Existing Typography Controls ... */}
                            <div className="space-y-4">
                                {/* Size */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Size</span>
                                        <span>{selectedItem.textStyle?.fontSize || 24}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="12"
                                        max="120"
                                        value={selectedItem.textStyle?.fontSize || 24}
                                        onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, fontSize: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                {/* Weight & Align Row */}
                                <div className="flex gap-2">
                                    {/* Weight */}
                                    <div className="flex-1 bg-[#1E1E1E] rounded-lg p-1 flex">
                                        {['normal', 'bold'].map((w) => (
                                            <button
                                                key={w}
                                                onClick={() => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, fontWeight: w })}
                                                className={`flex-1 py-1.5 text-[10px] uppercase rounded-md transition-all ${selectedItem.textStyle?.fontWeight === w ? 'bg-primary text-white font-bold' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {w === 'normal' ? 'Reg' : 'Bold'}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Align */}
                                    <div className="flex-1 bg-[#1E1E1E] rounded-lg p-1 flex">
                                        {[
                                            { val: 'left', icon: <AlignLeft size={14} /> },
                                            { val: 'center', icon: <AlignCenter size={14} /> },
                                            { val: 'right', icon: <AlignRight size={14} /> }
                                        ].map((opt) => (
                                            <button
                                                key={opt.val}
                                                onClick={() => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, textAlign: opt.val })}
                                                className={`flex-1 flex justify-center items-center rounded-md transition-all ${selectedItem.textStyle?.textAlign === opt.val ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {opt.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <span className="text-xs text-gray-400">Color</span>
                                    <div className="flex flex-wrap gap-2">
                                        {TEXT_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, color })}
                                                className={`w-5 h-5 rounded-full border border-white/10 ${selectedItem.textStyle?.color === color ? 'ring-2 ring-primary ring-offset-1 ring-offset-[#2A2A2A]' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/10 cursor-pointer">
                                            <input
                                                type="color"
                                                value={selectedItem.textStyle?.color || '#ffffff'}
                                                onChange={(e) => onUpdateText(selectedItem.content!, { ...selectedItem.textStyle, color: e.target.value })}
                                                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 opacity-0 cursor-pointer"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionItem>

                        {/* Animation Group (New) */}
                        {onUpdateAnimation && (
                            <AccordionItem
                                title="Animations"
                                isOpen={openSections.includes('animation')}
                                onToggle={() => toggleSection('animation')}
                                icon={Sparkles} // Assuming Lucide icon
                            >
                                <div className="space-y-4">
                                    <div className="flex bg-[#1E1E1E] rounded-lg p-1">
                                        {(['in', 'out'] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setAnimationTab(tab)}
                                                className={`flex-1 py-1.5 text-xs rounded-md transition-all capitalize ${animationTab === tab ? 'bg-primary text-white font-medium' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Animation Controls (Reuse logic) */}
                                    <div className="space-y-3">
                                        {/* Type */}
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-gray-500 uppercase">Type</span>
                                            <select
                                                value={selectedItem.animation?.[animationTab]?.type || 'none'}
                                                onChange={(e) => {
                                                    const newType = e.target.value as any;
                                                    const currentAnim = selectedItem.animation?.[animationTab] || { duration: 0.5 };
                                                    onUpdateAnimation({
                                                        ...selectedItem.animation,
                                                        [animationTab]: { ...currentAnim, type: newType }
                                                    });
                                                }}
                                                className="w-full bg-[#1E1E1E] border border-[#333] text-xs text-gray-200 rounded p-2 outline-none"
                                            >
                                                <option value="none">None</option>
                                                <option value="fade">Fade</option>
                                                <option value="slide">Slide</option>
                                                <option value="scale">Scale</option>
                                                <option value="pop">Pop</option>
                                            </select>
                                        </div>

                                        {/* Dynamic Controls */}
                                        {selectedItem.animation?.[animationTab]?.type && selectedItem.animation?.[animationTab]?.type !== 'none' && (
                                            <div className="space-y-3 pt-2 border-t border-[#333]/50">
                                                {/* Direction */}
                                                {(selectedItem.animation?.[animationTab]?.type === 'slide') && (
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] text-gray-500 uppercase">Direction</span>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {['up', 'down', 'left', 'right'].map((dir) => (
                                                                <button
                                                                    key={dir}
                                                                    onClick={() => onUpdateAnimation({ ...selectedItem.animation, [animationTab]: { ...selectedItem.animation?.[animationTab], direction: dir } })}
                                                                    className={`py-1 text-[10px] rounded border ${selectedItem.animation?.[animationTab]?.direction === dir ? 'bg-primary/20 border-primary text-primary' : 'bg-[#1E1E1E] border-[#333] text-gray-500'}`}
                                                                >
                                                                    {dir}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Duration */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[10px] text-gray-500">
                                                        <span>Duration</span>
                                                        <span>{selectedItem.animation?.[animationTab]?.duration || 0.5}s</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.1"
                                                        max="2"
                                                        step="0.1"
                                                        value={selectedItem.animation?.[animationTab]?.duration || 0.5}
                                                        onChange={(e) => onUpdateAnimation({ ...selectedItem.animation, [animationTab]: { ...selectedItem.animation?.[animationTab], duration: parseFloat(e.target.value) } })}
                                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AccordionItem>
                        )}
                    </>
                )}

                {/* 2. MEDIA CONTROLS (Video/Image) */}
                {(selectedItem.type === 'video' || selectedItem.type === 'image') && (
                    <>
                        {/* Transform Group */}
                        {onUpdateTransform && (
                            <AccordionItem
                                title="Transform"
                                isOpen={openSections.includes('transform')}
                                onToggle={() => toggleSection('transform')}
                                icon={Maximize2}
                            >
                                <div className="space-y-4">
                                    {/* Scale */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Scale</span>
                                            <span>{Math.round((selectedItem.transform?.scale || 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="5"
                                            step="0.1"
                                            value={selectedItem.transform?.scale || 1}
                                            onChange={(e) => onUpdateTransform({ ...(selectedItem.transform || { x: 0, y: 0, rotation: 0 }), scale: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onUpdateTransform({ scale: 1, x: 0, y: 0, rotation: 0 })}
                                        className="w-full py-1.5 text-xs text-gray-400 bg-[#1E1E1E] border border-[#333] rounded hover:text-white"
                                    >
                                        Reset Position
                                    </button>
                                </div>
                            </AccordionItem>
                        )}

                        {/* Adjustments Group */}
                        <AccordionItem
                            title="Adjustments"
                            isOpen={openSections.includes('adjustments')}
                            onToggle={() => toggleSection('adjustments')}
                            icon={Gauge}
                        >
                            <div className="space-y-4">
                                {/* Opacity */}
                                {onUpdateOpacity && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Opacity</span>
                                            <span>{Math.round((selectedItem.opacity ?? 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={selectedItem.opacity ?? 1}
                                            onChange={(e) => onUpdateOpacity(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                )}

                                {/* Speed (Video Only) */}
                                {selectedItem.type === 'video' && (
                                    <div className="space-y-2 pt-2 border-t border-[#333]/50">
                                        <span className="text-xs text-gray-400">Speed</span>
                                        <div className="flex bg-[#1E1E1E] rounded-lg p-1">
                                            {[0.5, 1, 1.5, 2].map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() => onUpdateSpeed(rate)}
                                                    className={`flex-1 text-[10px] py-1.5 rounded transition-all ${currentGlobalSpeed === rate ? 'bg-primary text-white' : 'text-gray-500 hover:text-white'}`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Volume (Video Only) */}
                                {selectedItem.type === 'video' && onUpdateVolume && (
                                    <div className="space-y-2 pt-2 border-t border-[#333]/50">
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Volume</span>
                                            <span>{Math.round((selectedItem.volume ?? 1) * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={selectedItem.volume ?? 1}
                                            onChange={(e) => onUpdateVolume(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                )}
                            </div>
                        </AccordionItem>
                    </>
                )}

                {/* DELETE ACTION - BOTTOM */}
                <div className="mt-auto pt-6">
                    <button
                        onClick={onDelete}
                        className="w-full py-2.5 flex items-center justify-center gap-2 text-destructive border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 rounded-lg transition-colors text-xs font-medium"
                    >
                        <Trash2 size={14} />
                        Delete Item
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PropertiesPanel;
