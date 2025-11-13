import { editGoogleImage } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { NanoBananaEditSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';
import type { EditImageInput } from '@/lib/generation-schema';

/**
 * Transform NanoBananaEditSettings to EditImageInput format
 */
function transformInput(input: NanoBananaEditSettings): EditImageInput {
    return {
        model: input.model,
        operation: "edit",
        prompt: input.prompt,
        images: input.images,
        aspectRatio: input.aspectRatio,
        imageSize: input.imageSize,
    };
}

/**
 * Processor for Nano Banana (Google) image editing
 * Synchronous processor that edits an image and uploads it
 */
export const nanoBananaEditProcessor: JobProcessor<NanoBananaEditSettings, ImageResult> = {
    async start(input) {
        try {
            // Call Google API to edit image
            const imageBuffer = await editGoogleImage(transformInput(input));

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
