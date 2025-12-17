import React from 'react';
import { Type, Heading1, Heading2, AlignLeft } from 'lucide-react';

interface TextPanelProps {
    onAddText?: (type: 'heading' | 'subheading' | 'body') => void;
}

const TextPanel: React.FC<TextPanelProps> = ({ onAddText }) => {
    return (
        <div className="h-full flex flex-col p-4 gap-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-[#F48969] to-[#E07858] bg-clip-text text-transparent">
                Text & Titles
            </h2>

            <div className="grid gap-3">
                <button
                    onClick={() => onAddText?.('heading')}
                    className="w-full flex items-center justify-start gap-4 h-16 bg-[#2A2A2A] hover:bg-[#333] border border-[#3A3A3A] rounded-xl group transition-all"
                >
                    <div className="w-10 h-10 rounded-lg bg-[#F48969]/10 flex items-center justify-center text-[#F48969] group-hover:bg-[#F48969] group-hover:text-white transition-colors">
                        <Heading1 size={24} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-lg font-bold text-gray-200">Add Heading</span>
                        <span className="text-xs text-gray-500">Large, bold title text</span>
                    </div>
                </button>

                <button
                    onClick={() => onAddText?.('subheading')}
                    className="w-full flex items-center justify-start gap-4 h-14 bg-[#2A2A2A] hover:bg-[#333] border border-[#3A3A3A] rounded-xl group transition-all"
                >
                    <div className="w-9 h-9 rounded-lg bg-[#3F8CFF]/10 flex items-center justify-center text-[#3F8CFF] group-hover:bg-[#3F8CFF] group-hover:text-white transition-colors">
                        <Heading2 size={20} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-base font-semibold text-gray-200">Add Subheading</span>
                        <span className="text-xs text-gray-500">Medium sized secondary text</span>
                    </div>
                </button>

                <button
                    onClick={() => onAddText?.('body')}
                    className="w-full flex items-center justify-start gap-4 h-12 bg-[#2A2A2A] hover:bg-[#333] border border-[#3A3A3A] rounded-xl group transition-all"
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <AlignLeft size={18} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-gray-200">Add Body Text</span>
                        <span className="text-xs text-gray-500">Small paragraph text</span>
                    </div>
                </button>
            </div>

            <div className="mt-4 p-4 bg-[#2A2A2A]/50 rounded-xl border border-dashed border-[#3A3A3A] text-center">
                <p className="text-xs text-gray-500 leading-relaxed">
                    💡 Tip: Select a text item on the timeline to edit its content, color, font, and more.
                </p>
            </div>
        </div>
    );
};

export default TextPanel;
