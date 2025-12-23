import { NextRequest, NextResponse } from 'next/server';
import { executeGraphQL, UPDATE_PROJECT_BLOCKS } from '@/lib/graphql';

export async function POST(request: NextRequest) {
    try {
        const adminSecret = process.env.HASURA_ADMIN_SECRET;
        if (!adminSecret) {
            console.error('HASURA_ADMIN_SECRET is not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { projectId, blocksJson } = await request.json();

        if (!projectId || !blocksJson) {
            return NextResponse.json({ error: 'Missing projectId or blocksJson' }, { status: 400 });
        }

        // blocksJson here actually refers to the Visual Timeline items (videoTrackItems)
        // We update the project's blocks_json column directly.

        // Ensure we sanitize or compress if needed, but for now direct save
        const response = await executeGraphQL({
            query: UPDATE_PROJECT_BLOCKS,
            variables: {
                id: projectId,
                blocks_json: blocksJson,
            },
            headers: {
                'x-hasura-admin-secret': adminSecret,
            },
        });

        if (response.errors) {
            console.error('Hasura Error saving timeline (blocks_json):', response.errors);
            return NextResponse.json({ error: 'Failed to update timeline' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Timeline saved successfully' }, { status: 200 });

    } catch (error) {
        console.error('Save Timeline API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
