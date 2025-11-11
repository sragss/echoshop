import { NextResponse } from 'next/server';
import { editImage } from './google';
import { auth } from '@/server/auth';
import { editImageSchema } from '@/lib/generation-schema';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Build full schema with model and operation
    const inputWithMeta = {
      model: body.model || 'nano-banana',
      operation: 'edit' as const,
      prompt: body.prompt,
      images: body.images,
    };

    // Validate request body
    const validation = editImageSchema.safeParse(inputWithMeta);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    // Edit image using Google/Gemini
    const result = await editImage(validation.data, session.user.id);

    return NextResponse.json({
      id: result.id,
      url: result.url,
    });
  } catch (error) {
    console.error('Image edit error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Image edit failed',
      },
      { status: 500 }
    );
  }
}
