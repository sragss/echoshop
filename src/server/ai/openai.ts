import { OpenAI } from "openai";
import { getEchoToken } from "../auth";
import type { GptImage1GenSettings, GptImage1EditSettings } from '@/lib/schema';

/**
 * Fetch a blob URL and return as Response object
 */
async function fetchBlobAsResponse(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from blob storage: ${url}`);
  }
  return response;
}

/**
 * Get an OpenAI client configured with Echo authentication
 */
async function getOpenAIClient(): Promise<OpenAI> {
    const token = await getEchoToken();

    if (!token) {
        throw new Error("No Echo token available. User may not be authenticated.");
    }

    return new OpenAI({
        apiKey: token,
        baseURL: "https://echo.router.merit.systems",
    });
}

/**
 * Extract image buffer from OpenAI response
 */
function extractImageFromResponse(response: OpenAI.Images.ImagesResponse): Buffer {
    if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from OpenAI");
    }

    const b64Json = response.data[0]?.b64_json;

    if (!b64Json) {
        throw new Error("No b64_json in OpenAI response");
    }

    return Buffer.from(b64Json, "base64");
}

/**
 * Generate an image using OpenAI's gpt-image-1 model
 */
export async function generateOpenAIImage(input: GptImage1GenSettings): Promise<Buffer> {
    const openai = await getOpenAIClient();

    const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: input.prompt,
        // Optional parameters with OpenAI defaults
        size: input.size,
        quality: input.quality,
        background: input.background,
        output_format: input.output_format,
        output_compression: input.output_compression,
        moderation: input.moderation ?? "low", // Override default to "low"
        // Note: response_format is not supported for gpt-image-1
        // The model always returns base64 in b64_json field
    });

    return extractImageFromResponse(response);
}

/**
 * Edit images using OpenAI's gpt-image-1 model
 */
export async function editOpenAIImage(input: GptImage1EditSettings): Promise<Buffer> {
    const openai = await getOpenAIClient();

    // Fetch images and convert to File objects with proper MIME types
    const imageFiles = await Promise.all(
        input.images.map(async (url, index) => {
            const response = await fetchBlobAsResponse(url);
            const blob = await response.blob();
            const contentType = response.headers.get('content-type') ?? 'image/png';

            // OpenAI SDK expects File objects with proper type
            return new File([blob], `image-${index}.png`, { type: contentType });
        })
    );

    const response = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFiles,
        prompt: input.prompt,
        // Optional parameters with OpenAI defaults
        size: input.size,
        quality: input.quality,
        background: input.background,
        output_format: input.output_format,
        output_compression: input.output_compression,
        input_fidelity: input.input_fidelity,
        // Note: moderation is not supported for edit, only for generate
    });

    return extractImageFromResponse(response);
}

