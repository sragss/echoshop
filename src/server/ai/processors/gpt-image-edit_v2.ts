import { editOpenAIImage } from '@/server/ai/openai';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { GptImage1EditSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';
import type { EditImageInput } from '@/lib/generation-schema';

/**
 * Transform GptImage1EditSettings to EditImageInput format
 */
function transformInput(input: GptImage1EditSettings): EditImageInput {
    return {
        model: input.model,
        operation: "edit",
        prompt: input.prompt,
        images: input.images,
        size: input.size,
        quality: input.quality,
        background: input.background,
        output_format: input.output_format,
        output_compression: input.output_compression,
        input_fidelity: input.input_fidelity,
    };
}

/**
 * Processor for GPT Image 1 editing
 * Synchronous processor that edits an image and uploads it
 */
export const gptImageEditProcessor: JobProcessor<GptImage1EditSettings, ImageResult> = {
    async start(input) {
        try {
            // Call OpenAI API to edit image
            const imageBuffer = await editOpenAIImage(transformInput(input));

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
