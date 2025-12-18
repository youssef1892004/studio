import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studio.muejam.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/studio/',
                '/projects/',
                '/checkout/',
                '/api/',
                '/admin/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
