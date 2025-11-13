import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

/**
 * Upload a generated image to Vercel Blob storage
 *
 * @param imageBuffer - The image data as a Buffer
 * @param contentType - MIME type of the image (default: 'image/png')
 * @returns Object containing the UUID and blob URL
 */
export async function uploadGeneratedImage(
    imageBuffer: Buffer,
    contentType = 'image/png'
): Promise<{ id: string; url: string }> {
    // Generate UUID upfront for the output image
    const id = randomUUID();

    // Determine file extension from content type
    const extension = contentType.split('/')[1] ?? 'png';
    const filename = `generated/${id}.${extension}`;

    // Upload to Vercel Blob storage
    const blob = await put(filename, imageBuffer, {
        access: 'public',
        contentType,
    });

    console.log('Generated image uploaded to blob storage:', blob.url);

    return {
        id,
        url: blob.url,
    };
}
