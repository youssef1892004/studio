'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Zap, Film, MonitorPlay, AlertTriangle, Download } from 'lucide-react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (settings: ExportSettings) => void;
    isExporting: boolean;
}

export interface ExportSettings {
    preset: 'fast' | 'balanced' | 'professional';
    resolution: '480p' | '720p' | '1080p';
    fps: 30 | 60;
    format: 'mp4';
}

const PRESETS = {
    fast: {
        label: 'سريع (المعاينة)',
        desc: 'أقل جودة، أسرع وقت تصدير. ممتاز للمراجعة السريعة.',
        icon: Zap,
        defaults: { resolution: '720p', fps: 30 }
    },
    balanced: {
        label: 'متوازن (Recommended)',
        desc: 'جودة جيدة جدًا مع وقت تصدير معقول. مناسب للمنصات.',
        icon: MonitorPlay,
        defaults: { resolution: '1080p', fps: 30 }
    },
    professional: {
        label: 'جودة قصوى',
        desc: 'للمشاريع النهائية الهامة. جودة سينمائية لكن وقت أطول.',
        icon: Film,
        defaults: { resolution: '1080p', fps: 60 }
    }
};

export default function ExportModal({ isOpen, onClose, onExport, isExporting }: ExportModalProps) {
    const [selectedPreset, setSelectedPreset] = useState<'fast' | 'balanced' | 'professional'>('balanced');

    // Local overrides if needed, currently synced to preset
    const [resolution, setResolution] = useState<'480p' | '720p' | '1080p'>('1080p');
    const [fps, setFps] = useState<30 | 60>(30);

    // Sync state when preset changes
    const handlePresetChange = (key: 'fast' | 'balanced' | 'professional') => {
        setSelectedPreset(key);
        setResolution(PRESETS[key].defaults.resolution as any);
        setFps(PRESETS[key].defaults.fps as any);
    };

    const handleExport = () => {
        onExport({
            preset: selectedPreset,
            resolution,
            fps,
            format: 'mp4'
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Video className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">تصدير الفيديو</h2>
                                <p className="text-xs text-zinc-400">اختر الجودة المناسبة لمشروعك</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800"
                            disabled={isExporting}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-3">
                            {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => {
                                const preset = PRESETS[key];
                                const isSelected = selectedPreset === key;
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handlePresetChange(key)}
                                        disabled={isExporting}
                                        className={`text-right p-4 rounded-xl border-2 transition-all relative group ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold transition-colors ${isSelected ? 'text-primary' : 'text-zinc-300'}`}>
                                                    {preset.label}
                                                </h3>
                                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                                                    {preset.desc}
                                                </p>
                                            </div>

                                            {/* Technical Details Badge */}
                                            <div className="mr-auto flex flex-col items-end gap-1 text-[10px] font-mono opacity-70">
                                                <span className="bg-black/30 px-2 py-0.5 rounded text-zinc-300">
                                                    {PRESETS[key].defaults.resolution}
                                                </span>
                                                <span className="bg-black/30 px-2 py-0.5 rounded text-zinc-300">
                                                    {PRESETS[key].defaults.fps} FPS
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Warning for Heavy Export */}
                        {selectedPreset === 'professional' && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-500/90 leading-relaxed">
                                    تنبيه: التصدير بالجودة القصوى قد يستغرق وقتاً أطول ويستهلك موارد الجهاز بشكل كبير. يفضل استخدامه للأجهزة القوية فقط.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isExporting}
                            className="px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isExporting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري التصدير...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    بدء التصدير
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
