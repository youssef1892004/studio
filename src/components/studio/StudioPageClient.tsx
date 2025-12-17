'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { fetchVoices } from '@/lib/tts';
import { Voice, StudioBlock, Project } from '@/lib/types';
import { LoaderCircle, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getProjectById, updateProject, subscribeToBlocks, deleteBlock, deleteBlockByIndex, executeGraphQL, UPDATE_PROJECT_BLOCKS } from '@/lib/graphql';




import { uploadAudioSegment } from '@/lib/tts';
import toast from 'react-hot-toast';
import ProjectHeader from '@/components/studio/ProjectHeader';
// import EditorCanvas from '@/components/studio/EditorCanvas'; // Removed
// import RightSidebar from '@/components/studio/RightSidebar'; // Removed
import StudioSidebar from '@/components/studio/Sidebar';
import Toolbar from '@/components/studio/Toolbar';
import Timeline, { TimelineHandle, TimelineItem } from '@/components/Timeline';
import CenteredLoader from '@/components/CenteredLoader';
import PreviewPlayer from '@/components/studio/PreviewPlayer';
import DynamicPanel from '@/components/studio/DynamicPanel';
import StudioContextMenu from '@/components/studio/StudioContextMenu';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import { useStudioHistory } from '@/hooks/useStudioHistory';

