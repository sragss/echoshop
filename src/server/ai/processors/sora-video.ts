import { generateSoraVideo, pollSoraJob, downloadSoraVideo } from '@/server/ai/sora';
import { uploadGeneratedVideo } from '@/lib/blob-video-upload';
import type { Sora2GenSettings, VideoResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';

/**
 * Processor for Sora 2 video generation
 * Asynchronous processor that starts generation and polls for completion
 */
export const soraVideoProcessor: JobProcessor<Sora2GenSettings, VideoResult> = {
    async start(input) {
        try {
            // Start Sora video generation
            const soraJobId = await generateSoraVideo(input);

            // Return async handle for polling
            return {
                handle: soraJobId,
            };
        } catch (error) {
            return {
                handle: "sync",
                result: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            };
        }
    },

    async poll(handle: string) {
        try {
            // Poll Sora job status
            const status = await pollSoraJob(handle);

            // Check if failed
            if (status.status === 'failed') {
                return {
                    success: false,
                    error: status.error || 'Video generation failed',
                };
            }

            // Still processing - return progress from API
            if (status.status !== 'completed') {
                return {
                    processing: true,
                    progress: status.progress,
                };
            }

            // Completed - download and upload
            const { videoBuffer, thumbnailBuffer } = await downloadSoraVideo(handle);
            const { videoUrl, thumbnailUrl } = await uploadGeneratedVideo(
                videoBuffer,
                thumbnailBuffer
            );

            return {
                success: true,
                data: {
                    videoUrl,
                    thumbnailUrl,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
};
