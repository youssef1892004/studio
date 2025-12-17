import React from 'react';
import { Image, Mic, Upload, FolderOpen, Type } from 'lucide-react';

interface SidebarItem {
    id: string;
    label: string;
    icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
    { id: 'image', label: 'توليد صورة', icon: Image },
    { id: 'voice', label: 'توليد صوت', icon: Mic },
    { id: 'text', label: 'نصوص', icon: Type },
    { id: 'uploads', label: 'الرفوعات', icon: Upload },
    { id: 'assets', label: 'الأصول', icon: FolderOpen },
];

interface StudioSidebarProps {
    activeItem?: string;
    onItemClick?: (itemId: string) => void;
}

const StudioSidebar: React.FC<StudioSidebarProps> = ({
    activeItem = 'voice',
    onItemClick
}) => {
    return (
        <div className="w-20 bg-studio-bg dark:bg-studio-bg border-r border-studio-border-light dark:border-studio-border flex flex-col items-center py-6 gap-4 z-20 shadow-xl shrink-0">
            {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onItemClick?.(item.id)}
                        className={`
              group relative w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1
              transition-all duration-300 ease-out
              hover:scale-105 active:scale-95
              ${isActive
                                ? 'bg-studio-accent text-white shadow-[0_4px_20px_rgba(244,137,105,0.5)] scale-105 ring-2 ring-studio-accent/20'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-studio-panel-light dark:hover:bg-studio-panel hover:text-studio-accent hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                            }
            `}
                        title={item.label}
                    >
                        <Icon className="w-6 h-6" strokeWidth={1.5} />

                        {/* Tooltip */}
                        <div className={`
              absolute left-full ml-4 px-3 py-2 bg-studio-panel-light dark:bg-studio-panel 
              text-studio-text-light dark:text-studio-text text-sm rounded-lg shadow-lg
              border border-studio-border-light dark:border-studio-border
              whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity duration-200 z-50
            `}>
                            {item.label}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default StudioSidebar;
