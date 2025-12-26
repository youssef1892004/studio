'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, StudioBlock, Project, ASPECT_RATIO_PRESETS } from '@/lib/types';
import { LoaderCircle, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectById, updateProject, subscribeToBlocks, deleteBlock, deleteBlockByIndex, executeGraphQL, UPDATE_PROJECT_BLOCKS } from '@/lib/graphql';
import { structureTimelineData, flattenTimelineData } from '@/lib/timeline-adapters';
import { TimelineItem, TimelineLayer, ProjectDataV2 } from '@/lib/types';




import { uploadAudioSegment } from '@/lib/tts';
import toast from 'react-hot-toast';
import ProjectHeader from '@/components/studio/ProjectHeader';
// import EditorCanvas from '@/components/studio/EditorCanvas'; // Removed
// import RightSidebar from '@/components/studio/RightSidebar'; // Removed
import StudioSidebar from '@/components/studio/Sidebar';
import Toolbar from '@/components/studio/Toolbar';
import StudioToolbar from './StudioToolbar';
import Timeline, { TimelineHandle } from '@/components/Timeline';
import CenteredLoader from '@/components/CenteredLoader';
import PreviewPlayer from '@/components/studio/PreviewPlayer';
import DynamicPanel from '@/components/studio/DynamicPanel';
import StudioContextMenu from '@/components/studio/StudioContextMenu';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import { useStudioHistory } from '@/hooks/useStudioHistory';

import { getApiUrl } from '@/lib/tts';
import { notFound } from 'next/navigation';
import { PerformanceProvider } from '@/contexts/PerformanceContext';
import ExportModal, { ExportSettings } from './ExportModal';

const PRO_VOICES_IDS = ['0', '1', '2', '3'];
const MAINTENANCE_VOICES = ['0', '1', '2', '3'];

