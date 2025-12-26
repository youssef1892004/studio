import React from 'react';
import ImageGenerationPanel from './panels/ImageGenerationPanel';
import VoiceGenerationPanel from './panels/VoiceGenerationPanel';
import SceneBuilderPanel from './panels/SceneBuilderPanel';
import GenericGridPanel from './panels/GenericGridPanel';
import UploadsPanel from './panels/UploadsPanel';
import TextPanel from './panels/TextPanel';

interface DynamicPanelProps {
    activeTool: string;
    onGenerateVoice?: (text: string, voice: any, provider: string, speed: number, pitch: number) => Promise<void>;
    activeBlock?: any;
    onUpdateBlock?: (blockId: string, text: string, voice: any, provider: string, speed: number, pitch: number) => Promise<void>;
    onDeleteBlock?: (blockId: string) => Promise<void>;
    onClearSelection?: () => void;
    onAddGhostBlock?: (text: string, voice: any, provider: string, speed: number, pitch: number) => void;
    project?: any; // Pass the full project object
    onAssetsUpdated?: (newAssets: any[]) => void;
    blockIndex?: number;
    voices?: any[]; // Pass voices array
    onAddText?: (type: 'heading' | 'subheading' | 'body') => void;
}

const DynamicPanel: React.FC<DynamicPanelProps> = ({ activeTool, onGenerateVoice, activeBlock, onUpdateBlock, onDeleteBlock, onClearSelection, onAddGhostBlock, project, onAssetsUpdated, blockIndex, voices = [], onAddText }) => {
    const renderPanel = () => {
        switch (activeTool) {
            case 'image':
                return <ImageGenerationPanel />;
            case 'text':
                return <TextPanel onAddText={onAddText} />;
            case 'voice':
                return <VoiceGenerationPanel
                    onGenerate={onGenerateVoice || (async () => { })}
                    activeBlock={activeBlock}
                    blockIndex={blockIndex}
                    voices={voices}
                    onUpdateBlock={onUpdateBlock}
                    onDeleteBlock={onDeleteBlock}
                    onClearSelection={onClearSelection}
                    onAddGhostBlock={onAddGhostBlock}
                />;
            case 'scenes':
                return <SceneBuilderPanel />;
            case 'characters':
                return <GenericGridPanel title="Characters" description="Manage your AI characters" itemName="character" />;
            case 'uploads':
                return <UploadsPanel project={project} onAssetsUpdated={onAssetsUpdated} />;
            case 'assets':
                return <GenericGridPanel title="Assets" description="Manage your project assets" itemName="asset" projectId={project?.id} />;
            case 'templates':
                return <GenericGridPanel title="Templates" description="Start with a pre-made template" itemName="template" />;
            default:
                return (
                    <div className="h-full flex items-center justify-center text-studio-text-light/50 dark:text-studio-text/50">
                        <p>Select a tool to start editing</p>
                    </div>
                );
        }
    };

    return (
        <div className="flex-1 bg-card border-t border-border overflow-hidden h-full">
            {renderPanel()}
        </div>
    );
};

export default DynamicPanel;
