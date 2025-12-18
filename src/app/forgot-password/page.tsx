'use client';
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulation
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
            toast.success('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">

            {/* Right Side - Visual Area (Hidden on Mobile) */}
            <div className="hidden lg:flex w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/hero-modern.png"
                        alt="Studio Background"
                        fill
                        className="object-cover opacity-40 mix-blend-overlay"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-zinc-900/80 to-zinc-900" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 max-w-lg text-center space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/90 text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>استعد وصولك</span>
                    </div>
                    <h1 className="text-4xl font-black text-white leading-tight">
                        نسيت كلمة المرور؟ <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">لا تقلق.</span>
                    </h1>
                    <p className="text-lg text-white/60 leading-relaxed font-light">
                        أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة حسابك والعودة للإبداع.
                    </p>
                </div>
            </div>

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
                <Link href="/login" className="absolute top-8 right-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm z-20">
                    <ArrowRight className="w-4 h-4" />
                    العودة لتسجيل الدخول
                </Link>

                <div className="w-full max-w-[420px] space-y-8 animate-fade-in-up md:delay-200">
                    {isSubmitted ? (
                        <div className="text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">تحقق من بريدك</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                أرسلنا رابط استعادة كلمة المرور إلى <br /> <span className="text-foreground font-mono font-bold">{email}</span>
                            </p>
                            <p className="text-sm text-muted-foreground/80">
                                لم يصلك البريد؟ <button onClick={() => setIsSubmitted(false)} className="text-primary hover:underline">أرسل مرة أخرى</button>
                            </p>
                            <Link href="/login" className="btn btn-outline w-full py-3 mt-4 block">
                                العودة لتسجيل الدخول
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center lg:text-right space-y-2">
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">استعادة كلمة المرور</h2>
                                <p className="text-muted-foreground">أدخل البريد الإلكتروني المرتبط بحسابك</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground" htmlFor="email">البريد الإلكتروني</label>
                                    <div className="relative group">
                                        <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`} />
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField('')}
                                            required
                                            className="relative w-full px-4 py-3 pl-10 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none placeholder:text-muted-foreground/40 font-mono text-sm"
                                            placeholder="name@example.com"
                                            dir="ltr"
                                        />
                                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full btn btn-primary py-4 text-base rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'جاري الإرسال...' : 'أرسل رابط الاستعادة'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
