import JSZip from 'jszip';
import { MuejamProjectFile, StudioBlock } from './types';

// Helper to fetch blob from URL
async function fetchBlob(url: string): Promise<{ blob: Blob; type: string }> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const blob = await response.blob();
        return { blob, type: blob.type };
    } catch (error) {
        console.error("Fetch blob error", error);
        throw error;
    }
}

function getExtensionFromType(type: string): string {
    if (type.includes('image/png')) return 'png';
    if (type.includes('image/jpeg')) return 'jpg';
    if (type.includes('image/gif')) return 'gif';
    if (type.includes('image/webp')) return 'webp';
    if (type.includes('video/mp4')) return 'mp4';
    if (type.includes('video/webm')) return 'webm';
    if (type.includes('audio/mpeg')) return 'mp3';
    if (type.includes('audio/wav')) return 'wav';
    return 'bin';
}

export async function createMuejamFile(
    projectTitle: string,
    cards: StudioBlock[],
    timelineItems: any[],
    activePresetId: string
): Promise<Blob> {
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets");

    // Deep copy to avoid mutation
    const processedItems = JSON.parse(JSON.stringify(timelineItems));
    const processedCards = JSON.parse(JSON.stringify(cards));

    // Helper to process asset
    const processAsset = async (url: string | undefined, prefix: string): Promise<string | undefined> => {
        if (!url) return undefined;
        if (!url.startsWith('http') && !url.startsWith('blob:')) return url; // Already relative or data URI?

        try {
            const { blob, type } = await fetchBlob(url);
            const ext = getExtensionFromType(type);
            const filename = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

            assetsFolder?.file(filename, blob);
            return `assets/${filename}`;
        } catch (e) {
            console.warn(`Failed to bundle asset ${url}, keeping original URL`, e);
            return url;
        }
    };

    // 1. Process Timeline Items
    for (let i = 0; i < processedItems.length; i++) {
        const item = processedItems[i];

        // Content (Image/Video URL)
        if (item.type === 'image' || item.type === 'video' || item.type === 'scene') {
            // Sometimes content is the URL
            if (item.content && (item.content.startsWith('http') || item.content.startsWith('blob:'))) {
                item.content = await processAsset(item.content, `${item.type}-${i}`);
            }
        }

        // Audio URL (Music/Voice items)
        if (item.audioUrl) {
            item.audioUrl = await processAsset(item.audioUrl, `audio-${i}`);
        }
    }

    // 2. Process Voice Cards
    for (let i = 0; i < processedCards.length; i++) {
        const card = processedCards[i];
        if (card.audioUrl) {
            card.audioUrl = await processAsset(card.audioUrl, `voice-${i}`);
        }
    }

    const projectFile: MuejamProjectFile = {
        version: "1.0.0",
        metadata: {
            title: projectTitle,
            description: "Exported from Studio",
            createdAt: new Date().toISOString(),
            exportedAt: new Date().toISOString()
        },
        settings: {
            activePresetId
        },
        content: {
            voiceBlocks: processedCards,
            timelineItems: processedItems
        }
    };

    zip.file("project.json", JSON.stringify(projectFile, null, 2));

    return await zip.generateAsync({ type: "blob" });
}

export async function parseMuejamFile(file: File): Promise<MuejamProjectFile> {
    const zip = await JSZip.loadAsync(file);
    const projectJson = await zip.file("project.json")?.async("string");

    if (!projectJson) throw new Error("Invalid project file: missing project.json");

    const projectData: MuejamProjectFile = JSON.parse(projectJson);
    const assetMap = new Map<string, string>();

    const getAssetUrl = async (path: string | undefined): Promise<string | undefined> => {
        if (!path || !path.startsWith('assets/')) return path;
        if (assetMap.has(path)) return assetMap.get(path);

        // Remove "assets/" prefix if needed or just use path if zip.file matches exact path
        // JSZip file lookup is strict? "assets/foo.png" usually works if folder struct matches
        const file = zip.file(path);
        if (file) {
            const blob = await file.async("blob");
            const url = URL.createObjectURL(blob);
            assetMap.set(path, url);
            return url;
        }
        // Fallback: try removing directory prefix
        const fileName = path.split('/').pop();
        if (fileName) {
            const fallbackFile = zip.folder("assets")?.file(fileName);
            if (fallbackFile) {
                const blob = await fallbackFile.async("blob");
                const url = URL.createObjectURL(blob);
                assetMap.set(path, url); // Map original path to this url
                return url;
            }
        }

        console.warn(`Asset not found in zip: ${path}`);
        return path;
    };

    // Restore Timeline Items
    for (const item of projectData.content.timelineItems) {
        if (item.type === 'image' || item.type === 'video' || item.type === 'scene') {
            const resolvedUrl = await getAssetUrl(item.content);
            if (resolvedUrl) {
                item.content = resolvedUrl;
            }
        }
        if (item.audioUrl) {
            const resolvedAudio = await getAssetUrl(item.audioUrl);
            if (resolvedAudio) {
                item.audioUrl = resolvedAudio;
            }
        }

        // Ensure sourceDuration is preserved (it should be in JSON)
    }

    // Restore Voice Cards
    for (const card of projectData.content.voiceBlocks) {
        if (card.audioUrl) {
            const resolvedAudio = await getAssetUrl(card.audioUrl);
            if (resolvedAudio) {
                card.audioUrl = resolvedAudio;
            }
        }
    }

    return projectData;
}
