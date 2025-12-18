import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, MessageSquare, Send, Phone } from 'lucide-react';

export const metadata: Metadata = {
    title: 'تواصل معنا | MuejamStudio',
    description: 'فريق دعم MuejamStudio هنا لمساعدتك. تواصل معنا للاستفسارات، الدعم الفني، أو طلبات الأعمال.',
    robots: { index: true, follow: true },
};

export default function ContactPage() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <div className="max-w-6xl mx-auto px-6 relative z-10">

                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-orange-500/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

                {/* Header */}
                <div className="mb-12 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        العودة إلى الرئيسية
                    </Link>

                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        تواصل مع <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">فريقنا</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        سواء كان لديك سؤال تقني، اقتراح لتطوير المنصة، أو ترغب في مناقشة شراكة عمل، نحن هنا للاستماع إليك.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">

                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* Email Card */}
                        <div className="p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all shadow-lg group">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">البريد الإلكتروني</h3>
                            <p className="text-muted-foreground text-sm mb-3">للأسرع في الرد على الاستفسارات العامة</p>
                            <a href="mailto:support@muejam.com" className="text-primary font-mono hover:underline block break-all">support@muejam.com</a>
                        </div>

                        {/* Technical Support */}
                        <div className="p-6 rounded-3xl bg-card border border-border/50 hover:border-border transition-all shadow-lg">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">الدعم الفني</h3>
                            <p className="text-muted-foreground text-sm mb-3">واجهت مشكلة؟ نحن هنا للمساعدة</p>
                            <Link href="/docs" className="text-sm text-foreground hover:text-primary underline decoration-border hover:decoration-primary underline-offset-4 transition-all">
                                تصفح التوثيق أولاً &rarr;
                            </Link>
                        </div>

                        {/* Office Location */}
                        <div className="p-6 rounded-3xl bg-card border border-border/50 hover:border-border transition-all shadow-lg">
                            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-4">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">المقر الرئيسي</h3>
                            <p className="text-muted-foreground text-sm">
                                القاهرة، جمهورية مصر العربية<br />
                                <span className="text-xs opacity-70 block mt-1">ساعات العمل: 9 ص - 5 م (توقيت القاهرة)</span>
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 to-black border border-border/50 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Send className="w-6 h-6 text-primary" />
                                أرسل لنا رسالة
                            </h2>

                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium text-muted-foreground">الاسم الكامل</label>
                                        <input
                                            type="text"
                                            id="name"
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600"
                                            placeholder="أدخل اسمك هنا"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                                        <input
                                            type="email"
                                            id="email"
                                            className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600"
                                            placeholder="your@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium text-muted-foreground">عنوان الرسالة</label>
                                    <select
                                        id="subject"
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                                    >
                                        <option value="general">استفسار عام</option>
                                        <option value="support">دعم فني</option>
                                        <option value="business">شراكة أعمال / مبيعات</option>
                                        <option value="feedback">اقتراح / تغذية راجعة</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium text-muted-foreground">نص الرسالة</label>
                                    <textarea
                                        id="message"
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-zinc-600 resize-none"
                                        placeholder="كيف يمكننا مساعدتك اليوم؟"
                                    ></textarea>
                                </div>

                                <button
                                    type="button"
                                    className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 group"
                                >
                                    <span>إرسال الرسالة</span>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform rtl:group-hover:-translate-x-1" />
                                </button>

                                <p className="text-center text-xs text-zinc-500">
                                    سنحاول الرد عليك في أقرب وقت ممكن. عادةً خلال 24 ساعة.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
