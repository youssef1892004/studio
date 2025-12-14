'use client';

import { Play, Mic, Video, Wand2, Image as ImageIcon, CheckCircle2, Layers, Scissors, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EditorShowcase() {
    const router = useRouter();

    return (
        <section className="py-24 relative overflow-hidden bg-muted/10">
            <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Right Column: Text Content (RTL) */}
                    <div className="order-2 lg:order-1 space-y-8 text-right lg:text-right">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-2">
                            <Sparkles className="w-4 h-4" />
                            <span>محرر الكل في واحد</span>
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
                            معجم <span className="text-primary">استوديو</span>
                        </h2>

                        <p className="text-xl text-muted-foreground leading-relaxed">
                            استوديو صوت وصورة وفيديو... مونتاج احترافي في تجربة بسيطة تشبه <span className="font-bold text-foreground">CapCut</span> ولكن بقوة الذكاء الاصطناعي.
                        </p>

                        <div className="space-y-4">
                            {[
                                { icon: Video, text: "تعديل فيديوهات قصيرة للسوشيال ميديا (Reels & TikTok)" },
                                { icon: Mic, text: "تحسين الصوت وإزالة الضوضاء بضغطة زر" },
                                { icon: Layers, text: "طبقات غير محدودة من الصوت والصورة والمؤثرات" },
                                { icon: Scissors, text: "قص ودمج ذكي للمشاهد تلقائياً" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                                        <item.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="font-medium text-foreground">{item.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <button className="btn btn-primary text-lg px-8 rounded-full shadow-lg shadow-primary/20">
                                <Sparkles className="w-5 h-5 ml-2" />
                                ابدأ مشروعك الآن
                            </button>
                            <button className="btn btn-outline text-lg px-8 rounded-full hover:bg-muted">
                                <Play className="w-5 h-5 ml-2 fill-current" />
                                شوف أعمالنا
                            </button>
                        </div>
                    </div>

                    {/* Left Column: Editor Mockup Visual */}
                    <div className="order-1 lg:order-2 relative perspective-1000">
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-50 animate-pulse-slow pointer-events-none" />

                        {/* Editor Window */}
                        <div className="relative bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-500 ease-out-back group">

                            {/* Floating Badges */}
                            <div className="absolute top-8 -right-6 z-20 bg-zinc-800/90 backdrop-blur border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-float" style={{ animationDelay: '0s' }}>
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">مقطع فيديو</div>
                                    <div className="font-bold text-white text-sm">Main_Scene.mp4</div>
                                </div>
                            </div>

                            <div className="absolute bottom-20 -left-6 z-20 bg-zinc-800/90 backdrop-blur border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3 animate-float" style={{ animationDelay: '1.5s' }}>
                                <div className="text-right">
                                    <div className="text-xs text-muted-foreground">صوت</div>
                                    <div className="font-bold text-white text-sm">AI_Voiceover.mp3</div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white">
                                    <Mic className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="absolute bottom-8 right-8 z-20 bg-zinc-800/90 backdrop-blur border border-white/10 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce-subtle">
                                <Wand2 className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs font-bold text-white">تأثير سحري</span>
                            </div>


                            {/* Header */}
                            <div className="h-10 bg-zinc-800 border-b border-white/5 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                </div>
                                <div className="flex-1 text-center text-[10px] text-zinc-500 font-mono">Muejam Editor v1.0</div>
                            </div>

                            {/* Main Workspace */}
                            <div className="p-6 h-[400px] flex gap-4">
                                {/* Sidebar */}
                                <div className="w-12 flex flex-col items-center gap-4 py-2 border-l border-white/5">
                                    {[Scissors, Layers, ImageIcon, Wand2, Mic].map((Icon, i) => (
                                        <div key={i} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer">
                                            <Icon className="w-4 h-4" />
                                        </div>
                                    ))}
                                </div>

                                {/* Timeline Area */}
                                <div className="flex-1 flex flex-col gap-4">
                                    {/* Preview Area (Simulated) */}
                                    <div className="flex-1 bg-black/50 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center group/preview">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
                                        <Play className="w-12 h-12 text-white/50 group-hover/preview:scale-110 transition-transform duration-300" fill="currentColor" />

                                        {/* Floating UI Elements inside preview */}
                                        <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-mono">00:15:24</div>
                                    </div>

                                    {/* Timeline Tracks */}
                                    <div className="h-32 bg-zinc-950/50 rounded-xl border border-white/5 p-3 space-y-2 relative overflow-hidden">
                                        {/* Playhead */}
                                        <div className="absolute top-0 left-1/2 h-full w-0.5 bg-primary z-10 shadow-[0_0_10px_rgba(244,137,105,0.5)]">
                                            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-primary transform rotate-45" />
                                        </div>

                                        {/* Video Track */}
                                        <div className="h-8 bg-zinc-800 rounded-lg relative overflow-hidden flex items-center px-2">
                                            <div className="absolute left-[10%] right-[20%] top-1 bottom-1 bg-purple-500/80 rounded opacity-80" />
                                            <div className="absolute left-[40%] right-[40%] top-1 bottom-1 bg-purple-400/80 rounded opacity-80 mix-blend-overlay" />
                                        </div>

                                        {/* Audio Track */}
                                        <div className="h-8 bg-zinc-800 rounded-lg relative overflow-hidden flex items-center justify-center gap-0.5 px-2">
                                            {/* Waveform Bars */}
                                            {[...Array(40)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 bg-primary/60 rounded-full animate-music-bar-1"
                                                    style={{
                                                        height: `${Math.abs(Math.sin(i * 5)) * 80 + 20}%`,
                                                        animationDelay: `${i * 0.05}s`
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Effects Track */}
                                        <div className="h-6 bg-zinc-800 rounded-lg relative overflow-hidden mt-1">
                                            <div className="absolute left-[30%] w-20 top-1 bottom-1 bg-yellow-500/80 rounded opacity-80 text-[8px] flex items-center justify-center text-black font-bold">Effect</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
