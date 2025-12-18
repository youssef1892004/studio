import LandingPageClient from '@/components/LandingPageClient';
import Script from 'next/script';

export default async function LandingPage() {
  return (
    <>
      <LandingPageClient />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "ما هو MuejamStudio؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "هو استوديو متكامل مدعوم بالذكاء الاصطناعي لإنشاء محتوى فيديو وصوت احترافي. يجمع بين تحويل النص إلى كلام (TTS)، استنساخ الأصوات، والمونتاج السحابي في واجهة واحدة."
                }
              },
              {
                "@type": "Question",
                "name": "هل تدعمون اللهجات العربية العامية؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "نعم، هذا هو تخصصنا! ندعم أكثر من 30 لهجة محلية (مصرية، سعودية، إماراتية، شامية، مغاربية) بنطق طبيعي جداً يفهم السياق والتشكيل."
                }
              },
              {
                "@type": "Question",
                "name": "هل يحتاج البرنامج لمواصفات جهاز قوية؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "لا، MuejamStudio يعمل بالكامل على المتصفح السحابي. يمكنك استخدامه من أي لابتوب أو حتى جهاز تابلت دون الحاجة لكرت شاشة قوي."
                }
              },
              {
                "@type": "Question",
                "name": "ما هي دقة استنساخ الصوت؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "تصل الدقة إلى 95% من نبرة الصوت الأصلية. تحتاج فقط لتسجيل عينة قصيرة (30 ثانية) لإنشاء نسخة رقمية مطابقة لصوتك."
                }
              },
              {
                "@type": "Question",
                "name": "هل يمكنني استخدام الأصوات في يوتيوب (Monetization)؟",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "بالتأكيد. جميع الأصوات التي تنتجها عبر خططنا المدفوعة تأتي مع حقوق ملكية تجارية كاملة تسمح لك بالربح من قنوات اليوتيوب والإعلانات."
                }
              }
            ]
          })
        }}
      />
    </>
  );
}