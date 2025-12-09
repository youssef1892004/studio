import React, { useState } from 'react';
import { Layers, Palette, Camera, Layout } from 'lucide-react';

const SceneBuilderPanel: React.FC = () => {
    const [description, setDescription] = useState('');
    const [mood, setMood] = useState('cinematic');

    return (
        <div className="h-full flex flex-col bg-studio-bg-light dark:bg-studio-bg p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-studio-accent/20 rounded-xl">
                    <Layers className="w-6 h-6 text-studio-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-studio-text-light dark:text-studio-text">
                        بناء المشهد (Scene Builder)
                    </h2>
                    <p className="text-sm text-studio-text-light/70 dark:text-studio-text/70">
                        صمم مشاهد قصصية متكاملة
                    </p>
                </div>
            </div>

            {/* Scene Description */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    وصف المشهد
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="صف المشهد بالتفصيل..."
                    className="w-full h-24 px-4 py-3 bg-studio-panel-light dark:bg-studio-panel border border-studio-border-light dark:border-studio-border rounded-xl text-studio-text-light dark:text-studio-text placeholder-studio-text-light/50 dark:placeholder-studio-text/50 focus:outline-none focus:ring-2 focus:ring-studio-accent resize-none"
                />
            </div>

            {/* Mood Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    المزاج (Mood)
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {['Cinematic', 'Cheerful', 'Dark', 'Fantasy'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMood(m.toLowerCase())}
                            className={`px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${mood === m.toLowerCase()
                                ? 'border-studio-accent bg-studio-accent/10 text-studio-accent'
                                : 'border-studio-border-light dark:border-studio-border text-studio-text-light dark:text-studio-text hover:border-studio-accent/50'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Camera Angle */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    زاوية الكاميرا
                </label>
                <select className="w-full px-4 py-2.5 bg-studio-panel-light dark:bg-studio-panel border border-studio-border-light dark:border-studio-border rounded-xl text-studio-text-light dark:text-studio-text focus:outline-none focus:ring-2 focus:ring-studio-accent">
                    <option>Wide Shot</option>
                    <option>Close Up</option>
                    <option>Aerial View</option>
                    <option>Low Angle</option>
                </select>
            </div>

            {/* Background Options */}
            <div className="space-y-2">
                <label className="block text-sm font-semibold text-studio-text-light dark:text-studio-text flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    الخلفية
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-video bg-studio-panel-light dark:bg-studio-panel rounded-lg border border-studio-border-light dark:border-studio-border hover:border-studio-accent cursor-pointer transition-all"></div>
                    ))}
                </div>
            </div>

            {/* Create Scene Button */}
            <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-studio-accent hover:bg-studio-accent/90 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mt-auto">
                <Layers className="w-5 h-5" />
                إنشاء المشهد
            </button>
        </div>
    );
};

export default SceneBuilderPanel;
