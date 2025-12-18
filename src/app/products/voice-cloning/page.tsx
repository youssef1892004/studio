import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Fingerprint, Lock, Wand2, Mic2, ArrowLeft, Volume2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'استنساخ الأصوات (Voice Cloning) | أنشئ نسختك الرقمية بالذكاء الاصطناعي',
    description: 'تقنية استنساخ الصوت (Voice Cloning) الأولى عربياً. انسخ نبرة صوتك أو أي شخصية بدقة 95%. مثالي لصناع المحتوى، البودكاست، والكتب الصوتية (Audiobooks).',
    keywords: ['استنساخ الصوت', 'Voice Cloning Arabic', 'نسخ الصوت', 'تقليد الأصوات', 'ذكاء اصطناعي صوتي', 'تغيير الصوت', 'Custom Voice', 'AI Voice API'],
};

export default function VoiceCloningPage() {
    return (
        <div className="bg-background text-foreground min-h-screen pt-24 font-sans">

            {/* Hero Section */}
            <section className="relative overflow-hidden pb-20 pt-10">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full text-sm font-bold border border-purple-500/20">
                                <Fingerprint className="w-4 h-4" />
                                <span>Instant Voice Cloning</span>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
                                صوتك هو هويتك. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                                    اجعله رقمياً للأبد
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                أنشئ نسخة رقمية طبق الأصل من صوتك في ثوانٍ. استخدمها لقراءة الكتب، الفيديوهات، أو المساعدات الصوتية دون الحاجة للتسجيل كل مرة.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/studio" className="btn bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-bold flex items-center justify-center gap-2 rounded-xl transition-all shadow-lg shadow-purple-500/20">
                                    استنسخ صوتك الآن
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <Link href="#how-it-works" className="px-8 py-3 rounded-xl border border-border hover:bg-muted font-bold text-center transition-colors">
                                    كيف يعمل؟
                                </Link>
                            </div>
                        </div>

                        <div className="lg:w-1/2 flex justify-center">
                            <div className="relative w-80 h-80">
                                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-20"></div>
                                <div className="absolute inset-4 bg-purple-500/20 rounded-full animate-pulse opacity-30"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl z-10 border-4 border-background">
                                        <Mic2 className="w-20 h-20 text-white" />
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute top-0 right-0 bg-card p-3 rounded-xl shadow-lg border border-border animate-bounce delay-700">
                                    <Volume2 className="w-6 h-6 text-green-500" />
                                </div>
                                <div className="absolute bottom-10 left-0 bg-card p-3 rounded-xl shadow-lg border border-border animate-bounce delay-1000">
                                    <Wand2 className="w-6 h-6 text-orange-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-20 bg-muted/20">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">بساطة مذهلة، نتائج واقعية</h2>
                        <p className="text-muted-foreground">3 خطوات بسيطة للحصول على نسختك الصوتية الرقمية (AI Voice Clone)</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        {[
                            {
                                step: "01",
                                icon: <Mic2 className="w-8 h-8" />,
                                title: "سجل عينة قصيرة",
                                desc: "سجل أو ارفع ملف صوتي واضح مدته 30 ثانية فقط بصوتك الطبيعي."
                            },
                            {
                                step: "02",
                                icon: <Wand2 className="w-8 h-8" />,
                                title: "المعالجة الفورية",
                                desc: "يقوم الذكاء الاصطناعي بتحليل بصمة صوتك، نبرتك، وإيقاع حديثك بدقة عالية."
                            },
                            {
                                step: "03",
                                icon: <Fingerprint className="w-8 h-8" />,
                                title: "استخدم صوتك",
                                desc: "اكتب أي نص وسينطق فوراً بصوتك المستنسخ. جاهز للتنزيل والاستخدام."
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-card p-8 rounded-2xl border border-border relative group">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-background border-2 border-purple-500 text-purple-500 rounded-full flex items-center justify-center font-black z-10">
                                    {item.step}
                                </div>
                                <div className="pt-6">
                                    <div className="mx-auto bg-purple-500/10 w-16 h-16 rounded-2xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Privacy Guarantee */}
            <section className="py-16">
                <div className="container mx-auto px-6">
                    <div className="bg-zinc-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 border border-zinc-800">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Lock className="w-8 h-8 text-green-500" />
                        </div>
                        <div className="flex-1 text-center md:text-start">
                            <h3 className="text-2xl font-bold text-white mb-2">أمان وخصوصية تامة</h3>
                            <p className="text-zinc-400">
                                نحن نأخذ بصمتك الصوتية على محمل الجد. بياناتك الصوتية مشفرة ولا يتم مشاركتها أبداً. أنت المالك الوحيد لصوتك المستنسخ وحقوق استخدامه.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
