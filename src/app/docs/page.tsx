// src/app/docs/page.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DocsPage() {
  return (
    // الخلفية والتنسيقات الأساسية للوضع الداكن/الفاتح
    <div className="min-h-screen pt-16 bg-background text-foreground transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-8">

        {/* زر العودة إلى الرئيسية */}
        <Link
          href="/"
          className="flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة إلى الرئيسية
        </Link>

        <h1 className="text-4xl font-bold mb-6 border-b border-border pb-3">
          دليل التوثيق و API
        </h1>

        {/* === قسم البدء === */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">1. البدء</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              مرحباً بك! تتيح لك خدمتنا تحويل النصوص العربية إلى صوت بجودة عالية باستخدام بنية GraphQL آمنة.
              للبدء، تأكد من أن متغيرات البيئة الخاصة بخدمة TTS مضبوطة بشكل صحيح  .
            </p>

            <h3 className="text-xl font-medium mt-6 text-foreground">المصادقة</h3>
            <p>
              تتم المصادقة عبر <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">/api/auth/token</code> لتوليد رمز JWT، والذي يستخدمه التطبيق تلقائياً في طلبات API الداخلية.
            </p>
          </div>
        </section>

        {/* === قسم توليد الصوت === */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-foreground mb-4">2. توليد الصوت (TTS)</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              عملية التوليد غير متزامنة وتمر بثلاث خطوات أساسية (تدار داخلياً بواسطة التطبيق):
            </p>
            <ul className="list-disc list-inside p-4 rounded-lg bg-card border border-border">
              <li><strong className="text-foreground">إنشاء المهمة:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">/api/tts/generate-segment</code> يبدأ المهمة ويعيد <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">job_id</code>.</li>
              <li><strong className="text-foreground">التحقق من الحالة (Polling):</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">/api/tts/status/[job_id]</code> للتحقق المستمر من الحالة (Completed/Failed).</li>
              <li><strong className="text-foreground">جلب النتيجة:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">/api/tts/result/[job_id]</code> يسترد الملف الصوتي النهائي (MP3).</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 text-foreground">الميزة المتقدمة: Pro Arabic</h3>
            <p>
              عند تفعيل زر &quot;Pro Arabic&quot;، يتم استخدام مزود التشكيل المتقدم. يُرجى ملاحظة أن هذه الميزة تتطلب معالجة إضافية وقد تستغرق وقتاً أطول لإكمال التوليد.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}