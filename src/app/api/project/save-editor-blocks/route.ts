// src/app/api/project/save-editor-blocks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { executeGraphQL, UPSERT_PROJECT_BLOCKS } from '@/lib/graphql';

export async function POST(request: NextRequest) {
  try {
    const adminSecret = process.env.HASURA_ADMIN_SECRET;
    if (!adminSecret) {
      console.error('HASURA_ADMIN_SECRET is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const bodyText = await request.text();
    // console.log("API Received Body Length:", bodyText.length);

    if (!bodyText) {
      return NextResponse.json({ error: 'Empty request body' }, { status: 400 });
    }

    let bodyData;
    try {
      bodyData = JSON.parse(bodyText);
    } catch (e) {
      console.error("JSON Parse Error. Body snippet:", bodyText.slice(0, 100));
      throw e;
    }
    const { projectId, blocksJson } = bodyData;

    if (!projectId || !blocksJson) {
      return NextResponse.json({ error: 'Missing projectId or blocksJson' }, { status: 400 });
    }

    // Filter out empty blocks
    const filteredBlocks = blocksJson.filter((block: any) => {
      if (block.type === 'paragraph' && (!block.data.text || block.data.text.trim() === '')) {
        return false;
      }
      return true;
    });

    // Prepare blocks for upsert
    const blocksToUpsert = filteredBlocks.map((block: any) => ({
      id: block.id,
      project_id: projectId,
      block_index: block.block_index,
      // Ensure content is a string since DB column is text
      content: typeof block.content === 'object' ? JSON.stringify(block.content) : block.content,
      voice: block.voice,
      provider: block.provider,
      s3_url: block.s3_url || '', // Ensure s3_url is not null
      // Duration removed due to DB schema mismatch/permission issues
      // duration: typeof block.duration === 'number' && !Number.isInteger(block.duration)
      //   ? Math.round(block.duration * 1000)
      //   : block.duration,
      created_at: block.created_at || new Date().toISOString(),
    }));

    const response = await executeGraphQL({
      query: UPSERT_PROJECT_BLOCKS,
      variables: {
        blocks: blocksToUpsert,
      },
      headers: {
        'x-hasura-admin-secret': adminSecret,
      },
    });

    if (response.errors) {
      console.error('Hasura Error saving blocks_json:', response.errors);
      return NextResponse.json({ error: 'Failed to update project blocks' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Blocks saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
