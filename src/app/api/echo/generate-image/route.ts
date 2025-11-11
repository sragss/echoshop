import { NextResponse } from 'next/server';
import { generateImage, generateImageSchema } from './google';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = generateImageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    // Generate image using Google/Gemini
    const result = await generateImage(validation.data);

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
