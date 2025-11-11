import { getGoogleClient, extractImageFromResponse } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';
import { db } from '@/server/db';
import type { EditImageInput } from '@/lib/generation-schema';

export async function editImage(input: EditImageInput, userId: string): Promise<{ id: string; url: string }> {
    const google = await getGoogleClient();

    // Fetch images directly from blob storage URLs
    const imagePromises = input.images.map(async (blobUrl) => {
        const response = await fetch(blobUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from blob storage: ${blobUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // Detect MIME type from response or blob URL
        const contentType = response.headers.get('content-type') || 'image/png';

        return {
            inlineData: {
                mimeType: contentType,
                data: base64Image,
            },
        };
    });

    const imageData = await Promise.all(imagePromises);

    // Build prompt with text and images
    const contents = [
        { text: input.prompt },
        ...imageData,
    ];

    const response = await google.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents,
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
