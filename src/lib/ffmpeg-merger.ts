import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function mergeAudioFiles(audioUrls: string[]): Promise<Blob> {
    if (!ffmpeg) {
        ffmpeg = new FFmpeg();
    }

    if (!ffmpeg.loaded) {
        // Load ffmpeg from unpkg (reliable CDN)
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
    }

    const { fetchFile } = await import('@ffmpeg/util');
    const inputFiles: string[] = [];

    // 1. Download files and write to virtual FS
    for (let i = 0; i < audioUrls.length; i++) {
        const url = audioUrls[i];
        const fileName = `input${i}.mp3`;

        // Handle CORS proxies if needed for direct S3 links
        // If it's a blob, fetchFile handles it directly
        // If it's remote, we might need our proxy if CORS fails, but let's try direct first.
        // Actually, for remote Wasabi links, we usually need the proxy if headers aren't set perfect, 
        // but let's assume we can fetch data.

        let data: Uint8Array;
        try {
            // Check if it's a blob URL
            if (url.startsWith('blob:')) {
                data = await fetchFile(url);
            } else {
                // Use our proxy to guarantee bytes access (bypass CORS)
                const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(url)}`;
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error('Failed to fetch via proxy');
                data = new Uint8Array(await res.arrayBuffer());
            }

            await ffmpeg.writeFile(fileName, data);
            inputFiles.push(fileName);
        } catch (e) {
            console.error(`Failed to load file ${url}`, e);
            throw new Error(`Failed to load audio segment ${i + 1}`);
        }
    }

    // 2. Create concat list
    // ffmpeg concat demuxer format:
    // file 'input0.mp3'
    // file 'input1.mp3'
    const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
    await ffmpeg.writeFile('filelist.txt', concatContent);

    // 3. Run ffmpeg
    console.log('Starting ffmpeg merge...');
    await ffmpeg.exec(['-f', 'concat', '-safe', '0', '-i', 'filelist.txt', '-c', 'copy', 'output.mp3']);

    // 4. Read output
    const data = await ffmpeg.readFile('output.mp3');
    const blob = new Blob([data as any], { type: 'audio/mpeg' });

    // Cleanup
    for (const f of inputFiles) {
        await ffmpeg.deleteFile(f);
    }
    await ffmpeg.deleteFile('filelist.txt');
    await ffmpeg.deleteFile('output.mp3');

    return blob;
}
