import { db } from '@/server/db';
import { uploadGeneratedVideo } from '@/lib/blob-video-upload';
import { generateSoraVideo, pollSoraJob, downloadSoraVideo } from './sora';
import type { Prisma } from '@/../../generated/prisma';
import type { GenerateVideoInput } from '@/lib/video-schema';

/**
 * Create a new video generation job
 * Initiates the Sora API call and returns the job ID for polling
 */
export async function createVideoJob(
    input: GenerateVideoInput,
    userId: string
): Promise<{ jobId: string }> {
    // Create the job record
    const job = await db.videoJob.create({
        data: {
            userId,
            input: input as Prisma.InputJsonValue,
            status: 'pending',
            progress: 0,
        },
    });

    // Start the async video generation process (fire and forget)
    processVideoJob(job.id, input).catch((error) => {
        console.error(`Failed to process video job ${job.id}:`, error);
        // Update job with error
        db.videoJob.update({
            where: { id: job.id },
            data: {
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
        }).catch(console.error);
    });

    return { jobId: job.id };
}

/**
 * Background process that handles the full video generation lifecycle
 * 1. Call Sora API to start generation
 * 2. Poll for completion
 * 3. Download video + thumbnail
 * 4. Upload to blob storage
 * 5. Update database with final URLs
 */
async function processVideoJob(jobId: string, input: GenerateVideoInput): Promise<void> {
    // Step 1: Start Sora generation
    const soraJobId = await generateSoraVideo(input);

    // Update DB with processing status
    await db.videoJob.update({
        where: { id: jobId },
        data: {
            status: 'processing',
            progress: 10,
        },
    });

    // Step 2: Poll until completion
    let soraCompleted = false;
    while (!soraCompleted) {
        // Wait before polling (avoid rate limits)
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second interval

        const jobStatus = await pollSoraJob(soraJobId);

        // Update progress in database (but don't mark as completed yet)
        await db.videoJob.update({
            where: { id: jobId },
            data: {
                status: jobStatus.status === 'completed' ? 'processing' : jobStatus.status,
                progress: jobStatus.status === 'completed' ? 95 : jobStatus.progress,
                ...(jobStatus.error && { errorMessage: jobStatus.error }),
            },
        });

        if (jobStatus.status === 'completed') {
            soraCompleted = true;
        } else if (jobStatus.status === 'failed') {
            throw new Error(jobStatus.error || 'Video generation failed');
        }
    }

    // Step 3: Download video and thumbnail
    const { videoBuffer, thumbnailBuffer } = await downloadSoraVideo(soraJobId);

    // Step 4: Upload to blob storage
    const { videoUrl, thumbnailUrl } = await uploadGeneratedVideo(
        videoBuffer,
        thumbnailBuffer
    );

    // Step 5: Update database with final URLs and mark as completed
    // Only NOW is the video truly complete with accessible URLs
    await db.videoJob.update({
        where: { id: jobId },
        data: {
            status: 'completed',
            progress: 100,
            videoUrl,
            thumbnailUrl,
        },
    });

    console.log(`Video job ${jobId} completed successfully`);
}

/**
 * Get the status of a video generation job
 */
export async function getVideoJobStatus(jobId: string, userId: string) {
    const job = await db.videoJob.findUnique({
        where: { id: jobId },
    });

    if (!job) {
        throw new Error('Job not found');
    }

    // Ensure the job belongs to the requesting user
    if (job.userId !== userId) {
        throw new Error('Unauthorized');
    }

    return {
        id: job.id,
        status: job.status,
        progress: job.progress,
        videoUrl: job.videoUrl,
        thumbnailUrl: job.thumbnailUrl,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    };
}


/**
 * List all video jobs for a user
 */
export async function listVideoJobs(
    userId: string,
    options?: {
        limit?: number;
        status?: string;
    }
) {
    const jobs = await db.videoJob.findMany({
        where: {
            userId,
            ...(options?.status && { status: options.status }),
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: options?.limit || 50,
    });

    return jobs;
}
