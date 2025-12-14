
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

    // Load FFmpeg
    if (!ffmpeg.loaded) {
        // Load locally from public/ffmpeg
        const baseURL = '/ffmpeg';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }

    // --- 1. Prepare Inputs ---

    // A. Process Video/Images
    // We will create a "inputs.txt" for the concat demuxer or use a complex filter.
    // Concat demuxer is safer for images to avoid massive filter graphs, but it requires same resolution/format.
    // For simplicity with variable inputs, we'll try to use a filter complex, but if it gets too long, we might hit CLI limits.
    // Given it's WASM, let's try the safer "concat" approach by normalizing inputs first.

    // Write all image files to MemFS
    const imageInputs: { filename: string, duration: number }[] = [];

    // Sort items by start time
    const sortedVideoItems = [...videoItems].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sortedVideoItems.length; i++) {
        const item = sortedVideoItems[i];
        if (!item.audioUrl) continue; // Skip placeholders

        // Filename
        const ext = item.type === 'scene' ? 'mp4' : 'png';
        const filename = `v_input_${i}.${ext}`;

        try {
            // Fetch and Write
            // Use proxy if needed to bypass CORS
            let url = item.audioUrl;
            if (url.startsWith('http')) {
                url = `/api/proxy-audio?url=${encodeURIComponent(url)}`;
            }

            const data = await fetchFile(url);
            await ffmpeg.writeFile(filename, data);

            imageInputs.push({
                filename,
                duration: item.duration
            });

        } catch (e) {
            console.error(`Failed to load asset ${item.audioUrl}`, e);
        }
    }

    if (imageInputs.length === 0) {
        throw new Error("No visual assets found to render.");
    }

    // --- 2. Create Video Stream ---

    // Since images might have different sizes, we must scale them.
    // We will run a command to convert EACH input to a standardized raw video segment, then concat them.
    // This is slower but robust.

    const videoSegments: string[] = [];

    for (let i = 0; i < imageInputs.length; i++) {
        const input = imageInputs[i];
        const segName = `seg_${i}.ts`; // Transport Stream is good for concatenation

        // Command to scale and pad to target resolution, and set duration
        // -loop 1 for images effectively makes them video. -t sets duration.

        // Note: For video inputs (mp4), -loop 1 is bad. Check extension.
        const isVideo = input.filename.endsWith('mp4');
        const inputArgs = isVideo ? ['-i', input.filename] : ['-loop', '1', '-t', input.duration.toString(), '-i', input.filename];

        // Filter to scale/pad
        const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

        // If it's a video item, we might need to trim it if duration differs? 
        // For now assume user wants full clip or handled by timeline logic. 
        // We strictly enforce duration -t.

        // We use .mp4 segments for intermediate to ensure compatibility
        // But re-encoding every time is slow.
        // Let's try to map to a common format.

        await ffmpeg.exec([
            ...inputArgs,
            '-vf', filter,
            '-c:v', 'libx264',
            '-t', input.duration.toString(),
            '-r', fps.toString(),
            '-pix_fmt', 'yuv420p',
            '-shortest', // Stop if audio/video mismatch (for loops)
            segName
        ]);

        videoSegments.push(segName);
    }

    // Concat Videos
    const fileList = videoSegments.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('files.txt', fileList);

    await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'files.txt', '-c', 'copy', 'video_only.mp4']);


    // --- 3. Process Audio ---
    // Perform simple mix or concat. 
    // If audio tracks are sequential, we can just concat.
    // If they overlap, we need amix.
    // Assuming sequential for now based on previous implementation logic.

    const audioSegments: string[] = [];
    const sortedAudioItems = [...audioItems].sort((a, b) => a.start - b.start);

    // Create a silent filler if there are gaps? 
    // For MVP, just concat the audio files present.
    // Better: Generate a complex filter to place audio at specific times.
    // adelay=start_time_ms|start_time_ms

    // We will build a complex filter for audio mixing.
    // inputs: [0:a] [1:a] ...
    // filters: [0:a]adelay=1000[a0]; [1:a]adelay=5000[a1]; [a0][a1]amix=inputs=2[aout]

    let audioFilterComplex = "";
    const validAudioInputs: string[] = [];

    for (let i = 0; i < sortedAudioItems.length; i++) {
        const item = sortedAudioItems[i];
        if (!item.audioUrl) continue;

        const filename = `a_input_${i}.mp3`;
        // Fetch and Write
        let url = item.audioUrl;
        if (url.startsWith('http')) {
            url = `/api/proxy-audio?url=${encodeURIComponent(url)}`;
        }
        const data = await fetchFile(url);
        await ffmpeg.writeFile(filename, data);

        validAudioInputs.push(filename);

        const delay = Math.round(item.start * 1000); // ms
        audioFilterComplex += `[${i}:a]adelay=${delay}|${delay}[a${i}];`;
    }

    let hasAudio = validAudioInputs.length > 0;

    if (hasAudio) {
        const inputs = validAudioInputs.map((_, i) => `[a${i}]`).join('');
        audioFilterComplex += `${inputs}amix=inputs=${validAudioInputs.length}:dropout_transition=0[aout]`;

        // Render Audio Mix
        const audioArgs = validAudioInputs.flatMap(f => ['-i', f]);

        await ffmpeg.exec([
            ...audioArgs,
            '-filter_complex', audioFilterComplex,
            '-map', '[aout]',
            'mixed_audio.mp3'
        ]);
    }

    // --- 4. Merge Video and Audio ---

    const finalArgs = [
        '-i', 'video_only.mp4'
    ];

    if (hasAudio) {
        finalArgs.push('-i', 'mixed_audio.mp3');
        finalArgs.push('-c:v', 'copy');
        finalArgs.push('-c:a', 'aac');
        finalArgs.push('-map', '0:v:0');
        finalArgs.push('-map', '1:a:0');
        finalArgs.push('-shortest'); // Cut to shortest stream (usually video)
    } else {
        finalArgs.push('-c', 'copy');
    }

    finalArgs.push('output.mp4');

    await ffmpeg.exec(finalArgs);

    // Read result
    const data = await ffmpeg.readFile('output.mp4');
    const blob = new Blob([data as any], { type: 'video/mp4' });

    return blob;
}
