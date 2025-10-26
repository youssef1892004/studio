'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'processing' | 'completed' | 'failed';

export default function PaymentSuccessPage() {
    const { refreshSubscription, subscription } = useAuth();
    const [status, setStatus] = useState<Status>('processing');
    const attempts = useRef(0);
    const maxAttempts = 5;

    // Effect to start and manage the polling interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (status === 'completed' || attempts.current >= maxAttempts) {
                clearInterval(interval);
                if (status !== 'completed') {
                    setStatus('failed');
                }
                return;
            }

            console.log(`Polling for subscription... Attempt ${attempts.current + 1}`);
            refreshSubscription();
            attempts.current += 1;

        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [refreshSubscription, status]);

    // Effect to react to the subscription data changing
    useEffect(() => {
        // If we get a valid and active subscription, the process is complete.
        if (subscription && subscription.active) {
            setStatus('completed');
        }
    }, [subscription]);

    const renderContent = () => {
        switch (status) {
            case 'processing':
                return (
                    <>
                        <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">جاري معالجة الدفع...</h1>
                        <p className="text-gray-600 dark:text-gray-300">نقوم بتحديث اشتراكك. قد يستغرق هذا بضع ثوانٍ.</p>
                    </>
                );
            case 'completed':
                return (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">تم الدفع بنجاح!</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">تم تفعيل اشتراكك بنجاح. يمكنك الآن الاستمتاع بجميع مزايا خطتك الجديدة.</p>
                        <Link href="/projects" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            الانتقال إلى مشاريعي
                        </Link>
                    </>
                );
            case 'failed':
                return (
                    <>
                        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">حدث تأخير في التفعيل</h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">لقد استلمنا دفعتك بنجاح، ولكننا نواجه تأخيراً في تفعيل اشتراكك تلقائياً. يرجى التحقق من صفحة مشاريعك خلال دقيقة.</p>
                        <Link href="/projects" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                            الانتقال إلى مشاريعي
                        </Link>
                    </>
                );
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md transition-all duration-300">
                {renderContent()}
            </div>
        </div>
    );
}
