import React, { useState, useEffect, useMemo } from 'react';
import { Mic, Play, Settings, User, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Voice } from '@/lib/types';

interface VoiceGenerationPanelProps {
    onGenerate: (text: string, voice: Voice, provider: string, speed: number, pitch: number) => Promise<void>;
    activeBlock?: any;
    onUpdateBlock?: (blockId: string, text: string, voice: Voice, provider: string, speed: number, pitch: number) => Promise<void>;
    onDeleteBlock?: (blockId: string) => Promise<void>;
    onClearSelection?: () => void;
    onAddGhostBlock?: (text: string, voice: Voice, provider: string, speed: number, pitch: number) => void;
    blockIndex?: number;
    voices: Voice[];
}

const VoiceGenerationPanel: React.FC<VoiceGenerationPanelProps> = ({
    onGenerate,
    activeBlock,
    onUpdateBlock,
    onDeleteBlock,
    onClearSelection,
    onAddGhostBlock,
    blockIndex,
    voices
}) => {
    const [text, setText] = useState('');
    const [provider, setProvider] = useState<string>('');
    const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
    const [speed, setSpeed] = useState(1);
    const [pitch, setPitch] = useState(1);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isVoiceListOpen, setIsVoiceListOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper to get flag emoji
    const getCountryFlag = (countryCode: string) => {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    // Set default provider from voices prop
    useEffect(() => {
        if (voices.length > 0 && !provider) {
            const hasGhaymah = voices.some(v => v.provider === 'ghaymah');
            const firstProvider = hasGhaymah ? 'ghaymah' : (voices[0].provider || '');
            setProvider(firstProvider);
        }
    }, [voices]);

    // Populate state from activeBlock
    useEffect(() => {
        if (activeBlock && voices.length > 0) {
            const blockText = activeBlock.content.blocks.map((b: any) => b.data.text).join('\n');
            setText(blockText);

            // Find voice
            const voice = voices.find(v => v.name === activeBlock.voice);
            if (voice) {
                setSelectedVoice(voice);
                setProvider(voice.provider || '');
            }
            // Start Load speed/pitch from block or default
            setSpeed(activeBlock.speed || 1);
            setPitch(activeBlock.pitch || 1);
            // End Load speed/pitch from block or default
            if (voice) {
                setSelectedVoice(voice);
                setProvider(voice.provider || '');
            }
        } else if (!activeBlock) {
            setText('');
            // Reset voice to default if needed, or keep last selected
            setSpeed(1);
            setPitch(1);
        }
    }, [activeBlock, voices]);

    // Derive unique providers
    const providers = useMemo(() => {
        const safeVoices = voices || [];
        const unique = new Set(safeVoices.map(v => v.provider).filter(Boolean));
        return Array.from(unique) as string[];
    }, [voices]);

    // Filter voices by selected provider
    const availableVoices = useMemo(() => {
        return voices.filter(v => v.provider === provider);
    }, [voices, provider]);

    // Auto-select first voice when provider changes if none selected or invalid
    useEffect(() => {
        if (availableVoices.length > 0) {
            const currentVoiceValid = availableVoices.find(v => v.voiceId === selectedVoice?.voiceId);
            if (!currentVoiceValid && !activeBlock) { // Only auto-select if not editing a block (or block voice invalid)
                setSelectedVoice(availableVoices[0]);
            }
        } else {
            setSelectedVoice(null);
        }
    }, [availableVoices, selectedVoice, activeBlock]);

    const handleGenerate = async () => {
        if (!text || !selectedVoice) return;

        try {
            setIsGenerating(true);
            if (activeBlock && onUpdateBlock) {
                await onUpdateBlock(activeBlock.id, text, selectedVoice, provider, speed, pitch);
            } else {
                await onGenerate(text, selectedVoice, provider, speed, pitch);
                setText(''); // Clear text after success only for new blocks
            }
        } catch (error) {
            console.error("Generation failed:", error);
            // Error handling could be improved here (e.g. toast)
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddGhost = () => {
        if (!text || !selectedVoice || !onAddGhostBlock) return;
        if (!text || !selectedVoice || !onAddGhostBlock) return;
        onAddGhostBlock(text, selectedVoice, provider, speed, pitch);
        setText('');
    };

    const handleDelete = async () => {
        if (activeBlock && onDeleteBlock) {
            await onDeleteBlock(activeBlock.id);
        }
    };

    return (
        <div className="h-full flex flex-col bg-card p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/20 rounded-xl">
                        <Mic className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            {activeBlock ? (
                                <>
                                    تعديل الصوت
                                    {blockIndex !== undefined && (
                                        <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full border border-white/10 font-mono">#{blockIndex}</span>
                                    )}
                                </>
                            ) : 'توليد الصوت'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {activeBlock ? 'Edit Voice Block' : 'Voice Generation'}
                        </p>
                    </div>
                </div>
                {activeBlock && onClearSelection && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                            title="تحديث الصفحة"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                <path d="M16 16h5v5" />
                            </svg>
                        </button>
                        <button
                            onClick={onClearSelection}
                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                            title="إنشاء مقطع جديد"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(156, 163, 175, 0.5);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>

            {voices.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>جاري تحميل الأصوات...</p>
                </div>
            ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-studio-panel border border-studio-border rounded hover:bg-studio-panel/80"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            ) : (
                <>
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-foreground">
                            المزود (Provider)
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary capitalize appearance-none cursor-pointer"
                        >
                            {providers.map(p => (
                                <option key={p} value={p} className="bg-muted text-foreground">
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Voice Selection UI */}
                    <div className={`space-y-2 flex flex-col ${isVoiceListOpen ? 'flex-1 min-h-0' : ''}`}>
                        <label className="block text-sm font-bold text-studio-text-light dark:text-studio-text">
                            الصوت (Voice)
                        </label>

                        {!isVoiceListOpen ? (
                            // Collapsed View (Selected Voice)
                            <button
                                onClick={() => setIsVoiceListOpen(true)}
                                className="w-full flex items-center justify-between p-4 bg-muted border border-border rounded-2xl shadow-sm hover:border-primary transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-xl shadow-inner border border-border">
                                        {selectedVoice ? getCountryFlag(selectedVoice.countryCode) : <User className="w-5 h-5 text-muted-foreground/50" />}
                                    </div>
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-base font-bold text-foreground" dir="ltr">
                                            {selectedVoice ? (selectedVoice.characterName || selectedVoice.name) : 'Select a voice'}
                                        </span>
                                        {selectedVoice && (
                                            <span className="text-xs text-muted-foreground/60">
                                                {selectedVoice.gender === 'Male' ? 'Male' : 'Female'} • {selectedVoice.languageName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-muted-foreground/50 group-hover:text-primary transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </div>
                            </button>
                        ) : (
                            // Expanded View (Voice List)
                            <div className="flex-1 flex flex-col bg-muted border border-border rounded-2xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {/* List Header */}
                                <div className="p-3 border-b border-border bg-card/50 flex items-center gap-2">
                                    <button
                                        onClick={() => setIsVoiceListOpen(false)}
                                        className="p-1.5 hover:bg-primary/10 text-foreground rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m15 18-6-6 6-6" />
                                        </svg>
                                    </button>
                                    <span className="flex-1 font-bold text-sm text-foreground">
                                        Select Voice ({availableVoices.length})
                                    </span>
                                </div>

                                {/* List Items */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {availableVoices.map((voice) => (
                                        <button
                                            key={voice.voiceId}
                                            onClick={() => {
                                                setSelectedVoice(voice);
                                                setIsVoiceListOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-start transition-all ${selectedVoice?.voiceId === voice.voiceId
                                                ? 'bg-primary/10 border border-primary/20'
                                                : 'hover:bg-card border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl shadow-sm border border-border ${selectedVoice?.voiceId === voice.voiceId ? 'bg-muted' : 'bg-card'
                                                }`}>
                                                {getCountryFlag(voice.countryCode)}
                                            </div>
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <span
                                                    className={`text-sm font-bold truncate ${selectedVoice?.voiceId === voice.voiceId ? 'text-primary' : 'text-foreground'}`}
                                                    dir="ltr"
                                                >
                                                    {voice.characterName || voice.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground/60 truncate">
                                                    {voice.gender === 'Male' ? 'Male' : 'Female'} • {voice.languageName}
                                                </span>
                                            </div>
                                            {selectedVoice?.voiceId === voice.voiceId && (
                                                <div className="text-primary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>



                    {/* Text Input */}
                    {!isVoiceListOpen && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300 delay-75">
                            <label className="block text-sm font-semibold text-foreground">
                                النص (Text)
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="اكتب النص هنا..."
                                className="w-full min-h-[100px] px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            />
                        </div>
                    )}

                    {/* Generate Button */}
                    {!isVoiceListOpen && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300 delay-100">
                            <div className="flex">
                                <button
                                    onClick={handleGenerate}
                                    disabled={!text || !selectedVoice || isGenerating}
                                    className={`w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl`}
                                >
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                                    {isGenerating ? 'جاري التوليد...' : (activeBlock && (activeBlock.audioUrl || activeBlock.s3_url) ? 'تحديث الصوت' : 'توليد الصوت')}
                                </button>
                            </div>

                            {activeBlock && onDeleteBlock && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all duration-300"
                                >
                                    حذف المقطع
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default VoiceGenerationPanel;
