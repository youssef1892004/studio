// src/app/api/project/get-records/route.ts
import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// --- S3/Wasabi Configuration ---
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const WASABI_ENDPOINT = "https://s3.eu-south-1.wasabisys.com";

// --- Hasura Configuration ---
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET!;

// Initialize S3 Client
const s3Client = new S3Client({
    region: AWS_REGION,
    endpoint: WASABI_ENDPOINT,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const url = new URL(req.url);
        const projectId = url.searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // 1. Fetch the project and its blocks (try both sources)
        const query = `
            query GetProjectData($id: uuid!) {
                Voice_Studio_projects(where: {id: {_eq: $id}}) {
                    blocks_json
                    user_id
                }
                Voice_Studio_blocks(where: {project_id: {_eq: $id}}, order_by: {block_index: asc}) {
                    id
                    project_id
                    block_index
                    content
                    s3_url
                    created_at
                    voice
                    provider
                }
            }
        `;

        const res = await fetch(HASURA_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify({ query, variables: { id: projectId } }),
        });

        const data = await res.json();
        if (data.errors) {
            console.error("Hasura Error fetching project:", data.errors);
            return NextResponse.json({ error: data.errors }, { status: 500 });
        }

        const projectData = data.data;

        const project = projectData.Voice_Studio_projects[0];
        if (!project) {
            // This can happen if the project doesn't exist OR if the user doesn't have permission
            return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
        }

        let allBlocks = projectData.Voice_Studio_blocks || [];

        // If no blocks in table, fallback to blocks_json
        // If no blocks in table, fallback to blocks_json
        // [FIX] Disable fallback to prevent ghost blocks from old JSON field appearing
        /*
        if (allBlocks.length === 0 && project.blocks_json) {
            let jsonBlocks = project.blocks_json;
            if (jsonBlocks && !Array.isArray(jsonBlocks) && jsonBlocks.blocks) {
                jsonBlocks = jsonBlocks.blocks;
            } else if (jsonBlocks && !Array.isArray(jsonBlocks)) {
                jsonBlocks = [];
            }
            allBlocks = jsonBlocks;
        }
        */

        // Filter out the special 'merged_blocks' record so it doesn't appear in the UI
        const blocks = allBlocks.filter((block: any) => block.block_index !== 'merged_blocks');

        // 2. Generate pre-signed URLs for any blocks that have an s3_url
        const blocksWithPlayableLinks = await Promise.all(
            blocks.map(async (block: any) => {
                if (!block.s3_url) {
                    return block; // No s3_url, return block as is
                }

                try {
                    const urlPrefix = `${WASABI_ENDPOINT}/${S3_BUCKET_NAME}/`;
                    if (!block.s3_url.startsWith(urlPrefix)) {
                        console.warn(`Block ${block.id} s3_url is not a Wasabi URL, returning as is: ${block.s3_url}`);
                        return { ...block, audioUrl: block.s3_url }; // Use audioUrl to match client state
                    }
                    const objectKey = block.s3_url.substring(urlPrefix.length);

                    const command = new GetObjectCommand({
                        Bucket: S3_BUCKET_NAME,
                        Key: objectKey,
                    });

                    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

                    // Return with audioUrl to match the client-side property
                    return { ...block, audioUrl: signedUrl };

                } catch (presignError) {
                    console.error(`Failed to pre-sign URL for block ${block.id}:`, presignError);
                    return { ...block, audioUrl: null, error: 'Failed to generate playable link' };
                }
            })
        );

        return NextResponse.json(blocksWithPlayableLinks);

    } catch (err) {
        console.error("GET /api/project/get-records error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}