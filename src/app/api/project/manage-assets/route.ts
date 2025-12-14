import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
        const { projectId, assetId, action, newName } = await request.json();

        if (!assetId || !action) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        if (action === 'delete') {
            // 1. Fetch Asset to get URL
            const getAssetQuery = `
                query GetAsset($id: uuid!) {
                    Voice_Studio_Asset_by_pk(id: $id) {
                        id
                        image_url
                        video_url
                        voice_url
                    }
                }
            `;
            const assetData = await executeGraphQL(getAssetQuery, { id: assetId });
            const asset = assetData?.Voice_Studio_Asset_by_pk;

            if (!asset) {
                return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
            }

            // 2. Determine URL for S3 deletion
            let url = null;
            const getUrl = (val: any) => {
                if (Array.isArray(val) && val.length > 0) return val[0];
                if (typeof val === 'string') return val;
                return null;
            };

            url = getUrl(asset.image_url) || getUrl(asset.video_url) || getUrl(asset.voice_url);

            // 3. Delete from S3
            if (url && S3_BUCKET_NAME && AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
                try {
                    const s3Client = new S3Client({
                        region: AWS_REGION,
                        endpoint: WASABI_ENDPOINT,
                        credentials: {
                            accessKeyId: AWS_ACCESS_KEY_ID,
                            secretAccessKey: AWS_SECRET_ACCESS_KEY,
                        }
                    });

                    const bucketUrlPrefix = `${WASABI_ENDPOINT}/${S3_BUCKET_NAME}/`;
                    if (url.startsWith(bucketUrlPrefix)) {
                        const key = url.replace(bucketUrlPrefix, '');
                        await s3Client.send(new DeleteObjectCommand({
                            Bucket: S3_BUCKET_NAME,
                            Key: key,
                        }));
                    }
                } catch (s3Error) {
                    console.error("S3 deletion error (non-fatal):", s3Error);
                }
            }

            // 4. Delete from DB
            const deleteQuery = `
                mutation DeleteAsset($id: uuid!) {
                    delete_Voice_Studio_Asset_by_pk(id: $id) {
                        id
                    }
                }
            `;
            await executeGraphQL(deleteQuery, { id: assetId });

            return NextResponse.json({ success: true, message: 'Asset deleted successfully.' });

        } else if (action === 'rename') {
            return NextResponse.json({ error: 'Renaming is not currently supported.' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });

    } catch (error: any) {
        console.error("Manage assets error:", error);
        return NextResponse.json({
            error: error.message || 'Operation failed.',
            details: error.toString()
        }, { status: 500 });
    }
}
