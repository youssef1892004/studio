import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3-server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        // Extract bucket and key from URL
        // Expected format: https://s3.eu-south-1.wasabisys.com/BUCKET_NAME/KEY
        // Or similar. We need to parse it robustly.

        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);

        // Assuming path is /BUCKET/KEY...
        if (pathParts.length < 2) {
            return NextResponse.json({ error: 'Invalid S3 URL format' }, { status: 400 });
        }

        const bucket = pathParts[0];
        const key = pathParts.slice(1).join('/');

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Convert stream to Web Response
        // @ts-ignore - AWS SDK stream type compatibility
        return new NextResponse(response.Body.transformToWebStream(), {
            headers: {
                'Content-Type': response.ContentType || 'audio/mpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error: any) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
    }
}
