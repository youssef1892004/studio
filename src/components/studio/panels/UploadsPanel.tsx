import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UploadCloud, File, MoreVertical, Loader2, Image as ImageIcon, Music, Video, Trash2, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadsPanelProps {
    project?: any;
    onAssetsUpdated?: (newAssets: any[]) => void;
    onAddAsset?: (file: { url: string; width?: number; height?: number; type: string }) => void;
}

const UploadsPanel: React.FC<UploadsPanelProps> = ({ project, onAssetsUpdated, onAddAsset }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [previewAsset, setPreviewAsset] = useState<any | null>(null);

    // ... (rest of stats)

    // ... (handleFileSelect)

    // ... (handleManageAsset)

    // ... (helpers)

    // ... (useEffect fetch)

    return (
        <div className="h-full flex flex-col bg-card p-6 space-y-6 overflow-y-auto custom-scrollbar relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground">
                        Uploads
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your uploaded assets
                    </p>
                </div>
            </div>

            {/* Upload Area */}
            <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 hover:border-primary'}`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,audio/*,video/*"
                />
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                    {isUploading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <UploadCloud className="w-6 h-6 text-primary" />}
                </div>
                <p className="text-sm font-medium text-foreground">
                    {isUploading ? 'Uploading...' : 'Click to upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Images, Audio, Video (max. 50MB)
                </p>
            </div>

            {/* File List */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-studio-text-light dark:text-studio-text">
                    Recent Uploads ({assets.length})
                </h3>
                <div className="space-y-2 pb-20">
                    {assets.length === 0 ? (
                        <p className="text-sm text-studio-text-light/50 dark:text-studio-text/50 text-center py-4">
                            No uploads yet
                        </p>
                    ) : (
                        assets.map((file: any, i: number) => (
                            <div
                                key={i}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({
                                        url: file.url,
                                        name: file.name,
                                        type: file.type
                                    }));
                                    e.dataTransfer.effectAllowed = 'copy';
                                }}
                                onClick={() => {
                                    if (file.type?.startsWith('image/') && onAddAsset) {
                                        const img = new Image();
                                        img.src = `/api/asset-proxy?url=${encodeURIComponent(file.url)}`;
                                        img.onload = () => {
                                            onAddAsset({ ...file, width: img.naturalWidth, height: img.naturalHeight });
                                        };
                                        img.onerror = () => {
                                            onAddAsset(file);
                                        };
                                    } else {
                                        setPreviewAsset(file);
                                    }
                                }}
                                className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border group hover:border-primary/50 transition-colors relative cursor-pointer active:scale-[0.98]"
                                style={{ zIndex: activeMenuId === file.id ? 50 : 1 }}
                            >
                                <div className="p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                                    {getFileIcon(file.type || '')}
                                </div>

                                {renamingAssetId === file.id ? (
                                    <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="flex-1 bg-muted border border-border rounded px-2 py-1 text-sm text-foreground focus:outline-none focus:border-primary"
                                            autoFocus
                                        />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleManageAsset(file.id, 'rename', newName); }}
                                            className="p-1 text-green-500 hover:bg-green-500/10 rounded"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setRenamingAssetId(null); }}
                                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatSize(file.size || 0)} • {new Date(file.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenuId(activeMenuId === file.id ? null : file.id);
                                        }}
                                        className="p-2 text-studio-text-light/70 dark:text-studio-text/70 hover:text-studio-text-light dark:hover:text-studio-text hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {activeMenuId === file.id && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(null);
                                                }}
                                            />
                                            <div className="absolute end-0 top-full mt-1 w-32 bg-studio-panel-light dark:bg-studio-panel border border-studio-border-light dark:border-studio-border rounded-lg shadow-lg z-50 overflow-hidden">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenamingAssetId(file.id);
                                                        setNewName(file.name);
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full text-start px-3 py-2 text-sm text-studio-text-light dark:text-studio-text hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                                                >
                                                    <Edit2 className="w-3 h-3" /> Rename
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Are you sure you want to delete this file?')) {
                                                            handleManageAsset(file.id, 'delete');
                                                        }
                                                        setActiveMenuId(null);
                                                    }}
                                                    className="w-full text-start px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewAsset && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setPreviewAsset(null)}
                >
                    <div
                        className="bg-studio-panel-light dark:bg-studio-panel rounded-xl overflow-hidden w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative mx-4 animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-studio-border-light dark:border-studio-border">
                            <h3 className="font-medium text-studio-text-light dark:text-studio-text truncate max-w-md">
                                {previewAsset.name}
                            </h3>
                            <button
                                onClick={() => setPreviewAsset(null)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-studio-text-light dark:text-studio-text" />
                            </button>
                        </div>
                        <div className="p-8 flex-1 overflow-auto flex items-center justify-center bg-black/5 dark:bg-black/20 min-h-[400px]">
                            {previewAsset.type?.startsWith('image/') && (
                                <img
                                    src={`/api/asset-proxy?url=${encodeURIComponent(previewAsset.url)}`}
                                    alt={previewAsset.name}
                                    className="max-w-full max-h-[70vh] object-contain rounded"
                                />
                            )}
                            {previewAsset.type?.startsWith('video/') && (
                                <video
                                    src={`/api/asset-proxy?url=${encodeURIComponent(previewAsset.url)}`}
                                    controls
                                    className="max-w-full max-h-[70vh] rounded"
                                />
                            )}
                            {previewAsset.type?.startsWith('audio/') && (
                                <div className="w-full max-w-md flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center">
                                        <Music className="w-10 h-10 text-purple-500" />
                                    </div>
                                    <audio
                                        src={`/api/asset-proxy?url=${encodeURIComponent(previewAsset.url)}`}
                                        controls
                                        className="w-full"
                                    />
                                </div>
                            )}
                            {!previewAsset.type?.startsWith('image/') && !previewAsset.type?.startsWith('video/') && !previewAsset.type?.startsWith('audio/') && (
                                <div className="flex flex-col items-center gap-2 text-studio-text-light/50 dark:text-studio-text/50">
                                    <File className="w-16 h-16" />
                                    <p>Preview not available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default UploadsPanel;
