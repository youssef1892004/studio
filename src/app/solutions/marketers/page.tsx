import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Megaphone, Target, BarChart3, Globe, Languages, Zap, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
    title: 'للمسوقين والمعلنين | MuejamStudio',
    description: 'قم بإنشاء إعلانات صوتية وفيديوهات ترويجية بلهجات متعددة وتكلفة منخفضة. الحل الأمثل لوكالات التسويق والتجارة الإلكترونية.',
    keywords: ['تسويق إلكتروني', 'إعلانات', 'فويس اوفر إعلاني', 'دبلجة إعلانات', 'توطين المحتوى'],
};

export default function MarketersPage() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <div className="max-w-6xl mx-auto px-6 relative z-10">

                {/* Hero Section */}
                <div className="text-center mb-20 relative">
                    <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-blue-500/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

                    <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold mb-6 border border-blue-500/20">
                        📣 للمسوقين ووكلات الدعاية
                    </span>
                    <h1 className="text-4xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                        أطلق حملاتك الإعلانية <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">بسرعة الصوت</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                        أنشئ نسخاً متعددة من إعلاناتك بلهجات مختلفة (سعودي، مصري، إماراتي) في دقائق، واختبر أداءها (A/B Testing) بأقل تكلفة.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/projects" className="btn bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 shadow-xl shadow-blue-500/20 rounded-xl transition-all">
                            جرب التعليق الصوتي للإعلانات
                        </Link>
                    </div>
                </div>

                {/* Benefits Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-blue-500/30 transition-all">
                        <Globe className="w-12 h-12 text-blue-500 mb-6" />
                        <h3 className="text-xl font-bold mb-3">توطين المحتوى (Localization)</h3>
                        <p className="text-muted-foreground">لا تستخدم إعلاناً واحداً لكل العرب. كلم عملاءك في الرياض باللهجة النجدية، وفي القاهرة باللهجة المصرية لزيادة معدل التحويل (Conversion Rate).</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-blue-500/30 transition-all">
                        <Zap className="w-12 h-12 text-yellow-500 mb-6" />
                        <h3 className="text-xl font-bold mb-3">سرعة التنفيذ (Time to Market)</h3>
                        <p className="text-muted-foreground">بدلاً من انتظار المعلق الصوتي لأيام، احصل على التسجيل فوراً. عدل النص وأعد التوليد في ثوانٍ لتواكب الترندات.</p>
                    </div>

                    <div className="p-8 rounded-3xl bg-card border border-border/50 hover:border-blue-500/30 transition-all">
                        <DollarSign className="w-12 h-12 text-green-500 mb-6" />
                        <h3 className="text-xl font-bold mb-3">وفر 90% من الميزانية</h3>
                        <p className="text-muted-foreground">تكلفة الدقيقة الواحدة لدينا تعادل جزءاً بسيطاً من تكلفة الاستوديوهات التقليدية، مما يتيح لك ميزانية أكبر للإنفاق الإعلاني.</p>
                    </div>
                </div>

                {/* Use Cases Section with Side-by-Side */}
                <div className="space-y-24 mb-24">
                    {/* Case 1: E-commerce */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 order-2 md:order-1">
                            <h2 className="text-3xl font-bold mb-4">فيديوهات المنتجات (E-commerce)</h2>
                            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                                للمتاجر الإلكترونية والدروب شيبنج. حول صور منتجاتك إلى فيديوهات تيك توك وريلز جذابة مع تعليق صوتي حماسي ومؤثرات صوتية.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> إنتاج ضخم (Bulk Creation)</li>
                                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> أصوات حماسية للبيع</li>
                            </ul>
                        </div>
                        <div className="flex-1 h-[300px] bg-gradient-to-br from-blue-900/20 to-black rounded-3xl border border-blue-500/10 flex items-center justify-center order-1 md:order-2">
                            <BarChart3 className="w-32 h-32 text-blue-500/50" />
                        </div>
                    </div>

                    {/* Case 2: Explainer Videos */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 h-[300px] bg-gradient-to-br from-purple-900/20 to-black rounded-3xl border border-purple-500/10 flex items-center justify-center">
                            <Languages className="w-32 h-32 text-purple-500/50" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-3xl font-bold mb-4">فيديوهات الشرح (Explainer Videos)</h2>
                            <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                                اشرح خدمات شركتك SaaS أو التطبيق الخاص بك بصوت هادئ وواثق يبعث على المصداقية والاحترافية.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> نبرات صوت رسمية ومحترفة</li>
                                <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> دقة في نطق المصطلحات التقنية</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* CTA Footer */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-8">هل أنت جاهز لتغيير قواعد التسويق؟</h2>
                    <Link href="/register" className="btn bg-white text-black hover:bg-gray-200 text-lg px-12 py-4 rounded-full font-bold shadow-xl transition-all">
                        أنشئ حساب أعمال مجاني
                    </Link>
                </div>

            </div>
        </div>
    );
}
