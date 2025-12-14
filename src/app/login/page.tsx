'use client';
import { useState, useContext, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, Sparkles, Gift, CheckCircle, ArrowRight, Github, Chrome } from 'lucide-react';
import Image from 'next/image';

function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const router = useRouter();
  const authContext = useContext(AuthContext);
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'unauthorized') {
      toast.error('يجب تسجيل الدخول أولاً للوصول إلى هذه الصفحة.');
    }
  }, [searchParams]);

  if (!authContext) {
    throw new Error('AuthContext must be used within an AuthProvider');
  }

  const { login } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('تم تسجيل الدخول بنجاح!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.');
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
            className="object-cover opacity-40 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-zinc-900/80 to-zinc-900" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/90 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>الجيل القادم من الإنتاج</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight">
            مرحباً بك في <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">MuejamStudio</span>
          </h1>

          <p className="text-lg text-white/60 leading-relaxed font-light">
            المكان الذي تلتقي فيه رؤيتك الإبداعية مع قوة الذكاء الاصطناعي. انضم لأكثر من 10,000 مبدع يغيرون شكل المحتوى العربي.
          </p>

          {/* Mini Showcase Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-2xl text-start hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-white font-bold text-sm">أدوات ذكية</h3>
              <p className="text-white/40 text-xs mt-1">وفر 90% من وقت المونتاج</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 p-4 rounded-2xl text-start hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                <Gift className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-white font-bold text-sm">تجربة مجانية</h3>
              <p className="text-white/40 text-xs mt-1">وصول كامل لمدة 14 يوم</p>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <Link href="/" className="absolute top-8 right-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-sm z-20">
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <div className="w-full max-w-[420px] space-y-8 animate-fade-in-up md:delay-200">

          <div className="text-center lg:text-right space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">تسجيل الدخول</h2>
            <p className="text-muted-foreground">أدخل بياناتك للمتابعة إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

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

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground" htmlFor="password">كلمة المرور</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">نسيت كلمة المرور؟</Link>
              </div>
              <div className="relative group">
                <div className={`absolute inset-0 bg-primary/5 rounded-xl transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  required
                  className="relative w-full px-4 py-3 pl-10 pr-10 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none placeholder:text-muted-foreground/40 font-mono text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === 'password' ? 'text-primary' : 'text-muted-foreground/50'}`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button" // Disabled for now, just visual
              className="w-full btn btn-primary py-4 text-base rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>

            <p className="text-center text-sm text-muted-foreground pt-4">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-primary font-bold hover:underline transition-colors">
                أنشئ حساب مجاناً
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <LoginComponent />
    </Suspense>
  );
}