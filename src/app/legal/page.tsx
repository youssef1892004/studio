import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Lock, DollarSign, Users, Code, Hammer } from 'lucide-react';

export const metadata: Metadata = {
    title: 'السياسات والشروط القانونية',
    description: 'سياسة الخصوصية، شروط الاستخدام، الملكية الفكرية، وسياسة الدفع لمنصة Voice Studio.',
    robots: { index: true, follow: true },
};

// Helper component for policy sections
const PolicySection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; id?: string }> = ({ title, children, icon, id }) => (
    <section id={id} className="mb-12 p-8 rounded-3xl bg-card border border-border/50 shadow-xl scroll-mt-32 transition-all hover:border-primary/20">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 text-foreground pb-4 border-b border-border/50">
            <div className="p-2 bg-primary/10 rounded-xl text-primary md:scale-110">{icon}</div>
            {title}
        </h2>
        <div className="space-y-6 text-muted-foreground leading-loose text-lg">
            {children}
        </div>
    </section>
);

// Helper component for policy subsections
const PolicySubsection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-background/50 p-6 rounded-2xl border border-border/30">
        <h3 className="text-xl font-bold mt-2 mb-4 text-foreground flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary rounded-full inline-block"></span>
            {title}
        </h3>
        {children}
    </div>
);

