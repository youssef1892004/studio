'use client';

import Link from 'next/link';
import { Mic, Globe, Zap, Play, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-muted/30 border-t border-border pt-16 pb-8 relative z-10 print:hidden">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                                <Mic className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold">MuejamStudio</span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                            المنصة العربية الأولى المتكاملة لتحرير الصوت، الصورة، والفيديو باستخدام أحدث تقنيات الذكاء الاصطناعي التوليدي.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-foreground">المنتجات</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/products/text-to-speech" className="hover:text-primary transition-colors">Text to Speech</Link></li>
                            <li><Link href="/products/voice-cloning" className="hover:text-primary transition-colors">Voice Cloning</Link></li>
                            <li><Link href="/projects" className="hover:text-primary transition-colors">Video Editor <span className="text-[10px] bg-green-500/20 text-green-500 px-1 rounded ml-1">New</span></Link></li>
                            <li><Link href="/solutions/content-creators" className="hover:text-primary transition-colors">لصناع المحتوى</Link></li>
                            <li><Link href="/solutions/marketers" className="hover:text-primary transition-colors">للمسوقين</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-foreground">مصادر</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/about" className="hover:text-primary transition-colors">من نحن</Link></li>
                            <li><Link href="/compare" className="hover:text-primary transition-colors text-orange-400">مقارنة بالمنافسين</Link></li>
                            <li><a href="https://muejam.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">المدونة</a></li>
                            <li><Link href="/docs" className="hover:text-primary transition-colors">التوثيق</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">مساعدة (تواصل معنا)</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4 text-foreground">قانوني</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/legal#privacy" className="hover:text-primary transition-colors">الخصوصية</Link></li>
                            <li><Link href="/legal#terms" className="hover:text-primary transition-colors">الشروط</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} MuejamStudio. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    );
}
