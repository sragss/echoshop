import { GoogleGenAI } from '@google/genai';
import { getEchoToken } from '@/server/auth';
import type { NanoBananaGenSettings, NanoBananaEditSettings } from '@/lib/schema';

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
 * Get a Google AI client configured with Echo authentication
 */
async function getGoogleClient(): Promise<GoogleGenAI> {
    const token = await getEchoToken();

    if (!token) {
        throw new Error("No Echo token available. User may not be authenticated.");
    }

    return new GoogleGenAI({
        apiKey: token,
        httpOptions: {
            baseUrl: 'https://echo.router.merit.systems',
        }
    });
}

/**
 * Extract image buffer from Google AI response
 */
function extractImageFromResponse(response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>): Buffer {
    if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No response from Google AI");
    }

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
            return Buffer.from(part.inlineData.data, "base64");
        }
    }

    throw new Error("No image data returned from Google AI");
}

/**
 * Generate an image using Google's Gemini model
 */
export async function generateGoogleImage(input: NanoBananaGenSettings): Promise<Buffer> {
    const google = await getGoogleClient();

    // Build image config from input parameters
    const imageConfig: { aspectRatio?: string; imageSize?: string } = {};
    if (input.aspectRatio) {
        imageConfig.aspectRatio = input.aspectRatio;
    }
    if (input.imageSize) {
        imageConfig.imageSize = input.imageSize;
    }

    const response = await google.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: input.prompt,
        ...(Object.keys(imageConfig).length > 0 && { imageConfig }),
    });

    return extractImageFromResponse(response);
}

/**
 * Edit images using Google's Gemini model
 */
export async function editGoogleImage(input: NanoBananaEditSettings): Promise<Buffer> {
    const google = await getGoogleClient();

    // Fetch images and convert to Google's format
    const imageData = await Promise.all(
        input.images.map(async (url) => {
            const response = await fetchBlobAsResponse(url);
            const arrayBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString('base64');
            const contentType = response.headers.get('content-type') ?? 'image/png';

            return {
                inlineData: {
                    mimeType: contentType,
                    data: base64Image,
                },
            };
        })
    );

    // Build contents with text and images
    const contents = [
        { text: input.prompt },
        ...imageData,
    ];

    // Build image config from input parameters
    const imageConfig: { aspectRatio?: string; imageSize?: string } = {};
    if (input.aspectRatio) {
        imageConfig.aspectRatio = input.aspectRatio;
    }
    if (input.imageSize) {
        imageConfig.imageSize = input.imageSize;
    }

    const response = await google.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
        ...(Object.keys(imageConfig).length > 0 && { imageConfig }),
    });

    return extractImageFromResponse(response);
}
