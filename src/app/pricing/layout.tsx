import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "خطط الأسعار | MuejamStudio",
    description: "اختر الخطة المناسبة لك. خطط مرنة للأفراد، الشركات، وصناع المحتوى. ادفع بالجنية المصري أو الدولار.",
    keywords: ['أسعار MuejamStudio', 'اشتراك شهري', 'خطط الأسعار', 'دفع فودافون كاش', 'تسعير الدبلجة'],
    robots: { index: true, follow: true }
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
