import { uploadGeneratedImage } from '@/lib/blob-upload';
import { db } from '@/server/db';
import type { Prisma } from '@/../../generated/prisma';
import type { GenerationInput } from '@/lib/generation-schema';

/**
 * Fetch a blob URL and return as Response object
 */
export async function fetchBlobAsResponse(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from blob storage: ${url}`);
  }
  return response;
}

/**
 * Save generated image to blob storage and database
 * Returns the database ID and blob URL
 */
export async function saveImageOutput(
  imageBuffer: Buffer,
  input: GenerationInput,
  userId: string
): Promise<{ id: string; url: string }> {
  // Upload to Vercel Blob storage
  const uploadResult = await uploadGeneratedImage(imageBuffer, 'image/png');

  // Save to Outputs table
  const output = await db.output.create({
    data: {
      userId,
      input: input as Prisma.InputJsonValue,
      outputUrl: uploadResult.url,
    },
  });

  return {
    id: output.id,
    url: uploadResult.url,
  };
}
