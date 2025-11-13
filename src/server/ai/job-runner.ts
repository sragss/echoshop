import { db } from '@/server/db';
import type { Prisma } from '@/../../generated/prisma';
import type { JobKind, JobSettings } from '@/lib/schema';
import type { JobInputMap, JobOutputMap, ProcessorRegistry } from './job-processor';

/**
 * Create a new job and start processing it asynchronously
 * Returns the job ID for polling
 */
export async function createAndProcessJob<K extends JobKind>(
    type: K,
    input: JobInputMap[K],
    userId: string,
    processorRegistry: ProcessorRegistry
): Promise<{ jobId: string }> {
    // Create the job record
    const job = await db.job.create({
        data: {
            userId,
            type,
            input: input as Prisma.InputJsonValue,
            status: 'pending',
            progress: 0,
        },
    });

    // Start the async job processing (fire and forget)
    processJob(job.id, type, processorRegistry).catch((error) => {
        console.error(`Failed to process job ${job.id}:`, error);
        // Update job with error
        db.job.update({
            where: { id: job.id },
            data: {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
        }).catch(console.error);
    });

    return { jobId: job.id };
}

/**
 * Background process that handles the full job lifecycle
 * 1. Load job from database
 * 2. Route to correct processor
 * 3. Execute processor (sync or async with polling)
 * 4. Save result to database
 * 5. Update job status
 */
async function processJob<K extends JobKind>(
    jobId: string,
    type: K,
    processorRegistry: ProcessorRegistry
): Promise<void> {
    // Load the job
    const job = await db.job.findUnique({
        where: { id: jobId },
    });

    if (!job) {
        throw new Error(`Job ${jobId} not found`);
    }

    // Get the processor for this job type
    const processor = processorRegistry[type];
    const input = job.input as JobInputMap[K];

    try {
        // Update status to loading with discrete initial progress
        await db.job.update({
            where: { id: jobId },
            data: {
                status: 'loading',
                progress: 0,
            },
        });

        // Start the processor
        const { handle, result: immediateResult } = await processor.start(input);

        let finalResult: JobOutputMap[K];

        if (handle === "sync") {
            // Sync job - result is available immediately
            if (!immediateResult) {
                throw new Error("Sync processor must return result");
            }
            if (!immediateResult.success) {
                throw new Error(immediateResult.error);
            }
            finalResult = immediateResult.data;

            // Sync jobs go directly to 100% (no intermediate progress)
        } else {
            // Async job - need to poll
            if (!processor.poll) {
                throw new Error("Async processor must implement poll()");
            }

            let pollResult: JobOutputMap[K] | undefined;
            let attempts = 0;
            const maxAttempts = 240; // 20 minutes at 5 second intervals

            while (!pollResult && attempts < maxAttempts) {
                // Wait before polling
                await new Promise(resolve => setTimeout(resolve, 5000));
                attempts++;

                const result = await processor.poll(handle);

                // Check if still processing
                if ('processing' in result && result.processing) {
                    // Use real progress if provided, otherwise use discrete 50%
                    const progress = result.progress ?? 50;
                    await db.job.update({
                        where: { id: jobId },
                        data: {
                            progress,
                        },
                    });
                    continue;
                }

                // Job completed or failed - TypeScript now knows it's JobResult
                if ('success' in result && !result.success) {
                    throw new Error(result.error);
                }

                if ('success' in result && result.success) {
                    pollResult = result.data;
                }
            }

            if (!pollResult) {
                throw new Error("Job polling timed out");
            }

            finalResult = pollResult;
        }

        // Save the result to the Result table
        await db.result.create({
            data: {
                userId: job.userId,
                jobId: job.id,
                output: finalResult as Prisma.InputJsonValue,
            },
        });

        // Mark job as complete
        await db.job.update({
            where: { id: jobId },
            data: {
                status: 'complete',
                progress: 100,
            },
        });

        console.log(`Job ${jobId} completed successfully`);
    } catch (error) {
        // Handle any errors during processing
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Job ${jobId} failed:`, errorMessage);

        await db.job.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                error: errorMessage,
            },
        });

        throw error;
    }
}

/**
 * Get the status of a job and its result (if complete)
 */
export async function getJobStatus(jobId: string, userId: string) {
    const job = await db.job.findUnique({
        where: { id: jobId },
        include: {
            result: true,
        },
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
        type: job.type,
        status: job.status,
        progress: job.progress,
        result: job.result?.output,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    };
}

/**
 * List all jobs for a user
 */
export async function listJobs(
    userId: string,
    options?: {
        limit?: number;
        status?: string;
        type?: JobKind;
    }
) {
    const jobs = await db.job.findMany({
        where: {
            userId,
            ...(options?.status && { status: options.status }),
            ...(options?.type && { type: options.type }),
        },
        include: {
            result: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: options?.limit || 50,
    });

    return jobs.map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        result: job.result?.output,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    }));
}
