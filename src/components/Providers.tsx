
// src/components/Providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    capture_pageview: false, // We're capturing pageviews manually
  })
}

export function PostHogPageview(): JSX.Element {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (pathname) {
            let url = window.origin + pathname;
            if (searchParams && searchParams.toString()) {
                url = url + `?${searchParams.toString()}`;
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
        if (user) {
            posthog.identify(user.id, {
                email: user.email,
                name: user.displayName,
            })
        }
    }, [user])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
