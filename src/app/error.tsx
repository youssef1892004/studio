'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page Error caught:', error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-500/5 blur-3xl rounded-full -z-10 pointer-events-none"></div>

                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-2xl font-bold mb-3 text-foreground">حدث خطأ ما</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                    نعتذر، واجهنا مشكلة في تحميل هذه الصفحة. يرجى المحاولة مرة أخرى أو التحقق من اتصالك بالإنترنت.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="btn btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all hover:scale-[1.02] shadow-lg shadow-primary/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                    </button>

                    <Link
                        href="/"
                        className="btn bg-muted hover:bg-muted/80 text-foreground w-full py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-all"
                    >
                        <Home className="w-4 h-4" />
                        العودة للرئيسية
                    </Link>
                </div>

                {error.digest && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                        <p className="text-xs text-muted-foreground font-mono opacity-50">Error Ref: {error.digest}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
