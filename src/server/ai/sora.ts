import OpenAI from "openai";
import { getEchoToken } from "../auth";
import { fetchBlobAsResponse } from './image-helpers';
import type { GenerateVideoInput } from '@/lib/video-schema';

/**
 * Get an OpenAI client configured with Echo authentication
 */
async function getOpenAIClient(): Promise<OpenAI> {
    const token = await getEchoToken();

    if (!token) {
        throw new Error("No Echo token available. User may not be authenticated.");
    }

    return new OpenAI({
        apiKey: token,
        baseURL: "https://echo.router.merit.systems",
    });
}

/**
 * Generate a video using OpenAI's Sora-2 model
 * Returns the job ID for polling
 */
export async function generateSoraVideo(input: GenerateVideoInput): Promise<string> {
    const openai = await getOpenAIClient();

    // Prepare parameters - cast to any to work around SDK type strictness
    const params: any = {
        model: input.model,
        prompt: input.prompt,
        ...(input.seconds && { seconds: parseInt(input.seconds) }),
        ...(input.size && { size: input.size }),
    };

    // If input_reference is provided, fetch it and convert to File
    if (input.input_reference) {
        const response = await fetchBlobAsResponse(input.input_reference);
        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || 'image/png';
        params.input_reference = new File([blob], 'reference.png', { type: contentType });
    }

    // Create video generation job
    const job = await openai.videos.create(params);

    return job.id;
}

/**
 * Poll the status of a Sora video generation job
 * Returns job status and progress percentage
 */
export async function pollSoraJob(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    error?: string;
}> {
    const openai = await getOpenAIClient();

    const job = await openai.videos.retrieve(jobId);

    // Map OpenAI job status to our status
    let status: 'pending' | 'processing' | 'completed' | 'failed';
    let progress = 0;

    switch (job.status) {
        case 'queued':
            status = 'pending';
            progress = 10;
            break;
        case 'in_progress':
            status = 'processing';
            // Estimate progress based on time if available, otherwise use 50%
            progress = 50;
            break;
        case 'completed':
            status = 'completed';
            progress = 100;
            break;
        case 'failed':
            status = 'failed';
            progress = 0;
            break;
        default:
            status = 'pending';
            progress = 0;
    }

    return {
        status,
        progress,
        error: job.status === 'failed' ? job.error?.message : undefined,
    };
}

/**
 * Download the completed video and thumbnail from a Sora job
 * Returns both as Buffers
 */
export async function downloadSoraVideo(jobId: string): Promise<{
    videoBuffer: Buffer;
    thumbnailBuffer: Buffer;
}> {
    const openai = await getOpenAIClient();

    // Retrieve the completed job
    const job = await openai.videos.retrieve(jobId);

    if (job.status !== 'completed') {
        throw new Error(`Cannot download video: job status is ${job.status}`);
    }

    // Use the downloadContent method to get the video
    const videoContent = await openai.videos.downloadContent(jobId);
    const videoBuffer = Buffer.from(await videoContent.arrayBuffer());

    // Download the thumbnail variant
    const thumbnailContent = await openai.videos.downloadContent(jobId, { variant: 'thumbnail' });
    const thumbnailBuffer = Buffer.from(await thumbnailContent.arrayBuffer());

    return {
        videoBuffer,
        thumbnailBuffer,
    };
}

/**
 * Cancel a running Sora video generation job
 */
export async function cancelSoraJob(jobId: string): Promise<void> {
    const openai = await getOpenAIClient();
    // Note: cancel method may not be available in all OpenAI SDK versions
    // If it doesn't exist, this will be a no-op
    if ('cancel' in openai.videos && typeof (openai.videos as any).cancel === 'function') {
        await (openai.videos as any).cancel(jobId);
    } else {
        console.warn('Video cancellation not supported by OpenAI SDK');
    }
}
