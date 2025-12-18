import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans flex items-center justify-center p-6">
            <div className="text-center max-w-md mx-auto relative z-10">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 blur-[100px] -z-10 rounded-full pointer-events-none"></div>

                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800 shadow-2xl animate-bounce">
                        <FileQuestion className="w-12 h-12 text-primary" />
                    </div>
                </div>

                <h1 className="text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">404</h1>
                <h2 className="text-2xl font-bold mb-4 text-foreground">الصفحة غير موجودة</h2>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                    عذراً، الرابط الذي تحاول الوصول إليه قد يكون تم حذفه أو تغييره، أو أنه غير متاح حالياً.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/" className="btn btn-primary px-8 py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                        <Home className="w-4 h-4" />
                        الرئيسية
                    </Link>
                    <Link href="/contact" className="px-8 py-3 rounded-xl border border-border hover:bg-muted font-bold text-center transition-colors flex items-center justify-center gap-2">
                        بلغ عن مشكلة
                    </Link>
                </div>
            </div>
        </div>
    );
}
