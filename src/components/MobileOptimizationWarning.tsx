'use client';

import { useState, useEffect } from 'react';
import { X, Monitor, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileOptimizationWarning() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if screen width is less than 768px (md breakpoint)
        const checkScreenSize = () => {
            if (window.innerWidth < 768) {
                // Only show if user hasn't dismissed it in this session
                const dismissed = sessionStorage.getItem('mobile_warning_dismissed');
                if (!dismissed) {
                    setIsVisible(true);
                }
            }
        };

        checkScreenSize();
        // Optional: listen to resize events if you want it to appear when resizing down
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const dismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('mobile_warning_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:hidden pointer-events-none flex justify-center"
                >
                    <div className="bg-card/95 backdrop-blur-xl border border-primary/20 p-5 rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto relative overflow-hidden ring-1 ring-primary/10">
                        {/* Background Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 animate-pulse">
                                        <Monitor className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-sm">تجربة الاستوديو الكاملة</h3>
                                </div>
                                <button
                                    onClick={dismiss}
                                    aria-label="إغلاق التنبيه"
                                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed mb-4 font-medium">
                                للحصول على أفضل تجربة مونتاج وهندسة صوتية، نوصي باستخدام
                                <span className="text-primary font-bold mx-1">كمبيوتر</span>
                                أو
                                <span className="text-primary font-bold mx-1">لابتوب</span>.
                                واجهة الاستوديو مصممة للشاشات الكبيرة لضمان الدقة والسرعة.
                            </p>

                            <button
                                onClick={dismiss}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20"
                            >
                                فهمت، استمر في التصفح
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
