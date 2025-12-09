import init, { generate_waveform_wasm, validate_media_item_wasm } from '../../public/wasm/media_engine.js';

let isReady = false;

export const initWasm = async () => {
    if (isReady) return;
    try {
        await init('/wasm/media_engine_bg.wasm');
        isReady = true;
        console.log("🦀 WebAssembly Module Loaded!");
    } catch (e) {
        console.error("Failed to load Wasm module", e);
    }
};

export const generateWaveform = async (audioData: Uint8Array, points: number) => {
    if (!isReady) await initWasm();
    return generate_waveform_wasm(audioData, points);
};

export const validateMediaItem = async (json: string) => {
    if (!isReady) await initWasm();
    return validate_media_item_wasm(json);
};
