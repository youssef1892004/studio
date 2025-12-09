import { uploadToS3 } from './s3-server';
import getMP3Duration from 'get-mp3-duration';
import { executeGraphQL } from './graphql';

const TTS_API_BASE_URL = process.env.TTS_API_BASE_URL;
const TTS_API_USERNAME = process.env.TTS_API_USERNAME;
const TTS_API_PASSWORD = process.env.TTS_API_PASSWORD;

async function getAccessToken() {
    if (!TTS_API_BASE_URL || !TTS_API_USERNAME || !TTS_API_PASSWORD) {
        throw new Error("TTS Service environment variables are not configured");
    }
    const response = await fetch(`${TTS_API_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            username: TTS_API_USERNAME,
            password: TTS_API_PASSWORD,
        }),
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error('Could not validate credentials with TTS service');
    }
    const data = await response.json();
    return data.access_token;
}

const UPDATE_BLOCK_MUTATION = `
    mutation UpdateBlockAudio($id: uuid!, $s3_url: String!) {
        update_Voice_Studio_blocks_by_pk(
            pk_columns: {id: $id}, 
            _set: {s3_url: $s3_url}
        ) {
            id
        }
    }
`;



/*
const UPDATE_BLOCK_ERROR_MUTATION = `
    mutation UpdateBlockError($id: uuid!, $error: String!) {
        update_Voice_Studio_blocks_by_pk(
            pk_columns: {id: $id}, 
            _set: {error: $error}
        ) {
            id
        }
    }
`;
*/

export async function pollTTSJob(jobId: string, blockId: string, projectId: string) {
    console.log(`[Worker] Starting poll for Job ${jobId} (Block ${blockId})`);
    try {
        const token = await getAccessToken();
        let status = 'pending';
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes approx (2s interval)

        while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;

            const statusRes = await fetch(`${TTS_API_BASE_URL}/status/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            });

            if (!statusRes.ok) {
                console.warn(`[Worker] Status check failed: ${statusRes.status}`);
                continue;
            }

            const statusData = await statusRes.json();
            status = statusData.status;
            console.log(`[Worker] Job ${jobId} status: ${status}`);
        }

        if (status === 'failed') {
            throw new Error('TTS Generation failed on remote service');
        }

        if (status !== 'completed') {
            throw new Error('TTS Generation timed out');
        }

        // Fetch Audio
        console.log(`[Worker] Fetching audio for Job ${jobId}`);
        const audioRes = await fetch(`${TTS_API_BASE_URL}/result/${jobId}/audio`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!audioRes.ok) {
            throw new Error('Failed to download audio result');
        }

        const arrayBuffer = await audioRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (buffer.length < 1000) {
            throw new Error('Generated audio file is too small/empty');
        }

        // Upload to S3
        console.log(`[Worker] Uploading to S3 for Block ${blockId}`);
        const s3Url = await uploadToS3(buffer, 'audio/mpeg', projectId, 'mp3');

        // Calculate Duration (Milliseconds for Integer column)
        const duration = Math.round(getMP3Duration(buffer));

        // Update DB
        console.log(`[Worker] Updating DB for Block ${blockId}`);
        const result = await executeGraphQL({
            query: UPDATE_BLOCK_MUTATION,
            variables: {
                id: blockId,
                s3_url: s3Url
            }
        });
        console.log(`[Worker] DB Update Result for Block ${blockId}:`, result);
        console.log(`[Worker] Success for Block ${blockId}`);

    } catch (error: any) {
        console.error(`[Worker] Error for Block ${blockId}:`, error);
        // Update block with error
        /*
        await executeGraphQL({
            query: UPDATE_BLOCK_ERROR_MUTATION,
            variables: {
                id: blockId,
                error: error.message || 'Generation failed'
            }
        });
        */
    }
}
