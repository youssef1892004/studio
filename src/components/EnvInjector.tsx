'use client';

import { useEffect } from 'react';

export default function EnvInjector({ env }: { env: Record<string, string | undefined> }) {
    if (typeof window !== 'undefined') {
        (window as any).__ENV = { ...((window as any).__ENV || {}), ...env };
    }

    return (
        <script
            id="env-injector"
            dangerouslySetInnerHTML={{
                __html: `window.__ENV = ${JSON.stringify(env)};`,
            }}
        />
    );
}
