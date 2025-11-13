import { generateGoogleImage } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { NanoBananaGenSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';
import type { GenerateImageInput } from '@/lib/generation-schema';

/**
 * Transform NanoBananaGenSettings to GenerateImageInput format
 */
function transformInput(input: NanoBananaGenSettings): GenerateImageInput {
    return {
        model: input.model,
        operation: "generate",
        prompt: input.prompt,
        aspectRatio: input.aspectRatio,
        imageSize: input.imageSize,
    };
}

/**
 * Processor for Nano Banana (Google) image generation
 * Synchronous processor that generates an image and uploads it
 */
export const nanoBananaGenProcessor: JobProcessor<NanoBananaGenSettings, ImageResult> = {
    async start(input) {
        try {
            // Call Google API to generate image
            const imageBuffer = await generateGoogleImage(transformInput(input));

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
