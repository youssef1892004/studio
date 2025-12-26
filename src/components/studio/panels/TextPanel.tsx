import React from 'react';
import { Heading1, Heading2, AlignLeft } from 'lucide-react';

interface TextPanelProps {
    onAddText?: (type: 'heading' | 'subheading' | 'body') => void;
}

const TextPanel: React.FC<TextPanelProps> = ({ onAddText }) => {
    return (
        <div className="h-full flex flex-col p-4 gap-6">
            <h2 className="text-xl font-bold text-primary">
                Text & Titles
            </h2>

            <div className="grid gap-3">
                <button
                    onClick={() => onAddText?.('heading')}
                    className="w-full flex items-center justify-start gap-4 h-16 bg-muted hover:bg-muted/80 border border-border rounded-xl group transition-all"
                >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Heading1 size={24} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-lg font-bold text-foreground">Add Heading</span>
                        <span className="text-xs text-muted-foreground">Large, bold title text</span>
                    </div>
                </button>

                <button
                    onClick={() => onAddText?.('subheading')}
                    className="w-full flex items-center justify-start gap-4 h-14 bg-muted hover:bg-muted/80 border border-border rounded-xl group transition-all"
                >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Heading2 size={20} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-base font-semibold text-foreground">Add Subheading</span>
                        <span className="text-xs text-muted-foreground">Medium sized secondary text</span>
                    </div>
                </button>

                <button
                    onClick={() => onAddText?.('body')}
                    className="w-full flex items-center justify-start gap-4 h-12 bg-muted hover:bg-muted/80 border border-border rounded-xl group transition-all"
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <AlignLeft size={18} />
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-medium text-foreground">Add Body Text</span>
                        <span className="text-xs text-muted-foreground">Small paragraph text</span>
                    </div>
                </button>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-xl border border-dashed border-border text-center">
                <p className="text-xs text-muted-foreground leading-relaxed">
                    💡 Tip: Select a text item on the timeline to edit its properties in the left sidebar.
                </p>
            </div>
        </div>
    );
};

export default TextPanel;
