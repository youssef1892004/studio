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

        if (!projectId || !assetId || !action) {
            return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
        }

        // Fetch current assets (DISABLED: Column image_url does not exist)
        /*
        const getQuery = `
            query GetProjectAssets($id: uuid!) {
                Voice_Studio_projects_by_pk(id: $id) {
                    image_url
                }
            }
        `;
        const currentData = await executeGraphQL(getQuery, { id: projectId });
        const currentAssets = currentData.Voice_Studio_projects_by_pk?.image_url || [];
        */
        const currentAssets: any[] = []; // Mock empty

        let updatedAssets = [...currentAssets];
        const assetIndex = updatedAssets.findIndex((a: any) => a.id === assetId);

        if (assetIndex === -1) {
            // Since we can't fetch from DB, we can't find the asset to delete/rename.
            // We'll return success with empty list or error. 
            // Returning error might be better to indicate failure.
            return NextResponse.json({ error: 'Asset not found (Persistence disabled).' }, { status: 404 });
        }

        if (action === 'delete') {
            const assetToDelete = updatedAssets[assetIndex];

            // Delete from S3 if keys are present
            if (S3_BUCKET_NAME && AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
                try {
                    const s3Client = new S3Client({
                        region: AWS_REGION,
                        endpoint: WASABI_ENDPOINT,
                        credentials: {
                            accessKeyId: AWS_ACCESS_KEY_ID,
                            secretAccessKey: AWS_SECRET_ACCESS_KEY,
                        }
                    });

                    // Extract key from URL
                    // URL format: https://s3.eu-south-1.wasabisys.com/BUCKET/KEY
                    const urlParts = assetToDelete.url.split(`${S3_BUCKET_NAME}/`);
                    if (urlParts.length > 1) {
                        const key = urlParts[1];
                        await s3Client.send(new DeleteObjectCommand({
                            Bucket: S3_BUCKET_NAME,
                            Key: key,
                        }));
                    }
                } catch (s3Error) {
                    console.error("S3 deletion error (non-fatal):", s3Error);
                }
            }

            updatedAssets.splice(assetIndex, 1);
        } else if (action === 'rename') {
            if (!newName) {
                return NextResponse.json({ error: 'New name is required for rename action.' }, { status: 400 });
            }
            updatedAssets[assetIndex] = { ...updatedAssets[assetIndex], name: newName };
        } else {
            return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
        }

        // Update project (DISABLED)
        /*
        const updateQuery = `
            mutation UpdateProjectAssets($id: uuid!, $image_url: jsonb!) {
                update_Voice_Studio_projects_by_pk(
                    pk_columns: {id: $id}, 
                    _set: {image_url: $image_url}
                ) {
                    id
                    image_url
                }
            }
        `;
        await executeGraphQL(updateQuery, { id: projectId, image_url: updatedAssets });
        */

        return NextResponse.json({
            success: true,
            assets: updatedAssets,
            message: `Asset ${action}d successfully.`
        });

    } catch (error: any) {
        console.error("Manage assets error:", error);
        return NextResponse.json({
            error: error.message || 'Operation failed.',
            details: error.toString()
        }, { status: 500 });
    }
}
