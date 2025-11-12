import { generateGoogleImage, editGoogleImage } from '@/server/ai/google';
import { generateOpenAIImage, editOpenAIImage } from '@/server/ai/openai';
import { saveImageOutput } from '@/server/ai/image-helpers';
import type { GenerateImageInput, EditImageInput } from '@/lib/generation-schema';

/**
 * Generate an image using the specified model
 * Routes to the appropriate provider based on input.model
 */
export async function generateImage(
  input: GenerateImageInput,
  userId: string
): Promise<{ id: string; url: string }> {
  const imageBuffer = input.model === "gpt-image-1"
    ? await generateOpenAIImage(input)
    : await generateGoogleImage(input);

  return saveImageOutput(imageBuffer, input, userId);
}

/**
 * Edit images using the specified model
 * Routes to the appropriate provider based on input.model
 */
export async function editImage(
  input: EditImageInput,
  userId: string
): Promise<{ id: string; url: string }> {
  const imageBuffer = input.model === "gpt-image-1"
    ? await editOpenAIImage(input)
    : await editGoogleImage(input);

  return saveImageOutput(imageBuffer, input, userId);
}