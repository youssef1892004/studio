import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Mic, Globe, Zap, Play, CheckCircle2, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'تحويل النص إلى كلام عربي (Arabic TTS) | أصوات طبيعية بالذكاء الاصطناعي',
    description: 'أفضل برنامج تحويل النص إلى كلام (TTS) يدعم اللهجات العربية (المصرية، السعودية، الخليجية) مع تشكيل تلقائي للنص. اصنع تعليقاً صوتياً (Voice Over) لليوتيوب، الكتب الصوتية، والرد الآلي IVR بجودة بشرية 100%.',
    keywords: ['تحويل النص إلى كلام', 'Arabic TTS', 'Text to Speech Arabic', 'قارئ النصوص العربية', 'أصوات ذكاء اصطناعي', 'دبلجة آلية', 'تشكيل النصوص', 'فويس اوفر مجاني', 'برنامج ناطق عربي'],
};

export default function TextToSpeechPage() {
    return (
        <div className="bg-background text-foreground min-h-screen pt-24 font-sans">

            {/* Hero Section */}
            <section className="relative overflow-hidden pb-20 pt-10">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
                                <Mic className="w-4 h-4" />
                                <span>Text to Speech 2.0</span>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
                                حول كلماتك إلى <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                                    صوت ينبض بالحياة
                                </span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                أقوى محرك لتحويل النص إلى كلام (TTS) مخصص للغة العربية. يدعم التشكيل التلقائي، النطق الصحيح للأسماء، وتعدد اللهجات بلمسة زر واحدة.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/studio" className="btn btn-primary px-8 py-3 text-lg font-bold flex items-center justify-center gap-2">
                                    جرب مجاناً الآن
                                    <ArrowLeft className="w-5 h-5" />
                                </Link>
                                <Link href="#features" className="px-8 py-3 rounded-xl border border-border hover:bg-muted font-bold text-center transition-colors">
                                    اكتشف المميزات
                                </Link>
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            {/* Visual representation of TTS */}
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
                                <div className="space-y-4">
                                    {/* Mock Audio Player */}
                                    <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl">
                                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white">
                                            <Play className="w-6 h-6 fill-current" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 bg-border rounded-full w-full overflow-hidden">
                                                <div className="h-full bg-primary w-2/3"></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>00:15</span>
                                                <span>00:45</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Preview */}
                                    <div className="bg-background p-4 rounded-xl border border-border/50 text-right font-serif text-lg leading-loose">
                                        "أهلاً بكم في MuejamStudio. حيث يلتقي الإبداع بالذكاء الاصطناعي لإنتاج محتوى عربي استثنائي."
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] right-[0%] w-[30%] h-[50%] bg-orange-500/5 rounded-full blur-[120px]"></div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-muted/20">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">لماذا تقنية MuejamStudio هي الأفضل؟</h2>
                        <p className="text-muted-foreground">صممنا نماذجنا الصوتية خصيصاً لفهم تعقيدات اللغة العربية</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Globe className="w-8 h-8 text-blue-500" />,
                                title: "دعم اللهجات العربية",
                                desc: "مصرية، سعودية، خليجية، شامية، ومغربية. اختر اللهجة التي تناسب جمهورك."
                            },
                            {
                                icon: <Zap className="w-8 h-8 text-yellow-500" />,
                                title: "تشكيل تلقائي ذكي",
                                desc: "لا تقلق بشأن النحو. محركنا يضيف التشكيل للنص تلقائياً لضمان نطق سليم 100%."
                            },
                            {
                                icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
                                title: "نبرات عاطفية",
                                desc: "تحكم في نبرة الصوت: حماسي، هادئ، حزين، أو إخباري رسمي."
                            },
                        ].map((feature, i) => (
                            <div key={i} className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-all">
                                <div className="mb-6 bg-background w-16 h-16 rounded-xl flex items-center justify-center border border-border/50 shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden text-center">
                <div className="container mx-auto px-6 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">جاهز لتجربة الصوت العربي الجديد؟</h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        انضم لآلاف صناع المحتوى وابدأ في إنتاج تعليق صوتي احترافي خلال ثوانٍ.
                    </p>
                    <Link href="/studio" className="btn btn-primary px-10 py-4 text-xl font-bold shadow-2xl shadow-primary/30 inline-flex items-center gap-3 hover:scale-105 transition-transform">
                        <Mic className="w-6 h-6" />
                        ابدأ التجربة المجانية
                    </Link>
                </div>
            </section>

        </div>
    );
}
