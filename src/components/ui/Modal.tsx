'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string; // Allow custom classes for wider modals if needed
}

export default function Modal({ isOpen, onClose, title, children, className = '' }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Lock body scroll
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    // Use createPortal to render at the end of the document body
    // ensuring z-index works correctly over everything else
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">

            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div
                className={`bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-5 duration-200 ${className}`}
            >
                {/* Header (Optional) */}
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
                    {title && <h3 className="text-lg font-bold tracking-tight">{title}</h3>}
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground mr-auto"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
