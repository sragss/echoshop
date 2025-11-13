import { editOpenAIImage } from '@/server/ai/openai';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { GptImage1EditSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';

/**
 * Processor for GPT Image 1 editing
 * Synchronous processor that edits an image and uploads it
 */
export const gptImageEditProcessor: JobProcessor<GptImage1EditSettings, ImageResult> = {
    async start(input) {
        try {
            // Call OpenAI API to edit image
            const imageBuffer = await editOpenAIImage(input);

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
