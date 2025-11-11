import { NextResponse } from 'next/server';
import { generateImage } from './google';
import { auth } from '@/server/auth';
import { generateImageSchema } from '@/lib/generation-schema';

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
      operation: 'generate' as const,
      prompt: body.prompt,
    };

    // Validate request body
    const validation = generateImageSchema.safeParse(inputWithMeta);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    // Generate image using Google/Gemini
    const result = await generateImage(validation.data, session.user.id);

    return NextResponse.json({
      id: result.id,
      url: result.url,
    });
  } catch (error) {
    console.error('Image generation error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Image generation failed',
      },
      { status: 500 }
    );
  }
}
