import { editGoogleImage } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { NanoBananaEditSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';

/**
 * Processor for Nano Banana (Google) image editing
 * Synchronous processor that edits an image and uploads it
 */
export const nanoBananaEditProcessor: JobProcessor<NanoBananaEditSettings, ImageResult> = {
    async start(input) {
        try {
            // Call Google API to edit image
            const imageBuffer = await editGoogleImage(input);

            // Upload to blob storage
            const { url } = await uploadGeneratedImage(imageBuffer, 'image/png');

            // Return sync result
            return {
                handle: "sync",
                result: {
                    success: true,
                    data: { imageUrl: url },
                },
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
};
