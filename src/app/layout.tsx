// File path: src/app/layout.tsx
import MobileBlocker from '@/components/MobileBlocker';
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import ClientLayout from '@/components/ClientLayout';


const cairo = Cairo({ subsets: ["arabic"] });

// SEO Metadata Enhancement
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: {
    default: "Studio - AI Voice Studio | استوديو صوت بالذكاء الاصطناعي لتحويل النص إلى كلام",
    template: "%s | Studio - AI Voice Studio",
  },
  description: "منصة Studio تتيح لك تحويل النصوص العربية إلى أصوات واقعية واحترافية باستخدام الذكاء الاصطناعي. أنشئ تعليقات صوتية، كتب مسموعة، ومحتوى صوتي عالي الجودة بسهولة. | Generate realistic Arabic text-to-speech AI voices with Studio.",
  keywords: [
    'تحويل النص إلى كلام', 
    'TTS', 
    'Arabic TTS', 
    'نص إلى صوت', 
    'صوت عربي', 
    'studio',
    'ai voice studio', 
    'توليد صوت', 
    'ذكاء اصطناعي صوت', 
    'AI voice',
    'النطق العربي',
    'صوت احترافي',
    'text to speech',
    'arabic voice',
    'AI voice generator',
    'realistic arabic voice',
    'voice synthesis',
    'content creation',
    'voice over',
    'e-learning audio',
    'narration',
    'audiobook recording',
    'الذكاء الاصطناعي الصوتي',
    'تحويل النص إلى صوت',
    'مولد الأصوات',
    'صوت بالذكاء الاصطناعي',
    'تعليق صوتي',
    'فويس اوفر',
    'تسجيل الكتب الصوتية',
    'صوت واقعي',
    'محرك تحويل النص إلى كلام',
    'إنشاء محتوى صوتي'
  ],
  creator: 'Studio Team',
  publisher: 'Studio',
  openGraph: {
    title: 'Studio - AI Voice Studio | استوديو صوت بالذكاء الاصطناعي',
    description: 'حوّل نصوصك العربية إلى أصوات طبيعية وواقعية باستخدام الذكاء الاصطناعي. جرب الآن!',
    url: '/',
    siteName: 'Studio',
    images: [
      {
        url: '/logos/logo.png', 
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Studio - AI Voice Studio | استوديو صوت بالذكاء الاصطناعي',
    description: 'منصة Studio تتيح لك تحويل النصوص العربية إلى أصوات واقعية واحترافية باستخدام الذكاء الاصطناعي.',
    images: ['/logos/logo.png'], 
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/logos/logo.png',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <MobileBlocker />
        <ClientLayout>
          {children}
        </ClientLayout>
        {/* Umami Analytics */}
        <Script 
          src="https://cloud.umami.is/script.js" 
          data-website-id="b3c8b995-c0f2-4e86-b0ce-a937cda2e208" 
          strategy="afterInteractive"
        />
        {/* Schema Markup for SEO */}
        <Script
          id="schema-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Studio",
            "url": process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/logos/logo.png`
          }) }}
        />
      </body>
    </html>
  );
}