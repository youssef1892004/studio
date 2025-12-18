import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "تسجيل الدخول | MuejamStudio",
    description: "سجل دخولك إلى استوديو معجم للصوتيات. ابدأ مشروعاً جديداً، تابع رصيدك، أو قم بترقية خطتك.",
    robots: { index: true, follow: true }
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
