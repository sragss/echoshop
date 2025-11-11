import { NextResponse } from 'next/server';
import { editImage, editImageSchema } from './google';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = editImageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    // Edit image using Google/Gemini
    const result = await editImage(validation.data);

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
