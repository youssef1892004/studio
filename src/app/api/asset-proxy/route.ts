import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Environment variables
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const WASABI_ENDPOINT = "https://s3.eu-south-1.wasabisys.com";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('url');

        if (!fileUrl) {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        if (!S3_BUCKET_NAME || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Extract Key from URL
        // URL format: https://s3.eu-south-1.wasabisys.com/BUCKET_NAME/KEY
        // or https://BUCKET_NAME.s3.eu-south-1.wasabisys.com/KEY

        let key = '';
        if (fileUrl.includes(S3_BUCKET_NAME)) {
            // Simple extraction logic
            const parts = fileUrl.split(S3_BUCKET_NAME + '/');
            if (parts.length > 1) {
                key = parts[1];
            } else {
                // Try virtual host style
                const vhostParts = fileUrl.split('.wasabisys.com/');
                if (vhostParts.length > 1) {
                    key = vhostParts[1];
                }
            }
        }

        if (!key) {
            // Fallback: try to extract everything after the last slash if it looks like a simple filename, 
            // but we need the full path (studio-uploads/...).
            // Let's assume the URL structure we generated: .../BUCKET/studio-uploads/...
            const splitByBucket = fileUrl.split(`/${S3_BUCKET_NAME}/`);
            if (splitByBucket.length > 1) {
                key = splitByBucket[1];
            } else {
                return NextResponse.json({ error: 'Invalid file URL format' }, { status: 400 });
            }
        }

        // Decode URI components in case the key has spaces or special chars
        key = decodeURIComponent(key);

        const s3Client = new S3Client({
            region: AWS_REGION,
            endpoint: WASABI_ENDPOINT,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            }
        });

        const command = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: key,
        });

        const response = await s3Client.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Convert stream to Web Response
        // @ts-ignore
        const stream = response.Body.transformToWebStream();

        return new NextResponse(stream, {
            headers: {
                'Content-Type': response.ContentType || 'application/octet-stream',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error: any) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
    }
}
