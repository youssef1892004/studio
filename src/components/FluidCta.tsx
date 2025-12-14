'use client';
import { useRouter } from 'next/navigation';
import { Github, Twitter, Linkedin, Youtube, Instagram, Play } from 'lucide-react';

export default function FluidCta() {
    const router = useRouter();

    return (
        <section className="relative py-40 overflow-hidden bg-background flex flex-col items-center justify-center min-h-[600px]">

            {/* 1. Fluid Wave Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply dark:mix-blend-lighten">
                {/* Large Gradients (Blobs) */}
                <div className="absolute top-1/2 left-0 w-full h-[500px] bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-[120px] -translate-y-1/2 animate-pulse-slow" />

                {/* Moving SVG Wave Simulation */}
                <div className="absolute top-0 left-0 w-[200%] h-full flex animate-wave-slow opacity-30">
                    <svg className="w-1/2 h-full text-foreground" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="w-1/2 h-full text-foreground" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>

                <div className="absolute bottom-0 left-0 w-[200%] h-full flex animate-wave-slow opacity-20" style={{ animationDirection: 'reverse', animationDuration: '25s' }}>
                    <svg className="w-1/2 h-full text-primary" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                    <svg className="w-1/2 h-full text-primary" viewBox="0 0 1440 320" preserveAspectRatio="none">
                        <path fill="currentColor" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,106.7C672,117,768,171,864,197.3C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </div>

            {/* Center Card */}
            <div className="relative z-10 bg-card/90 backdrop-blur-2xl border border-white/10 dark:border-white/5 p-12 rounded-[2.5rem] text-center max-w-3xl w-[90%] mx-auto shadow-2xl shadow-black/20 animate-fade-in-up">
                {/* Play Icon Decor */}
                <div className="flex justify-center mb-8">
                    <button className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-lg group hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 ml-1 text-primary group-hover:fill-primary" fill="currentColor" strokeWidth={0} />
                    </button>
                </div>

                <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight text-foreground">
                    اصنع محتواك بأعلى جودة <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">ذكاء اصطناعي</span>
                </h2>

                <div className="flex flex-col items-center gap-4">
                    <button
                        onClick={() => router.push('/register')}
                        className="btn btn-primary text-lg px-12 py-4 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        ابدأ مجاناً
                    </button>
                    <p className="text-muted-foreground text-sm">
                        لديك حساب بالفعل؟ <button onClick={() => router.push('/login')} className="text-primary hover:underline font-bold px-1">تسجيل الدخول</button>
                    </p>
                </div>
            </div>

            {/* Social Icons Strip (Bottom) */}
            <div className="relative z-10 mt-20 flex gap-8 text-muted-foreground/60">
                {[Twitter, Linkedin, Github, Youtube, Instagram].map((Icon, i) => (
                    <Icon key={i} className="w-6 h-6 hover:text-primary transition-colors cursor-pointer hover:scale-110 transform duration-200" />
                ))}
            </div>
        </section>
    );
}
