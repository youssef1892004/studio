import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "إنشاء حساب جديد | MuejamStudio",
    description: "انضم إلى MuejamStudio مجاناً. احصل على رصيد مجاني لتجربة دبلجة الفيديو، استنساخ الأصوات، وتحويل النص إلى كلام.",
    keywords: ['تسجيل حساب', 'حساب مجاني', 'تجربة مجانية', 'MuejamStudio Sign up'],
    robots: { index: true, follow: true }
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
