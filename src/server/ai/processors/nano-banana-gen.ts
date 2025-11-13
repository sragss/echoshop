import { generateGoogleImage } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { NanoBananaGenSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';

/**
 * Processor for Nano Banana (Google) image generation
 * Synchronous processor that generates an image and uploads it
 */
export const nanoBananaGenProcessor: JobProcessor<NanoBananaGenSettings, ImageResult> = {
    async start(input) {
        try {
            // Call Google API to generate image
            const imageBuffer = await generateGoogleImage(input);

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
