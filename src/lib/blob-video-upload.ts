import { put } from '@vercel/blob';
import { randomUUID } from 'crypto';

/**
 * Upload a generated video and thumbnail to Vercel Blob storage
 *
 * @param videoBuffer - The video data as a Buffer
 * @param thumbnailBuffer - The thumbnail image data as a Buffer
 * @param videoContentType - MIME type of the video (default: 'video/mp4')
 * @param thumbnailContentType - MIME type of the thumbnail (default: 'image/jpeg')
 * @returns Object containing the UUID, video URL, and thumbnail URL
 */
export async function uploadGeneratedVideo(
    videoBuffer: Buffer,
    thumbnailBuffer: Buffer,
    videoContentType = 'video/mp4',
    thumbnailContentType = 'image/jpeg'
): Promise<{ id: string; videoUrl: string; thumbnailUrl: string }> {
    // Generate UUID upfront for the output video
    const id = randomUUID();

    // Determine file extensions from content types
    const videoExtension = videoContentType.split('/')[1] ?? 'mp4';
    const thumbnailExtension = thumbnailContentType.split('/')[1] ?? 'jpg';

    const videoFilename = `generated/videos/${id}.${videoExtension}`;
    const thumbnailFilename = `generated/videos/${id}-thumb.${thumbnailExtension}`;

    // Upload video to Vercel Blob storage
    const videoBlob = await put(videoFilename, videoBuffer, {
        access: 'public',
        contentType: videoContentType,
    });

    console.log('Generated video uploaded to blob storage:', videoBlob.url);

    // Upload thumbnail to Vercel Blob storage
    const thumbnailBlob = await put(thumbnailFilename, thumbnailBuffer, {
        access: 'public',
        contentType: thumbnailContentType,
    });

    console.log('Video thumbnail uploaded to blob storage:', thumbnailBlob.url);

    return {
        id,
        videoUrl: videoBlob.url,
        thumbnailUrl: thumbnailBlob.url,
    };
}
