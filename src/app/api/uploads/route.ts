import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate UUID upfront so we can return it to the client immediately
    const uploadId = randomUUID();

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        // Construct callback URL for onUploadCompleted
        // Priority: VERCEL_BLOB_CALLBACK_URL (for ngrok in local dev) > VERCEL_URL (production) > localhost fallback
        const baseUrl = process.env.VERCEL_BLOB_CALLBACK_URL
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        return {
          allowedContentTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            uploadId, // Pass the UUID through tokenPayload
          }),
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true, // Prevent filename conflicts
          callbackUrl: `${baseUrl}/api/uploads`,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          console.log('onUploadCompleted callback:', tokenPayload);
          const payload = JSON.parse(tokenPayload ?? '{}') as { userId: string; uploadId: string };

          // Save upload metadata to database using the pre-generated UUID
          const upload = await db.upload.create({
            data: {
              id: payload.uploadId,
              blobUrl: blob.url,
              filename: blob.pathname,
              mediaType: blob.contentType,
              size: 0, // Size not available in blob object
              userId: payload.userId,
            },
          });

          console.log('Upload saved to database with ID:', upload.id);
        } catch (error) {
          console.error('Failed to save upload to database:', error);
        }
      },
    });

    // Add the uploadId to the response so client can use it immediately
    return NextResponse.json({
      ...jsonResponse,
      uploadId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
