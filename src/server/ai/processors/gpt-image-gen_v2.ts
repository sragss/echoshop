import { generateOpenAIImage } from '@/server/ai/openai';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import type { GptImage1GenSettings, ImageResult } from '@/lib/schema';
import type { JobProcessor } from '../job-processor';
import type { GenerateImageInput } from '@/lib/generation-schema';

/**
 * Transform GptImage1GenSettings to GenerateImageInput format
 */
function transformInput(input: GptImage1GenSettings): GenerateImageInput {
    return {
        model: input.model,
        operation: "generate",
        prompt: input.prompt,
        size: input.size,
        quality: input.quality,
        background: input.background,
        output_format: input.output_format,
        output_compression: input.output_compression,
        moderation: input.moderation,
    };
}

/**
 * Processor for GPT Image 1 generation
 * Synchronous processor that generates an image and uploads it
 */
export const gptImageGenProcessor: JobProcessor<GptImage1GenSettings, ImageResult> = {
    async start(input) {
        try {
            // Call OpenAI API to generate image
            const imageBuffer = await generateOpenAIImage(transformInput(input));

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
