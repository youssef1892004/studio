'use client';

import { useState, useContext, useEffect } from "react";
import dynamic from 'next/dynamic';
import { ArrowLeft, Mic, Code, Database, Shield, Download, DollarSign, Gift, Zap, Sparkles, Globe, Layers, Image as ImageIcon, Video, Clapperboard, Wand2, Cpu, Music, Settings, Rocket, Megaphone, Check, X, Youtube } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import HeroDemo from '@/components/HeroDemo';

const FluidCta = dynamic(() => import('@/components/FluidCta'), {
  loading: () => <div className="h-96 w-full bg-muted/10 animate-pulse rounded-3xl container mx-auto" />,
  ssr: false
});

const EditorShowcase = dynamic(() => import('@/components/EditorShowcase'), {
  loading: () => <div className="h-[600px] w-full bg-muted/10 animate-pulse rounded-3xl container mx-auto" />,
  ssr: false
});

const MobileOptimizationWarning = dynamic(() => import('@/components/MobileOptimizationWarning'), { ssr: false });

export default function LandingPageClient() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const projectLink = user ? "/projects" : "/login";

  const [showPromoBar, setShowPromoBar] = useState(true);
  const [activeUseCase, setActiveUseCase] = useState<'creators' | 'marketers' | 'developers'>('creators');

  const useCases = {
    creators: {
      title: "لصناع المحتوى واليوتيوبرز",
      desc: "ضاعف إنتاجك من الفيديوهات. سواء كنت تدير قناة 'بدون وجه' (Faceless) أو بودكاست، وفر ساعات من التسجيل والمونتاج.",
      features: ["أصوات وثائقية عميقة", "تزامن تلقائي للفيديو", "تصدير 1080p"],
      link: "/solutions/content-creators",
      icon: <Youtube className="w-6 h-6" />,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    },
    marketers: {
      title: "للمسوقين ووكالات الإعلان",
      desc: "أطلق حملات إعلانية متعددة اللهجات في دقائق. خاطب كل عميل بلهجته المحلية لزيادة المبيعات.",
      features: ["30+ لهجة محلية", "تغيير الصيغ (A/B Testing)", "تكلفة دقيقة منخفضة"],
      link: "/solutions/marketers",
      icon: <Megaphone className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    developers: {
      title: "للمطورين والشركات الناشئة",
      desc: "ابنِ تطبيقات صوتية مذهلة باستخدام واجهة برمجة التطبيقات (API) الخاصة بنا. وثائق واضحة ودعم فني مباشر.",
      features: ["Low Latency API", "Webhooks", "SDKs جاهزة"],
      link: "/docs",
      icon: <Code className="w-6 h-6" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    }
  };

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
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-16 lg:gap-20 items-center w-full">

            {/* Left Column: Text & CTA */}
            <div className="flex flex-col items-start text-start space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 w-full max-w-full">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-primary/20 rounded-full px-3 py-1.5 sm:px-4 text-[10px] sm:text-sm font-medium text-primary mb-1 shadow-sm shadow-primary/10 backdrop-blur-sm ring-1 ring-primary/20 self-start">
                <Rocket className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                <span>الإصدار الجديد 2.0 متاح الآن!</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm flex flex-col gap-2 sm:gap-4 items-start leading-tight w-full max-w-full break-words">
                <span>اصنع فيديوهاتك بـ</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400 relative px-1 leading-relaxed pb-1 self-start inline-block">
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
                {/* Social Proof - Visible on Mobile now */}
                <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 text-sm text-muted-foreground bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                  <div className="flex -space-x-2 sm:-space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-background overflow-hidden relative z-0 hover:z-10 transition-all hover:scale-110 shadow-sm">
                        <Image
                          src={`/avatars/user${i}.png`}
                          alt={`User ${i}`}
                          fill
                          sizes="(max-width: 768px) 24px, 32px"
                          className="object-cover"
                        />
                      </div>
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
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">هندسة صوتية ذكية</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                لا مزيد من تداخل الأصوات. نظام ذكي يفصل صوت التعليق عن الموسيقى الخلفية مع عرض الموجات الصوتية (Waveforms) للمزامنة الدقيقة.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md font-medium">Music Track</span>
                <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md font-medium">Auto-Duration</span>
              </div>
            </div>

            {/* Card 3: Video Export */}
            <div className="bg-card border border-border/50 p-8 rounded-2xl hover:bg-muted/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-500 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-500/20 ring-1 ring-white/10">
                <Download className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">تصدير بجودة سينمائية</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                صدر فيديوهاتك بجودة تصل إلى 1080p و 60 إطار في الثانية (FPS). تحكم كامل في حجم الملف والجودة قبل التصدير.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-violet-500/10 text-violet-500 px-2 py-1 rounded-md font-medium">1080p FHD</span>
                <span className="text-xs bg-violet-500/10 text-violet-500 px-2 py-1 rounded-md font-medium">60 FPS</span>
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

      {/* Use Cases - Interactive Tabs */}
      <section className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">حلول مفصلة لكل مبدع</h2>
            <p className="text-muted-foreground">اختر مجالك واكتشف كيف يمكننا مساعدتك</p>
          </div>

          <div className="max-w-5xl mx-auto bg-card border border-border/50 rounded-3xl p-2 sm:p-4 shadow-2xl">
            {/* Tabs Header */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 border-b border-border/50 pb-4">
              {(Object.keys(useCases) as Array<keyof typeof useCases>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveUseCase(key)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all ${activeUseCase === key
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                    : 'hover:bg-muted text-muted-foreground'
                    }`}
                >
                  {useCases[key].icon}
                  {key === 'creators' ? 'صناع المحتوى' : key === 'marketers' ? 'المسوقين' : 'المطورين'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="grid md:grid-cols-2 gap-12 p-4 sm:p-8 items-center animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeUseCase}>
              <div className="space-y-6">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold w-fit ${useCases[activeUseCase].bg} ${useCases[activeUseCase].color} ${useCases[activeUseCase].border} border`}>
                  {useCases[activeUseCase].icon}
                  <span>الحل الأمثل</span>
                </div>
                <h3 className="text-3xl font-bold">{useCases[activeUseCase].title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {useCases[activeUseCase].desc}
                </p>
                <ul className="space-y-3">
                  {useCases[activeUseCase].features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">✓</div>
                      <span className="text-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href={useCases[activeUseCase].link} className="inline-flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4 mt-4 group">
                  اقرأ المزيد
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Visual Side */}
              <div className={`aspect-video rounded-2xl ${useCases[activeUseCase].bg} border ${useCases[activeUseCase].border} flex items-center justify-center relative overflow-hidden group`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20"></div>
                <Megaphone className={`w-32 h-32 ${useCases[activeUseCase].color} opacity-20 group-hover:scale-110 transition-transform duration-700`} />
                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm p-4 rounded-xl border border-border/50 text-sm font-mono opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                  {`> Initiating ${activeUseCase} module...`}
                  <br />
                  <span className="text-green-500">{`> Success! Efficiency boosted by 300%`}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Teaser */}
      <section className="py-24 bg-zinc-900/50 border-y border-white/5">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">لماذا ينتقل الجميع إلى <span className="text-primary">MuejamStudio</span>؟</h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                بينما تركز الأدوات العالمية على الإنجليزية، ركزنا نحن على لغتك. دقة في التشكيل، أداء طبيعي، وسعر يناسب منطقتنا.
              </p>
              <div className="flex gap-4">
                <Link href="/compare" className="btn btn-primary px-8 py-4 text-lg shadow-xl shadow-primary/10">
                  شاهد المقارنة الكاملة
                </Link>
                <Link href="/studio" className="btn bg-white/10 text-white hover:bg-white/20 px-8 py-4 text-lg">
                  جرب بنفسك
                </Link>
              </div>
            </div>

            {/* Mini Comparison Card */}
            <div className="bg-background rounded-3xl border border-border p-8 relative shadow-2xl">
              <div className="absolute -top-4 -right-4 bg-green-500 text-black font-bold px-4 py-1 rounded-full text-sm transform rotate-12">وفر 70%</div>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <span className="font-bold text-muted-foreground">الميزة</span>
                  <div className="flex gap-8 text-sm">
                    <span className="text-primary font-bold">Muejam</span>
                    <span className="text-muted-foreground">Others</span>
                  </div>
                </div>
                {[
                  { label: "دعم اللهجات", us: true, them: false },
                  { label: "التشكيل التلقائي", us: true, them: false },
                  { label: "الدفع المحلي", us: true, them: false },
                  { label: "تصدير الفيديو", us: true, them: "Limited" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex gap-12 items-center">
                      <span className="w-8 flex justify-center">{item.us ? <Check className="text-green-500 w-5 h-5" /> : item.us}</span>
                      <span className="w-8 flex justify-center text-muted-foreground text-xs">{item.them === false ? <X className="text-red-500 w-4 h-4 opacity-50" /> : item.them}</span>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* FAQ Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-foreground">الأسئلة الشائعة</h2>
            <p className="text-muted-foreground">إجابات على أهم استفسارات صناع المحتوى</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "ما هو MuejamStudio؟", a: "هو استوديو متكامل مدعوم بالذكاء الاصطناعي لإنشاء محتوى فيديو وصوت احترافي. يجمع بين تحويل النص إلى كلام (TTS)، استنساخ الأصوات، والمونتاج السحابي في واجهة واحدة." },
              { q: "هل تدعمون اللهجات العربية العامية؟", a: "نعم، هذا هو تخصصنا! ندعم أكثر من 30 لهجة محلية (مصرية، سعودية، إماراتية، شامية، مغاربية) بنطق طبيعي جداً يفهم السياق والتشكيل." },
              { q: "هل يحتاج البرنامج لمواصفات جهاز قوية؟", a: "لا، MuejamStudio يعمل بالكامل على المتصفح السحابي. يمكنك استخدامه من أي لابتوب أو حتى جهاز تابلت دون الحاجة لكرت شاشة قوي." },
              { q: "ما هي دقة استنساخ الصوت؟", a: "تصل الدقة إلى 95% من نبرة الصوت الأصلية. تحتاج فقط لتسجيل عينة قصيرة (30 ثانية) لإنشاء نسخة رقمية مطابقة لصوتك." },
              { q: "هل يمكنني استخدام الأصوات في يوتيوب (Monetization)؟", a: "بالتأكيد. جميع الأصوات التي تنتجها عبر خططنا المدفوعة تأتي مع حقوق ملكية تجارية كاملة تسمح لك بالربح من قنوات اليوتيوب والإعلانات." }
            ].map((item, i) => (
              <div key={i} className="border border-border/50 rounded-2xl bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <details className="group">
                  <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-6 text-foreground">
                    <span className="text-lg">{item.q}</span>
                    <span className="transition-transform group-open:rotate-180">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <div className="text-muted-foreground mt-0 px-6 pb-6 leading-relaxed border-t border-border/10 pt-4">
                    {item.a}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 w-full p-4 bg-background/80 backdrop-blur-lg border-t border-border md:hidden z-40">
        <button onClick={() => router.push(projectLink)} className="btn btn-primary w-full shadow-lg shadow-primary/20">
          جرب الاستوديو مجاناً الآن
        </button>
      </div>

      <MobileOptimizationWarning />

    </div >
  );
}