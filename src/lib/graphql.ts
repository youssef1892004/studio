// src/lib/graphql.ts
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { Project, StudioBlock } from "./types";
import { getEnv } from "./env";

const HASURA_GRAPHQL_URL = getEnv('NEXT_PUBLIC_HASURA_GRAPHQL_URL');
const HASURA_ADMIN_SECRET = getEnv('NEXT_PUBLIC_HASURA_ADMIN_SECRET');

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

// محتوى البلوك قد يكون نصًا عاديًا (مثل "السلام عليكم") أو JSON لسجل EditorJS.
// هذه الدالة تُعيده بصيغة OutputData آمنة دائمًا.
function normalizeBlockContent(raw: any) {
  if (!raw) {
    return { blocks: [] };
  }
  if (typeof raw === 'object') {
    return raw;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch (_) {
      const text = raw;
      return {
        time: Date.now(),
        blocks: [
          { id: 'plain-text', type: 'paragraph', data: { text } }
        ],
        version: '2.28.2'
      };
    }
  }
  return { blocks: [] };
}

async function fetchGraphQL<T>(query: string, variables: Record<string, any>): Promise<GraphQLResponse<T>> {
  if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    throw new Error("Required Hasura environment variables (NEXT_PUBLIC_HASURA_GRAPHQL_URL, NEXT_PUBLIC_HASURA_ADMIN_SECRET) are not set. Please check your environment variable configuration (.env.local for local development, or your hosting provider settings for production).");
  }

  const response = await fetch(HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

interface ExecuteGraphQLOptions {
  query: string;
  variables?: Record<string, any>;
  headers?: Record<string, string>;
}

export async function executeGraphQL<T>({ query, variables, headers = {} }: ExecuteGraphQLOptions): Promise<GraphQLResponse<T>> {
  if (!HASURA_GRAPHQL_URL) {
    throw new Error("Required Hasura environment variable (NEXT_PUBLIC_HASURA_GRAPHQL_URL) is not set.");
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add admin secret if it's available and no other authorization is provided
  if (HASURA_ADMIN_SECRET && !headers['Authorization'] && !headers['x-hasura-admin-secret']) {
    defaultHeaders['x-hasura-admin-secret'] = HASURA_ADMIN_SECRET;
  }

  const response = await fetch(HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    if (response.status >= 500 && response.status < 600) {
      throw new Error('Service Temporarily Unavailable. Please try again later.');
    }
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}



// --- Project Functions ---

export const getProjectsByUserId = async (userId: string, token: string): Promise<Project[]> => {
  const query = `
    query GetProjects($userId: uuid!) {
      Voice_Studio_projects(where: {user_id: {_eq: $userId}}, order_by: {crated_at: desc}) {
        id
        name
        description
        crated_at
        user_id
      }
    }
  `;
  const response = await executeGraphQL<{ Voice_Studio_projects: Project[] }>({
    query,
    variables: { userId },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data?.Voice_Studio_projects || [];
};

export const INSERT_ASSET = `
  mutation InsertAsset($image_url: jsonb, $video_url: jsonb, $voice_url: jsonb, $project_id: uuid) {
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

export const insertProject = async (name: string, description: string, userId: string): Promise<Project> => {
  const mutation = `
      mutation InsertProjects($description: String, $name: String, $crated_at: timestamptz!, $user_id: uuid!) {
        insert_Voice_Studio_projects(objects: {description: $description, name: $name, crated_at: $crated_at, user_id: $user_id}) {
          returning {
            id
            name
            description
            crated_at
            user_id
          }
        }
      }
    `;
  const variables = {
    name: name,
    description: description,
    crated_at: new Date().toISOString(),
    user_id: userId,
  };
  const response = await executeGraphQL<{ insert_Voice_Studio_projects: { returning: Project[] } }>({
    query: mutation,
    variables,
    // Using Admin Secret via defaultHeaders in executeGraphQL by omitting Authorization
  });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data!.insert_Voice_Studio_projects.returning[0];
};

export const UPDATE_PROJECT_BLOCKS = `
  mutation UpdateProjectBlocks($id: uuid!, $blocks_json: jsonb!) {
    update_Voice_Studio_projects_by_pk(
      pk_columns: {id: $id}, 
      _set: {blocks_json: $blocks_json}
    ) {
      id
      crated_at 
    }
  }
`;

export const UPDATE_PROJECT_ASSETS = `
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

export const getProjectById = async (projectId: string): Promise<Project | null> => {
  const query = `
      query GetProjectById($id: uuid!) {
        Voice_Studio_projects_by_pk(id: $id) {
          id
          name
          description
          crated_at
          user_id
          blocks_json
        }
      }
    `;
  const response = await fetchGraphQL<{ Voice_Studio_projects_by_pk: Project }>(query, { id: projectId });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data?.Voice_Studio_projects_by_pk || null;
}

export const DELETE_PROJECT_BLOCKS = `
  mutation DeleteProjectBlocks($projectId: uuid!) {
    delete_Voice_Studio_blocks(where: {project_id: {_eq: $projectId}}) {
      affected_rows
    }
  }
`;

export const UPSERT_PROJECT_BLOCKS = `
  mutation UpsertProjectBlocks($blocks: [Voice_Studio_blocks_insert_input!]!) {
    insert_Voice_Studio_blocks(
      objects: $blocks,
      on_conflict: {
        constraint: blocks_pkey,
        update_columns: [content, s3_url, voice, provider]
      }
    ) {
      affected_rows
      returning {
        id
      }
    }
  }
`;

export const GET_ASSETS = `
  query GetAssetsV2($project_id: uuid!) {
  Voice_Studio_Asset(where: { project_id: { _eq: $project_id } }, order_by: { id: desc }) {
    id
    project_id
    image_url
    video_url
    voice_url
  }
}
`;

export const DELETE_UNUSED_BLOCKS = `
  mutation DeleteUnusedBlocks($projectId: uuid!, $activeBlockIds: [uuid!]!) {
  delete_Voice_Studio_blocks(
    where: {
    project_id: { _eq: $projectId },
    id: { _nin: $activeBlockIds }
  }
  ) {
    affected_rows
  }
}
`;

export const updateProject = async (projectId: string, name: string, description: string, token: string) => {
  const mutation = `
        mutation UpdateProject($id: uuid!, $name: String, $description: String) {
  update_Voice_Studio_projects_by_pk(pk_columns: { id: $id }, _set: { name: $name, description: $description }) {
    id
  }
}
`;
  const variables = {
    id: projectId,
    name: name,
    description: description,
  };
  const response = await executeGraphQL({
    query: mutation,
    variables,
    headers: {
      'Authorization': `Bearer ${token} `
    }
  });
  if (response.errors) throw new Error(response.errors[0].message);
  return response.data;
}

export const deleteProject = async (projectId: string, token: string): Promise<{ id: string }> => {
  const mutation = `
        mutation DeleteProject($id: uuid!) {
  delete_Voice_Studio_projects_by_pk(id: $id) {
    id
  }
}
`;
  const variables = { id: projectId };
  const response = await executeGraphQL<{ delete_Voice_Studio_projects_by_pk: { id: string } }>({
    query: mutation,
    variables,
    headers: {
      'Authorization': `Bearer ${token} `
    }
  });
  if (response.errors) throw new Error(response.errors[0].message);
  if (!response.data?.delete_Voice_Studio_projects_by_pk) throw new Error("Project not found or could not be deleted.");
  return response.data.delete_Voice_Studio_projects_by_pk;
};

// --- Block Functions ---

export const getAllBlocks = async (): Promise<StudioBlock[]> => {
  const query = `
    query GetBlocks {
  Voice_Studio_blocks(order_by: { block_index: asc }) {
    id
    project_id
    block_index
    content
    s3_url
    created_at
  }
}
`;

  try {
    const response = await fetchGraphQL<{ Voice_Studio_blocks: any[] }>(query, {});

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      throw new Error(response.errors[0]?.message || 'Unknown GraphQL error');
    }

    if (!response.data) {
      throw new Error('No data received from GraphQL');
    }

    return response.data.Voice_Studio_blocks.map((block: any) => ({
      ...block,
      content: normalizeBlockContent(block.content),
    }));
  } catch (error) {
    console.error('Error fetching all blocks:', error);
    throw error;
  }
};

export const getBlocksByProjectId = async (projectId: string): Promise<StudioBlock[]> => {
  const query = `
    query GetBlocks($projectId: uuid!) {
  Voice_Studio_blocks(where: { project_id: { _eq: $projectId } }, order_by: { block_index: asc }) {
    id
    project_id
    block_index
    content
    s3_url
    created_at
  }
}
`;

  try {
    const response = await fetchGraphQL<{ Voice_Studio_blocks: any[] }>(query, { projectId });

    if (response.errors) {
      console.error('GraphQL errors:', response.errors);
      throw new Error(response.errors[0]?.message || 'Unknown GraphQL error');
    }

    if (!response.data) {
      throw new Error('No data received from GraphQL');
    }

    return response.data.Voice_Studio_blocks.map((block: any) => ({
      ...block,
      content: normalizeBlockContent(block.content),
    }));
  } catch (error) {
    console.error('Error fetching blocks by project ID:', error);
    throw error;
  }
};

export const upsertBlock = async (block: StudioBlock) => {
  // Extract plain text from the content object
  const plainText = block.content?.blocks?.map((b: any) => b.data.text || '').join('\n') || '';

  // Prepare data for the local TTS segment creation API
  const localTtsPayload = {
    project_id: block.project_id,
    user_id: "7ac72fd8-0127-451d-b177-128c0f55e7e7", // Default user ID as specified
    text: plainText,
    voice: block.voice || "ar-TN-ReemNeural",
  };

  try {
    // Send to local Next.js API which forwards to external TTS service
    try {
      const ttsResponse = await fetch('/api/tts/generate-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localTtsPayload),
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text().catch(() => '');
        console.warn(`TTS job creation warning: ${ttsResponse.status} ${ttsResponse.statusText} ${errText} `);
      } else {
        console.log('TTS job created via local API');
      }
    } catch (ttsError) {
      console.warn('Local TTS API call failed or was blocked:', ttsError);
    }
    // Do not perform manual GraphQL save; backend handles persistence
    return { success: true };
  } catch (error) {
    console.error('Error in upsertBlock:', error);
    throw error;
  }
};


export const deleteBlock = async (blockId: string): Promise<{ id: string }> => {
  const mutation = `
    mutation DeleteBlock($id: uuid!) {
  delete_Voice_Studio_blocks_by_pk(id: $id) {
    id
  }
}
`;
  const variables = { id: blockId };
  const response = await fetchGraphQL<{ delete_Voice_Studio_blocks_by_pk: { id: string } }>(mutation, variables);
  if (response.errors) throw new Error(response.errors[0].message);
  if (!response.data?.delete_Voice_Studio_blocks_by_pk) throw new Error("Block not found or could not be deleted.");
  return response.data.delete_Voice_Studio_blocks_by_pk;
};

// Safer deletion by project_id + block_index (handles local/remote ID mismatch)
export const deleteBlockByIndex = async (projectId: string, blockIndex: string): Promise<number> => {
  const mutation = `
    mutation DeleteBlockByIndex($projectId: uuid!, $blockIndex: String!) {
  delete_Voice_Studio_blocks(where: { project_id: { _eq: $projectId }, block_index: { _eq: $blockIndex } }) {
    affected_rows
  }
}
`;
  const variables = { projectId, blockIndex };
  const response = await fetchGraphQL<{ delete_Voice_Studio_blocks: { affected_rows: number } }>(mutation, variables);
  if (response.errors) throw new Error(response.errors[0].message);
  const affected = response.data?.delete_Voice_Studio_blocks?.affected_rows ?? 0;
  if (affected === 0) throw new Error("Block not found or could not be deleted.");
  return affected;
};

// --- Subscription Function ---

export const subscribeToBlocks = (projectId: string, callback: (blocks: StudioBlock[]) => void, onError?: (error: any) => void) => {
  if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    throw new Error("Hasura environment variables are not configured");
  }

  let wsUrl = HASURA_GRAPHQL_URL;
  if (wsUrl.startsWith('https://')) {
    wsUrl = wsUrl.replace('https://', 'wss://');
  } else {
    wsUrl = wsUrl.replace('http://', 'ws://');
  }

  const subscriptionClient = new SubscriptionClient(wsUrl, {
    reconnect: true,
    lazy: true,
    timeout: 30000,
    connectionParams: {
      headers: {
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
    },
  });

  const subscriptionQuery = `
        subscription GetBlocks($projectId: uuid!) {
  Voice_Studio_blocks(where: { project_id: { _eq: $projectId } }, order_by: { block_index: asc }) {
    block_index
    s3_url
    created_at
    id
    project_id
    content
    voice
    provider
  }
}
`;

  const observable = subscriptionClient.request({
    query: subscriptionQuery,
    variables: { projectId },
  });

  return observable.subscribe({
    next: (result) => {
      if (result.data && result.data.Voice_Studio_blocks) {
        // Normalize content if needed, similar to getAllBlocks
        const blocks = (result.data.Voice_Studio_blocks as any[]).map((block: any) => ({
          ...block,
          content: normalizeBlockContent(block.content)
        }));
        callback(blocks);
      }
    },
    error: (error) => {
      console.error('Subscription error object:', error);
      if (typeof error === 'object') {
        try {
          console.error('Subscription error JSON:', JSON.stringify(error, null, 2));
        } catch (e) {
          console.error('Could not stringify error');
        }
      }
      if (error?.message) console.error('Subscription error message:', error.message);

      if (onError) onError(error);
    },
  });
};