export default function StudioPageClient() {
    const [project, setProject] = useState<Project | null>(null);
    const [projectTitle, setProjectTitle] = useState("");
    const [projectDescription, setProjectDescription] = useState("");
    const [voices, setVoices] = useState<(Voice & { isPro?: boolean })[]>([]);
    const [cards, setCards] = useState<StudioBlock[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [videoTrackItems, setVideoTrackItems] = useState<TimelineItem[]>([]);
    const [showExportModal, setShowExportModal] = useState(false);
    const [activePresetId, setActivePresetId] = useState('youtube');
    // const [exportSettings, setExportSettings] = useState({ resolution: '720p', fps: 30 }); // Moved to Modal logic



    // Lifted State for Middle Toolbar (Zoom & Layers)
    const [zoomLevel, setZoomLevel] = useState(50);
    const [manualLayerCount, setManualLayerCount] = useState(2);
    const [layersState, setLayersState] = useState<TimelineLayer[]>([]); // V2 Layer Metadata Tracker

    // --- Toolbar Actions ---
    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 10));
    const handleAddLayer = () => setManualLayerCount(prev => prev + 1);

    // Undo/Redo History
    const {
        undo: undoHistory,
        redo: redoHistory,
        pushState,
        canUndo,
        canRedo,
        resetHistory
    } = useStudioHistory<{ cards: StudioBlock[], videoTrackItems: TimelineItem[] }>({ cards: [], videoTrackItems: [] });

    // History Helper
    const recordHistory = (newCards: StudioBlock[], newItems: TimelineItem[]) => {
        pushState({ cards: newCards, videoTrackItems: newItems });
    };

    const handleUndo = () => {
        const state = undoHistory();
        if (state) {
            setCards(state.cards);
            setVideoTrackItems(state.videoTrackItems);
        }
    };

    const handleRedo = () => {
        const state = redoHistory();
        if (state) {
            setCards(state.cards);
            setVideoTrackItems(state.videoTrackItems);
        }
    };

    // Wrapper for Timeline updates
    const handleVideoTrackUpdate = (newItems: TimelineItem[] | ((prev: TimelineItem[]) => TimelineItem[]), commit = true) => {
        setVideoTrackItems(prev => {
            const next = typeof newItems === 'function' ? newItems(prev) : newItems;
            if (commit) {
                console.log(`[UndoRedo] TrackUpdate: ${prev.length} -> ${next.length} items`);
                recordHistory(cards, next); // Record change
            }
            return next;
        });
    };

    const handleExportClick = () => {
        setShowExportModal(true);
    };

    const confirmExport = async (settings: ExportSettings) => {
        setShowExportModal(false);
        setIsExporting(true);
        const toastId = toast.loading('Initializing video export engine (WASM)...');

        try {
            // Dynamic import to load WASM module only on demand
            const { renderTimelineToVideo } = await import('@/lib/ffmpeg-video');

            // 1. Prepare Video Items
            // Already compatible: videoTrackItems is TimelineItem[]

            // 2. Prepare Audio Items
            let currentAudioStart = 0;
            const voiceItems: TimelineItem[] = cards
                .filter(c => c.audioUrl)
                .map(c => {
                    const duration = c.duration || 0;
                    const item: TimelineItem = {
                        id: c.id,
                        start: currentAudioStart,
                        duration: duration,
                        content: "audio",
                        type: 'voice',
                        audioUrl: c.audioUrl,
                        volume: c.volume ?? 1
                    };
                    currentAudioStart += duration;
                    return item;
                });

            const musicItems = videoTrackItems.filter(i => i.type === 'music');
            const allAudioItems = [...voiceItems, ...musicItems];

            // Visual items (exclude music)
            const visualItems = videoTrackItems.filter(i => i.type !== 'music');

            toast.loading(`Rendering video (${settings.resolution} @ ${settings.fps}fps)...`, { id: toastId });

            // Resolve Settings & Preset
            const currentPreset = ASPECT_RATIO_PRESETS.find(p => p.id === activePresetId) || ASPECT_RATIO_PRESETS[0];
            const ratio = currentPreset.ratio;

            let baseSize = 720;
            if (settings.resolution === '1080p') baseSize = 1080;
            if (settings.resolution === '480p') baseSize = 480;

            // Calculate width/height ensuring they are multiples of 2
            let width, height;
            if (ratio >= 1) {
                // Landscape or Square: Height is base, Width is derived
                height = baseSize;
                width = Math.round(height * ratio);
            } else {
                // Vertical: Width is base, Height is derived
                width = baseSize;
                height = Math.round(width / ratio);
            }

            // Ensure even numbers
            if (width % 2 !== 0) width++;
            if (height % 2 !== 0) height++;

            // 3. Render
            const startTime = Date.now();
            const blob = await renderTimelineToVideo(visualItems, allAudioItems, {
                width,
                height,
                fps: settings.fps,
                preset: settings.preset,
                onProgress: (p) => {
                    toast.loading(`Rendering video (${settings.resolution}) ... ${p}%`, { id: toastId });
                }
            });
            const endTime = Date.now();
            const durationInSeconds = ((endTime - startTime) / 1000).toFixed(1);

            // 4. Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle || 'video'}_${settings.resolution}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`Video exported successfully! (Took ${durationInSeconds}s)`, { id: toastId });

        } catch (error: any) {
            console.error("Export Error:", error);
            toast.error(`Export failed: ${error.message || 'Unknown error'}`, { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCriticalLoading, setIsCriticalLoading] = useState(true);
    const pendingDeletionsRef = useRef<Set<string>>(new Set());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeLeftTool, setActiveLeftTool] = useState('voice');
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'razor'>('select');

    const addNewBlock = () => {
        if (voices.length > 0) {
            handleAddGhostBlock("", voices[0], voices[0].provider || "", 1, 1);
        } else {
            toast.error("No voices available");
        }
    };

    // Tools Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLDivElement && e.target.isContentEditable) return;

            if (e.key.toLowerCase() === 'v') setActiveTool('select');
            if (e.key.toLowerCase() === 'c') setActiveTool('razor');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    const isInitialLoad = useRef(true);

    const [languageFilter, setLanguageFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [providerFilter, setProviderFilter] = useState('all');
    const [enableTashkeel, setEnableTashkeel] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [loadingMessage, setLoadingMessage] = useState("يتم تحميل المشروع...");
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [activeMedia, setActiveMedia] = useState<{ id?: string; url: string; type: string; start: number; volume?: number; mediaStartOffset?: number } | null>(null);



    // Playback State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const timelineRef = useRef<TimelineHandle>(null);

    const activeVisualLayers = useMemo(() => {
        return videoTrackItems
            .filter(item =>
                (item.type === 'video' || item.type === 'image' || item.type === 'scene') &&
                currentTime >= item.start && currentTime < (item.start + item.duration) &&
                (item.visible ?? true)
            )
            .sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
    }, [videoTrackItems, currentTime]);

    const { user, subscription, isLoading: isAuthLoading, refreshSubscription, token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const projectId = params.id as string;

    const [timelineLoaded, setTimelineLoaded] = useState(false);
    const dynamicPanelRef = useRef<HTMLDivElement>(null);
    const [playbackRate, setPlaybackRate] = useState(1);

    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    const scrollToTop = () => {
        if (dynamicPanelRef.current) {
            dynamicPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    // Context Menu State
    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        type: 'general' as 'general' | 'item' | 'block'
    });
    const [studioClipboard, setStudioClipboard] = useState<{ type: string, data: any } | null>(null);

    const currentMenuVolume = useMemo(() => {
        if (activeVideoId) return videoTrackItems.find(i => i.id === activeVideoId)?.volume ?? 1;
        if (activeCardId) return cards.find(c => c.id === activeCardId)?.volume ?? 1;
        return 1;
    }, [activeVideoId, activeCardId, videoTrackItems, cards]);

    // Global Context Menu Handler
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault(); // This effectively disables "Inspect" via right click

            let menuType: 'general' | 'item' | 'block' = 'general';
            if (activeVideoId) menuType = 'item';
            else if (activeCardId) menuType = 'block';

            setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                type: menuType
            });
        };

        const handleClick = () => {
            if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }));
        };

        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('click', handleClick);
        };
    }, [contextMenu.visible]);

    const handleVideoSelect = (id: string) => {
        setActiveVideoId(id);
        setActiveCardId(null);
    };

    const handleBlockClick = (blockId: string) => {
        setActiveCardId(blockId);
        setActiveVideoId(null); // Deselect video
        setActiveLeftTool('voice');
        setIsSidebarOpen(true);
    };

    // Selection Logic for Properties Panel (New)
    const selectedItem = useMemo(() => {
        if (activeVideoId) {
            const item = videoTrackItems.find(i => i.id === activeVideoId);
            // Ensure we return the item with its transform property
            return item || null;
        }
        if (activeCardId) {
            const c = cards.find(ca => ca.id === activeCardId);
            if (c) return {
                id: c.id,
                type: 'voice' as const,
                volume: c.volume,
                playbackRate: c.speed,
                content: c.content?.blocks?.[0]?.data?.text
            };
        }
        return null;
    }, [activeVideoId, activeCardId, videoTrackItems, cards]);




    const handleUpdateVolume = (vol: number) => {
        if (activeVideoId) {
            setVideoTrackItems(prev => {
                const next = prev.map(item => item.id === activeVideoId ? { ...item, volume: vol } : item);
                recordHistory(cards, next);
                return next;
            });
        } else if (activeCardId) {
            setCards(prev => {
                const next = prev.map(c => c.id === activeCardId ? { ...c, volume: vol } : c);
                recordHistory(next, videoTrackItems);
                return next;
            });
        } else if (activeMedia?.id) {
            setVideoTrackItems(prev => {
                const next = prev.map(item => item.id === activeMedia.id ? { ...item, volume: vol } : item);
                recordHistory(cards, next);
                return next;
            });
        }
    };

    const handleDeleteSelection = () => {
        handleContextAction('delete');
    };

    const handleContextAction = (action: string, value?: any) => {
        switch (action) {
            case 'volume':
                if (typeof value === 'number') {
                    if (activeVideoId) {
                        setVideoTrackItems(prev => prev.map(item =>
                            item.id === activeVideoId ? { ...item, volume: value } : item
                        ));
                    } else if (activeCardId) {
                        setCards(prev => prev.map(c =>
                            c.id === activeCardId ? { ...c, volume: value } : c
                        ));
                    }
                }
                break;
            case 'delete':
                if (activeCardId) {
                    const idToDelete = activeCardId;

                    // Optimistic UI Update
                    setCards(prev => {
                        const next = prev.filter(c => c.id !== idToDelete);
                        recordHistory(next, videoTrackItems);
                        return next;
                    });

                    // Prevent reappearance from subscription
                    pendingDeletionsRef.current.add(idToDelete);
                    setActiveCardId(null);

                    // API Call
                    deleteBlock(idToDelete).then(() => {
                        pendingDeletionsRef.current.delete(idToDelete);
                        toast.success('تم الحذف');
                    }).catch(err => {
                        console.error("Failed to delete block", err);
                        pendingDeletionsRef.current.delete(idToDelete);
                        toast.error("فشل الحذف");
                        // Ideally revert UI here, but complex with history
                    });
                } else if (activeVideoId) {
                    setVideoTrackItems(prev => {
                        const next = prev.filter(i => i.id !== activeVideoId);
                        recordHistory(cards, next);
                        return next;
                    });
                    setActiveVideoId(null);
                    toast.success('تم حذف العنصر');
                }
                break;
            case 'copy':
                if (activeCardId) {
                    const card = cards.find(c => c.id === activeCardId);
                    if (card) {
                        setStudioClipboard({ type: 'block', data: card });
                        toast.success('تم النسخ');
                    }
                } else if (activeVideoId) {
                    const item = videoTrackItems.find(i => i.id === activeVideoId);
                    if (item) {
                        setStudioClipboard({ type: 'video', data: item });
                        toast.success('تم نسخ العنصر');
                    }
                } else {
                    toast("لم يتم تحديد عنصر");
                }
                break;
            case 'cut':
                if (activeCardId) {
                    const card = cards.find(c => c.id === activeCardId);
                    if (card) {
                        setStudioClipboard({ type: 'block', data: card });
                        setCards(prev => {
                            const next = prev.filter(c => c.id !== activeCardId);
                            recordHistory(next, videoTrackItems);
                            return next;
                        });
                        setActiveCardId(null);
                        toast.success('تم القص');
                    }
                } else if (activeVideoId) {
                    const item = videoTrackItems.find(i => i.id === activeVideoId);
                    if (item) {
                        setStudioClipboard({ type: 'video', data: item });
                        setVideoTrackItems(prev => {
                            const next = prev.filter(i => i.id !== activeVideoId);
                            recordHistory(cards, next);
                            return next;
                        });
                        setActiveVideoId(null);
                        toast.success('تم قص العنصر');
                    }
                }
                break;
            case 'paste':
                if (studioClipboard) {
                    if (studioClipboard.type === 'block') {
                        const newId = uuidv4();
                        const newBlock = { ...studioClipboard.data, id: newId };
                        setCards(prev => {
                            const next = [...prev, newBlock];
                            recordHistory(next, videoTrackItems);
                            return next;
                        });
                        toast.success('تم اللصق');
                    } else if (studioClipboard.type === 'video') {
                        const newId = uuidv4();
                        const newItem = {
                            ...studioClipboard.data,
                            id: newId,
                            start: currentTime // Paste at Playhead
                        };
                        setVideoTrackItems(prev => {
                            const next = [...prev, newItem];
                            recordHistory(cards, next);
                            return next;
                        });
                        toast.success('تم لصق العنصر');
                    }
                } else {
                    toast("الحافظة فارغة");
                }
                break;
            case 'duplicate':
                if (activeCardId) {
                    const card = cards.find(c => c.id === activeCardId);
                    if (card) {
                        const newId = uuidv4();
                        const newBlock = { ...card, id: newId };
                        // Insert after current
                        const index = cards.findIndex(c => c.id === activeCardId);
                        setCards(prev => {
                            const newCards = [...prev];
                            newCards.splice(index + 1, 0, newBlock);
                            recordHistory(newCards, videoTrackItems);
                            return newCards;
                        });
                        toast.success('تم التكرار');
                    }
                } else if (activeVideoId) {
                    const item = videoTrackItems.find(i => i.id === activeVideoId);
                    if (item) {
                        const newId = uuidv4();
                        const newItem = { ...item, id: newId, start: item.start + item.duration };
                        setVideoTrackItems(prev => {
                            const next = [...prev, newItem];
                            recordHistory(cards, next);
                            return next;
                        });
                        toast.success('تم تكرار العنصر');
                    }
                }
                break;
            case 'info':
                if (activeCardId) {
                    const card = cards.find(c => c.id === activeCardId);
                    toast(`Block ID: ${card?.id}\nVoice: ${card?.voice}`);
                } else if (activeVideoId) {
                    const item = videoTrackItems.find(i => i.id === activeVideoId);
                    toast(`Type: ${item?.type}\nContent: ${item?.content}\nDuration: ${item?.duration}s`);
                } else {
                    toast(`Project: ${projectTitle}\nBlocks: ${cards.length}\nDuration: ${videoTrackItems.length > 0 ? '...' : '0s'}`);
                }
                break;
        }
    };

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            setIsCriticalLoading(true);
            setLoadingProgress(10);
            setLoadingMessage("يتم تحميل المشروع...");

            try {
                // 1. Fetch Project
                const projectData = await getProjectById(projectId);
                setLoadingProgress(40);

                if (!projectData) {
                    notFound();
                    return;
                }

                // 2. Fetch Voices
                setLoadingMessage("يتم تحضير الاصوات...");
                const voicesData = await fetchVoices().catch(e => { console.error("Voice fetch failed:", e); return []; });
                setLoadingProgress(70);

                // 3. Fetch Records/Assets
                setLoadingMessage("يتم تحضير assets...");
                const blocksData = await fetch(getApiUrl(`/api/project/get-records?projectId=${projectId}`), {
                    cache: 'no-store',
                    headers: { Authorization: `Bearer ${token}` }
                }).then(res => res.ok ? res.json() : []);
                setLoadingProgress(90);

                if (!projectData) {
                    notFound();
                    return;
                }

                const allVoices = voicesData.map((v: Voice) => ({
                    ...v,
                    isPro: v.provider === 'ghaymah' && PRO_VOICES_IDS.includes(v.name)
                }));

                setProject(projectData);
                if (projectData.blocks_json) {
                    let loadedItems = [];
                    let loadedLayers: TimelineLayer[] = [];
                    let settings: any = {};
                    let layerCount = 2;

                    // V2: Layer-Based Architecture
                    if (!Array.isArray(projectData.blocks_json) && projectData.blocks_json.kind === "projectData") {
                        console.log("[Persistence] Loading V2 Project Data");
                        const projectDataV2 = projectData.blocks_json as ProjectDataV2;
                        const flattened = flattenTimelineData(projectDataV2);

                        loadedItems = flattened.items;
                        layerCount = flattened.layerCount;
                        loadedLayers = flattened.layers;
                        if (flattened.settings?.activePresetId) {
                            setActivePresetId(flattened.settings.activePresetId);
                        }
                    }
                    // V1: Legacy Flat Array
                    else if (Array.isArray(projectData.blocks_json)) {
                        console.log("[Persistence] Loading V1 Legacy Data");
                        loadedItems = projectData.blocks_json;

                        // Extract Settings (Legacy Piggyback)
                        const settingsItemIndex = loadedItems.findIndex((i: any) => i.type === 'settings');
                        if (settingsItemIndex !== -1) {
                            try {
                                const s = JSON.parse(loadedItems[settingsItemIndex].content);
                                if (s.activePresetId) setActivePresetId(s.activePresetId);
                            } catch (e) {
                                console.error('[Persistence] Failed to parse settings', e);
                            }
                            loadedItems.splice(settingsItemIndex, 1);
                        }

                        // Sanitize Items logic (same as before)
                        loadedItems = loadedItems.map((item: any) => ({
                            ...item,
                            start: Number(item.start) || 0,
                            duration: Number(item.duration) || 5,
                            layerIndex: (item.layerIndex !== undefined && item.layerIndex !== null) ? Number(item.layerIndex) : 0,
                            transform: item.transform || { scale: 1, x: 0, y: 0, rotation: 0 }
                        }));

                        // Calculate Max Layer
                        loadedItems.forEach((item: any) => {
                            if (item.layerIndex !== undefined) {
                                layerCount = Math.max(layerCount, item.layerIndex + 1);
                            }
                        });
                    }

                    setVideoTrackItems(loadedItems);
                    setManualLayerCount(layerCount);
                    setLayersState(loadedLayers); // Sync V2 layers
                }

                setTimelineLoaded(true);
                setProjectTitle(projectData.name || "Untitled Project");
                setProjectDescription(projectData.description || "");
                setVoices(allVoices);

                const processedCards = blocksData
                    .filter((b: any) => {
                        if (b.id === 'merge' || b.block_index === 'merge' || b.block_index === 'record' || b.block_index === 'merged_blocks') return false;
                        if (b.s3_url && (typeof b.s3_url === 'string') && (b.s3_url.includes('_block') || b.s3_url.includes('_final'))) return false;
                        return true;
                    })
                    .map((card: StudioBlock) => {
                        let parsedContent = card.content;
                        if (typeof parsedContent === 'string') {
                            try {
                                parsedContent = JSON.parse(parsedContent);
                            } catch (e) {
                                console.error("Failed to parse card content:", e);
                                parsedContent = { blocks: [] };
                            }
                        }
                        if (!parsedContent || !parsedContent.blocks) {
                            parsedContent = { blocks: [], time: Date.now(), version: "2.28.2" };
                        }

                        return {
                            ...card,
                            content: parsedContent,
                            audioUrl: card.s3_url || card.audioUrl,
                            duration: card.duration ? (card.duration > 100 ? card.duration / 1000 : card.duration) : card.duration,
                            isGenerating: false
                        };
                    });

                setCards(processedCards);

                if (blocksData.length > 0) {
                    setActiveCardId(blocksData[0].id);
                }

                // Initialize History with loaded data
                resetHistory({
                    cards: processedCards,
                    videoTrackItems: (projectData.blocks_json && Array.isArray(projectData.blocks_json)) ? projectData.blocks_json : []
                });

            } catch (err) {
                console.error("Failed to fetch project data:", err);
                setError("Failed to load project data.");
            } finally {
                setIsCriticalLoading(false);
            }
        };

        fetchData();
    }, [projectId, token]);

    // Persist Video Timeline to Project.blocks_json
    // Persist Video Timeline to Project.blocks_json
    useEffect(() => {
        if (!projectId || !token || !timelineLoaded) return;

        const timer = setTimeout(async () => {
            try {
                // Sanitize items before saving
                const sanitizedItems = videoTrackItems.map(item => ({
                    id: item.id,
                    start: item.start,
                    duration: item.duration,
                    content: item.content,
                    type: item.type,
                    mediaStartOffset: item.mediaStartOffset,
                    blockId: item.blockId,
                    // Only save persistent URLs
                    audioUrl: item.audioUrl?.startsWith('blob:') ? undefined : item.audioUrl,
                    volume: item.volume,
                    playbackRate: item.playbackRate,
                    textStyle: item.textStyle
                }));

                const res = await executeGraphQL<any>({
                    query: UPDATE_PROJECT_BLOCKS,
                    variables: {
                        id: projectId,
                        blocks_json: sanitizedItems
                    },
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.errors) throw new Error(res.errors[0].message);
            } catch (e: any) {
                if (e.message !== 'connection error') {
                    console.error("Failed to save timeline", e);
                    toast.error(`Auto-save failed: ${e.message}`);
                }
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [videoTrackItems, projectId, token, timelineLoaded]);

    // Keep track of active card ID in a ref to use inside subscription callback
    const activeCardIdRef = useRef<string | null>(null);
    useEffect(() => {
        activeCardIdRef.current = activeCardId;
    }, [activeCardId]);

    // Keep track of layers in a ref to avoid circular dependencies in saveTimeline
    const layersStateRef = useRef<TimelineLayer[]>([]);
    useEffect(() => {
        layersStateRef.current = layersState;
    }, [layersState]);

    // Subscription Effect
    useEffect(() => {
        if (!projectId) return;

        const unsubscribe = subscribeToBlocks(projectId, (serverBlocks) => {
            console.groupCollapsed("🔔 Subscription Update");
            console.log("Server Blocks:", serverBlocks);
            console.log("Server IDs:", serverBlocks.map(b => b.id));

            setCards(currentCards => {
                const rawServerIds = new Set(serverBlocks.map(b => b.id));

                const validServerBlocks = Array.from(new Map(serverBlocks.map(b => [b.id, b])).values())
                    .filter(b => {
                        if (pendingDeletionsRef.current.has(b.id)) return false; // Ignore if pending delete
                        if (b.id === 'merge' || b.block_index === 'merge' || b.block_index === 'record' || b.block_index === 'merged_blocks') return false;
                        if (!b.content || !Array.isArray(b.content.blocks)) return false;
                        if (b.s3_url && (b.s3_url.includes('_block') || b.s3_url.includes('_final'))) {
                            return false;
                        }
                        return true;
                    });

                const serverCards = validServerBlocks.map(serverBlock => {
                    const existingCard = currentCards.find(c => c.id === serverBlock.id);
                    const isGenerated = !!serverBlock.s3_url;

                    // CRITICAL FIX: If this is the active card, prefer local state for content/voice to avoid flickering/overwriting user input from stale server echoes
                    const isActive = existingCard && existingCard.id === activeCardIdRef.current;

                    const localAudioUrl = existingCard?.audioUrl;
                    const localIsGenerating = existingCard?.isGenerating;

                    let newIsGenerating = false;

                    if (localIsGenerating) {
                        // If we are locally generating, only stop if:
                        // 1. Error occurred
                        // 2. We got a NEW s3_url (different from previous)
                        if (serverBlock.error) {
                            newIsGenerating = false;
                        } else if (serverBlock.s3_url && serverBlock.s3_url !== localAudioUrl) {
                            newIsGenerating = false;
                        } else {
                            // Still waiting for update (s3_url is same as old one, or empty)
                            newIsGenerating = true;
                        }
                    } else {
                        // Not generating locally? Then we aren't generating.
                        newIsGenerating = false;
                    }

                    return {
                        ...serverBlock,
                        content: isActive ? existingCard!.content : serverBlock.content, // Trust local content if active
                        audioUrl: serverBlock.s3_url || undefined,
                        duration: serverBlock.duration ? (serverBlock.duration > 100 ? serverBlock.duration / 1000 : serverBlock.duration) : (existingCard?.duration || 0),
                        isGenerating: newIsGenerating,
                        // Use server voice if available, otherwise fallback to existing or default. Trust local if active.
                        voice: isActive ? existingCard!.voice : (serverBlock.voice || existingCard?.voice || "ar-EG-ShakirNeural"),
                        // Provide provider if available
                        provider: isActive ? existingCard?.provider : (serverBlock.provider || existingCard?.provider),
                        voiceSelected: existingCard?.voiceSelected ?? true,
                        isArabic: existingCard?.isArabic ?? true,
                        job_id: newIsGenerating ? existingCard?.job_id : undefined,
                        error: serverBlock.error
                    } as StudioBlock;
                });

                const localOnlyCards = currentCards.filter(localCard =>
                    !rawServerIds.has(localCard.id)
                );

                const mergedCards = [...serverCards, ...localOnlyCards].sort((a, b) => {
                    const indexA = parseInt(a.block_index) || 0;
                    const indexB = parseInt(b.block_index) || 0;
                    if (indexA !== indexB) {
                        return indexA - indexB;
                    }
                    // Secondary sort by creation time to prevent jitter
                    const timeA = new Date(a.created_at || 0).getTime();
                    const timeB = new Date(b.created_at || 0).getTime();
                    if (timeA !== timeB) return timeA - timeB;
                    return a.id.localeCompare(b.id);
                });

                console.log("Current Local Cards:", currentCards.map(c => c.id));
                console.log("Merged Cards Result:", mergedCards.map(c => c.id));
                console.groupEnd();

                setTimeout(() => {
                    serverCards.forEach(newCard => {
                        const oldCard = currentCards.find(c => c.id === newCard.id);
                        if (oldCard && !oldCard.audioUrl && newCard.audioUrl) {
                            toast.success("تم توليد الصوت بنجاح", { id: newCard.id, position: 'top-right' });
                        }
                        if (oldCard && !oldCard.error && newCard.error) {
                            toast.error(`فشل توليد الصوت: ${newCard.error}`, { id: newCard.id, position: 'top-right' });
                        }
                    });
                }, 0);

                return mergedCards;
            });
        }, (err) => {
            console.error("Subscription Error:", err);
            toast.error("Service disconnected. You may need to refresh if issues persist.", { id: 'conn-err' });
        });

        return () => {
            if (unsubscribe && typeof unsubscribe.unsubscribe === 'function') {
                unsubscribe.unsubscribe();
            }
        };
    }, [projectId]);

    const activeCard = cards.find(c => c.id === activeCardId);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Auto-save for project name and description
    useEffect(() => {
        if (isInitialLoad.current) return;
        if (!token) return;

        console.log("[AutoSave] Queueing metadata save:", { projectTitle, projectDescription });

        const handler = setTimeout(() => {
            console.log("[AutoSave] Executing metadata save...", { projectTitle });
            updateProject(projectId, projectTitle, projectDescription, token)
                .then(res => console.log("[AutoSave] Metadata saved details:", res))
                .catch(err => {
                    console.error("Auto-save for metadata failed:", err);
                });
        }, 2000);
        return () => clearTimeout(handler);
    }, [projectTitle, projectDescription, projectId, token]);

    // --- Persistence Logic ---

    // 1. Voice Blocks Persistence (cards -> blocks table)
    const saveVoiceBlocks = useCallback(async (blocksToSave: StudioBlock[]) => {
        // console.log("Saving voice blocks...", blocksToSave.length);
        try {
            const payload = JSON.stringify({
                projectId: projectId,
                blocksJson: blocksToSave,
            });
            console.log(`[Persistence] Saving blocks. Payload size: ${payload.length} chars`);

            await fetch(`/api/project/save-editor-blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
            });
        } catch (err) {
            console.error("Voice blocks save failed:", err);
        }
    }, [projectId]);

    // 2. Timeline Persistence (videoTrackItems -> projects.blocks_json)
    const saveTimeline = useCallback(async (itemsToSave: TimelineItem[]) => {
        // V2: Structure Data
        const structuredData = structureTimelineData(
            itemsToSave,
            manualLayerCount,
            activePresetId,
            layersStateRef.current
        );

        console.log(`[Persistence] Saving Timeline V2 (${structuredData.layers.length} layers, ${itemsToSave.length} clips)`);

        // Sync back generated IDs/Layers to state so we permit them next time
        // Only update if IDs changed or new layers added to avoid loops
        const hasChanges = structuredData.layers.length !== layersStateRef.current.length ||
            structuredData.layers.some((l, i) => l.id !== layersStateRef.current[i]?.id);

        if (hasChanges) {
            console.log("[Persistence] Updating Layer State with new IDs");
            // We need to defer this to avoid "cannot update while rendering" if triggered synchronously
            setTimeout(() => setLayersState(structuredData.layers), 0);
        }

        try {
            await fetch(`/api/project/save-timeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    blocksJson: structuredData,
                }),
            });
        } catch (err: any) {
            console.error("Timeline save failed:", err);
        }
    }, [projectId, activePresetId, manualLayerCount]);

    const lastSavedCardsState = useRef<string>("");
    const lastSavedTimelineState = useRef<string>("");

    // Effect: Autosave Voice Blocks
    useEffect(() => {
        if (isInitialLoad.current) return;

        const handler = setTimeout(() => {
            if (cards.length > 0) {
                const currentCardsString = JSON.stringify(cards.map(c => ({
                    ...c,
                    isGenerating: false,
                    voiceSelected: c.voiceSelected
                })));

                if (currentCardsString !== lastSavedCardsState.current) {
                    saveVoiceBlocks(cards);
                    lastSavedCardsState.current = currentCardsString;
                }
            }
        }, 1500);
        return () => clearTimeout(handler);
    }, [cards, saveVoiceBlocks]);

    // Effect: Autosave Timeline
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        const handler = setTimeout(() => {
            const currentItemsString = JSON.stringify(videoTrackItems);

            if (currentItemsString !== lastSavedTimelineState.current) {
                saveTimeline(videoTrackItems);
                lastSavedTimelineState.current = currentItemsString;
            }
        }, 1000);
        return () => clearTimeout(handler);
    }, [videoTrackItems, saveTimeline]);

    const addCard = useCallback((currentVoices = voices) => {
        const newCardId = uuidv4();
        const defaultVoice = "ar-EG-ShakirNeural";

        setCards(prevCards => {
            const newCard: StudioBlock = {
                id: newCardId,
                project_id: projectId,
                block_index: prevCards.length.toString(),
                content: {
                    time: Date.now(),
                    blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: '' } }],
                    version: "2.28.2"
                },
                s3_url: '',
                created_at: new Date().toISOString(),
                voice: defaultVoice,
                isGenerating: false,
                isArabic: enableTashkeel,
                voiceSelected: false,
            };
            const next = [...prevCards, newCard];
            recordHistory(next, videoTrackItems);
            return next;
        });
        setActiveCardId(newCardId);
    }, [voices, projectId, enableTashkeel]);

    // Effect to calculate audio durations when audioUrl is present - REMOVED (Server handles this)
    // useEffect(() => { ... }, [cards]);

    const updateCard = useCallback((id: string, data: Partial<StudioBlock>) => {
        setCards(currentCards =>
            currentCards.map(card =>
                card.id === id ? { ...card, ...data } : card
            )
        );
    }, []);

    const removeCard = useCallback(async (id: string) => {
        setCards(prev => prev.filter(card => card.id !== id));
    }, []);

    const handleApplyVoice = (voiceName: string) => {
        if (activeCardId) {
            const selectedVoice = voices.find(v => v.name === voiceName);
            const isArabicVoice = false;
            updateCard(activeCardId, {
                voice: voiceName,
                isArabic: isArabicVoice,
                voiceSelected: true,
                audioUrl: undefined,
                s3_url: '',
                duration: undefined,
                job_id: undefined,
            });
            toast.success(`Voice applied. Audio will be regenerated.`);
        }
    };

    const handleCreateAndGenerateVoice = async (text: string, voice: Voice, provider: string, speed: number, pitch: number) => {
        if (!user) return;

        let targetBlockId = uuidv4();
        let isNewBlock = true;

        // Check if we can reuse the active block
        if (activeCardId) {
            const activeCard = cards.find(c => c.id === activeCardId);
            // Reuse if it has no audio (is a draft/ghost)
            if (activeCard && !activeCard.audioUrl && !activeCard.s3_url) {
                targetBlockId = activeCardId;
                isNewBlock = false;
            }
        }

        if (isNewBlock) {
            // Create initial card
            const newCard: StudioBlock = {
                id: targetBlockId,
                project_id: projectId,
                block_index: String(cards.length),
                content: {
                    time: Date.now(),
                    blocks: [{ id: uuidv4(), type: 'paragraph', data: { text } }],
                    version: "2.28.2"
                },
                s3_url: '',
                created_at: new Date().toISOString(),
                voice: voice.name,
                provider: provider,
                speed: speed,
                pitch: pitch,
                isGenerating: true,
                isArabic: enableTashkeel,
                voiceSelected: true,
            };

            const updatedCards = [...cards, newCard];
            setCards(updatedCards);
            setActiveCardId(targetBlockId);

            // Force save immediately
            await saveVoiceBlocks(updatedCards);
        } else {
            // Update existing card state to generating
            updateCard(targetBlockId, {
                voice: voice.name,
                isGenerating: true,
                isArabic: enableTashkeel,
                voiceSelected: true,
                error: undefined,
                content: {
                    time: Date.now(),
                    blocks: [{ id: uuidv4(), type: 'paragraph', data: { text } }],
                    version: "2.28.2"
                }
            });
        }

        try {
            // Use block ID as toast ID so subscription can update it
            toast.loading('جاري توليد الصوت...', { id: targetBlockId, position: 'top-right' });
            const sanitizedText = text.replace(/[^\u0621-\u064A\u0660-\u0669\u064B-\u0652a-zA-Z0-9\s،.؟]/g, '');

            const res = await fetch(`/api/tts/generate-segment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sanitizedText,
                    voice: voice.voiceId,
                    provider: voice.provider,
                    project_id: projectId,
                    user_id: user.id,
                    arabic: enableTashkeel,
                    block_id: targetBlockId // Pass block ID for server update
                }),
            });

            const job = await res.json();
            if (!res.ok) {
                throw new Error(job.error || 'Generation failed');
            }

            // Update card with job_id, but don't wait. Subscription will handle the rest.
            updateCard(targetBlockId, {
                job_id: job.job_id,
                isGenerating: true
            });

            const toastId = toast.loading('جاري بدء التوليد...', { position: 'top-right' });
            toast.success('تم بدء التوليد', { id: toastId, position: 'top-right' });

        } catch (error: any) {
            console.error("Generation error:", error);
            updateCard(targetBlockId, { error: error.message, isGenerating: false });
            toast.error(`فشل بدء التوليد: ${error.message}`, { position: 'top-right' });
        }
    };

    const handleGenerate = async () => {
        if (isGenerating) return;
        if (!user) return;

        if (cards.length > 50) {
            toast.error('لقد تجاوزت الحد الأقصى لعدد الكتل المسموح به وهو 50.');
            return;
        }

        for (const card of cards) {
            const text = card.content.blocks.map(b => b.data.text).join(' \n');
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            if (wordCount > 1000) {
                toast.error(`تجاوزت كتلة واحدة الحد الأقصى للكلمات وهو 1000 كلمة. (الكتلة الحالية: ${wordCount} كلمة)`);
                return;
            }
        }

        const cardsToGenerate = cards.filter(card =>
            card.content.blocks.some(b => b.data.text && b.data.text.trim().length > 0) &&
            !card.audioUrl &&
            !card.isGenerating
        );
        if (cardsToGenerate.length === 0) {
            toast.error('أضف نصًا لإنشاء الصوت أو انتظر حتى تكتمل العملية الحالية.');
            return;
        }

        setIsGenerating(true);
        const generationToastId = toast.loading(`Generating audio for ${cardsToGenerate.length} block(s)...`);

        setCards(currentCards =>
            currentCards.map(card =>
                cardsToGenerate.find(c => c.id === card.id)
                    ? { ...card, isGenerating: true, job_id: undefined, error: undefined } // Reset error state
                    : card
            )
        );

        const BATCH_SIZE = 1;

        type GenerationResult = {
            id: string;
            s3_url: string;
            audioUrl: string;
            duration: number;
            job_id: string;
            error?: undefined;
        } | {
            id: string;
            error: string;
            s3_url?: undefined;
            audioUrl?: undefined;
            duration?: undefined;
            job_id?: undefined;
        };

        const allResults: GenerationResult[] = [];
        for (let i = 0; i < cardsToGenerate.length; i += BATCH_SIZE) {
            const batch = cardsToGenerate.slice(i, i + BATCH_SIZE);

            const generationPromises = batch.map(async (card): Promise<GenerationResult> => {
                const sanitizedText = card.content.blocks.map(b => b.data.text).join(' \n').replace(/[^\u0621-\u064A\u0660-\u0669\u064B-\u0652a-zA-Z0-9\s،.؟]/g, '');
                const selectedVoice = voices.find(v => v.name === card.voice);

                const doGenerate = async (withDiacritics: boolean): Promise<GenerationResult> => {
                    if (selectedVoice?.provider === 'ghaymah' && MAINTENANCE_VOICES.includes(selectedVoice.voiceId)) {
                        const voiceName = selectedVoice?.characterName || card.voice;
                        throw new Error(`Voice "${voiceName}" is currently under maintenance.`);
                    }

                    if (!selectedVoice) {
                        throw new Error(`Voice for block with text "${card.content.blocks[0].data.text.substring(0, 20)}"... not found. Please re-select a voice.`);
                    }

                    const provider = selectedVoice.provider;

                    const res = await fetch(`/api/tts/generate-segment`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: sanitizedText,
                            voice: selectedVoice.voiceId,
                            provider: provider,
                            project_id: projectId,
                            user_id: user?.id,
                            arabic: withDiacritics,

                            block_id: card.id,
                            speed: card.speed || 1,
                            pitch: card.pitch || 1
                        }),
                    });
                    const job = await res.json();
                    if (!res.ok) {
                        let errorMessage = 'Failed to start generation job.';
                        if (job.error) {
                            errorMessage = typeof job.error === 'object' ? JSON.stringify(job.error) : job.error;
                        }
                        throw new Error(errorMessage);
                    }

                    // For batch generation, we might still want to wait or just rely on subscriptions.
                    // If we rely on subscriptions, we can't easily track "batch progress" here.
                    // So for now, let's keep the polling logic for BATCH generation, OR refactor it to just fire-and-forget
                    // and let the subscription update the UI.
                    // Given the requirement is to use subscriptions, let's switch to fire-and-forget for batch too.

                    // However, to keep the "toast" progress accurate, we might need to listen to the subscription updates
                    // which is hard inside this loop.
                    // For simplicity and robustness in this refactor, I will keep the polling for BATCH generation
                    // BUT I will use the new server-side worker if possible? No, the worker is fire-and-forget.
                    // So if I use the new API, I get a job_id immediately.
                    // I should probably just return the job_id and let the subscription handle the update.

                    return { id: card.id, job_id: job.job_id, s3_url: '', audioUrl: '', duration: 0 };
                };

                try {
                    // const toastId = toast.loading('جاري توليد الصوت...', { position: 'top-right' });
                    const result = await doGenerate(card.isArabic || false);
                    // toast.success('تم توليد الصوت بنجاح', { id: toastId, position: 'top-right' });
                    return result;
                } catch (error: any) {
                    return { id: card.id, error: error.message };
                }
            });

            const batchResults = await Promise.all(generationPromises);
            allResults.push(...batchResults);

            if (i + BATCH_SIZE < cardsToGenerate.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Update cards with job_ids so subscription can pick them up (or just to show generating state)
        setCards(currentCards => {
            const newCards = [...currentCards];
            allResults.forEach(result => {
                const cardIndex = newCards.findIndex(c => c.id === result.id);
                if (cardIndex !== -1) {
                    if (result.error) {
                        newCards[cardIndex] = {
                            ...newCards[cardIndex],
                            isGenerating: false,
                            error: result.error,
                        };
                    } else {
                        newCards[cardIndex] = {
                            ...newCards[cardIndex],
                            isGenerating: true, // Keep generating until subscription updates it
                            job_id: result.job_id,
                            error: undefined,
                        };
                    }
                }
            });
            return newCards;
        });

        toast.success(`Started generation for ${allResults.filter(r => !r.error).length} blocks.`, { id: generationToastId });
        setIsGenerating(false);
    };

    const handleUpdateBlock = async (blockId: string, text: string, voice: Voice, provider: string, speed: number, pitch: number) => {
        // Reuse generation logic but update existing block
        const card = cards.find(c => c.id === blockId);
        if (!card) return;

        updateCard(blockId, {
            voice: voice.name,
            provider: voice.provider,
            speed: speed,
            pitch: pitch,
            isGenerating: true,
            isArabic: enableTashkeel,
            voiceSelected: true,
            error: undefined
        });

        try {
            const toastId = toast.loading('جاري تحديث الصوت...', { position: 'top-right' });
            const sanitizedText = text.replace(/[^\u0621-\u064A\u0660-\u0669\u064B-\u0652a-zA-Z0-9\s،.؟]/g, '');

            const res = await fetch(`/api/tts/generate-segment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sanitizedText,
                    voice: voice.voiceId,
                    provider: voice.provider,
                    project_id: projectId,
                    user_id: user?.id,
                    arabic: enableTashkeel,
                    block_id: blockId // Pass block ID
                }),
            });

            const job = await res.json();
            if (!res.ok) {
                throw new Error(job.error || 'Generation failed');
            }

            updateCard(blockId, {
                job_id: job.job_id,
                isGenerating: true,
                content: {
                    ...card.content,
                    blocks: [{ ...card.content.blocks[0], data: { text } }]
                }
            });

            toast.success('تم بدء التحديث', { id: toastId, position: 'top-right' });

        } catch (error: any) {
            console.error("Update error:", error);
            updateCard(blockId, { error: error.message, isGenerating: false });
            toast.error(`فشل بدء التحديث: ${error.message}`, { position: 'top-right' });
        }
    };

    const handleDeleteBlock = async (blockId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا المقطع؟')) {
            const cardToDelete = cards.find(c => c.id === blockId);

            // Optimistic update
            await removeCard(blockId);
            if (activeCardId === blockId) {
                setActiveCardId(null);
            }

            // Server update
            try {
                console.log("Deleting block:", blockId);
                await deleteBlock(blockId);
                toast.success('تم حذف المقطع', { position: 'top-right' });
            } catch (error: any) {
                console.warn("Failed to delete block by ID, trying by index...", error);

                // Fallback: Try deleting by index if ID fails (e.g. mismatch)
                if (cardToDelete && cardToDelete.block_index) {
                    try {
                        await deleteBlockByIndex(projectId, cardToDelete.block_index);
                        toast.success('تم حذف المقطع (بالفهرس)', { position: 'top-right' });
                        return;
                    } catch (indexError) {
                        console.error("Failed to delete block by index:", indexError);
                    }
                }

                toast.error("فشل حذف المقطع من السيرفر. حاول مرة أخرى.");
            }
        }
    };

    const handleAddGhostBlock = (text: string, voice: Voice, provider: string, speed: number, pitch: number) => {
        const newCardId = uuidv4();
        setCards(prevCards => {
            const newCard: StudioBlock = {
                id: newCardId,
                project_id: projectId,
                block_index: prevCards.length.toString(),
                content: {
                    time: Date.now(),
                    blocks: [{ id: uuidv4(), type: 'paragraph', data: { text } }],
                    version: "2.28.2"
                },
                s3_url: '',
                created_at: new Date().toISOString(),
                voice: voice.name,
                provider: provider,
                speed: speed,
                pitch: pitch,
                isGenerating: false,
                isArabic: enableTashkeel,
                voiceSelected: true,
                duration: 0, // 0 indicates uninitialized duration (will be auto-updated on load)
            };
            return [...prevCards, newCard];
        });
        toast.success('Added to timeline', { icon: '📝', position: 'top-center' });
        scrollToTop();
    };

    const handleGenerateAll = async () => {
        const ungeneratedCards = cards.filter(c => !c.audioUrl && c.content.blocks[0]?.data?.text);
        if (ungeneratedCards.length === 0) {
            toast('No blocks to generate', { icon: 'ℹ️', position: 'top-right' });
            return;
        }

        toast.loading(`Starting batch generation for ${ungeneratedCards.length} blocks...`, { id: 'batch-gen', position: 'top-right' });

        for (const card of ungeneratedCards) {
            const text = card.content.blocks[0].data.text;
            const voiceName = card.voice;
            const voice = voices.find(v => v.name === voiceName);

            if (voice) {
                try {
                    await handleUpdateBlock(card.id, text, voice, voice.provider || '', 1, 1);
                } catch (e) {
                    console.error(`Failed to generate block ${card.id}`, e);
                }
            }
        }

        toast.success('Batch generation completed', { id: 'batch-gen', position: 'top-right' });
    };

    const handleDownloadAll = async () => {
        const audioCards = cards.filter(card => card.s3_url || card.audioUrl);
        if (audioCards.length === 0) {
            toast.error("No audio has been generated and saved yet.");
            return;
        }

        // Get actual URLs (prefer s3_url, fallback to audioUrl if it's a blob/local)
        const urlsToMerge = audioCards.map(c => c.s3_url || c.audioUrl!).filter(Boolean);

        const toastId = toast.loading('جاري دمج الملفات في المتصفح...');

        try {
            // Dynamic import to avoid SSR issues with ffmpeg.wasm
            const { mergeAudioFiles } = await import('@/lib/ffmpeg-merger');

            const mergedBlob = await mergeAudioFiles(urlsToMerge);

            // Create download link
            const url = URL.createObjectURL(mergedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle || 'project'}_full.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('تم تحميل الملف المدمج', { id: toastId });
        } catch (error: any) {
            console.error("Merging failed:", error);
            toast.error(`فشل الدمج: ${error.message}`, { id: toastId });
        }
    };

    const handleAssetsUpdated = (newAssets: any[]) => {
        if (!project) return;
        setProject(prev => {
            if (!prev) return null;
            return {
                ...prev,
                image_url: newAssets
            };
        });
    };

    const handleAddText = useCallback((type: 'heading' | 'subheading' | 'body') => {
        let textContent = 'New Text';
        let style = {
            fontSize: 24,
            fontWeight: 'normal',
            color: '#ffffff',
            backgroundColor: 'transparent',
            textAlign: 'center'
        };

        if (type === 'heading') {
            textContent = 'Heading';
            style = { ...style, fontSize: 48, fontWeight: 'bold', color: '#ffffff' };
        } else if (type === 'subheading') {
            textContent = 'Subheading';
            style = { ...style, fontSize: 32, fontWeight: 'bold', color: '#e0e0e0' };
        } else {
            textContent = 'Body Text';
            style = { ...style, fontSize: 24, color: '#cccccc' };
        }

        const newItem: TimelineItem = {
            id: uuidv4(),
            type: 'text',
            start: currentTime, // Add at current playhead
            duration: 5,
            content: textContent,
            textStyle: style as any
        };

        setVideoTrackItems(prev => [...prev, newItem]);
        recordHistory(cards, [...videoTrackItems, newItem]);
        toast.success(`Text added: ${type}`);
    }, [currentTime, videoTrackItems, cards, recordHistory]);


    const handleSplit = useCallback((itemId: string, splitTime: number, trackType: string) => {
        if (trackType === 'voice') {
            // Sort cards by block_index to ensure we split the correct visual item in sequence
            const sortedCards = [...cards].sort((a, b) => parseInt(a.block_index) - parseInt(b.block_index));

            const cardIndex = sortedCards.findIndex(c => c.id === itemId);
            if (cardIndex === -1) return;
            const card = sortedCards[cardIndex];

            // Calculate start time of this card
            let currentStart = 0;
            for (let i = 0; i < cardIndex; i++) {
                currentStart += (sortedCards[i].duration || 0);
            }

            const splitPointInItem = splitTime - currentStart;
            const cardDuration = card.duration || 0;

            if (splitPointInItem <= 0.1 || splitPointInItem >= cardDuration - 0.1) {
                toast.error("Split point too close to edge.");
                return;
            }

            const firstPart: StudioBlock = {
                ...card,
                duration: splitPointInItem
            };

            const secondPart: StudioBlock = {
                ...card,
                id: uuidv4(),
                created_at: new Date().toISOString(),
                // block_index will be recalculated by index in array ideally, or we just stringify it
                block_index: (parseInt(card.block_index) + 1).toString(),
                duration: cardDuration - splitPointInItem,
                trimStart: (card.trimStart || 0) + splitPointInItem
            };

            const newCards = [...sortedCards];
            newCards.splice(cardIndex, 1, firstPart, secondPart);

            // Recalculate indexes
            newCards.forEach((c, i) => c.block_index = i.toString());

            setCards(newCards);
            recordHistory(newCards, videoTrackItems);
            toast.success('Voice block split!');

        } else {
            // Video/Image Split
            const itemToSplit = videoTrackItems.find(item => item.id === itemId);
            if (!itemToSplit) return;

            const splitPointInItem = splitTime - itemToSplit.start;

            if (splitPointInItem <= 0.1 || splitPointInItem >= itemToSplit.duration - 0.1) {
                toast.error("Split point too close to edge.");
                return;
            }

            const firstPart: TimelineItem = {
                ...itemToSplit,
                duration: splitPointInItem,
            };

            const secondPart: TimelineItem = {
                ...itemToSplit,
                id: uuidv4(),
                start: splitTime,
                duration: itemToSplit.duration - splitPointInItem,
                mediaStartOffset: (itemToSplit.mediaStartOffset || 0) + splitPointInItem
            };

            const newItems = videoTrackItems.flatMap(item =>
                item.id === itemId ? [firstPart, secondPart] : item
            );

            setVideoTrackItems(newItems);
            recordHistory(cards, newItems);
            toast.success('Item split successfully!');
        }
    }, [cards, videoTrackItems, recordHistory]);

    const languages = Array.from(new Map(voices.map(v => [v.languageCode, { code: v.languageCode, name: v.languageName }])).values());
    const countries = Array.from(new Map(voices.map(v => [v.countryCode, { code: v.countryCode, name: v.countryName }])).values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    const providers = Array.from(new Set(voices.map(v => v.provider))).filter(p => p);

    const filteredVoices = voices
        .filter(voice => (languageFilter === 'all' || voice.languageCode === languageFilter))
        .filter(voice => (countryFilter === 'all' || voice.countryCode === countryFilter))
        .filter(voice => (genderFilter === 'all' || voice.gender === genderFilter))
        .filter(voice => (providerFilter === 'all' || voice.provider === providerFilter))
        .filter(voice => {
            if (searchTerm.trim() === '') return true;
            const lowerSearchTerm = searchTerm.toLowerCase();
            return (voice.characterName.toLowerCase().includes(lowerSearchTerm) || voice.countryName.toLowerCase().includes(lowerSearchTerm));
        });

    const handleTextUpdate = useCallback((id: string, newStyle: any) => {
        setVideoTrackItems(prev => {
            return prev.map(item =>
                item.id === id
                    ? { ...item, textStyle: newStyle }
                    : item
            );
        });
        setActiveVideoId(id);
    }, []);

    const handleUpdateText = useCallback((content: string, style: any) => {
        if (!activeVideoId) return;

        setVideoTrackItems(prev => {
            return prev.map(item =>
                item.id === activeVideoId && item.type === 'text'
                    ? { ...item, content: content, textStyle: style }
                    : item
            );
        });
    }, [activeVideoId]);

    const activeTextItems = useMemo(() => {
        return videoTrackItems
            .filter(item => item.type === 'text' && currentTime >= item.start && currentTime < (item.start + item.duration))
            .map(item => ({ id: item.id, content: item.content, style: item.textStyle }));
    }, [videoTrackItems, currentTime]);

    const handleUpdateItemSpeed = useCallback((newSpeed: number) => {
        const targetId = activeVideoId || activeMedia?.id;
        if (!targetId) return;

        setVideoTrackItems(prev => prev.map(item => {
            if (item.id === targetId) {
                // Ensure we have sourceDuration (original duration at 1x)
                const sourceDuration = item.sourceDuration || item.duration;
                // Calculate new duration: duration = source / speed
                const newDuration = sourceDuration / newSpeed;

                return {
                    ...item,
                    playbackRate: newSpeed,
                    sourceDuration: sourceDuration,
                    duration: newDuration
                };
            }
            return item;
        }));
    }, [activeVideoId, activeMedia]);










    const handleManualSave = useCallback(async () => {
        const toastId = toast.loading('Saving project...');
        try {
            await Promise.all([
                saveVoiceBlocks(cards),
                saveTimeline(videoTrackItems)
            ]);
            toast.success('Project saved successfully!', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Failed to save project', { id: toastId });
        }
    }, [cards, videoTrackItems, saveVoiceBlocks, saveTimeline]);

    // --- Import/Export Project File ---
    const handleExportProject = useCallback(async () => {
        const toastId = toast.loading('Packing project file (this might take a while)...');
        try {
            const { createMuejamFile } = await import('@/lib/project-file');
            const blob = await createMuejamFile(projectTitle, cards, videoTrackItems, activePresetId);

            // Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.muejam`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Project exported successfully!', { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error('Failed to export project', { id: toastId });
        }
    }, [projectTitle, cards, videoTrackItems, activePresetId]);

    const handleImportProject = useCallback(async (file: File) => {
        const toastId = toast.loading('Importing project & unpacking assets...');
        try {
            const { parseMuejamFile } = await import('@/lib/project-file');
            const projectData = await parseMuejamFile(file);

            // Restore State
            setProjectTitle(projectData.metadata.title);
            setProjectDescription(projectData.metadata.description);
            if (projectData.settings?.activePresetId) {
                setActivePresetId(projectData.settings.activePresetId);
            }

            // IMPORTANT: cards need to be mapped to be compatible if needed, assuming direct match for now
            // But checking types is safer.
            setCards(projectData.content.voiceBlocks);
            setVideoTrackItems(projectData.content.timelineItems);

            // Auto-Save imported state
            await Promise.all([
                saveVoiceBlocks(projectData.content.voiceBlocks),
                saveTimeline(projectData.content.timelineItems)
            ]);

            toast.success('Project imported successfully!', { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error('Failed to import project', { id: toastId });
        }
    }, [saveVoiceBlocks, saveTimeline]);


    if (!user) {
        return null;
    }

    return (
        <PerformanceProvider>
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={confirmExport}
                isExporting={isExporting}
            />
            {isCriticalLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-studio-bg-light dark:bg-studio-bg transition-colors duration-300">
                    <div className="w-full max-w-md px-6 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-studio-accent flex items-center justify-center shadow-lg shadow-studio-accent/20">
                                <span className="text-white font-bold text-2xl">S</span>
                            </div>
                            <h1 className="text-2xl font-bold text-studio-text-light dark:text-studio-text">
                                Studio muejam
                            </h1>
                        </div>
                        <div className="w-full bg-studio-panel-light dark:bg-studio-panel h-2 rounded-full overflow-hidden border border-studio-border-light dark:border-studio-border relative">
                            <div
                                className="h-full bg-studio-accent transition-all duration-300 ease-out relative overflow-hidden"
                                style={{ width: `${loadingProgress}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-studio-text-light/70 dark:text-studio-text/70 animate-pulse font-medium">
                            {loadingMessage}
                        </p>
                    </div>
                </div>
            )}

            {project && (
                <div className="flex h-screen bg-studio-bg-light dark:bg-studio-bg font-sans overflow-hidden text-studio-text-light dark:text-studio-text flex-row">
                    {/* Left Sidebar - Always Visible */}
                    <StudioSidebar
                        activeItem={activeLeftTool}
                        onItemClick={setActiveLeftTool}
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Toolbar */}
                        {/* Top Toolbar */}
                        <Toolbar
                            onExport={handleDownloadAll}
                            onExportVideo={handleExportClick}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            enableTashkeel={enableTashkeel}
                            onToggleTashkeel={() => setEnableTashkeel(!enableTashkeel)}
                            activeTool={activeTool}
                            onToolChange={setActiveTool}
                            onBack={() => router.push('/projects')}
                            activePresetId={activePresetId}
                            onPresetChange={setActivePresetId}
                            handleSave={handleManualSave}
                            onExportProject={handleExportProject}
                            onImportProject={handleImportProject}
                        />

                        {/* Middle Area: Split View (Properties + Center + Dynamic) */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

                            {/* Right: Dynamic Panel (Reordered: First in DOM -> Right in RTL) */}
                            {/* This puts the Library/Tools NEXT to the Sidebar which is exactly what we want */}
                            <div ref={dynamicPanelRef} className={`w-full lg:w-[340px] flex-shrink-0 bg-studio-bg-light dark:bg-studio-bg border-l border-studio-border-light dark:border-studio-border z-10 overflow-y-auto ${!activeLeftTool ? 'hidden' : ''}`}>
                                <DynamicPanel
                                    voices={voices}
                                    activeTool={activeLeftTool}
                                    onGenerateVoice={handleCreateAndGenerateVoice}
                                    activeBlock={activeCard}
                                    blockIndex={activeCardId ? (cards.findIndex(c => c.id === activeCardId) + 1) : undefined}
                                    onUpdateBlock={handleUpdateBlock}
                                    onDeleteBlock={handleDeleteBlock}
                                    onClearSelection={() => setActiveCardId(null)}
                                    onAddGhostBlock={handleAddGhostBlock}
                                    project={project}
                                    onAssetsUpdated={handleAssetsUpdated}
                                    onAddText={handleAddText}
                                />
                            </div>

                            {/* Center: Preview Player */}
                            <div className="flex-1 flex flex-col relative bg-black/20 overflow-hidden">
                                <PreviewPlayer
                                    layers={activeVisualLayers}
                                    activeId={activeVideoId}
                                    activeMedia={activeMedia} // Keep for legacy or specific audio logic if any

                                    isPlaying={isPlaying}
                                    currentTime={currentTime}
                                    playbackRate={playbackRate}
                                    onPlayPause={() => timelineRef.current?.togglePlayPause()}
                                    onSeek={(t) => timelineRef.current?.seek(t)}
                                    // Media Volume
                                    onVolumeChange={handleUpdateVolume}
                                    activeTextItems={activeTextItems}
                                    onTextUpdate={handleTextUpdate}
                                    aspectRatio={ASPECT_RATIO_PRESETS.find(p => p.id === activePresetId)?.ratio || 16 / 9}
                                    // Visual Transform - PREFER SELECTED ITEM
                                    activeTransform={
                                        activeVideoId
                                            ? (videoTrackItems.find(i => i.id === activeVideoId)?.transform || { scale: 1, x: 0, y: 0, rotation: 0 })
                                            : (activeMedia?.id ? videoTrackItems.find(i => i.id === activeMedia.id)?.transform : { scale: 1, x: 0, y: 0, rotation: 0 })
                                    }
                                    onTransformUpdate={(newTransform) => {
                                        // Update the SELECTED item (activeVideoId) if available, otherwise activeMedia
                                        const targetId = activeVideoId || activeMedia?.id;
                                        if (targetId) {
                                            setVideoTrackItems(prev => prev.map(item =>
                                                item.id === targetId
                                                    ? { ...item, transform: newTransform }
                                                    : item
                                            ));
                                        }
                                    }}
                                />
                            </div>

                            {/* Left: Properties Panel (Reordered: Last in DOM -> Left in RTL) */}
                            <div className="w-full lg:w-[300px] flex-shrink-0 bg-[#1E1E1E] border-r border-studio-border z-10 overflow-y-auto">
                                <PropertiesPanel
                                    selectedItem={selectedItem as any}
                                    currentGlobalSpeed={selectedItem?.playbackRate ?? playbackRate}
                                    onUpdateVolume={handleUpdateVolume}
                                    onUpdateSpeed={handleUpdateItemSpeed}
                                    onDelete={handleDeleteSelection}
                                    onUpdateText={handleUpdateText}
                                    onUpdateTransform={(newTransform) => {
                                        // Update transform for the selected item (activeVideoId)
                                        if (activeVideoId) {
                                            setVideoTrackItems(prev => prev.map(item =>
                                                item.id === activeVideoId
                                                    ? { ...item, transform: newTransform }
                                                    : item
                                            ));
                                        }
                                    }}
                                    onUpdateOpacity={(newOpacity) => {
                                        if (activeVideoId) {
                                            setVideoTrackItems(prev => prev.map(item =>
                                                item.id === activeVideoId
                                                    ? { ...item, opacity: newOpacity }
                                                    : item
                                            ));
                                        }
                                    }}
                                    onUpdateVisibility={(visible) => {
                                        if (activeVideoId) {
                                            setVideoTrackItems(prev => prev.map(item =>
                                                item.id === activeVideoId
                                                    ? { ...item, visible: visible }
                                                    : item
                                            ));
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Middle Action Bar (CapCut Style) */}
                        <StudioToolbar
                            isPlaying={isPlaying}
                            onPlayPause={() => timelineRef.current?.togglePlayPause()}
                            onSeekStart={() => timelineRef.current?.seek(0)}
                            zoomLevel={zoomLevel}
                            onZoomIn={handleZoomIn}
                            onZoomOut={handleZoomOut}
                            activeTool={activeTool}
                            onToolChange={setActiveTool}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            onDelete={handleDeleteSelection}
                            onSplit={() => {
                                // We can trigger split logic here if needed, or keeping tool selection is often enough
                                // For now, the razor tool is selected via onToolChange
                            }}
                            onAddLayer={handleAddLayer}
                            currentTime={currentTime}
                        />

                        {/* Timeline Area (Fixed at bottom of main content) */}
                        <div className="h-[280px] flex-shrink-0 border-t border-border bg-muted/30 backdrop-blur-md z-20">
                            <Timeline
                                ref={timelineRef}
                                cards={cards}
                                voices={voices}
                                onCardsUpdate={setCards}
                                isBlocksProcessing={isGenerating}
                                onBlockClick={handleBlockClick}
                                onAddBlock={addNewBlock}
                                onGenerateAll={handleGenerateAll}
                                videoTrackItems={videoTrackItems}
                                onVideoTrackUpdate={handleVideoTrackUpdate}
                                activeBlockId={activeCardId}
                                onActiveMediaChange={setActiveMedia}
                                onTimeUpdate={setCurrentTime}
                                onIsPlayingChange={setIsPlaying}
                                activeVideoId={activeVideoId}
                                onVideoClick={handleVideoSelect}
                                onPlaybackRateChange={setPlaybackRate}
                                activeTool={activeTool}
                                onSplit={handleSplit}
                                onToolChange={setActiveTool}
                                onDelete={handleDeleteSelection}
                                onUndo={handleUndo}
                                onRedo={handleRedo}
                                canUndo={canUndo}
                                canRedo={canRedo}
                                // Lifted Props
                                zoomLevel={zoomLevel}
                                manualLayerCount={manualLayerCount}
                            />
                        </div>
                    </div>
                </div>
            )}
        </PerformanceProvider>
    );
};
