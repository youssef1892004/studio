'use client';

import { useState, useContext, useEffect } from "react";
import { ArrowLeft, Mic, Code, Database, Shield, Download, DollarSign, Gift, Zap, Sparkles, Globe, Layers, Image as ImageIcon, Video, Clapperboard, Wand2, Cpu } from "lucide-react";
import Image from 'next/image';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import HeroDemo from '@/components/HeroDemo';
import FluidCta from '@/components/FluidCta';
import EditorShowcase from '@/components/EditorShowcase';

export default function LandingPageClient() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const projectLink = user ? "/projects" : "/login";

  const [showPromoBar, setShowPromoBar] = useState(true);

  // Redirect if user is logged in
  useEffect(() => {
    if (user) {
      router.push('/projects');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20 selection:text-primary">


      {/* Hero Section */}
      <section className="relative pt-32 pb-32 lg:pt-48 lg:pb-48 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-modern.png"
            alt="Studio Abstract Background"
            fill
            className="object-cover opacity-20 pointer-events-none select-none blur-[2px]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left Column: Text & CTA */}
            <div className="text-center lg:text-left space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="inline-flex items-center gap-2 bg-muted/50 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-medium text-primary mb-2 shadow-sm shadow-primary/10 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                <span>مستقبل صناعة المحتوى العربي</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm flex flex-col gap-4 items-center lg:items-start">
                <span>استوديو شامل لـ</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 relative px-2 leading-relaxed pb-1">
                  الصوت، الصورة، والفيديو
                  {/* Underline decoration */}
                  <svg className="absolute w-full h-3 -bottom-1 right-0 text-primary opacity-50" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7509 2.49997 73.2509 1.49997 121.75 3.99997C153.383 5.63066 183.5 7.99997 198 7.99997" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground/90 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                منصة MuejamStudio تجمع لك أقوى أدوات الذكاء الاصطناعي في مكان واحد. حول نصوصك إلى أصوات واقعية، أنشئ صوراً مذهلة، وصمم فيديوهات احترافية بمحرر واحد متكامل.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <button
                  onClick={() => router.push(projectLink)}
                  className="btn btn-primary text-lg px-8 py-4 w-full sm:w-auto hover:scale-105 transition-transform shadow-xl shadow-primary/25"
                >
                  <span className="flex items-center gap-2">
                    جرب المحرر الشامل
                    <ArrowLeft className="w-5 h-5" />
                  </span>
                </button>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-zinc-700 flex items-center justify-center text-xs text-white">U{i}</div>
                    ))}
                  </div>
                  <p>انضم لـ 10,000+ صانع محتوى</p>
                </div>
              </div>
            </div>

            {/* Right Column: New Interactive Demo Player */}
            <div className="w-full perspective-1000 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-200">
              <HeroDemo />
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid - REFINED */}
      <section className="py-24 bg-muted/20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">لماذا تختار MuejamStudio؟</h2>
            <p className="text-muted-foreground text-lg">أكثر من مجرد أداة صوت. نحن نبني المحرر العربي الأول المتكامل للوسائط المتعددة.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Audio Engine */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-orange-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/20">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">محرك صوتي حصري</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                نمتلك 3 موديلات ذكاء اصطناعي حصرية تم تطويرها خصيصاً في MuejamStudio، بالإضافة لنموذج رابع احترافي للأداء العالي.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">100% عربي</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">لهجات متعددة</span>
              </div>
            </div>

            {/* Card 2: Image Gen (Coming Soon) */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-zinc-700">قريباً</div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/20">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">توليد الصور والمشاهد</h3>
              <p className="text-muted-foreground leading-relaxed">
                حوّل أفكارك إلى لوحات فنية ومشاهد واقعية. سنمكنك قريباً من بناء هوية بصرية كاملة لمشروعك بضغطة زر.
              </p>
            </div>

            {/* Card 3: Video Editor (Coming Soon) */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-zinc-700">قريباً</div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-rose-500/20">
                <Clapperboard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">صناعة الفيديو</h3>
              <p className="text-muted-foreground leading-relaxed">
                المحرر الشامل سيسمح لك بدمج الصوت والصورة وتحريكهم لإنتاج فيديوهات احترافية لليوتيوب والتيك توك دون مغادرة المنصة.
              </p>
            </div>

            {/* Card 4: Editor Interface */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">محرر متكامل (Editor)</h3>
              <p className="text-muted-foreground leading-relaxed">
                واجهة تحرير سهلة وقوية تشبه برامج المونتاج العالمية، صممت لتكون بسيطة للمبتدئين وقوية للمحترفين.
              </p>
            </div>

            {/* Card 5: Performance */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
                <Cpu className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">سرعة ومعالجة فائقة</h3>
              <p className="text-muted-foreground leading-relaxed">
                بنية تحتية قوية تضمن توليد المحتوى (Rendering) في ثوانٍ معدودة، مع دعم التصدير بأعلى جودة ممكنة.
              </p>
            </div>

            {/* Card 6: Ownership */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">حقوق ملكية وتجارية</h3>
              <p className="text-muted-foreground leading-relaxed">
                كل ما تنتجه على منصة MuejamStudio هو ملك لك 100%. استخدمه في مشاريعك التجارية، إعلاناتك، أو قنواتك بحرية تامة.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">كيف يعمل MuejamStudio؟</h2>
            <p className="text-muted-foreground">خطوات بسيطة تفصلك عن إنتاج محتواك القادم</p>
          </div>
          {/* Steps Grid - Updated Icons */}
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
            {[
              { step: "01", icon: <Mic className="w-6 h-6" />, title: "ابدأ بالصوت", desc: "اختر المؤدي الصوتي واكتب النص، وسيقوم محركنا الذكي بالأداء." },
              { step: "02", icon: <ImageIcon className="w-6 h-6" />, title: "أضف الصورة (قريباً)", desc: "ولد شخصيات ومشاهد تناسب النص الخاص بك لتعزيز القصة." },
              { step: "03", icon: <Clapperboard className="w-6 h-6" />, title: "انتج الفيديو (قريباً)", desc: "ادمج العناصر معاً في المحرر وقم بتصدير فيديو كامل." }
            ].map((s, i) => (
              <div key={i} className="text-center relative bg-background p-4 rounded-3xl border border-transparent hover:border-border/50 transition-colors">
                <div className="w-16 h-16 mx-auto bg-card border-2 border-primary text-primary rounded-2xl flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-primary/10 relative z-10 hover:rotate-6 transition-transform duration-300">
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{s.title}</h3>
                <p className="text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editor Showcase Section */}
      <EditorShowcase />

      {/* Fluid CTA Section */}
      <FluidCta />

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border pt-16 pb-8">
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
                <li><a href="#" className="hover:text-primary transition-colors">Text to Speech</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Voice Cloning</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Image Gen <span className="text-[10px] bg-primary/20 text-primary px-1 rounded ml-1">Soon</span></a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Video Editor <span className="text-[10px] bg-primary/20 text-primary px-1 rounded ml-1">Soon</span></a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">مصادر</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">المدونة</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">التوثيق</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">مساعدة</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">المجتمع</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">قانوني</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">الخصوصية</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">الشروط</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">الأمان</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} MuejamStudio. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA (Optional) */}
      <div className="fixed bottom-0 w-full p-4 bg-background/80 backdrop-blur-lg border-t border-border md:hidden z-50">
        <button onClick={() => router.push(projectLink)} className="btn btn-primary w-full shadow-lg shadow-primary/20">
          جرب مجاناً الآن
        </button>
      </div>

    </div>
  );
}