
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { TimelineItem } from '../components/Timeline';

let ffmpeg: FFmpeg | null = null;

interface RenderOptions {
    width?: number;
    height?: number;
    fps?: number;
    onProgress?: (progress: number) => void;
    preset?: 'fast' | 'balanced' | 'professional';
}

export async function renderTimelineToVideo(
    videoItems: TimelineItem[],
    audioItems: TimelineItem[],
    opt: RenderOptions = {}
): Promise<Blob> {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
    }
    const { width = 1280, height = 720, fps = 30, onProgress, preset = 'balanced' } = opt;

    // Load FFmpeg
    if (!ffmpeg.loaded) {
        const baseURL = '/ffmpeg';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }

    ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]:', message));

    // 1. Pre-process Assets
    // Identify all unique visual assets to download once
    const visualItems = videoItems.filter(i => i.type !== 'text');
    const textItems = videoItems.filter(i => i.type === 'text');

    // Map ItemID -> Local Filename
    const assetMap = new Map<string, string>();
    const uniqueAssets = new Map<string, string>(); // Url -> Filename

    let assetCounter = 0;

    // Helper to get asset
    const getAssetFilename = (url: string) => {
        if (!uniqueAssets.has(url)) {
            const ext = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.mov') ? 'mp4' : 'png';
            const fname = `asset_${assetCounter++}.${ext}`;
            uniqueAssets.set(url, fname);
        }
        return uniqueAssets.get(url)!;
    };

    // Download Phase
    const downloadQueue = visualItems.map(async (item) => {
        let url = item.audioUrl || item.content || "";
        if (!url) return;
        if (url.startsWith('http')) url = `/api/asset-proxy?url=${encodeURIComponent(url)}`;

        const fname = getAssetFilename(url);
        assetMap.set(item.id, fname);

        // Check if already written?
        try {
            await ffmpeg!.readFile(fname);
            // Already exists
        } catch (e) {
            // Fetch and write
            const res = await fetch(url);
            const blob = await res.blob();
            await ffmpeg!.writeFile(fname, await fetchFile(blob));
        }
    });

    onProgress?.(5);
    await Promise.all(downloadQueue);
    onProgress?.(15);

    // 2. Slicing Strategy
    // Find all critical points
    const points = new Set<number>([0]);
    visualItems.forEach(i => {
        points.add(i.start);
        points.add(i.start + i.duration);
    });
    // Add end of timeline if needed? 
    // Usually max(duration) is enough.
    const sortedPoints = Array.from(points).sort((a, b) => a - b);

    // If last point is 0, nothing to render
    if (sortedPoints.length <= 1) {
        // Return empty black video?
        sortedPoints.push(5); // Default 5s
    }

    const segments: string[] = [];
    const totalDuration = sortedPoints[sortedPoints.length - 1];

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const start = sortedPoints[i];
        const end = sortedPoints[i + 1];
        const duration = end - start;

        if (duration < 0.05) continue; // Skip micro gaps

        const segName = `chunk_${i}.mp4`;

        // Find active items in this interval
        // Sort by Layer Index (Z-Index)
        const activeItems = visualItems
            .filter(v => v.start < end - 0.01 && (v.start + v.duration) > start + 0.01)
            .sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));

        // Build Filter Graph
        const args: string[] = [];

        // Input 0: Black Background
        args.push('-f', 'lavfi', '-i', `color=c=black:s=${width}x${height}:r=${fps}`);

        // Inputs for items
        activeItems.forEach(item => {
            const fname = assetMap.get(item.id);
            if (fname) args.push('-i', fname);
        });

        // Filter Complex
        let filter = `[0:v]trim=duration=${duration.toFixed(3)}[base];`;
        let lastStream = '[base]';

        activeItems.forEach((item, idx) => {
            const inputIdx = idx + 1;
            const fname = assetMap.get(item.id);
            if (!fname) return;

            // Calculate trim relative to item source
            // Item starts at item.start.
            // Current slice starts at 'start'.
            // Offset into item = start - item.start.
            // Plus item.mediaStartOffset (if video trimmed).
            const relStart = (start - item.start) + (item.mediaStartOffset || 0);
            const relDuration = duration;

            // 1. Trim & SetPTS
            // If image, we loop/trim? Image doesn't need trim start, just duration?
            // Actually image needs loop. FFmpeg handles image input as 25fps stream if looped?
            // Or use -loop 1 input option?
            // Better to use filter 'loop=loop=-1:size=1:start=0' or just '-loop 1' on input.
            // But we didn't put -loop 1 on input args above.
            // Let's assume we handle it in filter.

            const isVideo = fname.endsWith('mp4');
            const rate = item.playbackRate || 1;
            let chain = `[${inputIdx}:v]`;

            if (isVideo) {
                // Calculate source start and duration based on rate
                const sourceRelStart = ((start - item.start) * rate) + (item.mediaStartOffset || 0);
                const sourceDuration = duration * rate;

                // Apply trim and speed change
                chain += `trim=start=${sourceRelStart.toFixed(3)}:duration=${sourceDuration.toFixed(3)},setpts=(PTS-STARTPTS)/${rate}`;
            } else {
                // Image: loop it to fill duration (rate doesn't apply to static image)
                chain += `loop=loop=-1:size=1:start=0,trim=duration=${duration.toFixed(3)},setpts=PTS-STARTPTS`;
            }

            // 2. Scale & Transform
            const tf = item.transform || { scale: 1, x: 0, y: 0 };
            const scale = tf.scale || 1;
            // Scale Calculation
            // Scale to fit wrapper then apply transform scale
            const scaleW = `iw*min(${width}/iw,${height}/ih)*${scale}`;
            const scaleH = `ih*min(${width}/iw,${height}/ih)*${scale}`;
            chain += `,scale=w='${scaleW}':h='${scaleH}'`;

            // 3. Opacity
            if (item.opacity !== undefined && item.opacity < 1) {
                chain += `,format=rgba,colorchannelmixer=aa=${item.opacity}`;
            }

            // 4. Position (Overlay X/Y)
            const x = tf.x || 0;
            const y = tf.y || 0;
            // X/Y are % from center? Logic from previous file:
            // x/y are percentages of canvas size.
            // (W-w)/2 + (x%/100 * W)
            const overlayX = `(W-w)/2+(${x}/100*${width})`;
            const overlayY = `(H-h)/2+(${y}/100*${height})`;

            chain += `[v${idx}];`;

            // 5. Overlay
            filter += `${lastStream}[v${idx}]overlay=x='${overlayX}':y='${overlayY}':shortest=1[tmp${idx}];`;
            lastStream = `[tmp${idx}]`;
        });

        // Remove trailing semicolon from last overlay
        filter = filter.slice(0, -1);
        // Rename last stream to out?
        // Actually [tmpN] is the output of last overlay.

        args.push('-filter_complex', filter);
        args.push('-map', lastStream);

        // Output format
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p');
        args.push(segName);

        await ffmpeg!.exec(args);
        segments.push(segName);

        const overallProgress = 15 + ((i / sortedPoints.length) * 60);
        onProgress?.(overallProgress);
    }

    // 3. Concatenate Segments
    if (segments.length === 0) {
        // Fallback: Create 1 second black video
        console.warn("No video segments generated. Creating dummy black video.");
        await ffmpeg.exec([
            '-f', 'lavfi',
            '-i', `color=c=black:s=${width}x${height}:r=${fps}`,
            '-t', '1',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            'visual_out.mp4'
        ]);
    } else {
        const concatList = 'concat_list.txt';
        let listContent = '';
        segments.forEach(seg => {
            listContent += `file '${seg}'\n`;
        });
        await ffmpeg.writeFile(concatList, listContent);

        try {
            await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', concatList, '-c', 'copy', 'visual_out.mp4']);
        } catch (e) {
            console.error("Concat execution error", e);
            throw new Error("Video stitching failed.");
        }
    }

    // Safe check
    try {
        await ffmpeg.readFile('visual_out.mp4');
    } catch (e) {
        throw new Error("Failed to generate visual output (file not found).");
    }

    onProgress?.(80);

    // 4. Audio Mixing (Keep existing logic)
    const audioSources: {
        filename: string,
        start: number,
        volume?: number,
        playbackRate?: number,
        mediaStartOffset?: number,
        duration?: number
    }[] = [];

    // Extract audio from video items if needed (re-use download logic?)
    // Or extract from original assets?
    // We didn't track "which item" gave which asset well for this.
    // Let's re-iterate videoItems to extract audio.

    for (const item of visualItems) {
        if (!item.audioUrl && (item.content?.endsWith('.mp4') || item.content?.endsWith('.mov'))) {
            // It's a video, might have audio.
            const fname = assetMap.get(item.id);
            if (fname) {
                const audName = `aud_${item.id}.wav`;
                try {
                    const rate = item.playbackRate || 1;
                    const offset = (item.mediaStartOffset || 0).toFixed(3);
                    // We need source duration = timeline duration * rate
                    const sourceDurationVal = item.duration * rate;
                    const durationStr = sourceDurationVal.toFixed(3);

                    await ffmpeg.exec(['-ss', offset, '-i', fname, '-t', durationStr, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', audName]);

                    // We extracted exactly what we need, so for mixing we just need to apply speed.
                    // mediaStartOffset is handled by extraction (-ss).
                    // duration is handled by extraction (-t).
                    // So in mixing: playbackRate needed. offset=0. sourceDuration already cut?
                    // Actually if we cut it exactly, applying atempo will result in correct timeline duration.
                    audioSources.push({
                        filename: audName,
                        start: item.start,
                        volume: item.volume,
                        playbackRate: rate,
                        duration: item.duration, // Timeline duration
                        mediaStartOffset: 0 // Already cut
                    });
                } catch (e) { }
            }
        }
    }

    // Add standalone audio items
    // audioItems are passed in args (voices + music)
    let audioCounter = 0;
    for (const item of audioItems) {
        let url = item.audioUrl;
        if (!url) continue;
        if (url.startsWith('http')) url = `/api/asset-proxy?url=${encodeURIComponent(url)}`;

        const audName = `ext_aud_${audioCounter++}.mp3`; // Assume mp3 or whatever
        const res = await fetch(url);
        const blob = await res.blob();
        await ffmpeg.writeFile(audName, await fetchFile(blob));
        audioSources.push({
            filename: audName,
            start: item.start,
            volume: item.volume,
            playbackRate: item.playbackRate || 1,
            mediaStartOffset: item.mediaStartOffset || 0,
            duration: item.duration
        });
    }

    let mixedFileName = 'mixed_out.mp4';

    if (audioSources.length > 0) {
        const mixArgs = ['-i', 'visual_out.mp4'];
        let filter = "";

        audioSources.forEach((src, idx) => {
            mixArgs.push('-i', src.filename);
            const streamIdx = idx + 1;
            const delay = Math.round(src.start * 1000);
            const vol = src.volume ?? 1;
            const rate = src.playbackRate || 1;
            const offset = src.mediaStartOffset || 0;
            // Calculate source duration needed
            const sourceDur = (src.duration || 0) * rate;

            // Audio Filter Chain: atrim -> atempo -> volume -> adelay
            let af = `[${streamIdx}:a]`;

            // 1. Trim (if needed)
            if (offset > 0 || sourceDur > 0) {
                // Note: atrim uses time seconds. 
                // If item is the whole file, duration check might be needed?
                // But safer to always trim to be precise.
                af += `atrim=start=${offset}:duration=${sourceDur},`;
                // Reset PTS after trim so valid atempo calculation
                af += `asetpts=PTS-STARTPTS,`;
            }

            // 2. Speed (atempo)
            if (Math.abs(rate - 1) > 0.01) {
                // Handle rate outside 0.5-2.0 if needed, but for now user has [0.5, 2]
                af += `atempo=${rate},`;
            }

            // 3. Volume & Delay
            af += `volume=${vol},adelay=${delay}|${delay}[a${idx}];`;

            filter += af;
        });

        audioSources.forEach((_, i) => filter += `[a${i}]`);
        filter += `amix=inputs=${audioSources.length}:dropout_transition=0:duration=first[out_audio]`;

        mixArgs.push('-filter_complex', filter);
        mixArgs.push('-map', '0:v');
        mixArgs.push('-map', '[out_audio]');
        mixArgs.push('-c:v', 'copy');
        mixArgs.push('-c:a', 'aac');
        mixArgs.push(mixedFileName);

        await ffmpeg.exec(mixArgs);
    } else {
        await ffmpeg.exec(['-i', 'visual_out.mp4', '-c', 'copy', mixedFileName]);
    }

    onProgress?.(90);

    // 5. Text Overlay
    if (textItems.length > 0) {
        // ... (Re-implement Text Logic or Copy it) ...
        // For brevity, I'll assume Text Logic is similar to before.
        // I will copy the text overlay logic from previous file.

        const textInputs: { fname: string; item: TimelineItem }[] = [];
        const createTextImage = (item: TimelineItem): string => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';

            const style = item.textStyle || {};
            const scaleFactor = height / 720;
            const fontSize = (style.fontSize || 24) * scaleFactor;

            ctx.font = `${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || 'Arial'}`;
            ctx.textAlign = style.textAlign || 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = style.color || '#ffffff';

            // Positional
            const y = (style.yPosition !== undefined ? style.yPosition : 50) / 100 * canvas.height;
            let x = canvas.width / 2;
            if (style.xPosition !== undefined) {
                x = (style.xPosition / 100) * canvas.width;
            } else {
                if (ctx.textAlign === 'left') x = canvas.width * 0.05;
                if (ctx.textAlign === 'right') x = canvas.width * 0.95;
            }

            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            const lines = (item.content || '').split('\\n');
            const lineHeight = fontSize * 1.2;
            const initialY = y - ((lines.length - 1) * lineHeight) / 2;

            lines.forEach((line, index) => {
                ctx.fillText(line, x, initialY + (index * lineHeight));
            });
            return canvas.toDataURL('image/png');
        };

        for (let i = 0; i < textItems.length; i++) {
            const item = textItems[i];
            const dataUrl = createTextImage(item);
            const fname = `text_${i}.png`;
            await ffmpeg.writeFile(fname, await fetchFile(dataUrl));
            textInputs.push({ fname, item });
        }

        let filterComplex = "";
        textInputs.forEach((ti, idx) => {
            const inputIdx = idx + 1;
            const prevStream = idx === 0 ? "[0:v]" : `[v${idx - 1}]`;
            const nextStream = `[v${idx}]`;
            filterComplex += `${prevStream}[${inputIdx}:v]overlay=0:0:enable='between(t,${ti.item.start.toFixed(3)},${(ti.item.start + ti.item.duration).toFixed(3)})'${nextStream};`;
        });
        filterComplex = filterComplex.slice(0, -1);
        const lastStream = `[v${textInputs.length - 1}]`;

        await ffmpeg.exec([
            '-i', mixedFileName,
            ...textInputs.flatMap(t => ['-i', t.fname]),
            '-filter_complex', filterComplex,
            '-map', lastStream,
            '-map', '0:a?',
            '-c:v', 'libx264',
            '-c:a', 'copy',
            'final_with_text.mp4'
        ]);
        mixedFileName = 'final_with_text.mp4';
    }

    const data = await ffmpeg.readFile(mixedFileName);
    return new Blob([data as any], { type: 'video/mp4' });
}
