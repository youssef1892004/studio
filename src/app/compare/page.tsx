import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, ArrowLeft, ShieldCheck, Zap, Globe } from 'lucide-react';

export const metadata: Metadata = {
    title: 'مقارنة MuejamStudio بالمنافسين | الأفضل للمحتوى العربي',
    description: 'لماذا MuejamStudio هو الخيار الأفضل لصناع المحتوى العرب مقارنة بـ ElevenLabs و Murf AI. دعم متميز للهجات العربية وتكلفة تنافسية.',
    keywords: ['بديل ElevenLabs', 'بديل Murf', 'أفضل برنامج دبلجة عربي', 'مقارنة برامج TTS'],
};

export default function ComparePage() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <div className="max-w-7xl mx-auto px-6 relative z-10">

                {/* Header */}
                <div className="text-center mb-16">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        العودة إلى الرئيسية
                    </Link>

                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        لماذا يختار العرب <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">MuejamStudio</span>؟
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                        مقارنة صريحة وشفافة بيننا وبين الأدوات العالمية الأخرى. نحن لا ندعي أننا الأفضل في كل شيء، ولكننا الأفضل في فهم لغتك.
                    </p>
                </div>

                {/* Comparison Table */}
                <div className="overflow-x-auto mb-20 bg-card rounded-3xl border border-border/50 shadow-2xl">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/50">
                                <th className="p-6 text-lg font-bold border-b border-border text-foreground w-1/4">الميزة</th>
                                <th className="p-6 text-lg font-bold border-b border-border text-primary w-1/4 bg-primary/5">MuejamStudio 🚀</th>
                                <th className="p-6 text-lg font-bold border-b border-border text-muted-foreground w-1/4">ElevenLabs</th>
                                <th className="p-6 text-lg font-bold border-b border-border text-muted-foreground w-1/4">أدوات أخرى (Murf/Lovo)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { feature: "دعم اللهجات العربية", us: "✅ 30+ لهجة محلية دقيقة", them1: "⚠️ لهجة فصحى وجدانية فقط", them2: "❌ ضعيف جداً" },
                                { feature: "تشكيل النص (Diacritics)", us: "✅ تشكيل تلقائي ذكي", them1: "❌ لا يدعم التشكيل", them2: "❌ لا يدعم" },
                                { feature: "السعر (الخطة المبدئية)", us: "✅ يبدأ من 0$ (مجاني حقيقي)", them1: "⚠️ غالي بالدولار", them2: "⚠️ مكلف جداً للمبتدئين" },
                                { feature: "طرق الدفع المحلية", us: "✅ فودافون كاش، ميزة، فوري", them1: "❌ بطاقات دولية فقط", them2: "❌ بطاقات دولية فقط" },
                                { feature: "محرر فيديو مدمج", us: "✅ نعم (صوت + صورة)", them1: "❌ صوت فقط", them2: "⚠️ محدود" },
                                { feature: "الدعم الفني", us: "✅ عربي 100% (واتساب/إيميل)", them1: "❌ إنجليزي فقط", them2: "❌ إنجليزي فقط" },
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors border-b border-border/10 last:border-0">
                                    <td className="p-6 font-bold text-foreground">{row.feature}</td>
                                    <td className="p-6 font-semibold text-foreground bg-primary/5 border-x border-primary/10 shadow-[inset_0_0_20px_rgba(234,88,12,0.05)]">
                                        {row.us}
                                    </td>
                                    <td className="p-6 text-muted-foreground">{row.them1}</td>
                                    <td className="p-6 text-muted-foreground">{row.them2}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Deep Dive Sections */}
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">نفهم ثقافتك</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            النماذج العالمية تدربت بشكل أساسي على الإنجليزية. نماذجنا تدربت على آلاف الساعات من المحتوى العربي المتنوع، لذا فهي تفهم الفرق بين نطق "الرياض" و "القاهرة" وتضبط التشكيل ومخارج الحروف بشكل طبيعي لا يبدو آلياً.
                        </p>
                    </div>

                    <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800">
                        <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 mb-6">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">آمن ومحلي</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            نتعامل مع بوابات دفع محلية موثوقة ونضمن سرية بياناتك. سيرفراتنا مهيأة لخدمة المنطقة العربية بسرعة استجابة عالية (low latency) مقارنة بالسيرفرات الأمريكية للأدوات الأخرى.
                        </p>
                    </div>
                </div>

                {/* Final CTA */}
                <div className="text-center bg-gradient-to-t from-primary/10 to-transparent p-12 rounded-3xl border border-primary/20">
                    <h2 className="text-3xl font-bold mb-6">لا تأخذ كلمتنا كمسلمات</h2>
                    <p className="text-lg text-muted-foreground mb-8">جرب بنفسك وقارن النتيجة. الرصيد المجاني متاح الآن.</p>
                    <div className="flex justify-center gap-4 flex-col sm:flex-row">
                        <Link href="/studio" className="btn btn-primary px-8 py-4 text-lg">
                            جرب الاستوديو مجاناً
                        </Link>
                        <a href="https://elevenlabs.io" target="_blank" rel="nofollow noreferrer" className="btn bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 text-lg">
                            زيارة المنافسين (للمقارنة)
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
