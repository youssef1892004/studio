'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles, Gift, CheckCircle, UserPlus, Shield } from 'lucide-react';

function RegisterComponent() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasAgreed) {
      toast.error('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
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
    <div className="flex items-center justify-center min-h-screen bg-gray-50 relative overflow-hidden p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="mb-6 animate-fade-in-down">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg text-center">
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-5 h-5" />
              <span className="font-bold text-sm sm:text-base">🎉 سجل الآن واحصل على 14 يوم مجاناً! 🎉</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 animate-fade-in-up">
          
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-600 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-700 bg-clip-text text-transparent mb-2">
              إنشاء حساب جديد
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">انضم لآلاف المبدعين على منصتنا</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2 animate-fade-in-up-delay">
              <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                  required
                  placeholder="أدخل اسمك الكامل"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl shadow-sm transition-all duration-300 focus:outline-none ${
                    focusedField === 'name'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'name' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
            </div>

            <div className="space-y-2 animate-fade-in-up-delay-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  required
                  placeholder="example@domain.com"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl shadow-sm transition-all duration-300 focus:outline-none ${
                    focusedField === 'email'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                  focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'
                }`} />
              </div>
            </div>

            <div className="space-y-2 animate-fade-in-up-delay-3">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  required
                  minLength={6}
                  placeholder="6 أحرف على الأقل"
                  className={`w-full px-4 py-3 pr-12 border-2 rounded-xl shadow-sm transition-all duration-300 focus:outline-none ${
                    focusedField === 'password'
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3" />
                كلمة المرور يجب أن تكون 6 أحرف على الأقل
              </p>
            </div>

            <div className="animate-fade-in-up-delay-4">
              <div className="flex items-start gap-3 p-4 bg-gray-100 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  id="terms"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer mt-0.5 flex-shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
                  أوافق على{' '}
                  <Link href="/legal" target="_blank" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                    الشروط والأحكام وسياسة الخصوصية
                  </Link>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 space-y-2 animate-fade-in-up-delay-5 border border-blue-100">
              <p className="font-semibold text-gray-800 text-sm mb-3">ما ستحصل عليه:</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>14 يوم تجربة مجانية كاملة</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>60 دقيقة صوت عالي الجودة</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>جميع الميزات الاحترافية (Pro)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>بدون بطاقة ائتمان</span>
              </div>
            </div>

            <div className="animate-fade-in-up-delay-6">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    <>
                      إنشاء حساب مجاني
                      <ArrowLeft className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">أو</span>
            </div>
          </div>

          <div className="text-center animate-fade-in-up-delay-7">
            <p className="text-gray-600 text-sm sm:text-base">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors inline-flex items-center gap-1">
                سجل الدخول
                <Sparkles className="w-4 h-4 text-blue-500" />
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              <Shield className="w-4 h-4 text-green-600" />
              <span>بياناتك محمية بتشفير من الدرجة العسكرية</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center animate-fade-in-up-delay-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 rotate-180" />
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce 2s ease-in-out infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
        
        .animate-fade-in-up-delay {
          animation: fade-in-up 0.6s ease-out 0.1s backwards;
        }
        
        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 0.6s ease-out 0.15s backwards;
        }
        
        .animate-fade-in-up-delay-3 {
          animation: fade-in-up 0.6s ease-out 0.2s backwards;
        }
        
        .animate-fade-in-up-delay-4 {
          animation: fade-in-up 0.6s ease-out 0.25s backwards;
        }
        
        .animate-fade-in-up-delay-5 {
          animation: fade-in-up 0.6s ease-out 0.3s backwards;
        }
        
        .animate-fade-in-up-delay-6 {
          animation: fade-in-up 0.6s ease-out 0.35s backwards;
        }
        
        .animate-fade-in-up-delay-7 {
          animation: fade-in-up 0.6s ease-out 0.4s backwards;
        }
        
        .animate-fade-in-up-delay-8 {
          animation: fade-in-up 0.6s ease-out 0.45s backwards;
        }
      `}</style>
    </div>
  );
}

export default function RegisterPage() {
  return <RegisterComponent />;
}