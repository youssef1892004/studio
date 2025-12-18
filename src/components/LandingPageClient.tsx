'use client';

import { useState, useContext, useEffect } from "react";
import { ArrowLeft, Mic, Code, Database, Shield, Download, DollarSign, Gift, Zap, Sparkles, Globe, Layers, Image as ImageIcon, Video, Clapperboard, Wand2, Cpu, Music, Settings, Rocket } from "lucide-react";
import Image from 'next/image';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import HeroDemo from '@/components/HeroDemo';
import FluidCta from '@/components/FluidCta';
import EditorShowcase from '@/components/EditorShowcase';
import MobileOptimizationWarning from '@/components/MobileOptimizationWarning';

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
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-48 overflow-hidden">
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

        <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-24 lg:gap-20 items-center w-full">

            {/* Left Column: Text & CTA */}
            <div className="flex flex-col items-start text-start space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 w-full max-w-full">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-primary/20 rounded-full px-3 py-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-primary mb-1 shadow-sm shadow-primary/10 backdrop-blur-sm ring-1 ring-primary/20 self-start">
                <Rocket className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                <span>الإصدار الجديد 2.0 متاح الآن!</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm flex flex-col gap-2 sm:gap-4 items-start leading-tight w-full max-w-full break-words">
                <span>اصنع فيديوهاتك بـ</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400 relative px-1 leading-relaxed pb-1 self-start inline-block">
                  ذكاء وقوة لا مثيل لها
                  {/* Underline decoration */}
                  <svg className="absolute w-full h-2 sm:h-3 -bottom-1 right-0 text-primary opacity-50" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.7509 2.49997 73.2509 1.49997 121.75 3.99997C153.383 5.63066 183.5 7.99997 198 7.99997" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                </span>
              </h1>

              <p className="text-sm sm:text-xl text-muted-foreground/90 max-w-xl leading-relaxed font-light break-words whitespace-normal w-full">
                استوديو MuejamStudio الجديد كلياً. هندسة صوتية دقيقة، خط زمن (Timeline) متعدد المسارات، وتصدير بجودة 1080p فوراً من متصفحك. كل ما تحتاجه لصناعة محتوى يبهر جمهورك.
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-start gap-4 sm:gap-6 pt-4 sm:pt-6 w-full">
                <button
                  onClick={() => router.push(projectLink)}
                  className="btn btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full max-w-[280px] sm:max-w-xs sm:w-auto hover:scale-105 transition-all shadow-xl shadow-primary/25 ring-2 ring-transparent hover:ring-primary/50"
                >
                  <span className="flex items-center justify-center gap-2 font-bold">
                    جرب الاستوديو مجاناً
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                </button>

                {/* Social Proof - Visible on Mobile now */}
                <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 text-sm text-muted-foreground bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                  <div className="flex -space-x-2 sm:-space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background bg-zinc-700 flex items-center justify-center text-[8px] sm:text-[10px] text-white font-bold relative z-0 hover:z-10 transition-all">U{i}</div>
                    ))}
                  </div>
                  <p className="font-medium whitespace-nowrap text-xs sm:text-sm">انضم لـ 10,000+ مبدع</p>
                </div>
              </div>
            </div>

            {/* Right Column: New Interactive Demo Player */}
            <div className="w-full perspective-1000 animate-in fade-in slide-in-from-bottom-20 duration-1000 delay-200 lg:mt-0">
              <HeroDemo />
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid - REFINED */}
      <section className="py-24 bg-muted/20 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">قوة سطح المكتب، بمرونة المتصفح</h2>
            <p className="text-muted-foreground text-lg">لم تعد بحاجة لتحميل برامج ثقيلة. MuejamStudio يضع بين يديك أدوات المونتاج الاحترافية في مكان واحد.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: Multi-Track Timeline */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">Timeline متعدد المسارات</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                تحكم كامل في الفيديو: مسارات منفصلة للفيديو، النصوص، المؤثرات الصوتية، والموسيقى. رتب أفكارك بدقة المحترفين.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md font-medium">Drag & Drop</span>
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md font-medium">Split & Trim</span>
              </div>
            </div>

            {/* Card 2: Advanced Audio */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20 ring-1 ring-white/10">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">هندسة صوتية ذكية</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                لا مزيد من تداخل الأصوات. نظام ذكي يفصل صوت التعليق عن الموسيقى الخلفية مع عرض الموجات الصوتية (Waveforms) للمزامنة الدقيقة.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md font-medium">Music Track</span>
                <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-md font-medium">Auto-Duration</span>
              </div>
            </div>

            {/* Card 3: Video Export */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-rose-500/20 ring-1 ring-white/10">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">تصدير بجودة سينمائية</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                صدر فيديوهاتك بجودة تصل إلى 1080p و 60 إطار في الثانية (FPS). تحكم كامل في حجم الملف والجودة قبل التصدير.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-1 rounded-md font-medium">1080p FHD</span>
                <span className="text-xs bg-rose-500/10 text-rose-500 px-2 py-1 rounded-md font-medium">60 FPS</span>
              </div>
            </div>

            {/* Card 4: Audio Engine (Original) */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-500/20">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">أصوات عربية حصرية</h3>
              <p className="text-muted-foreground leading-relaxed">
                مكتبة ضخمة من الأصوات العربية والخليجية والمصرية المطورة بالذكاء الاصطناعي، تمنح محتواك هوية فريدة لا تتوفر في أي مكان آخر.
              </p>
            </div>

            {/* Card 5: Performance & Privacy */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group">
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg ring-1 ring-white/10">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">سرعة وخصوصية قصوى</h3>
              <p className="text-muted-foreground leading-relaxed">
                تقنية WebAssembly (WASM) تسمح بمعالجة وتصدير الفيديو داخل جهازك مباشرة. ملفاتك لا تغادر متصفحك أبداً أثناء الدمج، لسرعة وأمان تام.
              </p>
            </div>

            {/* Card 6: Image Gen */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-zinc-800 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-zinc-700">تحديث قادم</div>
              <div className="w-14 h-14 bg-zinc-800 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">توليد الصور بالذكاء الاصطناعي</h3>
              <p className="text-muted-foreground leading-relaxed">
                نعمل حالياً على دمج أقوى نماذج توليد الصور مباشرة داخل المحرر، لتبني هوية بصرية كاملة لمشروعك بضغطة زر.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">كيف يعمل الاستوديو؟</h2>
            <p className="text-muted-foreground">ثلاث خطوات بسيطة لتحويل فكرتك إلى فيديو احترافي</p>
          </div>
          {/* Steps Grid - Updated Icons */}
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -z-10" />
            {[
              { step: "01", icon: <Mic className="w-6 h-6" />, title: "أنشئ الصوت", desc: "اكتب النص واختر صوتاً من مكتبتنا الحصرية، وسيقوم الـ AI بتوليده فوراً." },
              { step: "02", icon: <Layers className="w-6 h-6" />, title: "رتب المشاهد", desc: "اسحب الصور، الفيديوهات، والموسيقى إلى Timeline ورتبها بتناغم تام." },
              { step: "03", icon: <Download className="w-6 h-6" />, title: "تصدير فوري", desc: "اضغط تصدير، اختر الجودة (حتى 1080p)، وحمل الفيديو جاهزاً للنشر." }
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

      {/* Legacy/Other Sections kept for completeness */}
      <EditorShowcase />
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
                <li><a href="#" className="hover:text-primary transition-colors">Video Editor <span className="text-[10px] bg-green-500/20 text-green-500 px-1 rounded ml-1">New</span></a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">مصادر</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">المدونة</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">التوثيق</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">مساعدة</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-foreground">قانوني</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">الخصوصية</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">الشروط</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} MuejamStudio. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 w-full p-4 bg-background/80 backdrop-blur-lg border-t border-border md:hidden z-40">
        <button onClick={() => router.push(projectLink)} className="btn btn-primary w-full shadow-lg shadow-primary/20">
          جرب الاستوديو مجاناً الآن
        </button>
      </div>

      <MobileOptimizationWarning />

    </div>
  );
}