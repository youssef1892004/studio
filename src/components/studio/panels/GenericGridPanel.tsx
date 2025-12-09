import React, { useState, useEffect } from 'react';
import { Folder, Film, Image as ImageIcon, Music, Plus, Search, MoreHorizontal, ArrowLeft } from 'lucide-react';

interface Asset {
    id: string;
    name: string;
    type: 'video' | 'image' | 'audio';
    url?: string;
}

interface GenericGridPanelProps {
    title: string;
    description: string;
    itemName: string;
    items?: Asset[];
    projectId?: string;
}

interface Folder {
    id: string;
    name: string;
    type: 'video' | 'image' | 'audio' | 'mixed';
    assets: Asset[];
}

const GenericGridPanel: React.FC<GenericGridPanelProps> = ({ title, description, itemName, items: initialItems = [], projectId }) => {
    // Initial folder structure
    const [folders, setFolders] = useState<Folder[]>([
        { id: 'videos', name: 'Videos', type: 'video', assets: [] },
        { id: 'images', name: 'Images', type: 'image', assets: [] },
        { id: 'audio', name: 'Audio', type: 'audio', assets: [] },
        { id: 'legacy', name: 'Legacy Voices', type: 'mixed', assets: [] },
    ]);

    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [dbItems, setDbItems] = useState<Asset[]>([]);

    useEffect(() => {
        if (!projectId) return;
        const fetchAssets = async () => {
            try {
                const { executeGraphQL, GET_ASSETS } = await import('../../../lib/graphql');
                const data = await executeGraphQL<any>({ query: GET_ASSETS, variables: { project_id: projectId } });
                if (data.data?.Voice_Studio_Asset) {
                    const mapped = data.data.Voice_Studio_Asset.map((a: any) => {
                        const imageRaw = (a.image_url && a.image_url.length > 0) ? a.image_url : null;
                        const videoRaw = (a.video_url && a.video_url.length > 0) ? a.video_url : null;
                        const voiceRaw = (a.voice_url && a.voice_url.length > 0) ? a.voice_url : null;

                        let rawUrl = imageRaw || videoRaw || voiceRaw;
                        if (Array.isArray(rawUrl)) rawUrl = rawUrl[0];
                        const url = typeof rawUrl === 'string' ? rawUrl : '';

                        const type = imageRaw ? 'image' : videoRaw ? 'video' : 'audio';
                        const name = url ? (url.split('/').pop() || 'Asset') : 'Asset';

                        return { id: a.id, name, type, url };
                    });
                    setDbItems(mapped);
                }
            } catch (e) {
                console.error("Failed to fetch assets", e);
            }
        };
        fetchAssets();
    }, [projectId]);

    const items = [...initialItems, ...dbItems];

    // Filter items into folders automatically based on type
    const getFolderAssets = (folderId: string) => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return [];

        if (folder.id === 'legacy') return []; // Todo: populate with legacy

        // Auto-distribute items to main folders
        if (folder.type === 'mixed') return [];

        return items.filter(item => {
            if (folder.type === 'video') return item.type === 'video';
            if (folder.type === 'image') return item.type === 'image';
            if (folder.type === 'audio') return item.type === 'audio';
            return false;
        });
    };

    const handleAddFolder = () => {
        const name = prompt("Enter folder name:");
        if (name) {
            setFolders([...folders, {
                id: `custom-${Date.now()}`,
                name,
                type: 'mixed',
                assets: []
            }]);
        }
    };

    const activeFolder = folders.find(f => f.id === activeFolderId);
    const displayedAssets = activeFolderId ? getFolderAssets(activeFolderId) : [];

    return (
        <div className="h-full flex flex-col bg-studio-bg-light dark:bg-studio-bg p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {activeFolder && (
                        <button
                            onClick={() => setActiveFolderId(null)}
                            className="p-2 hover:bg-studio-panel-light dark:hover:bg-studio-panel rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-studio-text-light dark:text-studio-text" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-studio-text-light dark:text-studio-text">
                            {activeFolder ? activeFolder.name : title}
                        </h2>
                        <p className="text-sm text-studio-text-light/70 dark:text-studio-text/70">
                            {activeFolder ? `${displayedAssets.length} items` : description}
                        </p>
                    </div>
                </div>
                {!activeFolderId && (
                    <button
                        onClick={handleAddFolder}
                        className="p-2 bg-studio-accent/10 hover:bg-studio-accent/20 text-studio-accent rounded-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Folders View */}
            {!activeFolderId && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => setActiveFolderId(folder.id)}
                            className="group p-4 bg-studio-panel-light dark:bg-studio-panel rounded-xl border border-studio-border-light dark:border-studio-border hover:border-studio-accent/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 aspect-square"
                        >
                            {folder.type === 'video' ? <Film className="w-8 h-8 text-blue-400" /> :
                                folder.type === 'image' ? <ImageIcon className="w-8 h-8 text-green-400" /> :
                                    folder.type === 'audio' ? <Music className="w-8 h-8 text-orange-400" /> :
                                        <Folder className="w-8 h-8 text-studio-accent" />}

                            <span className="font-medium text-studio-text-light dark:text-studio-text text-center text-sm">{folder.name}</span>
                            <span className="text-xs text-studio-text-light/50 dark:text-studio-text/50">
                                {getFolderAssets(folder.id).length} items
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Assets View (Inside Folder) */}
            {activeFolderId && (
                <>
                    {displayedAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-studio-text-light/50 dark:text-studio-text/50">
                            <Folder className="w-12 h-12 mb-4 opacity-20" />
                            <p>No assets in this folder yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {displayedAssets.map((item, i) => (
                                <div
                                    key={item.id || i}
                                    draggable={true}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify(item));
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="group relative aspect-square bg-studio-panel-light dark:bg-studio-panel rounded-xl border border-studio-border-light dark:border-studio-border overflow-hidden hover:border-studio-accent/50 transition-all cursor-move focus:outline-none focus:ring-2 focus:ring-studio-accent"
                                >
                                    {item.type === 'image' && item.url ? (
                                        <img
                                            src={`/api/asset-proxy?url=${encodeURIComponent(item.url)}`}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Image load error', item.url);
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5 fallback">
                                            {item.type === 'video' ? <Film className="w-8 h-8 text-studio-text-light/30 dark:text-studio-text/30" /> :
                                                item.type === 'audio' ? <Music className="w-8 h-8 text-studio-text-light/30 dark:text-studio-text/30" /> :
                                                    <div className="w-8 h-8 rounded-full bg-studio-accent/20"></div>}
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-black/60 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform">
                                        <p className="text-xs text-white truncate">{item.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GenericGridPanel;
