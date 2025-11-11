import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
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

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname) => {
        // Construct callback URL for onUploadCompleted
        // In production on Vercel, this uses VERCEL_URL automatically
        // In local dev, this won't work (expected - localhost not publicly accessible)
        const baseUrl = process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

        return {
          allowedContentTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
          maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
          addRandomSuffix: true, // Prevent filename conflicts
          callbackUrl: `${baseUrl}/api/uploads`,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const payload = JSON.parse(tokenPayload ?? '{}') as { userId: string };

          // Save upload metadata to database
          await db.upload.create({
            data: {
              blobUrl: blob.url,
              filename: blob.pathname,
              mediaType: blob.contentType,
              size: 0, // Size not available in blob object
              userId: payload.userId,
            },
          });
        } catch (error) {
          console.error('Failed to save upload to database:', error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
