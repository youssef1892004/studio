import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Zap, Users, Code, Sparkles, Rocket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'من نحن | Studio',
  description: 'تعرف على فريق ورؤية Studio، المشروع الرائد لتحويل النص إلى كلام عربي. تم تطويره بواسطة شركة غيمة لتمكين صناع المحتوى بأصوات عربية دقيقة.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      <div className="max-w-4xl mx-auto px-6 relative z-10">

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none"></div>

        {/* Header */}
        <div className="mb-12 text-center md:text-start">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            العودة إلى الرئيسية
          </Link>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            حول تطبيق <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">MuejamStudio</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            نحن نعيد تعريف كيفية إنشاء المحتوى الصوتي العربي باستخدام أحدث تقنيات الذكاء الاصطناعي التوليدي.
          </p>
        </div>

        {/* === Vision Section === */}
        <div className="grid gap-8 mb-12">
          <section className="p-8 rounded-3xl bg-card border border-border/50 shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary"><Zap className="w-6 h-6" /></div>
                القيادة والرؤية
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                <p>
                  تم إطلاق هذا المشروع الطموح بواسطة <span className="text-foreground font-semibold">شركة غيمة</span>، تحت القيادة التقنية للمهندس <span className="text-foreground font-semibold">قيس</span>.
                </p>
                <p>
                  رؤيتنا تتجاوز مجرد تحويل النص إلى كلام؛ نحن نبني نظاماً بيئياً متكاملاً للمبدعين العرب، حيث تتلاشى الحواجز التقنية أمام السرد القصصي الملهم.
                </p>
              </div>
            </div>
          </section>

          {/* === Tech Stack === */}
          <section className="p-8 rounded-3xl bg-card border border-border/50 shadow-xl">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Code className="w-6 h-6" /></div>
              التقنيات الأساسية
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Next.js 14', desc: 'أداء فائق وسرعة تحميل' },
                { label: 'Hasura Engine', desc: 'بيانات فورية وآمنة' },
                { label: 'FFmpeg Core', desc: 'معالجة الفيديو في المتصفح' },
                { label: 'AI Models', desc: 'نماذج صوتية متطورة' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-background border border-border/50 hover:border-primary/50 transition-colors flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mb-auto mt-2"></div>
                  <div>
                    <h3 className="font-bold text-foreground">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* === Team Section === */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-border/50 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center justify-center gap-3">
            <Users className="w-6 h-6 text-purple-500" />
            فريق التطوير المبدع
          </h2>
          <div className="flex flex-wrap justify-center gap-8">
            {['يوسف عيسى', 'طارق أحمد', 'عبد الصبور السبيعي'].map((member, i) => (
              <div key={i} className="group">
                <div className="w-24 h-24 mx-auto bg-zinc-800 rounded-full flex items-center justify-center text-2xl font-bold text-zinc-500 mb-4 border-2 border-transparent group-hover:border-primary transition-all group-hover:scale-110 shadow-lg">
                  {member.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-foreground">{member}</h3>
                <p className="text-xs text-primary font-mono mt-1">Full Stack Developer</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}