export default function LegalPage() {
    return (
        <div className="min-h-screen pt-24 pb-20 bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
            <div className="max-w-5xl mx-auto px-6 relative z-10">

                <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-l from-primary/5 to-transparent blur-[120px] -z-10 rounded-full pointer-events-none"></div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-10 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    العودة إلى الرئيسية
                </Link>

                <div className="mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
                        السياسات والشروط <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">القانونية</span>
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                        آخر تحديث: 02/10/2025. يرجى مراجعة هذه الوثائق بدقة لضمان حقوقك وفهم التزاماتك عند استخدام منصتنا.
                    </p>
                </div>

                {/* --- 1. سياسة الخصوصية --- */}
                <PolicySection title="سياسة الخصوصية" icon={<Lock className="w-7 h-7" />} id="privacy">
                    <p>نحن نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية. تنطبق هذه السياسة على جميع الخدمات التي تقدمها عبر موقع Voice Studio وخدمات الواجهات البرمجية.</p>

                    <PolicySubsection title="1.1 جمع البيانات">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، بيانات الفوترة والدفع (عند الاشتراك).</li>
                            <li><strong>مدخلات المستخدم:</strong> النصوص التي تدخلها، الملفات الصوتية التي ترفعها، أي بيانات منتجة (مخرجات صوتية).</li>
                            <li><strong>بيانات تقنية:</strong> عنوان IP، نوع المتصفح / الجهاز، سجلات الاستخدام، معرفات الأداء (logs).</li>
                            <li><strong>ملفات تعريف الارتباط:</strong> كوكيز ضرورية وتحليلية ووظائفية.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="1.2 استخدام البيانات">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>تشغيل الخدمة وتسليم المخرجات الصوتية للمستخدم.</li>
                            <li>تحسين نماذج الذكاء الاصطناعي (التدريب والتحليل الإحصائي بما يحترم خصوصية البيانات).</li>
                            <li>الأمن ومنع الاحتيال ومكافحة إساءة الاستخدام.</li>
                            <li>التواصل الإداري، إشعارات النظام، وتنبيهات الحساب.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="1.3 مشاركة البيانات">
                        <p>لا نبيع بيانات المستخدمين أو نؤجرها. قد نشارك أجزاء من البيانات مع:</p>
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>مزودي خدمات الدفع (Pay Mob أو Accept) لمعالجة المعاملات.</li>
                            <li>مزودي الاستضافة والسحابة (Ghayma Systems) وفق اتفاقيات معالجة بيانات (DPA).</li>
                            <li>مزودي التحليلات أو خدمات الدعم التقني لضمان تشغيل الخدمة.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="1.4 الاحتفاظ والأمن">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>نحتفظ بالبيانات فقط للفترة اللازمة لتقديم الخدمة أو للالتزامات القانونية، ثم نقوم بحذفها أو إخفاء هويتها.</li>
                            <li>نطبق ضوابط أمنية تقنية وإدارية: التشفير أثناء النقل (TLS 1.2/1.3)، تشفير قواعد البيانات عند الحاجة، وضوابط وصول مبنية على الدور.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="1.5 حقوق المستخدمين">
                        <p className="font-semibold text-sm mb-2 text-primary/80">(خاصة بمستخدمي الاتحاد الأوروبي)</p>
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>الحق في الوصول، التصحيح، المحو (حق النسيان)، تقييد المعالجة، ونقل البيانات.</li>
                            <li>لسحب الموافقة إن اعتمدت المعالجة بناءً عليها.</li>
                            <li>للشكاوى يمكن الاتصال بمسؤول حماية البيانات على ghaymah.systems أو تقديم شكوى لدى سلطة الحماية المحلية.</li>
                        </ul>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 2. شروط الاستخدام --- */}
                <PolicySection title="شروط الاستخدام" icon={<BookOpen className="w-7 h-7" />} id="terms">
                    <p>تنظم هذه الشروط العلاقة بين المستخدم و Voice Studio: باستخدامك للخدمة، تكون قد قبلت هذه الشروط وسياسة الخصوصية والسياسات ذات الصلة.</p>

                    <PolicySubsection title="2.1 الأهلية">
                        <p>يجب أن تكون قادراً قانونياً على إبرام عقد. لا توجه الخدمة للأطفال دون سن القانون المحلي (عادة 13 عاماً أو أعلى).</p>
                    </PolicySubsection>

                    <PolicySubsection title="2.2 الوصول والاستخدام المسموح">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>تمنح للمستخدمين ترخيصاً محدوداً غير حصري لاستخدام الواجهة والخدمات وفقاً لهذه الشروط.</li>
                            <li>تظل ملكية المدخلات (النصوص) للمستخدم، بينما تمنح Voice Studio ترخيصاً مؤقتاً لمعالجتها لأغراض تشغيل الخدمة.</li>
                            <li>المخرجات الصوتية مرخصة للاستخدام وفق الخطة المشتراة ونطاق الترخيص الموضح في لوحة التحكم.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="2.3 القيود والامتناع">
                        <p>يحظر على المستخدم:</p>
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>محاولة عكس هندسة الأنظمة (Reverse Engineering) أو استنساخ النماذج.</li>
                            <li>استخدام الخدمة لارتكاب جرائم أو نشر محتوى يخالف القوانين أو ينتهك حقوق الغير.</li>
                            <li>مشاركة مفاتيح API أو استخدام المفاتيح بطريقة تؤدي لإساءة الاستخدام.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="2.4 التعويض وحدود المسؤولية">
                        <p>يتعهد المستخدم بتعويض الشركة عن أية مطالبات ناتجة عن خرق هذه الشروط. مسؤولية الشركة محدودة إلى أقصى حد يسمح به القانون.</p>
                    </PolicySubsection>

                    <PolicySubsection title="2.5 التعديلات والإنهاء">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>نحتفظ بالحق في تعديل هذه الشروط في أي وقت مع نشر التغييرات. استمرار الاستخدام بعد التعديل يعني الموافقة.</li>
                            <li>يمكن للشركة تعليق أو إنهاء الحسابات في حالة الخروقات الجسيمة.</li>
                        </ul>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 3. سياسة الملكية الفكرية --- */}
                <PolicySection title="سياسة الملكية الفكرية" icon={<Code className="w-7 h-7" />}>
                    <PolicySubsection title="3.1 ملكية المنصة">
                        <p>جميع الحقوق المتعلقة بالبرمجيات، النماذج، الخوارزميات، الكود المصدري والشعارات محفوظة لـ Voice Studio أو المرخصين لها.</p>
                    </PolicySubsection>

                    <PolicySubsection title="3.2 حقوق المستخدم في المدخلات والمخرجات">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>تبقى نصوصك وملفاتك الخاصة مملوكة لك، وتمنح الشركة ترخيصاً لتقديم الخدمة.</li>
                            <li>المخرجات الصوتية مرخصة للاستخدام بناءً على الخطة المتفق عليها.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="3.3 إخطار الانتهاك وإزالة المحتوى">
                        <p>في حال تلقي إخطار قانوني (مثل DMCA) بانتهاك حقوق، سنراجع الإخطار وقد نزيل المحتوى أو نقيد الوصول وفق الإجراءات القانونية السارية.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 4. سياسة الاستخدام المقبول --- */}
                <PolicySection title="سياسة الاستخدام المقبول" icon={<Hammer className="w-7 h-7" />}>
                    <PolicySubsection title="4.1 ممارسات محظورة">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>استخدام الخدمة لتوليد أو نشر محتوى يحض على العنف أو الإرهاب أو الكراهية.</li>
                            <li>انتحال هوية أشخاص حقيقيين أو شخصيات عامة بدون موافقة.</li>
                            <li>إنشاء أو توزيع مواد مزيفة (deepfakes) بقصد الاحتيال.</li>
                            <li>استغلال المنصة في عمليات احتيال مالي.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="4.2 المراقبة والإجراءات التصحيحية">
                        <p>نطبق نظم مراقبة آلية لاكتشاف إساءة الاستخدام مع اتخاذ الإجراءات اللازمة مثل إغلاق الحساب.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 5. سياسة الدفع واسترداد الأموال --- */}
                <PolicySection title="سياسة الدفع واسترداد الأموال" icon={<DollarSign className="w-7 h-7" />}>
                    <PolicySubsection title="5.1 الفوترة والرسوم">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>تقدم الخدمات عبر خطط اشتراك شهرية / سنوية أو نموذج ائتماني باستهلاك.</li>
                            <li>تحتسب الضرائب المحلية بحسب موقع الفوترة.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="5.2 سياسة الاسترداد">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>يمكن طلب استرداد خلال 7 أيام من الدفع إذا لم يتجاوز استهلاك الخدمة 10%.</li>
                            <li>في حال الخلل التقني من جانبنا، قد نمنح استرداداً كلياً أو جزئياً.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="5.3 آليات إعادة الأموال">
                        <p>طلبات الاسترداد تقدم عبر دعم العملاء مع إرفاق رقم الفاتورة وتفاصيل المشكلة.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 6. ما بعد البيع والدعم --- */}
                <PolicySection title="الدعم وما بعد البيع" icon={<Users className="w-7 h-7" />}>
                    <PolicySubsection title="6.1 الدعم الفني">
                        <ul className="list-disc list-inside space-y-2 marker:text-primary">
                            <li>قنوات الدعم: نظام تذاكر، بريد إلكتروني، ودعم SLA للمؤسسات.</li>
                            <li>الرد الأولي خلال 24-48 ساعة عمل.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="6.2 الشكاوى">
                        <p>على العميل تقديم شكوى مكتوبة خلال 7 أيام من وقوع المشكلة، وسنلتزم بالرد خلال 15 يوم عمل.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 8. القانون والاختصاص --- */}
                <PolicySection title="القانون والاختصاص" icon={<BookOpen className="w-7 h-7" />}>
                    <p>تخضع هذه السياسات لقوانين <strong>جمهورية مصر العربية</strong>. في حال النزاع تختص محاكم <strong>العريش</strong>.</p>
                </PolicySection>

                {/* --- 9. معلومات الاتصال --- */}
                <PolicySection title="معلومات الاتصال" icon={<Users className="w-7 h-7" />}>
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                        <p className="mb-4 text-lg">للاستفسارات أو الشكاوى، نحن هنا للمساعدة:</p>
                        <ul className="list-none space-y-3">
                            <li className="flex items-center gap-3">
                                <span className="bg-primary/20 p-1.5 rounded-lg text-primary text-xs font-bold">EMAIL</span>
                                <a href="mailto:support@muejam.com" className="text-foreground hover:text-primary transition-colors font-mono">support@muejam.com</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="bg-primary/20 p-1.5 rounded-lg text-primary text-xs font-bold">DPO</span>
                                <span className="text-muted-foreground">ghaymah.systems</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="bg-primary/20 p-1.5 rounded-lg text-primary text-xs font-bold">LOC</span>
                                <span className="text-muted-foreground">القاهرة، مصر</span>
                            </li>
                        </ul>
                    </div>
                </PolicySection>
            </div>
        </div>
    );
}