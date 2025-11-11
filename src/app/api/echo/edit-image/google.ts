import { z } from 'zod';
import { getGoogleClient, extractImageFromResponse } from '@/server/ai/google';
import { uploadGeneratedImage } from '@/lib/blob-upload';

// Zod schema for edit image request
export const editImageSchema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty"),
    images: z.array(z.string().url("Invalid blob URL")).min(1, "At least one image is required"),
});

export type EditImageInput = z.infer<typeof editImageSchema>;

export async function editImage(input: EditImageInput): Promise<{ id: string; url: string }> {
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

    // TODO(sragss): Add to Outputs table (input, user, input_image_UUIDs, output_UUID)

    return result;
}
