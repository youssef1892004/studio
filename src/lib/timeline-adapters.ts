import { v4 as uuidv4 } from 'uuid';
import { TimelineItem, TimelineLayer, ProjectDataV2 } from './types';

/**
 * Converts the flat list of TimelineItems (from UI/State) into a structured Layer-based object (V2).
 * @param items Flat list of items from the timeline state.
 * @param manualLayerCount The current manually set layer count in the UI.
 * @param existingLayers Optional existing layers to preserve IDs and metadata (locks/visibility).
 */
export function structureTimelineData(
    items: TimelineItem[],
    manualLayerCount: number,
    activePresetId: string,
    existingLayers: TimelineLayer[] = []
): ProjectDataV2 {

    // 1. Group items by layerIndex
    const layerGroups = new Map<number, TimelineItem[]>();

    // Initialize groups based on manual count to ensure empty layers exist
    for (let i = 0; i < manualLayerCount; i++) {
        layerGroups.set(i, []);
    }

    // Distribute items
    items.forEach(item => {
        const idx = item.layerIndex ?? 0;
        // Expand if item is beyond manual count (safety)
        if (!layerGroups.has(idx)) {
            layerGroups.set(idx, []);
        }
        layerGroups.get(idx)?.push(item);
    });

    // 2. Create Layer Objects
    const layers: TimelineLayer[] = [];
    const sortedIndices = Array.from(layerGroups.keys()).sort((a, b) => a - b);

    // Map old normalized indices to current actual indices to find existing layer metadata
    // This is a simple mapping assuming index checks. 
    // Ideally we track by ID, but from UI state we only have index.
    // So we try to find a layer with the same 'order' in existingLayers.

    sortedIndices.forEach((originalIndex, newOrder) => {
        const groupItems = layerGroups.get(originalIndex) || [];

        // Try to find existing layer by Order (UI Index) or ID if we tracked it
        // Since UI index = Order, we look for existing layer with this order.
        const existingLayer = existingLayers.find(l => l.order === newOrder);

        const layerId = existingLayer ? existingLayer.id : uuidv4();

        // Clean up items for storage (add layerId, maybe strip layerIndex?)
        // We keep layerIndex undefined or ignore it on load since strict hierarchy rules.
        const cleanedClips = groupItems.map(item => ({
            ...item,
            layerId: layerId, // Parent Reference
            // We do NOT strictly need layerIndex in V2 storage, 
            // but keeping it undefined or syncing it might be confusing.
            // Let's rely on nesting.
            layerIndex: undefined
        }));

        layers.push({
            id: layerId,
            type: 'visual', // Default, could infer from items if needed
            order: newOrder, // Normalized Order (0, 1, 2...)
            name: existingLayer?.name || `Layer ${newOrder + 1}`,
            isLocked: existingLayer?.isLocked || false,
            isVisible: existingLayer?.isVisible ?? true,
            clips: cleanedClips
        });
    });

    return {
        version: 2,
        kind: "projectData",
        layers,
        settings: { activePresetId }
    };
}

/**
 * Flattens the structured ProjectDataV2 (from DB) into a flat list for the UI.
 * @param data The structured project data.
 */
export function flattenTimelineData(data: ProjectDataV2): { items: TimelineItem[], layerCount: number, layers: TimelineLayer[], settings?: { activePresetId?: string } } {
    if (!data || !Array.isArray(data.layers)) {
        return { items: [], layerCount: 2, layers: [] };
    }

    const flatItems: TimelineItem[] = [];

    // Sort layers by order to ensure consistency
    const sortedLayers = [...data.layers].sort((a, b) => a.order - b.order);

    sortedLayers.forEach(layer => {
        if (!layer.clips) return;

        layer.clips.forEach(clip => {
            flatItems.push({
                ...clip,
                layerIndex: layer.order, // Strict: UI uses Order
                layerId: layer.id        // Strict: Track Parent
            });
        });
    });

    return {
        items: flatItems,
        layerCount: sortedLayers.length,
        layers: sortedLayers,
        settings: data.settings
    };
}
