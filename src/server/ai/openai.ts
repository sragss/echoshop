import { OpenAI } from "openai";
import { getEchoToken } from "../auth";
import { fetchBlobAsResponse } from './image-helpers';

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
export async function generateOpenAIImage(prompt: string): Promise<Buffer> {
    const openai = await getOpenAIClient();

    const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
    });

    return extractImageFromResponse(response);
}

/**
 * Edit images using OpenAI's gpt-image-1 model
 */
export async function editOpenAIImage(prompt: string, imageUrls: string[]): Promise<Buffer> {
    const openai = await getOpenAIClient();

    // Fetch images and convert to File objects with proper MIME types
    const imageFiles = await Promise.all(
        imageUrls.map(async (url, index) => {
            const response = await fetchBlobAsResponse(url);
            const blob = await response.blob();
            const contentType = response.headers.get('content-type') || 'image/png';

            // OpenAI SDK toFile helper expects File objects with proper type
            return new File([blob], `image-${index}.png`, { type: contentType });
        })
    );

    const response = await openai.images.edit({
        model: "gpt-image-1",
        image: imageFiles,
        prompt,
    });

    return extractImageFromResponse(response);
}

