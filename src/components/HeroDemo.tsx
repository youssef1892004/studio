'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronRight, Mic, Globe, Settings2, Sparkles, Volume2, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';

const DEMO_TEXTS = [
    "أهلاً بك في MuejamStudio. منصتك المتكاملة لإنتاج محتوى صوتي احترافي.",
    "يمكنك تحويل أي نص إلى كلام بشري واقعي بضغطة زر واحدة.",
    "نحن نقدم أحدث تقنيات الصوت باللغة العربية واللهجات المحلية."
];

export default function HeroDemo() {
    const router = useRouter();
    const [text, setText] = useState(DEMO_TEXTS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [usageCount, setUsageCount] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const storedCount = localStorage.getItem('demo_usage_count');
        if (storedCount) {
            const count = parseInt(storedCount, 10);
            setUsageCount(count);
            if (count >= 3) setIsLocked(true);
        }
    }, []);

    const handlePlay = async () => {
        // 1. Handle Stop logic
        if (isPlaying) {
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setAudioProgress(0);
            return;
        }

        // 2. Handle Lock logic
        if (isLocked || usageCount >= 3) {
            setShowLockModal(true);
            return;
        }

        // 3. Start Generation
        setIsLoading(true);
        try {
            const response = await fetch('/api/tts/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Generation failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                    // Increment Usage
                    const newCount = usageCount + 1;
                    setUsageCount(newCount);
                    localStorage.setItem('demo_usage_count', newCount.toString());
                    if (newCount >= 3) {
                        setIsLocked(true);
                    }
                }).catch(e => {
                    console.error("Playback error:", e);
                    setIsPlaying(false);
                });
            }

        } catch (error: any) {
            console.error("TTS Demo Error:", error);
            toast.error(error.message || "عذراً، حدث خطأ أثناء توليد الصوت. يرجى المحاولة مرة أخرى.", {
                style: { direction: 'rtl' }
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Sync progress bar with actual audio
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                setAudioProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setAudioProgress(0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    return (
        <div className="w-full relative z-20">
            <audio ref={audioRef} className="hidden" />

            {/* Main Card - Exact Design Replica */}
            <div className="bg-[#444444] rounded-[1.5rem] shadow-2xl overflow-hidden relative group w-full font-sans border border-white/5">

                {/* Header (Forced LTR for consistency with image layout) */}
                <div className="flex items-center justify-between px-6 py-4 bg-[#4a4a4a] border-b border-white/5" dir="ltr">
                    {/* Badge (Left) */}
                    <div className="bg-[#3a2e2e] px-3 py-1.5 rounded-md text-[#ff8c66] text-xs font-mono font-bold tracking-tight shadow-inner shadow-black/20">
                        {isLocked ? "Limit Reached" : `Tries Left ${3 - usageCount}`}
                    </div>

                    {/* Tabs (Right) */}
                    <div className="flex items-center gap-6 text-xs sm:text-sm font-bold text-zinc-400">
                        <button className="hover:text-white transition-colors uppercase tracking-wide hidden sm:block">Audio Dubbing</button>
                        <button className="hover:text-white transition-colors uppercase tracking-wide hidden sm:block">Voice Cloning</button>
                        <button className="text-[#e8e8e8] border-b-2 border-[#ff8c66] pb-1 uppercase tracking-wide">Text to Speech</button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="relative p-8 min-h-[280px] bg-[#525252] flex flex-col group-hover:bg-[#555555] transition-colors duration-500">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isPlaying || isLoading}
                        readOnly={isLocked}
                        className="w-full h-full bg-transparent border-none focus:ring-0 text-xl sm:text-2xl leading-relaxed text-right text-[#f0f0f0] placeholder:text-zinc-500 resize-none font-medium custom-scrollbar selection:bg-[#ff8c66]/30"
                        dir="rtl"
                        placeholder="اكتب النص هنا..."
                    />

                    {/* Bottom Info Line */}
                    <div className="mt-auto pt-6 flex items-center justify-between text-zinc-400 text-xs font-mono" dir="ltr">
                        <span>chars {text.length} / 200</span>
                    </div>

                    {/* Locked Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                            <button
                                onClick={() => setShowLockModal(true)}
                                className="flex items-center gap-2 bg-[#333]/90 border border-zinc-500/50 rounded-full px-5 py-2.5 text-zinc-200 hover:scale-105 transition-transform shadow-lg"
                            >
                                <Lock className="w-4 h-4 text-[#ff8c66]" />
                                <span className="font-bold text-sm">انتهت المحاولات - اضغط هنا</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Controls (Compact & No Scroll) */}
                <div className="bg-[#444444] p-3 sm:p-6 flex flex-row items-center justify-between gap-2 border-t border-white/5 overflow-hidden" dir="ltr">

                    {/* Generate Button (Left) */}
                    <button
                        onClick={handlePlay}
                        disabled={isLoading}
                        className="bg-[#ff8c66] hover:bg-[#ff7a50] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-full font-bold text-sm sm:text-lg shadow-lg shadow-orange-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 flex-shrink-0"
                    >
                        <span>{isLoading ? 'Processing' : 'Generate'}</span>
                        {!isLoading && <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
                    </button>

                    {/* Selectors (Right - Optimized for Mobile) */}
                    <div className="flex items-center gap-2 flex-shrink min-w-0">
                        {/* Voice */}
                        <div className="flex items-center gap-2 sm:gap-3 bg-[#555555] rounded-full px-2 sm:px-3 py-2 border border-white/5 cursor-pointer hover:bg-[#5a5a5a] transition-colors group whitespace-nowrap overflow-hidden">
                            <div className="flex flex-col leading-none truncate">
                                <span className="text-xs sm:text-sm font-bold text-zinc-200 truncate">ar-EG-ShakirNeural</span>
                                <span className="text-[10px] text-zinc-400 hidden sm:block">Male • Arabic</span>
                            </div>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#333] flex items-center justify-center text-[10px] text-white border border-white/10 group-hover:border-[#ff8c66] transition-colors flex-shrink-0">EG</div>
                        </div>

                        {/* Provider */}
                        <div className="flex items-center gap-2 bg-[#555555] rounded-full px-3 sm:px-4 py-2 sm:py-3 border border-white/5 cursor-pointer hover:bg-[#5a5a5a] transition-colors whitespace-nowrap">
                            <span className="text-xs sm:text-sm font-bold text-zinc-200">Ghaymah</span>
                            <span className="text-[10px] text-zinc-400 border-l border-zinc-600 pl-2 ml-1 tracking-wider uppercase hidden sm:inline-block">PROVIDER</span>
                        </div>
                    </div>

                </div>

                {/* Progress Bar */}
                {isPlaying && <div className="absolute bottom-0 left-0 h-1.5 bg-[#ff8c66] transition-all duration-100 ease-linear z-30" style={{ width: `${audioProgress}%` }} />}
            </div>

            {/* Decorative Shadow/Glow (Subtle) */}
            <div className="absolute -inset-4 bg-black/20 blur-xl -z-10 rounded-[3rem]"></div>

            {/* Modal */}
            <Modal
                isOpen={showLockModal}
                onClose={() => setShowLockModal(false)}
                title="انتهت التجربة المجانية"
            >
                <div className="flex flex-col items-center text-center space-y-4 pt-4">
                    <div className="w-16 h-16 bg-[#ff8c66]/10 text-[#ff8c66] rounded-full flex items-center justify-center mb-2">
                        <Lock className="w-8 h-8" />
                    </div>
                    <p className="text-zinc-500 leading-relaxed text-sm sm:text-lg">
                        You have used all 3 free tries. <br />
                        Sign in to continue creating unlimited content.
                    </p>
                    <div className="grid gap-3 w-full pt-4">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-[#ff8c66] hover:bg-[#ff7a50] text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                        >
                            Sign In / Register
                        </button>
                        <button
                            onClick={() => setShowLockModal(false)}
                            className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors py-2"
                        >
                            Close Preview
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
