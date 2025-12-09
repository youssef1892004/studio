import React from 'react';
import { Undo, Redo, Scissors, ZoomIn, Filter, Sliders, Volume2, Download } from 'lucide-react';

interface ToolbarProps {
    onExport?: () => void;
    onExportVideo?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    enableTashkeel?: boolean;
    onToggleTashkeel?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    onExport,
    onExportVideo,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    enableTashkeel = true,
    onToggleTashkeel,
}) => {
    return (
        <div className="h-14 bg-studio-bg-light dark:bg-studio-bg border-b border-studio-border-light dark:border-studio-border flex items-center justify-between px-4 shadow-sm z-10">
            {/* Left Tools */}
            <div className="flex items-center gap-1">
                <div className="flex items-center bg-studio-panel-light dark:bg-studio-panel/50 rounded-lg p-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-2 rounded-md text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="تراجع (Undo)"
                    >
                        <Undo className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-2 rounded-md text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="إعادة (Redo)"
                    >
                        <Redo className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-studio-border-light dark:bg-studio-border mx-2"></div>

                <div className="flex items-center gap-1">
                    <button
                        className="p-2 rounded-md text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel hover:text-studio-accent transition-all"
                        title="قص / تقسيم (Split/Cut)"
                    >
                        <Scissors className="w-4 h-4" />
                    </button>

                    <button
                        className="p-2 rounded-md text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel hover:text-studio-accent transition-all"
                        title="تكبير الجدول الزمني (Zoom Timeline)"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                <div className="w-px h-6 bg-studio-border-light dark:bg-studio-border mx-2"></div>

                <div className="flex items-center gap-1">
                    {/* Tashkeel Toggle */}
                    <button
                        onClick={onToggleTashkeel}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${enableTashkeel
                                ? 'bg-studio-accent/10 text-studio-accent border border-studio-accent/20'
                                : 'text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel'
                            }`}
                        title="تشكيل تلقائي (Auto Tashkeel)"
                    >
                        <span className="text-lg leading-none">ً</span>
                        <span className="hidden xl:inline">تشكيل</span>
                    </button>

                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel hover:text-studio-accent transition-all"
                        title="تعديلات الصورة (Image Adjustments)"
                    >
                        <Sliders className="w-4 h-4" />
                        <span className="hidden xl:inline">صورة</span>
                    </button>

                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel hover:text-studio-accent transition-all"
                        title="تعديلات الصوت (Audio Adjustments)"
                    >
                        <Volume2 className="w-4 h-4" />
                        <span className="hidden xl:inline">صوت</span>
                    </button>

                    <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-studio-text-light dark:text-studio-text hover:bg-studio-panel-light dark:hover:bg-studio-panel hover:text-studio-accent transition-all"
                        title="فلاتر (Filters)"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden xl:inline">فلاتر</span>
                    </button>
                </div>
            </div>

            {/* Right - Export Buttons */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    title="تصدير صوت (Export Audio)"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">صوت</span>
                </button>
                <button
                    onClick={onExportVideo}
                    className="flex items-center gap-2 px-5 py-2 bg-studio-accent hover:bg-studio-accent/90 text-white text-sm font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                    title="تصدير فيديو (Export Video)"
                >
                    <Download className="w-4 h-4" />
                    فيديو
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
