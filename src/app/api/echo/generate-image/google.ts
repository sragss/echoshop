import { getGoogleClient, extractImageFromResponse } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import { db } from '@/server/db';
import type { GenerateImageInput } from '@/lib/generation-schema';

export async function generateImage(input: GenerateImageInput, userId: string): Promise<{ id: string; url: string }> {
    const google = await getGoogleClient();

    const response = await google.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: input.prompt,
    });

    const imageBuffer = extractImageFromResponse(response);

    // Upload to Vercel Blob storage and get UUID + URL
    const result = await uploadGeneratedImage(imageBuffer, 'image/png');

    // Save to Outputs table
    await db.output.create({
        data: {
            userId,
            input: input as any, // Prisma Json type
            outputUrl: result.url,
        },
    });

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