import { getApiUrl } from '@/lib/tts';
import { notFound } from 'next/navigation';

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
    const [exportSettings, setExportSettings] = useState({ resolution: '720p', fps: 30 });

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

    const confirmExport = async () => {
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

            toast.loading(`Rendering video (${exportSettings.resolution} @ ${exportSettings.fps}fps)...`, { id: toastId });

            // Resolve Settings
            let width = 1280, height = 720;
            if (exportSettings.resolution === '1080p') { width = 1920; height = 1080; }
            if (exportSettings.resolution === '480p') { width = 854; height = 480; }

            // 3. Render
            const blob = await renderTimelineToVideo(visualItems, allAudioItems, {
                width,
                height,
                fps: exportSettings.fps,
                onProgress: (p) => {
                    toast.loading(`Rendering video (${exportSettings.resolution}) ... ${p}%`, { id: toastId });
                }
            });

            // 4. Download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectTitle || 'video'}_${exportSettings.resolution}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Video exported successfully!', { id: toastId });

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
            if (item) return {
                id: item.id,
                type: (item.type === 'text' ? 'text' : 'video') as 'text' | 'video',
                volume: item.volume ?? 1,
                playbackRate: item.playbackRate ?? 1,
                name: item.content,
                content: item.content,
                textStyle: item.textStyle
            };
        } else if (activeCardId) {
            const card = cards.find(c => c.id === activeCardId);
            if (card) return { id: card.id, type: 'voice' as const, volume: card.volume ?? 1, playbackRate: card.playbackRate ?? 1, name: 'Voice Block' };
        }
        return null;
    }, [activeVideoId, activeCardId, videoTrackItems, cards]);

    const handleUpdateItemSpeed = (rate: number) => {
        if (activeVideoId) {
            setVideoTrackItems(prev => {
                const next = prev.map(item => item.id === activeVideoId ? { ...item, playbackRate: rate } : item);
                recordHistory(cards, next);
                return next;
            });
        } else if (activeCardId) {
            setCards(prev => {
                const next = prev.map(c => c.id === activeCardId ? { ...c, playbackRate: rate } : c);
                recordHistory(next, videoTrackItems);
                return next;
            });
        }
    };

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
                if (projectData.blocks_json && Array.isArray(projectData.blocks_json)) {
                    setVideoTrackItems(projectData.blocks_json);
                }
                setTimelineLoaded(true);
                setProjectTitle(projectData.name || "Untitled Project");
                setProjectDescription(projectData.description || "");
                setVoices(allVoices);
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

    // Keep track of active card ID in a ref to use inside subscription callback without re-running effect
    const activeCardIdRef = useRef<string | null>(null);
    useEffect(() => {
        activeCardIdRef.current = activeCardId;
    }, [activeCardId]);

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
        const handler = setTimeout(() => {
            updateProject(projectId, projectTitle, projectDescription, token)
                .catch(err => {
                    console.error("Auto-save for metadata failed:", err);
                });
        }, 2000);
        return () => clearTimeout(handler);
    }, [projectTitle, projectDescription, projectId, token]);

    // Main save function for blocks
    const saveBlocks = useCallback(async (blocksToSave: StudioBlock[]) => {
        console.log("Saving blocks...", blocksToSave);
        try {
            await fetch(`/api/project/save-editor-blocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    blocksJson: blocksToSave, // Send the raw data
                }),
            });
        } catch (err) {
            console.error("Blocks save failed:", err);
        }
    }, [projectId]);

    // Ref to store the last saved state string to prevent redundant saves (loop breaking)
    const lastSavedState = useRef<string>("");

    // Effect to trigger save when cards change
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        };

        const handler = setTimeout(() => {
            if (cards.length > 0) {
                // Create a stable string representation of the cards
                // We map to remove unstable fields (like isGenerating if it's transient) if needed, 
                // but checking the whole object is usually safer for sync.
                const currentCardsString = JSON.stringify(cards.map(c => ({
                    ...c,
                    // Ignore fields that might change locally but shouldn't trigger a DB save looping
                    isGenerating: false, // Don't save generating state changes repeatedly
                    voiceSelected: c.voiceSelected // Keep this
                })));

                if (currentCardsString !== lastSavedState.current) {
                    saveBlocks(cards);
                    lastSavedState.current = currentCardsString;
                }
            }
        }, 1000); // Wait 1 second after last change to save
        return () => clearTimeout(handler);
    }, [cards, saveBlocks]);

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
            await saveBlocks(updatedCards);
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

    if (!user) {
        return null;
    }






    return (
        <>
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
                                className="absolute top-0 left-0 h-full bg-studio-accent transition-all duration-300 ease-out rounded-full"
                                style={{ width: `${loadingProgress}%` }}
                            />
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
                        />

                        {/* Middle Area: Split View (Left Panel + Center Player + Right Properties) */}
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                            {/* Right: Properties Panel (Now First in Source -> Right in RTL) */}
                            <div className="w-full lg:w-[300px] flex-shrink-0 bg-[#1E1E1E] border-l border-studio-border z-10 overflow-y-auto">
                                <PropertiesPanel
                                    selectedItem={selectedItem}
                                    currentGlobalSpeed={selectedItem?.playbackRate ?? playbackRate}
                                    onUpdateVolume={handleUpdateVolume}
                                    onUpdateSpeed={handleUpdateItemSpeed}
                                    onDelete={handleDeleteSelection}
                                    onUpdateText={handleUpdateText}
                                />
                            </div>

                            {/* Center: Preview Player */}
                            <div className="flex-1 flex flex-col relative bg-black/20 overflow-hidden">
                                <PreviewPlayer
                                    activeMedia={activeMedia}
                                    isPlaying={isPlaying}
                                    currentTime={currentTime}
                                    playbackRate={playbackRate}
                                    onPlayPause={() => timelineRef.current?.togglePlayPause()}
                                    onSeek={(t) => timelineRef.current?.seek(t)}
                                    onVolumeChange={handleUpdateVolume}
                                    activeTextItems={activeTextItems}
                                    onTextUpdate={handleTextUpdate}
                                />
                            </div>

                            {/* Left: Dynamic Panel (Now Last in Source -> Left in RTL) */}
                            <div ref={dynamicPanelRef} className={`w-full lg:w-[340px] flex-shrink-0 bg-studio-bg-light dark:bg-studio-bg border-r border-studio-border-light dark:border-studio-border z-10 overflow-y-auto ${!activeLeftTool ? 'hidden' : ''}`}>
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
                        </div>

                        {/* Timeline Area */}
                        <div className="h-[180px] md:h-[250px] flex-shrink-0 border-t border-studio-border-light dark:border-studio-border bg-studio-panel-light dark:bg-studio-panel z-10">
                            <Timeline
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
                                ref={timelineRef}
                            />
                        </div>
                    </div>
                </div>
            )}

            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1E1E1E] p-6 rounded-xl border border-[#333] shadow-2xl w-[400px] flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Export Settings</h2>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10">
                                <span className="sr-only">Close</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-400 border-b border-white/5 pb-1 mb-1">Resolution (Quality)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['480p', '720p', '1080p'].map((res) => (
                                        <button
                                            key={res}
                                            onClick={() => setExportSettings(s => ({ ...s, resolution: res }))}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${exportSettings.resolution === res
                                                ? 'bg-[#F48969] text-white shadow-lg ring-1 ring-[#F48969]'
                                                : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333] hover:text-white'
                                                }`}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-400 border-b border-white/5 pb-1 mb-1">Frame Rate</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[24, 30, 60].map((fps) => (
                                        <button
                                            key={fps}
                                            onClick={() => setExportSettings(s => ({ ...s, fps: fps }))}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${exportSettings.fps === fps
                                                ? 'bg-[#F48969] text-white shadow-lg ring-1 ring-[#F48969]'
                                                : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333] hover:text-white'
                                                }`}
                                        >
                                            {fps} FPS
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#2A2A2A] text-gray-300 hover:bg-[#333] font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmExport}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-[#F48969] hover:bg-[#E07858] text-white font-bold shadow-lg shadow-[#F48969]/20 transition-all active:scale-95"
                            >
                                Start Export
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <StudioContextMenu
                visible={contextMenu.visible}
                x={contextMenu.x}
                y={contextMenu.y}
                type={contextMenu.type}
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
                onAction={handleContextAction}
                currentVolume={currentMenuVolume}
            />
        </>
    );
}
