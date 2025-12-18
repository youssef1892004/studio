import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'MuejamStudio - AI Video Editor',
        short_name: 'MuejamStudio',
        description: 'استوديو شامل لصناعة المحتوى: مونتاج فيديو، دبلجة صوتية، استنساخ أصوات، وتحويل النص إلى كلام.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#ea580c', // Primary Orange
        icons: [
            {
                src: '/logos/ms-logo-orange.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logos/ms-logo-orange.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
        orientation: 'portrait',
        scope: '/',
        lang: 'ar',
        categories: ['productivity', 'utilities', 'photo & video'],
    };
}
