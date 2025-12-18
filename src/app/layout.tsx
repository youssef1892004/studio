// File path: src/app/layout.tsx

import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Script from 'next/script';
import ClientLayout from '@/components/ClientLayout';
import EnvInjector from '@/components/EnvInjector';

// Force rebuild for ChunkLoadError fix


const cairo = Cairo({ subsets: ["arabic"] });

// SEO Metadata Enhancement
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://studio.muejam.com'),
  title: {
    default: "MuejamStudio - AI Video Editor & Voice Studio | مونتاج ودبلجة بالذكاء الاصطناعي",
    template: "%s | MuejamStudio",
  },
  description: "استوديو شامل لصناعة المحتوى: مونتاج فيديو، دبلجة صوتية (Audio Dubbing)، استنساخ أصوات (Voice Cloning)، وتحويل النص إلى كلام (TTS) بلهجات عربية واقعية. اصنع فيديوهات احترافية في ثوانٍ.",
  keywords: [
    // Brand Identity
    'MuejamStudio', 'Muejam', 'Studio', 'AI Studio', 'Mo3jam', 'Muejam AI',
    'معجم استوديو', 'استوديو معجم', 'معجم', 'منصة معجم', 'موقع معجم للصوتيات',

    // Arabic Text to Speech (Core)
    'Text to Speech', 'TTS', 'Arabic TTS', 'Arabic Text to Speech', 'Speech Synthesis', 'Neural TTS',
    'تحويل النص إلى كلام', 'تحويل الكتابة إلى صوت', 'قارئ النصوص', 'قارئ النصوص العربية',
    'ناطق عربي', 'نطق النصوص', 'تشكيل النصوص', 'قراءة بالتشكيل', 'صوت عربي طبيعي',
    'أصوات عربية', 'أصوات خليجية', 'أصوات مصرية', 'أصوات شامية', 'أصوات مغاربية', 'أصوات سعودية',
    'معلق صوتي آلي', 'الذكاء الاصطناعي في الصوت', 'نصوص مسموعة',

    // Voice Cloning & Custom Voices
    'Voice Cloning', 'AI Voice Cloning', 'Custom Voice', 'Voice Replication', 'Instant Voice Clone', 'Voice Copy',
    'استنساخ الصوت', 'استنساخ الأصوات', 'تقليد الأصوات', 'نسخ نبرة الصوت', 'بصمة صوتية',
    'صوتك بالذكاء الاصطناعي', 'تغيير الصوت', 'محاكي الصوت', 'صناعة صوت خاص',

    // AI Audio Dubbing & Translation
    'AI Dubbing', 'Video Dubbing', 'Audio Dubbing', 'Video Translation', 'Auto Dub', 'Multilingual Dubbing',
    'دبلجة', 'دبلجة الفيديو', 'ترجمة الفيديو', 'دبلجة بالذكاء الاصطناعي', 'دبلجة تلقائية',
    'تغيير لغة الفيديو', 'مترجم الفيديوهات', 'تزامن الشفاه', 'ترجمة صوتية',

    // Online Video Editor
    'Video Editor', 'Online Video Editor', 'Cloud Video Editing', 'Browser Video Editor',
    'Timeline Editor', 'Video Maker', 'Montage Maker', 'Clip Maker', 'Video Production',
    'مونتاج', 'تعديل الفيديو', 'محرر فيديو اونلاين', 'برنامج مونتاج', 'صناعة الفيديو',
    'قص الفيديو', 'دمج الفيديو', 'اضافة صوت للفيديو', 'كتابة على الفيديو', 'شريط زمني',

    // Content Creation & Social Media
    'YouTube Video Maker', 'TikTok Editor', 'Reels Maker', 'Shorts Maker', 'Social Media Videos',
    'Faceless Channel', 'Cash Cow Channel', 'Viral Videos', 'Automation', 'Content Creator Tools',
    'صناعة محتوى', 'يوتيوب', 'تيك توك', 'ريلز', 'انستجرام', 'فيديوهات قصيرة',
    'قنوات بدون وجه', 'الربح من اليوتيوب', 'اوتوميشن', 'ترند', 'زيادة المشاهدات',

    // Use Cases (E-learning, Audiobooks, Marketing)
    'Audiobooks', 'E-learning', 'Explainer Videos', 'Marketing Videos', 'Ads', 'IVR', 'Podcasts',
    'Narration', 'Documentaries', 'Gaming Videos',
    'كتب صوتية', 'تسجيل كتب', 'تعليم إلكتروني', 'فيديوهات تعليمية', 'فيديوهات تسويقية',
    'إعلانات', 'الرد الآلي', 'بودكاست', 'تعليق صوتي', 'فويس اوفر', 'Voice Over', 'وثائقيات',

    // Technical & Quality
    'AI', 'Artificial Intelligence', 'Deep Learning', 'Generative AI', 'Realistic Voice', 'Human-like Voice',
    'High Fidelity Audio', 'Export 1080p', 'No Watermark',
    'ذكاء اصطناعي', 'تعلم عميق', 'توليد أصوات', 'صوت واقعي', 'جودة عالية', '4K Export', '1080p', 'بدون علامة مائية'
  ],
  creator: 'MuejamStudio Team',
  publisher: 'MuejamStudio',
  openGraph: {
    title: 'MuejamStudio - AI Video Editor & Voice Studio | مونتاج ودبلجة',
    description: 'استوديو شامل لصناعة المحتوى: مونتاج فيديو، دبلجة صوتية، استنساخ أصوات، وتحويل النص إلى كلام بلهجات عربية واقعية.',
    url: '/',
    siteName: 'MuejamStudio',
    images: [
      {
        url: '/og-share-image.png',
        width: 1200,
        height: 630,
        alt: 'MuejamStudio Interface - AI Video & Audio Editor',
      },
    ],
    locale: 'ar_EG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MuejamStudio - AI Video Editor & Voice Studio',
    description: 'استوديو شامل لصناعة المحتوى: مونتاج فيديو، دبلجة صوتية، استنساخ أصوات، وتحويل النص إلى كلام.',
    images: ['/og-share-image.png'],
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
    icon: [
      { url: '/logos/ms-logo-orange.png' },
      { url: '/logos/ms-logo-orange.png', sizes: '32x32', type: 'image/png' },
      { url: '/logos/ms-logo-orange.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/logos/ms-logo-orange.png',
    apple: [
      { url: '/logos/ms-logo-orange.png' },
      { url: '/logos/ms-logo-orange.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;

}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={cairo.className}>
        <EnvInjector
          env={{
            NEXT_PUBLIC_HASURA_GRAPHQL_URL: process.env['NEXT_PUBLIC_HASURA_GRAPHQL_URL'],
            NEXT_PUBLIC_HASURA_ADMIN_SECRET: process.env['NEXT_PUBLIC_HASURA_ADMIN_SECRET'],
            NEXT_PUBLIC_BASE_URL: process.env['NEXT_PUBLIC_BASE_URL'],
            NEXT_PUBLIC_POSTHOG_KEY: process.env['NEXT_PUBLIC_POSTHOG_KEY'],
            NEXT_PUBLIC_POSTHOG_HOST: process.env['NEXT_PUBLIC_POSTHOG_HOST'],
            NEXT_PUBLIC_WEBSITE_IS_FREE: process.env['NEXT_PUBLIC_WEBSITE_IS_FREE'],
          }}
        />

        <ClientLayout>
          {children}
        </ClientLayout>
        {/* Umami Analytics - Commented out to prevent CORP errors for now */}
        {/* <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="b3c8b995-c0f2-4e86-b0ce-a937cda2e208"
          strategy="afterInteractive"
        /> */}
        {/* Schema Markup for SEO */}
        <Script
          id="schema-markup"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "MuejamStudio",
              "headline": "AI Video Editor & Voice Studio",
              "alternateName": "معجم استوديو",
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Web Browser",
              "url": process.env.NEXT_PUBLIC_BASE_URL || 'https://studio.muejam.com',
              "description": "Professional AI-powered studio for video editing, voice cloning, audio dubbing, and realistic Arabic text-to-speech. Transform your content with advanced AI tools.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "seller": {
                  "@type": "Organization",
                  "name": "MuejamStudio"
                }
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "1250",
                "bestRating": "5",
                "worstRating": "1"
              },
              "featureList": [
                "Advanced Multi-track Video Timeline",
                "Realistic Arabic Text-to-Speech (TTS)",
                "Instant Voice Cloning Technology",
                "AI Audio Dubbing & Translation",
                "High Quality 1080p Video Export",
                "Browser-based Cloud Editing"
              ],
              "screenshot": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://studio.muejam.com'}/hero-modern.png`,
              "softwareRequirements": "Modern Web Browser (Chrome, Firefox, Safari, Edge)",
              "author": {
                "@type": "Organization",
                "name": "MuejamStudio Team",
                "url": "https://studio.muejam.com"
              }
            })
          }}
        />
      </body>
    </html>
  );
}