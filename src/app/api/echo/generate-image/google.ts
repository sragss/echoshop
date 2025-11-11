import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { getEchoToken } from '@/server/auth';
import { uploadGeneratedImage } from '@/lib/blob-upload';

// Zod schema for generate image request
export const generateImageSchema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty"),
    images: z.array(z.string().uuid("Invalid upload ID")).optional().default([]),
});

export type GenerateImageInput = z.infer<typeof generateImageSchema>;

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

export async function generateImage(input: GenerateImageInput): Promise<{ id: string; url: string }> {
    const google = await getGoogleClient();

    const response = await google.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: input.prompt,
    });

    if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No response from Google AI");
    }

    // Extract image data from response
    let imageBuffer: Buffer | null = null;
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
            imageBuffer = Buffer.from(part.inlineData.data, "base64");
            break;
        }
    }

    if (!imageBuffer) {
        throw new Error("No image data returned from Google AI");
    }

    // Upload to Vercel Blob storage and get UUID + URL
    const result = await uploadGeneratedImage(imageBuffer, 'image/png');

    // TODO(sragss): Add to Outputs table (input, user, output_UUID)

    return result;
}

// TODO(sragss): Issues.
// Upload the images to blob storage after they come back. Add a column for input / output.
// - We don't handle refresh
//     - When we get it, validate it or refresh it.
// - Multiple output images
// - Multiple input images (edit)
// - How does the UI handle the 'waiting' state?
//     - Wait until it gets a UUID back, then load it.


// TODO(sragss): Nano-banana also supports:
// export declare interface ImageConfig {
//     /** Aspect ratio of the generated images. Supported values are
//      "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", and "21:9". */
//     aspectRatio?: string;
//     /** Optional. Specifies the size of generated images. Supported
//      values are `1K`, `2K`, `4K`. If not specified, the model will use default
//      value `1K`. */
//     imageSize?: string;
// }