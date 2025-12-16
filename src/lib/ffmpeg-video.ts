
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

    // --- 1. Process Video Track (Visuals + Video Audio) ---
    const sortedVideoItems = [...videoItems].sort((a, b) => a.start - b.start);
    let currentVideoCursor = 0;

    for (let i = 0; i < sortedVideoItems.length; i++) {
        const item = sortedVideoItems[i];
        if (!item.audioUrl) continue;

        // A. Handle Gap (Black Screen)
        if (item.start > currentVideoCursor + 0.1) {
            const gapDur = item.start - currentVideoCursor;
            const gapName = `gap_${i}.ts`;
            await createBlackSegment(gapDur, gapName);
            videoSegments.push(gapName);
            currentVideoCursor = item.start; // Update cursor
        }

        // B. Process Item
        const isVideo = item.type === 'scene' || item.content?.toLowerCase().endsWith('.mp4') || item.content?.toLowerCase().endsWith('.mov');
        const ext = isVideo ? 'mp4' : 'png';
        const inputName = `v_in_${i}.${ext}`;
        const segName = `seg_${i}.ts`;

        let url = item.audioUrl;
        if (url.startsWith('http')) url = `/api/proxy-audio?url=${encodeURIComponent(url)}`;

        try {
            await ffmpeg.writeFile(inputName, await fetchFile(url));

            // Standardize Video Segment
            const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
            const commonOut = ['-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-f', 'mpegts'];

            // We must strictly trim/limit duration to item.duration
            if (isVideo) {
                const offset = (item.mediaStartOffset || 0).toFixed(3);
                const duration = item.duration.toFixed(3);

                // Convert video to TS with Seek
                await ffmpeg.exec(['-ss', offset, '-i', inputName, '-t', duration, ...commonOut, segName]);

                // Extract Audio
                const audName = `v_aud_${i}.wav`;
                try {
                    // Extract audio with Seek
                    await ffmpeg.exec(['-ss', offset, '-i', inputName, '-t', duration, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '2', audName]);
                    // Verify file creation involved? ffmpeg throws if fail usually.
                    audioSources.push({ filename: audName, start: item.start, volume: item.volume });
                } catch (e) { /* Ignore if no audio */ }

            } else {
                // Convert image to TS video
                await ffmpeg.exec(['-loop', '1', '-t', item.duration.toFixed(3), '-i', inputName, ...commonOut, segName]);
            }

            videoSegments.push(segName);
            currentVideoCursor += item.duration; // Use strict addition for precision tracking

        } catch (err) {
            console.error(`Error processing item ${i}`, err);
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
    if (maxAudioEnd > currentVideoCursor + 0.1) {
        const finalGap = maxAudioEnd - currentVideoCursor;
        const finalGapName = 'gap_final.ts';
        await createBlackSegment(finalGap, finalGapName);
        videoSegments.push(finalGapName);
    }

    // --- 4. Concat Video ---
    if (videoSegments.length > 0) {
        const concatList = videoSegments.map(f => `file '${f}'`).join('\n');
        await ffmpeg.writeFile('concat_list.txt', concatList);
        await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'concat_list.txt', '-c', 'copy', 'video_only.mp4']);
    } else {
        // Fallback checks
        if (audioSources.length === 0) throw new Error("No content to export.");
        // Audio only export? Create black video for full duration
        await createBlackSegment(maxAudioEnd || 10, 'video_only.mp4');
    }

    // --- 5. Mix Audio ---
    let hasAudio = audioSources.length > 0;
    if (hasAudio) {
        let filter = "";
        // Sort audio sources just in case, though play order doesn't matter for amix, adelay handles it.
        // It's safer to not sort and rely on index mapping in filter.

        audioSources.forEach((src, i) => {
            const delay = Math.round(src.start * 1000);
            const vol = src.volume !== undefined ? src.volume : 1;
            filter += `[${i}:a]volume=${vol},adelay=${delay}|${delay}[a${i}];`;
        });
        audioSources.forEach((_, i) => filter += `[a${i}]`);
        // Use 'longest' duration for amix to ensure it doesn't cut short? 
        // default duration is 'longest'. dropout_transition helps smoothness.
        filter += `amix=inputs=${audioSources.length}:dropout_transition=0:duration=longest[out]`;

        const inputs = audioSources.flatMap(s => ['-i', s.filename]);
        await ffmpeg.exec([...inputs, '-filter_complex', filter, '-map', '[out]', 'mixed_audio.mp3']);
    }

    // --- 6. Final Merge ---
    const args = ['-i', 'video_only.mp4'];
    if (hasAudio) {
        args.push('-i', 'mixed_audio.mp3');
        args.push('-c:v', 'copy');
        args.push('-c:a', 'aac'); // Re-encode audio to AAC for MP4 compatibility
        args.push('-map', '0:v:0');
        args.push('-map', '1:a:0');
        args.push('-shortest');
    } else {
        args.push('-c', 'copy');
    }

    // Clean output
    // await ffmpeg.deleteFile('output.mp4'); // if exists
    args.push('output.mp4');

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile('output.mp4');
    return new Blob([data as any], { type: 'video/mp4' });
}
