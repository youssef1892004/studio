'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error using PostHog or other analytics if needed
        console.error('Global Error caught:', error);
    }, [error]);

    return (
        <html lang="ar" dir="rtl" className="dark">
            <body className="font-sans antialiased">
                <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-foreground p-6">
                    <div className="max-w-md w-full bg-[#18181b] border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-500/5 blur-3xl rounded-full -z-10 pointer-events-none"></div>

                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>

                        <h1 className="text-3xl font-bold mb-3">عذراً، حدث خطأ جسيم</h1>
                        <p className="text-zinc-400 mb-8 leading-relaxed">
                            واجهنا مشكلة غير متوقعة أثناء معالجة طلبك. لقد تم تسجيل الخطأ وسنعمل على حله فوراً.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => reset()}
                                className="btn bg-red-600 hover:bg-red-700 text-white w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02]"
                            >
                                <RefreshCw className="w-4 h-4" />
                                حاول مرة أخرى
                            </button>

                            <Link
                                href="/"
                                className="btn bg-white/5 hover:bg-white/10 text-white w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all"
                            >
                                <Home className="w-4 h-4" />
                                العودة للرئيسية
                            </Link>
                        </div>

                        {error.digest && (
                            <div className="mt-8 p-3 bg-black/30 rounded-lg border border-white/5">
                                <p className="text-xs text-zinc-600 font-mono">Error ID: {error.digest}</p>
                            </div>
                        )}
                    </div>
                </div>
            </body>
        </html>
    );
}
