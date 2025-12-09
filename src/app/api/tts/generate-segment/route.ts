import { NextRequest, NextResponse } from 'next/server';
import { executeGraphQL } from '@/lib/graphql';
import { pollTTSJob } from '@/lib/server-tts';
import { getEnv } from '@/lib/env';

async function getAccessToken() {
  if (!process.env.TTS_API_BASE_URL || !process.env.TTS_API_USERNAME || !process.env.TTS_API_PASSWORD) {
    throw new Error("TTS Service environment variables are not configured");
  }
  const response = await fetch(`${process.env.TTS_API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: process.env.TTS_API_USERNAME,
      password: process.env.TTS_API_PASSWORD,
    }),
    cache: 'no-store',
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("TTS Token Auth Failed:", errorBody);
    throw new Error('Could not validate credentials with TTS service');
  }
  const data = await response.json();
  return data.access_token;
}

const GET_SUBSCRIPTION_QUERY = `
  query GetSubscription($userId: uuid!) {
    Voice_Studio_subscriptions(where: {user_id: {_eq: $userId}, active: {_eq: true}}) {
      id
      remaining_chars
    }
  }
`;

export async function POST(request: NextRequest) {
  try {
    const { text, voice, provider, project_id, user_id, arabic, block_id, speed, pitch } = await request.json();

    if (!text || !voice || !provider || !user_id || !block_id) {
      return NextResponse.json({ error: 'Text, voice, provider, user_id and block_id are required' }, { status: 400 });
    }

    const isFree = getEnv('NEXT_PUBLIC_WEBSITE_IS_FREE') === 'true';

    // Always get subscription to avoid duplicating code, but only use it if not free
    const subResponse = await executeGraphQL<{ Voice_Studio_subscriptions: any[] }>({
      query: GET_SUBSCRIPTION_QUERY,
      variables: { userId: user_id }
    });

    if (subResponse.errors) {
      throw new Error(`Failed to fetch subscription: ${subResponse.errors[0].message}`);
    }
    const subscription = subResponse.data?.Voice_Studio_subscriptions[0];

    if (!isFree) {
      if (!subscription || subscription.remaining_chars < text.length) {
        return NextResponse.json({ error: 'Insufficient characters or no active subscription.' }, { status: 402 }); // 402 Payment Required
      }
    }

    const token = await getAccessToken();

    const blockPayload = {
      text: text,
      block_id: block_id,
      provider: provider,
      voice: voice,
      arabic: arabic, // Pass the arabic flag
      speed: speed || 1, // Extract from request
      pitch: pitch || 1, // Extract from request
    };

    const payload = {
      project_id: project_id,
      user_id: user_id,
      blocks: [blockPayload]
    };

    // 1. Create Job
    const jobResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const jobData = await jobResponse.json();
    if (!jobResponse.ok) {
      console.error("Error creating TTS job on external service:", jobData);
      try {
        return NextResponse.json({ error: jobData.detail || 'Failed to create TTS job' }, { status: jobResponse.status });
      } catch (e) {
        return NextResponse.json({ error: await jobResponse.text() || 'Failed to create TTS job' }, { status: jobResponse.status });
      }
    }

    if (!isFree && subscription) {
      // Deduct characters
      const newRemainingChars = subscription.remaining_chars - text.length;
      const UPDATE_SUBSCRIPTION_MUTATION = `
            mutation UpdateSubscriptionChars($id: uuid!, $remaining_chars: Int!) {
                update_Voice_Studio_subscriptions_by_pk(pk_columns: {id: $id}, _set: {remaining_chars: $remaining_chars}) {
                    id
                }
            }
        `;

      await executeGraphQL({
        query: UPDATE_SUBSCRIPTION_MUTATION,
        variables: {
          id: subscription.id,
          remaining_chars: newRemainingChars
        }
      });
    }

    // 2. Fire-and-forget worker
    // We do NOT await this. It runs in the background.
    pollTTSJob(jobData.job_id, block_id, project_id).catch(err => {
      console.error("Background worker failed:", err);
    });

    // 3. Return success immediately
    return NextResponse.json({
      success: true,
      message: 'Generation started',
      job_id: jobData.job_id
    });

  } catch (error: any) {
    console.error("Error in /api/tts/generate-segment route:", error.message);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}