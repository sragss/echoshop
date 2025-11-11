import { GoogleGenAI } from '@google/genai';
import { getEchoToken } from '@/server/auth';

/**
 * Get a Google AI client configured with Echo authentication
 */
export async function getGoogleClient(): Promise<GoogleGenAI> {
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
export function extractImageFromResponse(response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>): Buffer {
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
