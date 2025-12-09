import React, { useState } from 'react';
import { Image, Wand2, Sparkles } from 'lucide-react';

interface ImageGenerationPanelProps {
    onGenerate?: (prompt: string, model: string, aspectRatio: string, count: number) => void;
}

const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({ onGenerate }) => {
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState('stable-diffusion');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [imageCount, setImageCount] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    const models = [
        { id: 'stable-diffusion', name: 'Stable Diffusion XL' },
        { id: 'midjourney', name: 'Midjourney Style' },
        { id: 'dall-e', name: 'DALL-E 3' },
    ];

    const aspectRatios = [
        { value: '1:1', label: 'Square (1:1)' },
        { value: '16:9', label: 'Landscape (16:9)' },
        { value: '9:16', label: 'Portrait (9:16)' },
        { value: '4:3', label: 'Standard (4:3)' },
    ];

    const handleGenerate = () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        onGenerate?.(prompt, model, aspectRatio, imageCount);

        // Simulate generation
        setTimeout(() => {
            setIsGenerating(false);
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col bg-studio-bg-light dark:bg-studio-bg p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-studio-accent/20 rounded-xl">
                    <Image className="w-6 h-6 text-studio-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-studio-text-light dark:text-studio-text">
                        توليد الصور (Image Generation)
                    </h2>
                    <p className="text-sm text-studio-text-light/70 dark:text-studio-text/70">
                        أنشئ صوراً احترافية من خلال الوصف
                    </p>
                </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    وصف الصورة (Prompt)
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: منظر طبيعي خلاب لجبال ثلجية عند الغروب..."
                    className="w-full h-32 px-4 py-3 bg-studio-panel-light dark:bg-studio-panel border border-studio-border-light dark:border-studio-border rounded-xl text-studio-text-light dark:text-studio-text placeholder-studio-text-light/50 dark:placeholder-studio-text/50 focus:outline-none focus:ring-2 focus:ring-studio-accent resize-none"
                />
                <div className="flex items-center gap-2 text-xs text-studio-text-light/60 dark:text-studio-text/60">
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>كلما كان الوصف أكثر تفصيلاً، كانت النتيجة أفضل</span>
                </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    نموذج الذكاء الاصطناعي
                </label>
                <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-studio-panel-light dark:bg-studio-panel border border-studio-border-light dark:border-studio-border rounded-xl text-studio-text-light dark:text-studio-text focus:outline-none focus:ring-2 focus:ring-studio-accent cursor-pointer"
                >
                    {models.map((m) => (
                        <option key={m.id} value={m.id}>
                            {m.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    نسبة العرض إلى الارتفاع
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {aspectRatios.map((ratio) => (
                        <button
                            key={ratio.value}
                            onClick={() => setAspectRatio(ratio.value)}
                            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm ${aspectRatio === ratio.value
                                ? 'border-studio-accent bg-studio-accent/10 text-studio-accent'
                                : 'border-studio-border-light dark:border-studio-border text-studio-text-light dark:text-studio-text hover:border-studio-accent/50'
                                }`}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Count */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    عدد الصور ({imageCount})
                </label>
                <input
                    type="range"
                    min="1"
                    max="4"
                    value={imageCount}
                    onChange={(e) => setImageCount(Number(e.target.value))}
                    className="w-full h-2 bg-studio-panel-light dark:bg-studio-panel rounded-lg appearance-none cursor-pointer accent-studio-accent"
                />
                <div className="flex justify-between text-xs text-studio-text-light/60 dark:text-studio-text/60">
                    <span>1 صورة</span>
                    <span>4 صور</span>
                </div>
            </div>

            {/* Upload Reference Image */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    صورة مرجعية (اختياري)
                </label>
                <div className="border-2 border-dashed border-studio-border-light dark:border-studio-border rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-studio-panel-light dark:hover:bg-studio-panel/50 transition-colors cursor-pointer">
                    <p className="text-xs text-studio-text-light/70 dark:text-studio-text/70">
                        اضغط لرفع صورة
                    </p>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={() => {
                    // Show Coming Soon message
                    alert('Coming Soon: Image Generation process is currently under development.');
                    // Or use toast if available in context, but alert is safer for now as I don't see toast imported here.
                    // Actually, let's use the existing logic but just add the alert.
                    // handleGenerate(); // Disable actual generation for now or keep it?
                    // User said "process of generation is said coming soon".
                }}
                disabled={!prompt.trim() || isGenerating}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-studio-accent hover:bg-studio-accent/90 disabled:bg-studio-border disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mt-auto"
            >
                {isGenerating ? (
                    <>
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري التوليد...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        توليد الصور
                    </>
                )}
            </button>
        </div>
    );
};

export default ImageGenerationPanel;
