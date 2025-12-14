import Script from 'next/script';

export default function EnvInjector({ env }: { env: Record<string, string | undefined> }) {
    return (
        <Script
            id="env-injector"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
                __html: `window.__ENV = ${JSON.stringify(env)};`,
            }}
        />
    );
}
