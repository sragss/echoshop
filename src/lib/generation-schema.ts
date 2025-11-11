import { z } from 'zod';

// Base schema with only model and operation
export const baseGenerationSchema = z.object({
  model: z.enum(["nano-banana", "gpt-image-1"]),
  operation: z.enum(["generate", "edit"]),
});

// Generate schema extends base with prompt
export const generateImageSchema = baseGenerationSchema.extend({
  operation: z.literal("generate"),
  prompt: z.string().min(1, "Prompt cannot be empty"),
});

// Edit schema extends base with prompt and images
export const editImageSchema = baseGenerationSchema.extend({
  operation: z.literal("edit"),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  images: z.array(z.string().url("Invalid blob URL")).min(1, "At least one image is required"),
});

// Export types
export type BaseGeneration = z.infer<typeof baseGenerationSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type EditImageInput = z.infer<typeof editImageSchema>;
export type GenerationInput = GenerateImageInput | EditImageInput;

// Type for Output.input JSON field - used in gallery display
export type OutputMetadata = GenerationInput;
