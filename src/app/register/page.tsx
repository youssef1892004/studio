'use client';

import { useState, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowRight, Sparkles, Wand2, Chrome, Github, Check, AlertCircle, Phone } from 'lucide-react';
import Image from 'next/image';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const router = useRouter();
  const authContext = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!displayName || !email || !password || !phoneNumber) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      toast.error('يجب الموافقة على الشروط والأحكام للمتابعة');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password, phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل التسجيل.');
      }

      toast.success('تم إنشاء الحساب بنجاح! جاري تحويلك لتسجيل الدخول.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ غير متوقع أثناء التسجيل.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">

      {/* Right Side - Visual Area (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-modern.png"
            alt="Studio Background"
            fill
            className="object-cover opacity-30 mix-blend-color-dodge blur-sm"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 via-zinc-900/90 to-primary/20" />
          {/* Animated Blobs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-500/20 rounded-full blur-[80px] animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-[80px] animate-blob animation-delay-2000" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-primary/20 border border-primary/20 backdrop-blur-md px-4 py-2 rounded-full text-primary-foreground text-sm font-medium">
            <Wand2 className="w-4 h-4 text-orange-400" />
            <span className="text-white">أطلق العنان لإبداعك</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight text-right">
            اصنع المستحيل مع <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">الذكاء الاصطناعي</span>
          </h1>

          <div className="space-y-4 text-right">
            {[
              "توليد فوري للصوت البشري",
              "تحرير الفيديو والصور",
              "نصوص لا محدودة باللغة العربية",
              "تصدير بجودة 4K و WAV"
            ].map((feat, i) => (
              <div key={i} className="flex items-center justify-end gap-3 text-white/80">
                <span>{feat}</span>
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-green-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Founder/User Quote Style Card */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 mt-8 text-right relative">
            <div className="absolute -top-3 -right-3 text-4xl text-primary opacity-50">"</div>
            <p className="text-white/90 font-light italic mb-4">
              MuejamStudio ساعدني في إنتاج أكثر من 50 حلقة بودكاست في وقت قياسي. الجودة لا تصدق!
            </p>
            <div className="flex items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-white font-bold text-sm">محمد علي</div>
                <div className="text-white/40 text-xs">صانع محتوى تقني</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden relative border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <Link href="/" className="absolute top-8 right-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm z-20">
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <div className="w-full max-w-[420px] space-y-8 animate-fade-in-up md:delay-200 my-auto">

          <div className="text-center lg:text-right space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">إنشاء حساب جديد</h2>
            <p className="text-muted-foreground">ابدأ فترتك التجريبية المجانية (14 يوم) الآن</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="name">الاسم الكامل</label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${focusedField === 'name' ? 'opacity-100' : 'opacity-0'}`} />
                <input
                  id="name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  required
                  className="relative w-full px-4 py-3 pr-10 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none placeholder:text-muted-foreground/40 font-mono text-sm"
                  placeholder="أحمد محمد"
                  dir="rtl"
                />
                <User className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'name' ? 'text-primary' : 'text-muted-foreground/50'}`} />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">البريد الإلكتروني</label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  required
                  className="relative w-full px-4 py-3 pl-10 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none placeholder:text-muted-foreground/40 font-mono text-sm"
                  placeholder="name@example.com"
                  dir="ltr"
                />
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'email' ? 'text-primary' : 'text-muted-foreground/50'}`} />
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="phone">رقم الهاتف</label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${focusedField === 'phone' ? 'opacity-100' : 'opacity-0'}`} />
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField('')}
                  required
                  className="relative w-full px-4 py-3 pl-10 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none placeholder:text-muted-foreground/40 font-mono text-sm"
                  placeholder="+20 1X XXX XXXX"
                  dir="ltr"
                />
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'phone' ? 'text-primary' : 'text-muted-foreground/50'}`} />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">كلمة المرور</label>
              <div className="relative group">
                <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  required
                  minLength={6}
                  className="relative w-full px-4 py-3 pl-10 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none placeholder:text-muted-foreground/40 font-mono text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground/50'}`} />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                يجب أن تكون كلمة المرور 6 أحرف على الأقل
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2 pt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary bg-background"
                />
              </div>
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                أوافق على <Link href="/legal" target="_blank" className="text-primary hover:underline font-medium">الشروط والأحكام</Link>، وأقر بأنني قرأت <Link href="/about" target="_blank" className="text-primary hover:underline font-medium">من نحن</Link> و <Link href="/docs" target="_blank" className="text-primary hover:underline font-medium">التوثيق</Link>.
              </label>
            </div>

            <button
              type="submit"
              className="w-full btn btn-primary py-4 text-base rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] mt-4"
              disabled={isLoading}
            >
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب مجاناً'}
            </button>

            <p className="text-center text-sm text-muted-foreground pt-4">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-primary font-bold hover:underline transition-colors">
                تسجيل الدخول
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}