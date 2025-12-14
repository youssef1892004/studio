import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Environment variables
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;
const WASABI_ENDPOINT = "https://s3.eu-south-1.wasabisys.com";

// Helper to execute GraphQL
async function executeGraphQL(query: string, variables: any) {
    if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
        throw new Error("Hasura environment variables not configured.");
    }

    const response = await fetch(HASURA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();
    if (data.errors) {
        throw new Error(data.errors[0].message);
    }
    return data.data;
}

export async function POST(request: NextRequest) {
    try {
        const { dataUrl, projectId, fileName, fileType, fileSize } = await request.json();

        if (!dataUrl || !projectId || !fileName || !fileType) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        if (!S3_BUCKET_NAME || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
            return NextResponse.json({ error: 'Server configuration error: S3 keys missing.' }, { status: 500 });
        }

        // 1. Upload to Wasabi S3
        const s3Client = new S3Client({
            region: AWS_REGION,
            endpoint: WASABI_ENDPOINT,
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            }
        });

        const base64Data = dataUrl.split(',')[1]; // Remove prefix
        const buffer = Buffer.from(base64Data, 'base64');
        const extension = fileName.split('.').pop() || 'bin';
        const objectKey = `studio-uploads/${projectId}/${uuidv4()}.${extension}`;

        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: objectKey,
            Body: buffer,
            ContentType: fileType,
            ACL: 'public-read' as any,
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        const s3Url = `${WASABI_ENDPOINT}/${S3_BUCKET_NAME}/${objectKey}`;

        // 2. Update Hasura: Log to Voice_Studio_Asset
        const fileTypePrefix = fileType.split('/')[0];

        const mutationVariables = {
            project_id: projectId,
            image_url: fileTypePrefix === 'image' ? [s3Url] : [],
            video_url: fileTypePrefix === 'video' ? [s3Url] : [],
            voice_url: fileTypePrefix === 'audio' ? [s3Url] : []
        };

        const INSERT_ASSET_MUTATION_V2 = `
            mutation InsertAssetV2($image_url: jsonb, $video_url: jsonb, $voice_url: jsonb, $project_id: uuid) {
                insert_Voice_Studio_Asset(objects: {image_url: $image_url, video_url: $video_url, voice_url: $voice_url, project_id: $project_id}) {
                    returning {
                        id
                        project_id
                        image_url
                        video_url
                        voice_url
                    }
                }
            }
        `;

        const result = await executeGraphQL(INSERT_ASSET_MUTATION_V2, mutationVariables);
        const insertedAsset = result.insert_Voice_Studio_Asset?.returning?.[0];

        if (!insertedAsset) {
            throw new Error("Failed to insert asset record to database.");
        }

        const newAsset = {
            id: insertedAsset.id, // Use actual DB ID from Hasura 
            // Better to use the returned data from GraphQL if possible, but for now matching previous behavior:
            url: s3Url,
            name: fileName,
            type: fileType,
            size: fileSize
        };

        return NextResponse.json({
            success: true,
            asset: newAsset,
            message: "File uploaded and saved successfully."
        });

    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({
            error: error.message || 'Upload failed.',
            details: error.toString()
        }, { status: 500 });
    }
}
