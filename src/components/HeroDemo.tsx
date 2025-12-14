'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, ChevronRight, Mic, Globe, Settings2, Sparkles, Volume2, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
            // Optional: Add visual feedback/shake here
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

        } catch (error) {
            console.error("TTS Demo Error:", error);
            alert("عذراً، حدث خطأ أثناء توليد الصوت. يرجى المحاولة مرة أخرى.");
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
        <div className="w-full max-w-4xl mx-auto relative z-20">
            <audio ref={audioRef} className="hidden" />

            {/* Main Glass Card */}
            <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group transition-all duration-300 hover:shadow-primary/10">

                {/* Header Tabs */}
                <div className="flex items-center gap-6 px-8 py-4 border-b border-border/50 bg-muted/20">
                    <button className="text-foreground font-bold text-sm border-b-2 border-primary pb-4 -mb-4.5 px-2 transition-colors">
                        TEXT TO SPEECH
                    </button>
                    <button className="text-muted-foreground hover:text-foreground font-medium text-sm pb-4 -mb-4.5 px-2 transition-colors">
                        VOICE CLONING
                    </button>
                    <button className="text-muted-foreground hover:text-foreground font-medium text-sm pb-4 -mb-4.5 px-2 transition-colors">
                        AUDIO DUBBING
                    </button>
                    {/* Usage Counter Badge */}
                    <div className="mr-auto text-xs font-mono bg-background/50 px-2 py-1 rounded text-muted-foreground">
                        {isLocked ? "Limit Reached" : `${3 - usageCount} Tries Left`}
                    </div>
                </div>

                {/* Text Area */}
                <div className="relative p-6 sm:p-8 min-h-[220px]">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isPlaying || isLoading || isLocked}
                        className="w-full h-full min-h-[120px] bg-transparent border-none focus:ring-0 text-lg sm:text-xl leading-relaxed text-foreground resize-none placeholder:text-muted-foreground/50 font-medium disabled:opacity-50"
                        placeholder="اكتب النص هنا..."
                        dir="rtl"
                    />
                    <div className="absolute bottom-4 left-6 text-xs text-muted-foreground font-mono">
                        {text.length} / 200 chars
                    </div>

                    {/* Locked Overlay */}
                    {isLocked && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-20 animate-in fade-in">
                            <div className="bg-card border border-border p-6 rounded-2xl shadow-xl max-w-sm">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">انتهت التجربة المجانية</h3>
                                <p className="text-muted-foreground text-sm mb-6">لقد استهلكت جميع المحاولات المجانية (3 مرات). يرجى تسجيل الدخول للمتابعة بدون حدود.</p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="btn btn-primary w-full"
                                >
                                    تسجيل الدخول
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Control Bar */}
                <div className="relative bg-background/50 border-t border-border/50 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6">

                    {/* Waveform Background Animation */}
                    {isPlaying && (
                        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                            <div className="flex items-center justify-center gap-1 h-full w-full">
                                {[...Array(60)].map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            animationDelay: `${i * 0.05}s`,
                                            height: `${Math.random() * 60 + 20}%`
                                        }}
                                        className="w-1.5 bg-primary rounded-full animate-music-bar-1"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Provider & Character Selection */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full sm:w-auto">
                        <div className="flex items-center gap-3 bg-card border border-border rounded-full py-2 px-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer text-muted-foreground">
                            <span className="text-xs font-bold uppercase tracking-wider">Provider</span>
                            <div className="w-px h-4 bg-border"></div>
                            <span className="text-sm font-bold text-foreground">Ghaymah</span>
                        </div>
                        <div className="flex items-center gap-3 bg-card border border-border rounded-full py-2 px-2 pr-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer min-w-[200px]">
                            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden relative border border-border">
                                <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center text-[10px] text-white font-bold">EG</div>
                            </div>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-sm font-bold text-foreground">ar-EG-ShakirNeural</span>
                                <span className="text-[10px] text-muted-foreground text-left w-full">Male • Arabic</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </div>
                    </div>

                    {/* Play Button */}
                    <div className="relative z-10">
                        <button
                            onClick={handlePlay}
                            disabled={isLoading || isLocked}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none min-w-[140px] justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing</span>
                                </>
                            ) : isPlaying ? (
                                <>
                                    <Pause className="w-5 h-5 fill-current" />
                                    <span>Stop</span>
                                </>
                            ) : isLocked ? (
                                <>
                                    <Lock className="w-4 h-4" />
                                    <span>Locked</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 fill-current" />
                                    <span>Generate</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>

                {/* Progress Bar Line */}
                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-orange-400 z-30 transition-all duration-100 ease-linear" style={{ width: `${audioProgress}%` }} />
            </div>

            {/* Decorative Glows */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-[2rem] blur-2xl -z-10 opacity-50 animate-pulse-slow pointer-events-none" />
        </div>
    );
}
