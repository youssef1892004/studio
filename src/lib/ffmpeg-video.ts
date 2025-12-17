
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { TimelineItem } from '../components/Timeline';

let ffmpeg: FFmpeg | null = null;

interface RenderOptions {
    width?: number;
    height?: number;
    fps?: number;
}

export async function renderTimelineToVideo(
    videoItems: TimelineItem[],
    audioItems: TimelineItem[],
    opt: RenderOptions = {}
): Promise<Blob> {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
    }
    const { width = 1280, height = 720, fps = 30 } = opt;

    if (!ffmpeg.loaded) {
        const baseURL = '/ffmpeg';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }

    // Attach Loggers
    ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]:', message));
    ffmpeg.on('progress', ({ progress }) => console.log(`[FFmpeg] Progress: ${(progress * 100).toFixed(0)}%`));

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

    // --- 1. Process Video Track (Visuals + Video Audio) ---
    const sortedVisualItems = [...visualItems].sort((a, b) => a.start - b.start);
    let currentVideoCursor = 0;

    for (let i = 0; i < sortedVisualItems.length; i++) {
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

        let url = item.content || ""; // Use item.content for visual items
        if (url.startsWith('http')) url = `/api/proxy-asset?url=${encodeURIComponent(url)}`; // Assuming a proxy for assets

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

            // Standardize Video Segment
            const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
            const commonOut = ['-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-f', 'mpegts'];

            // We must strictly trim/limit duration to item.duration
            if (isVideo) {
                const offset = (item.mediaStartOffset || 0).toFixed(3);
                const duration = item.duration.toFixed(3);

                // Convert video to TS with Seek
                await ffmpeg.exec(['-ss', offset, '-i', inputName, '-t', duration, ...commonOut, segName]);

                // Extract Audio from Video Item
                if (item.audioUrl) { // Check if video item has an associated audio track
                    const audName = `v_aud_${i}.wav`;
                    try {
                        // Extract audio with Seek
                        await ffmpeg.exec(['-ss', offset, '-i', inputName, '-t', duration, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', audName]);
                        audioSources.push({ filename: audName, start: item.start, volume: item.volume });
                    } catch (e) { /* Ignore if no audio */ }
                }

            } else {
                // Convert image to TS video
                // Optimization: use -tune stillimage to speed up encoding of static images
                await ffmpeg.exec(['-loop', '1', '-t', item.duration.toFixed(3), '-i', inputName, ...commonOut, '-tune', 'stillimage', segName]);
            }

            videoSegments.push(segName);
            currentVideoCursor += item.duration; // Use strict addition for precision tracking

        } catch (err) {
            console.error(`Error processing visual item ${i}`, err);
        }
    }

    // --- 2. Process Voice Track ---
    let maxAudioEnd = 0;
    for (let i = 0; i < audioItems.length; i++) {
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
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            if (!ctx) return '';

            const style = item.textStyle || {};
            const fontSize = (style.fontSize || 24) * 2; // Scale for 1080p

            ctx.font = `${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily || 'Arial'}`;
            ctx.textAlign = style.textAlign || 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = style.color || '#ffffff';

            // Y Position
            const y = (style.yPosition !== undefined ? style.yPosition : 50) / 100 * canvas.height;
            const x = canvas.width / 2;

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
