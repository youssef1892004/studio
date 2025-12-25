import React, { useEffect, useState, useRef } from 'react';
import { Copy, ClipboardPaste, Scissors, CopyPlus, Info, X, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ContextMenuProps {
    x: number;
    y: number;
    visible: boolean;
    type: 'general' | 'item' | 'block' | 'text';
    onClose: () => void;
    onAction: (action: string, value?: any) => void;
    currentVolume?: number;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, type, onClose, onAction, currentVolume = 1 }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        // Close on scroll
        const handleScroll = () => onClose();

        if (visible) {
            window.addEventListener('click', handleClick);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [visible, onClose]);

    if (!visible) return null;

    // Adjust position to not overflow screen
    const style: React.CSSProperties = {
        top: y,
        left: x,
    };

    // Simple bound check (can be improved)
    if (typeof window !== 'undefined') {
        if (x + 200 > window.innerWidth) style.left = x - 200;
        if (y + 300 > window.innerHeight) style.top = y - 300;
    }

    const MenuItem = ({ icon: Icon, label, action, danger = false }: any) => (
        <button
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-studio-text hover:bg-studio-panel-light dark:text-studio-text dark:hover:bg-white/10'}`}
            onClick={() => {
                onAction(action);
                onClose(); // Auto close
            }}
        >
            <Icon size={14} />
            <span>{label}</span>
        </button>
    );

    return createPortal(
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-[#1E1E1E] border border-[#333] rounded-lg shadow-xl w-48 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            {(type === 'item' || type === 'block') && (
                <div className="px-3 py-2 flex flex-col gap-1 border-b border-[#333] mb-1">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Volume</span>
                        <span>{Math.round(currentVolume * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={currentVolume}
                        onChange={(e) => onAction('volume', parseFloat(e.target.value))}
                        className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            <MenuItem icon={Copy} label="Copy" action="copy" />
            <MenuItem icon={Scissors} label="Cut" action="cut" />
            <MenuItem icon={ClipboardPaste} label="Paste" action="paste" />
            <MenuItem icon={CopyPlus} label="Duplicate" action="duplicate" />

            <div className="h-px bg-[#333] my-1" />

            <div className="h-px bg-[#333] my-1" />

            <MenuItem icon={Trash2} label="Delete" action="delete" danger />
            <MenuItem icon={Info} label="Info" action="info" />
        </div>,
        document.body
    );
};

export default ContextMenu;
