import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Youtube, Mic, Video, Wand2, TrendingUp, DollarSign } from 'lucide-react';

export const metadata: Metadata = {
    title: 'لصناع المحتوى واليوتيوبرز | MuejamStudio',
    description: 'ضاعف إنتاجك من الفيديوهات باستخدام الذكاء الاصطناعي. الحل الأمثل لقنوات "بدون وجه" (Faceless Channels)، البودكاست، والريلز.',
    keywords: ['قنوات بدون وجه', 'الربح من اليوتيوب', 'صناعة محتوى', 'تيك توك', 'بودكاست', 'فويس اوفر'],
};

export default function ContentCreatorsPage() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <div className="max-w-6xl mx-auto px-6 relative z-10">

                {/* Hero Section */}
                <div className="text-center mb-20 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

                    <span className="inline-block py-1 px-3 rounded-full bg-red-500/10 text-red-500 text-sm font-bold mb-6 border border-red-500/20">
                        🚀 الحل رقم 1 لليوتيوبرز العرب
                    </span>
                    <h1 className="text-4xl md:text-7xl font-extrabold mb-8 tracking-tight leading-tight">
                        حول قناتك إلى <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">ماكينة مشاهدات</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
                        لا تحتاج لمايكروفون غالي أو استوديو عازل للصوت. اصنع وثائقيات، قصص، وفيديوهات شرح (Explainer Videos) بصوت احترافي في دقائق.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Link href="/projects" className="btn btn-primary text-lg px-8 py-4 shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                            ابدأ صناعة المحتوى مجاناً
                        </Link>
                    </div>
                </div>

                {/* Problems & Solutions Grid */}
                <div className="grid md:grid-cols-2 gap-12 mb-24 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold mb-4">وداعاً لعوائق صناعة المحتوى التقليدية</h2>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                <Mic className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">تسجيل الصوت متعب ومكلف</h3>
                                <p className="text-muted-foreground">التأتأة، ضوضاء الخلفية، والحاجة لإعادة التسجيل مرات عديدة... كلها انتهت. اكتب النص واحصل على صوت نقي 100%.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">المعلقون الصوتيون مكلفون</h3>
                                <p className="text-muted-foreground">بدلاً من دفع 50$ للدقيقة، احصل على ساعات من التعليق الصوتي القابل للربح (Monetizable) بجزء بسيط من التكلفة.</p>
                            </div>
                        </div>
                    </div>

                    {/* Visual/Image Placeholder */}
                    <div className="relative h-[400px] rounded-3xl bg-zinc-900 border border-zinc-800 p-8 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
                        <div className="text-center relative z-10">
                            <Youtube className="w-24 h-24 mx-auto text-red-500 mb-6 drop-shadow-2xl" />
                            <div className="text-2xl font-bold">Faceless YouTube Automation</div>
                            <p className="text-zinc-500 mt-2">النموذج الأسرع نمواً في 2025</p>
                        </div>
                    </div>
                </div>

                {/* Use Cases Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-24">
                    {[
                        { icon: <Video />, title: "قنوات القصص والوثائقيات", desc: "أصوات رخيمة وعميقة تناسب سرد القصص التاريخية والغموض." },
                        { icon: <TrendingUp />, title: "قنوات التلخيص والأخبار", desc: "أصوات سريعة وحماسية لتلخيص المباريات، الأفلام، أو أخبار الترند." },
                        { icon: <Wand2 />, title: "فيديوهات تعليمية (How-to)", desc: "شروحات واضحة بلهجة بيضاء مفهومة لجميع العرب." }
                    ].map((card, i) => (
                        <div key={i} className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all hover:-translate-y-1">
                            <div className="w-14 h-14 rounded-xl bg-zinc-800 flex items-center justify-center text-primary mb-6">
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                        </div>
                    ))}
                </div>

                {/* CTA Footer */}
                <div className="rounded-[3rem] bg-gradient-to-r from-zinc-900 to-black border border-zinc-800 p-12 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">جاهز لإطلاق قناتك؟</h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">انضم لآلاف المبدعين الذين يستخدمون MuejamStudio لتحقيق الدخل السلبي من المحتوى.</p>
                        <Link href="/login?source=creators_page" className="btn btn-primary text-lg px-10 py-5 rounded-full">
                            أنشئ أول فيديو الآن
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
