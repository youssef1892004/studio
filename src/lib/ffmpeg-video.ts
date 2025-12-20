
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

    // Map preset to FFmpeg settings
    // fast: ultrafast, crf 28 (smaller file, fast encode, lower quality)
    // balanced: medium, crf 23 (standard)
    // professional: slow, crf 18 (high quality, slow encode)
    let ffmpegPreset = 'medium';
    let crf = '23';

    if (preset === 'fast') {
        ffmpegPreset = 'ultrafast';
        crf = '28';
    } else if (preset === 'professional') {
        ffmpegPreset = 'medium'; // 'slow' might be too heavy for WASM, sticking to medium but lower CRF for quality
        crf = '18';
    }

    if (!ffmpeg.loaded) {
        const baseURL = '/ffmpeg';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }

    // Attach Loggers
    ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]:', message));
    // We handle progress manually via loops for better UX
    // ffmpeg.on('progress', ({ progress }) => ... );

    const videoSegments: string[] = [];
    const audioSources: { filename: string, start: number, volume?: number }[] = [];

    // Helper to generate black segment
    const createBlackSegment = async (duration: number, name: string) => {
        // Minimum duration safety
        const safeDur = Math.max(0.1, duration);
        await ffmpeg!.exec([
            '-f', 'lavfi',
            '-i', `color=c=black:s=${width}x${height}:r=${fps}`,
            '-t', safeDur.toFixed(3),
            '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
            name
        ]);
        return name;
    };

    // Separate Visuals & Text
    const visualItems = videoItems.filter(i => i.type !== 'text');
    const textItems = videoItems.filter(i => i.type === 'text');

    const sortedVisualItems = [...visualItems].sort((a, b) => a.start - b.start);
    let currentVideoCursor = 0;
    const totalSteps = sortedVisualItems.length + audioItems.length + 5; // approx
    let completedSteps = 0;

    const reportProgress = () => {
        if (onProgress) onProgress(Math.min(99, Math.round((completedSteps / totalSteps) * 100)));
    }

    for (let i = 0; i < sortedVisualItems.length; i++) {
        completedSteps++;
        reportProgress();
        const item = sortedVisualItems[i];

        // A. Handle Gap (Black Screen)
        if (item.start > currentVideoCursor + 0.1) {
            const gapDur = item.start - currentVideoCursor;
            const gapName = `gap_visual_${i}.ts`;
            await createBlackSegment(gapDur, gapName);
            videoSegments.push(gapName);
            currentVideoCursor = item.start; // Update cursor
        }

        // B. Process Item
        const isVideo = item.type === 'scene' || item.content?.toLowerCase().endsWith('.mp4') || item.content?.toLowerCase().endsWith('.mov');
        const ext = isVideo ? 'mp4' : 'png';
        const inputName = `v_in_${i}.${ext}`;
        const segName = `seg_visual_${i}.ts`;

        let url = item.audioUrl || item.content || ""; // Use audioUrl as priority for visual assets ensuring correct path
        if (url.startsWith('http')) url = `/api/asset-proxy?url=${encodeURIComponent(url)}`; // Correct API endpoint

        try {
            console.time(`fetch_${i}`);
            // Validate fetch first to prevent HTML/Error injection into FFmpeg
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
            const contentType = res.headers.get('content-type');
            if (contentType && (contentType.includes('text/') || contentType.includes('application/json'))) {
                const text = await res.text();
                console.error(`Invalid asset content for ${url}:`, text.slice(0, 100)); // Log signature
                throw new Error("Invalid asset: Received HTML/JSON instead of media");
            }
            const blob = await res.blob();
            await ffmpeg.writeFile(inputName, await fetchFile(blob));
            console.timeEnd(`fetch_${i}`);

            // Transform Logic
            const transform = item.transform || { scale: 1, x: 0, y: 0, rotation: 0 };
            const scale = transform.scale || 1;
            const x = transform.x || 0;
            const y = transform.y || 0;

            // Updated Filter Chain: Scale -> Overlay on Black Canvas
            // 1. Scale input to fit * scaleFactor
            const scaleW = `iw*min(${width}/iw,${height}/ih)*${scale}`;
            const scaleH = `ih*min(${width}/iw,${height}/ih)*${scale}`;
            const scaleFilter = `[0:v]scale=w='${scaleW}':h='${scaleH}'[fg]`;

            // 2. Overlay [fg] onto [bg] (black color source)
            // x/y are percentages of canvas size.
            // Overlay x = (W-w)/2 + (x%/100 * W)
            const overlayX = `(W-w)/2+(${x}/100*${width})`;
            const overlayY = `(H-h)/2+(${y}/100*${height})`;
            const overlayFilter = `[1:v][fg]overlay=x='${overlayX}':y='${overlayY}':shortest=1,setsar=1`;

            const complexFilter = `${scaleFilter};${overlayFilter}`;

            // Output flags (without filter)
            const baseEncodingFlags = ['-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-f', 'mpegts'];

            // We must strictly trim/limit duration to item.duration
            const CHUNK_DURATION = 10;
            const needsChunking = isVideo && item.duration > CHUNK_DURATION;

            // Helper to build command
            const runFFmpeg = async (seek: string | null, duration: string, outName: string) => {
                const args = [];
                // Input 0 (Visual)
                if (seek) args.push('-ss', seek);
                if (!isVideo) args.push('-loop', '1'); // Loop image
                args.push('-i', inputName);

                // Input 1 (Background Color)
                args.push('-f', 'lavfi', '-i', `color=c=black:s=${width}x${height}:r=${fps}`);

                // Filter
                args.push('-filter_complex', complexFilter);

                // Duration & Output
                args.push('-t', duration);
                if (!isVideo) args.push('-tune', 'stillimage');
                args.push(...baseEncodingFlags, outName);

                await ffmpeg!.exec(args);
                return outName;
            };

            if (isVideo) {
                if (needsChunking) {
                    let processed = 0;
                    let chunkIdx = 0;
                    while (processed < item.duration) {
                        const currentChunkDur = Math.min(CHUNK_DURATION, item.duration - processed);
                        const subSegName = `seg_visual_${i}_${chunkIdx}.ts`;
                        const currentOffset = (item.mediaStartOffset || 0) + processed;

                        await runFFmpeg(currentOffset.toFixed(3), currentChunkDur.toFixed(3), subSegName);
                        videoSegments.push(subSegName);

                        processed += currentChunkDur;
                        chunkIdx++;
                    }

                    // Audio extraction (unchanged)
                    if (item.audioUrl) {
                        const audName = `v_aud_${i}.wav`;
                        try {
                            const offset = (item.mediaStartOffset || 0).toFixed(3);
                            const duration = item.duration.toFixed(3);
                            await ffmpeg.exec(['-ss', offset, '-i', inputName, '-t', duration, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', audName]);
                            audioSources.push({ filename: audName, start: item.start, volume: item.volume });
                        } catch (e) { /* Ignore */ }
                    }

                } else {
                    // Standard processing for short clips
                    const offset = (item.mediaStartOffset || 0).toFixed(3);
                    const duration = item.duration.toFixed(3);

                    await runFFmpeg(offset, duration, segName);
                    videoSegments.push(segName);

                    // Extract Audio
                    if (item.audioUrl) {
                        const audName = `v_aud_${i}.wav`;
                        try {
                            await ffmpeg.exec(['-ss', offset, '-i', inputName, '-t', duration, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', audName]);
                            audioSources.push({ filename: audName, start: item.start, volume: item.volume });
                        } catch (e) { /* Ignore */ }
                    }
                }
            } else {
                // Image
                await runFFmpeg(null, item.duration.toFixed(3), segName);
                videoSegments.push(segName);
            }

            // cleanup input immediately
            try { await ffmpeg.deleteFile(inputName); } catch (e) { }

            currentVideoCursor += item.duration; // Use strict addition for precision tracking

        } catch (err) {
            console.error(`Error processing visual item ${i}`, err);
        }
    }

    // --- 2. Process Voice Track ---
    let maxAudioEnd = 0;
    for (let i = 0; i < audioItems.length; i++) {
        completedSteps++;
        reportProgress();
        const item = audioItems[i];
        const name = `voice_${i}.mp3`;
        const rawName = `raw_${name}`;
        let url = item.audioUrl || "";
        if (url.startsWith('http')) url = `/api/proxy-audio?url=${encodeURIComponent(url)}`;
        try {
            await ffmpeg.writeFile(rawName, await fetchFile(url));

            // Trim/Cut Audio Segment
            const offset = (item.mediaStartOffset || 0).toFixed(3);
            const duration = item.duration.toFixed(3);

            // Cut and save to 'name'
            await ffmpeg.exec(['-ss', offset, '-t', duration, '-i', rawName, '-vn', name]);

            audioSources.push({ filename: name, start: item.start, volume: item.volume });

            // cleanup raw audio input
            try { await ffmpeg.deleteFile(rawName); } catch (e) { }

            maxAudioEnd = Math.max(maxAudioEnd, item.start + item.duration);
        } catch (e) {
            console.error(`Error processing voice ${i}`, e);
        }
    }

    // --- 3. Fill Final Gap (if Audio is longer than Video) ---
    // This gap is for the visual track, before audio mixing
    if (maxAudioEnd > currentVideoCursor + 0.1) {
        const finalGap = maxAudioEnd - currentVideoCursor;
        const finalGapName = 'gap_final_visual.ts';
        await createBlackSegment(finalGap, finalGapName);
        videoSegments.push(finalGapName);
    }

    // --- 4. Concat Visuals ---
    // --- 4. Concat Visuals ---
    if (videoSegments.length > 0) {
        const concatList = videoSegments.map(f => `file '${f}'`).join('\n');
        await ffmpeg.writeFile('concat_list.txt', concatList);
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat_list.txt', '-c', 'copy', 'visual_out.mp4']);

        // Cleanup segments
        try { await ffmpeg.deleteFile('concat_list.txt'); } catch (e) { }
        for (const seg of videoSegments) {
            try { await ffmpeg.deleteFile(seg); } catch (e) { }
        }
    } else {
        if (audioSources.length === 0) throw new Error("No content to export.");
        const duration = maxAudioEnd || 10;
        await createBlackSegment(duration, 'visual_out.mp4');
    }

    // --- 5. Mix Audio and Combine with Visuals ---
    // --- 5. Mix Audio and Combine with Visuals ---
    const mixInputs = ['-i', 'visual_out.mp4'];
    const audioInputs = audioSources.flatMap(s => ['-i', s.filename]);
    mixInputs.push(...audioInputs);

    let mixedFileName = 'pre_text.mp4';
    const hasAudio = audioSources.length > 0;

    if (hasAudio) {
        let filter = "";
        // visual_out is index 0. Audio files start at index 1.
        audioSources.forEach((src, i) => {
            const index = i + 1;
            const delay = Math.round(src.start * 1000);
            const vol = src.volume !== undefined ? src.volume : 1;
            filter += `[${index}:a]volume=${vol},adelay=${delay}|${delay}[a${i}];`;
        });
        audioSources.forEach((_, i) => filter += `[a${i}]`);
        // Map 0:v (visual) to output video, and map amix output to output audio
        // duration=first ensures we don't extend beyond visual track usually, or 'longest' to keep audio.
        // Let's use longest to match audioEnd.
        filter += `amix=inputs=${audioSources.length}:dropout_transition=0:duration=longest[out_audio]`;

        await ffmpeg.exec([
            ...mixInputs,
            '-filter_complex', filter,
            '-map', '0:v',
            '-map', '[out_audio]',
            '-c:v', 'copy',
            '-c:a', 'aac',
            mixedFileName
        ]);
    } else {
        // No audio, just copy visual_out -> pre_text
        await ffmpeg.exec(['-i', 'visual_out.mp4', '-c', 'copy', mixedFileName]);
    }

    // --- 6. Apply Text Overlays ---
    let finalFileName = mixedFileName;

    if (textItems.length > 0) {
        const textInputs: { fname: string; item: TimelineItem }[] = [];

        const createTextImage = (item: TimelineItem): string => {
            const canvas = document.createElement('canvas');
            // Use actual dynamic export resolution
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';

            const style = item.textStyle || {};
            const scaleFactor = height / 720; // Scale relative to 720p baseline
            const fontSize = (style.fontSize || 24) * scaleFactor;

            ctx.font = `${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || 'Arial'}`;
            ctx.textAlign = style.textAlign || 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = style.color || '#ffffff';

            // Positional Logic
            const y = (style.yPosition !== undefined ? style.yPosition : 50) / 100 * canvas.height;
            let x = canvas.width / 2;
            if (style.xPosition !== undefined) {
                x = (style.xPosition / 100) * canvas.width;
            } else {
                // Fallback helpers
                if (ctx.textAlign === 'left') x = canvas.width * 0.05;
                if (ctx.textAlign === 'right') x = canvas.width * 0.95;
            }

            // Text/Shadow
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 2;

            const lines = (item.content || '').split('\n');
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

        // Build Filter Complex
        let filterComplex = "";

        textInputs.forEach((ti, idx) => {
            const inputIdx = idx + 1; // 0 is mixedFileName
            const prevStream = idx === 0 ? "[0:v]" : `[v${idx - 1}]`;
            const nextStream = `[v${idx}]`;

            filterComplex += `${prevStream}[${inputIdx}:v]overlay=0:0:enable='between(t,${ti.item.start.toFixed(3)},${(ti.item.start + ti.item.duration).toFixed(3)})'${nextStream};`;
        });

        const lastStream = `[v${textInputs.length - 1}]`;
        filterComplex = filterComplex.slice(0, -1);

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
        finalFileName = 'final_with_text.mp4';
    }

    const data = await ffmpeg.readFile(finalFileName);
    return new Blob([data as any], { type: 'video/mp4' });
}
