// src/components/Providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getEnv } from '@/lib/env'

// Init moved to PHProvider to avoid hydration mismatch by injecting scripts during render

export function PostHogPageview(): JSX.Element {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            let url = window.origin + pathname;
            if (searchParams && searchParams.toString()) {
                url = url + `? ${searchParams.toString()} `;
            }
            posthog.capture("$pageview", {
                $current_url: url,
            });
        }
    }, [pathname, searchParams]);

    return <></>;
}


export function PHProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth()

    useEffect(() => {
        // Initialize PostHog client-side only
        const key = getEnv('NEXT_PUBLIC_POSTHOG_KEY');
        const host = getEnv('NEXT_PUBLIC_POSTHOG_HOST');

        if (key && !posthog.__loaded) {
            posthog.init(key, {
                api_host: host,
                debug: process.env.NODE_ENV === 'development',
                capture_pageview: false,
            });
        }
    }, []);

    useEffect(() => {
        if (user) {
            posthog.identify(user.id, {
                email: user.email,
                name: user.displayName,
            })
        }
    }, [user])

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
