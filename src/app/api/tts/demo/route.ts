import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
    try {
        const { text } = await request.json();

        if (!text || text.length > 200) {
            return NextResponse.json({ error: 'Text is required and must be under 200 characters for demo.' }, { status: 400 });
        }

        const token = await getAccessToken();

        // Fixed Demo Configuration
        const payload = {
            project_id: "demo-project", // Dummy ID for external service if needed, or it ignores it
            user_id: "demo-user",    // Dummy ID
            blocks: [{
                text: text,
                block_id: "demo-block",
                provider: "ghaymah", // Fixed Provider (lowercase)
                voice: "ar-EG-ShakirNeural", // Fixed Voice
                arabic: true,
                speed: 1,
                pitch: 1
            }]
        };

        // 1. Create Job
        const jobResponse = await fetch(`${TTS_API_BASE_URL}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload),
            cache: 'no-store',
        });

        if (!jobResponse.ok) {
            const errText = await jobResponse.text();
            throw new Error(`TTS Job Creation Failed: ${errText}`);
        }

        const jobData = await jobResponse.json();
        const jobId = jobData.job_id;

        // 2. Poll for Completion (up to 30 seconds for demo)
        let status = 'pending';
        let attempts = 0;
        const maxAttempts = 15; // 30s total (2s interval)

        while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            attempts++;

            const statusRes = await fetch(`${TTS_API_BASE_URL}/status/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            });

            if (statusRes.ok) {
                const statusData = await statusRes.json();
                status = statusData.status;
            }
        }

        if (status !== 'completed') {
            return NextResponse.json({ error: 'Generation timed out. Please try again or login for faster results.' }, { status: 504 });
        }

        // 3. Fetch Audio
        const audioRes = await fetch(`${TTS_API_BASE_URL}/result/${jobId}/audio`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!audioRes.ok) {
            throw new Error('Failed to retrieve audio');
        }

        const audioBuffer = await audioRes.arrayBuffer();

        // Return Audio directly
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error("Demo TTS Error:", error);
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
    }
}
