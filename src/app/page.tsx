'use client';
import { useState, useEffect, useRef, useMemo, useContext } from "react";
import { ArrowLeft, Play, Mic, Code, Database, Shield, Edit, Download, DollarSign, CheckCircle, Star, Gift, Clock, Zap, Sparkles } from "lucide-react";
import Image from 'next/image';
import { AuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const projectLink = user ? "/projects" : "/login";

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentVoice, setCurrentVoice] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showPromoBar, setShowPromoBar] = useState(true);

    const voiceExamples = useMemo(() => [
        { name: "أحمد", dialect: "مصري", 
            text: "أول موقع في الوطن العربي متخصص في AI Studio", 
            audioUrl: "/generated_audio/1.mp3" 
        },
        { name: "محمد", dialect: "مغربي", 
            text: "مرحباً بك في مشروعك الجديد", 
            audioUrl: "/generated_audio/3.mp3" 
        }
    ], []);

    useEffect(() => {
        if (user) {
            router.push('/projects');
        }
    }, [user, router]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (currentVoice < voiceExamples.length - 1) {
                setCurrentVoice(prev => prev + 1);
            } else {
                setCurrentVoice(0);
                setIsPlaying(false);
            }
        };

        audio.addEventListener('ended', handleEnded);

        if (isPlaying) {
            const currentUrl = voiceExamples[currentVoice].audioUrl;
            if (audio.src !== currentUrl) {
                audio.src = currentUrl;
                audio.load();
            }
            
            audio.play().catch(e => {
                console.error("Audio play failed:", e);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
        
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
        
    }, [isPlaying, currentVoice, voiceExamples]);

    if (user) {
        return null; 
    }

    const handlePlayDemo = () => {
        if (voiceExamples.length === 0) return;

        if (!isPlaying && currentVoice === voiceExamples.length - 1) {
            setCurrentVoice(0);
        }

        setIsPlaying(prev => !prev);
    };

    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 overflow-hidden">
        <audio ref={audioRef} />

        {showPromoBar && (
          <div className="relative bg-blue-600 text-white py-3 px-6 overflow-hidden">
            <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3 flex-1 justify-center">
                <Gift className="w-6 h-6" />
                <span className="font-semibold text-base">
                  🎉 عرض خاص: جميع الخدمات مجانية لمدة أسبوعين! 🎉
                </span>
              </div>
              <button 
                onClick={() => setShowPromoBar(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <section className="relative z-10 text-center px-6 py-20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float-delayed"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-bold mb-8 shadow-sm border border-green-200">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span>مجاني تماماً لمدة 14 يوم</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight animate-fade-in-up">
              منصة الذكاء الاصطناعي الصوتي
              <span className="block mt-4">الأكثر واقعية</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up-delay">
              حوّل أفكارك لمحتوى صوتي احترافي بدعم الذكاء الاصطناعي.
              <span className="block mt-2">إنتاج سريع دون الحاجة لمعدات أو خبرة تقنية.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-up-delay-2">
              <a
                href={projectLink}
                className="group relative inline-flex items-center justify-center px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <span className="relative flex items-center">
                  ابدأ الآن مجانًا
                  <ArrowLeft className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </a>
              
              <a 
                href="/pricing"
                className="group inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 font-medium text-lg rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <DollarSign className="ml-2 h-5 w-5" />
                شاهد جميع الخطط
              </a>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 max-w-3xl mx-auto shadow-xl transition-all duration-300">
              <div className="text-right mb-6">
                <div className="text-gray-500 text-sm mb-2">تجربة الصوت الحالي:</div>
                <div className="text-2xl font-bold text-gray-900">
                  {voiceExamples[currentVoice].name} - {voiceExamples[currentVoice].dialect}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-2xl p-6 text-lg leading-relaxed mb-6 border-r-4 border-blue-500 text-gray-800">
                {voiceExamples[currentVoice].text}
              </div>
              
              <div className="flex justify-center gap-3 mb-6">
                {voiceExamples.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      index === currentVoice ? 'bg-blue-500 scale-125' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <button 
                onClick={handlePlayDemo}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center justify-center shadow-md hover:shadow-lg"
              >
                <Play className={`ml-2 h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                {isPlaying ? 'جاري التشغيل...' : 'تشغيل العينة'}
              </button>
            </div>
          </div>
        </section>

        <section className="relative z-10 py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 animate-fade-in-up">Easy to use APIs that scale</h2>
            <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto animate-fade-in-up-delay">
              نماذج الصوت الذكي الرائدة، قوية وقابلة للتوسع وسريعة التكامل.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center group animate-fade-in-up-delay">
                <div className="bg-gray-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-110">
                  <Code className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Python and TypeScript SDKs</h3>
                <p className="text-gray-600">انتقل إلى الإنتاج بسرعة</p>
              </div>
              
              <div className="text-center group animate-fade-in-up-delay-2">
                <div className="bg-gray-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-110">
                  <Shield className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">GDPR & SOC II compliant</h3>
                <p className="text-gray-600">آمن ومتوافق</p>
              </div>
              
              <div className="text-center group animate-fade-in-up-delay-3">
                <div className="bg-gray-100 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-110">
                  <Database className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Enterprise Ready</h3>
                <p className="text-gray-600">مصمم للمؤسسات الكبيرة</p>
              </div>
            </div>
            
            <div className="mt-12">
              <a href="/docs" className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all duration-300 transform hover:scale-105 shadow-md">
                READ THE DOCS
              </a>
            </div>
          </div>
        </section>

        <section className="relative z-10 py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ابدأ إنتاجك الاحترافي في 3 خطوات</h2>
            <p className="text-xl text-blue-600 font-semibold mb-12">✨ مجاني تماماً لمدة أسبوعين ✨</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
              
              <div className="relative p-8 bg-white rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-fade-in-up border-t-4 border-blue-500">
                <span className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 shadow-md">1</span>
                <div className="flex items-center justify-end mb-4">
                    <Mic className="w-8 h-8 text-blue-600 ml-3" />
                    <h3 className="text-xl font-bold text-gray-900">اختر صوتك ونمطك</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">أضف النصوص الخاصة بك، ثم اختر صوتاً من الأصوات الاحترافية (Pro) التي تضمن أعلى جودة تشكيل ودقة في النطق.</p>
              </div>
              
              <div className="relative p-8 bg-white rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-fade-in-up-delay border-t-4 border-green-500">
                <span className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 shadow-md">2</span>
                <div className="flex items-center justify-end mb-4">
                    <Edit className="w-8 h-8 text-green-600 ml-3" />
                    <h3 className="text-xl font-bold text-gray-900">حرر صوتك بالكامل</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">استخدم شريط الزمن التفاعلي لقص المقاطع، حذف الأجزاء غير المرغوب فيها، وتطبيق التشكيل الآلي المتقدم.</p>
              </div>
              
              <div className="relative p-8 bg-white rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-300 hover:shadow-xl animate-fade-in-up-delay-2 border-t-4 border-blue-500">
                <span className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xl font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-gray-50 shadow-md">3</span>
                <div className="flex items-center justify-end mb-4">
                    <Download className="w-8 h-8 text-blue-600 ml-3" />
                    <h3 className="text-xl font-bold text-gray-900">دمج وتنزيل فوري</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">قم بدمج جميع المقاطع التي أنشأتها في ملف MP3 واحد عالي الجودة، جاهز للاستخدام الفوري في مشاريعك.</p>
              </div>

            </div>
          </div>
        </section>
        
        <section className="relative z-10 py-20 px-6 bg-white">
            <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">قارن الميزات</h2>
                <p className="text-xl text-green-600 font-semibold mb-12 flex items-center justify-center gap-2">
                  <Gift className="w-6 h-6" />
                  جميع الخدمات مجانية لمدة أسبوعين!
                </p>
                
                <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-200">
                    <table className="min-w-full bg-white text-right">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-3 sm:px-8 sm:py-5 text-base sm:text-lg font-bold text-gray-800 border-l border-gray-200">الميزة</th>
                                <th className="px-4 py-3 sm:px-8 sm:py-5 text-base sm:text-lg font-bold text-gray-600 border-l border-gray-200">الخطة المجانية</th>
                                <th className="px-4 py-3 sm:px-8 sm:py-5 text-base sm:text-lg font-bold bg-blue-600 text-white">الخطة الاحترافية (Pro)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-gray-200 hover:bg-blue-50/50 transition-colors">
                                <td className="px-4 py-3 sm:px-8 sm:py-5 font-medium text-gray-800 border-l border-gray-200">مدة الصوت/الرصيد</td>
                                <td className="px-4 py-3 sm:px-8 sm:py-5 text-gray-700 border-l border-gray-200">15 دقيقة شهرياً</td>
                                <td className="px-4 py-3 sm:px-8 sm:py-5 font-bold text-green-600 flex items-center justify-end gap-2">
                                  <Zap className="w-5 h-5" />
                                  ساعة كاملة (60 دقيقة)
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200 hover:bg-blue-50/50 transition-colors">
                                <td className="px-4 py-3 sm:px-8 sm:py-5 font-medium text-gray-800 border-l border-gray-200">جودة التشكيل الآلي</td>
                                <td className="px-4 py-3 sm:px-8 sm:py-5 text-red-500 border-l border-gray-200">أساسي</td>
                                <td className="px-4 py-3 sm:px-8 sm:py-5 font-bold text-blue-600 flex items-center justify-end gap-2">
                                    <Star className="w-5 h-5 fill-current" />
                                    تشكيل آلي متقدم (Pro)
                                </td>
                            </tr>
                            <tr className="border-t border-gray-200 hover:bg-blue-50/50 transition-colors">
                                <td className="px-4 py-3 sm:px-8 sm:py-5 font-medium text-gray-800 border-l border-gray-200">تحرير الشريط الزمني</td>
                                <td className="px-4 py-3 sm:px-8 sm:py-5 text-red-500 border-l border-gray-200">غير متاح</td>
                                <td className="px-4 py-3 sm:px-8 sm:py-5 font-bold text-green-600 flex items-center justify-end gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    قص وحذف المقاطع
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <section className="relative z-10 py-24 px-6 text-center bg-blue-700 text-white overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float-delayed"></div>
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold mb-6">
              <Gift className="w-5 h-5" />
              <span>عرض لفترة محدودة: 14 يوم مجاناً!</span>
            </div>

            <h2 className="text-5xl font-bold mb-6 animate-fade-in-up">
              ابدأ تجربتك مع أول
              <span className="block mt-2">AI Studio عربي اليوم</span>
            </h2>
            
            <p className="text-xl mb-12 max-w-2xl mx-auto opacity-90 animate-fade-in-up-delay">
              انضم إلى آلاف صناع المحتوى الذين يثقون في منصتنا لإنتاج محتوى صوتي استثنائي
            </p>
            
            <a
              href={projectLink}
              className="group inline-flex items-center justify-center px-16 py-5 bg-white text-blue-600 hover:bg-gray-100 font-bold text-xl rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 animate-fade-in-up-delay-2"
            >
              جرّب مجانًا الآن
              <ArrowLeft className="mr-4 h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            
            <p className="text-sm opacity-75 mt-6">
              لا حاجة لبطاقة ائتمان • ابدأ خلال دقائق • جميع الخدمات مجانية لمدة أسبوعين
            </p>
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg animate-slide-up">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-gray-800 font-semibold hidden md:flex items-center gap-2">
                    <Gift className="w-5 h-5 text-green-600" />
                    <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      عرض خاص: 14 يوم مجاناً!
                    </span>
                </div>
                <div className="flex flex-1 justify-end gap-4">
                     <a 
                        href="/pricing"
                        className="inline-flex items-center justify-center px-5 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-xl transition-all transform hover:scale-105"
                      >
                        <DollarSign className="ml-2 h-4 w-4" />
                        شاهد الأسعار
                      </a>
                      <a
                        href={projectLink}
                        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-105"
                      >
                        ابدأ مجانًا
                      </a>
                </div>
            </div>
        </div>

        <footer className="relative z-10 border-t border-gray-200 py-12 px-6 bg-gray-100">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-3xl font-bold text-blue-700 mb-6">
              AI Voice Studio
            </div>
            <div className="flex justify-center space-x-4 rtl:space-x-reverse mb-4 text-gray-600 text-sm">
                <a href="/legal" className="hover:text-blue-600 transition-colors">Legal Policies</a>
                <a href="/about" className="hover:text-blue-600 transition-colors">About Us</a>
                <a href="/docs" className="hover:text-blue-600 transition-colors">Docs</a>
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 AI Voice Studio. All rights reserved.
            </div>
          </div>
        </footer>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
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
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
          }
          
          .animate-fade-in-up-delay {
            animation: fade-in-up 0.8s ease-out 0.2s backwards;
          }
          
          .animate-fade-in-up-delay-2 {
            animation: fade-in-up 0.8s ease-out 0.4s backwards;
          }
          
          .animate-fade-in-up-delay-3 {
            animation: fade-in-up 0.8s ease-out 0.6s backwards;
          }
          
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          
          .animate-slide-up {
            animation: slide-up 0.5s ease-out;
          }
          
          .hover-lift {
            transition: all 0.3s ease;
          }
          
          .hover-lift:hover {
            transform: translateY(-10px);
          }
          
          .hover\:scale-102:hover {
            transform: scale(1.02);
          }
        `}</style>
      </div>
    );
}