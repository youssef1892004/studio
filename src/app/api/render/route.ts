import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Forward to Rust Media Engine
        const response = await fetch('http://localhost:8080/render', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Media Engine Error: ${errorText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Render Proxy Error:', error);
        return NextResponse.json({ error: 'Failed to connect to Media Engine' }, { status: 500 });
    }
}
