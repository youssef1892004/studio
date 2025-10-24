'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Zap, Star, Users, DollarSign } from 'lucide-react';
import { executeGraphQL } from '@/lib/graphql';
import CenteredLoader from '@/components/CenteredLoader';

const GET_PLANS = `
  query GetPlans {
    Voice_Studio_Plans(order_by: {price: asc}) {
      id
      name
      price
      max_chars
      max_vioce_clones
      support_level
    }
  }
`;

interface Plan {
  id: string;
  name: string;
  price: string; // Price is text in DB
  max_chars: number;
  max_vioce_clones: number; // Added from DB schema
  support_level: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define the static Free Plan
  const freePlan: Plan = {
    id: 'free',
    name: 'الخطة المجانية',
    price: '0',
    max_chars: 15000, // Example: 15,000 characters per month
    max_vioce_clones: 0, // Free plan has 0 voice clones
    support_level: 'دعم أساسي',
  };

  // Function to derive features based on plan data
  const getPlanFeatures = (plan: Plan) => {
    const features = [
      `${plan.max_chars.toLocaleString()} حرف شهرياً`,
      plan.max_vioce_clones > 0 
        ? `${plan.max_vioce_clones} استنساخ صوتي` 
        : 'لا يوجد استنساخ صوتي',
      `دعم ${plan.support_level}`,
      'تنزيل MP3',
      'توليد صوت أساسي',
    ];
    // Add more specific features based on plan.name or other criteria if needed
    return features;
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await executeGraphQL<{ Voice_Studio_Plans: Plan[] }>({
          query: GET_PLANS,
        });
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }
        // Filter out the free plan if it's also in the database (assuming price '0')
        const fetchedPaidPlans = response.data?.Voice_Studio_Plans.filter(p => parseFloat(p.price) > 0) || [];
        setPlans(fetchedPaidPlans);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const getFeatureIcon = (isIncluded: boolean) => {
    return isIncluded 
      ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> 
      : <XCircle size={18} className="text-red-500 flex-shrink-0" />;
  };

  if (isLoading) {
    return <CenteredLoader message="جاري تحميل الخطط..." />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">خطأ في تحميل الخطط: {error}</div>;
  }

  // Combine free plan with fetched plans for rendering
  const allPlans = [freePlan, ...plans];

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-8">
        
        <Link 
            href="/" 
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة إلى الرئيسية
        </Link>
        
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            خطط الأسعار المرنة
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
            اختر الخطة التي تناسب احتياجاتك لإنتاج محتوى صوتي احترافي.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
          {allPlans.map(plan => (
            <div key={plan.id} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h2>
                    <div className="text-5xl font-extrabold my-6">
                        {parseFloat(plan.price) === 0 ? (
                            <span className="text-blue-600">مجاني</span>
                        ) : (
                            <>
                                LE {(parseFloat(plan.price) / 100).toFixed(2)}
                                <span className="text-xl font-normal">/شهرياً</span>
                            </>
                        )}
                    </div>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                        {getPlanFeatures(plan).map((feature, index) => (
                            <li key={index} className="flex items-center justify-end">
                                <span className="mr-3">{feature}</span>
                                {getFeatureIcon(true)} {/* All derived features are considered included */}
                            </li>
                        ))}
                    </ul>
                </div>
                <Link 
                    href={parseFloat(plan.price) === 0 ? '#' : `/checkout?plan_id=${plan.id}`}
                    className={`block w-full py-3 font-semibold rounded-lg transition-colors mt-6
                        ${parseFloat(plan.price) === 0 
                            ? 'bg-gray-200 text-gray-700 cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {parseFloat(plan.price) === 0 ? 'الخطة الحالية' : 'اشترك الآن'}
                </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}