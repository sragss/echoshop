import { z } from 'zod';

// Base schema with only model and operation
export const baseImageInSchema = z.object({
  model: z.enum(["nano-banana", "gpt-image-1"]),
  operation: z.enum(["generate", "edit"]),
});

// OpenAI-specific optional parameters (gpt-image-1 only)
// These will be ignored by other providers
export const oaiImageInSchema = z.object({
  // Image dimensions - default: "auto"
  size: z.enum(["1024x1024", "1536x1024", "1024x1536", "auto"]).optional(),

  // Rendering quality - default: "auto"
  quality: z.enum(["low", "medium", "high", "auto"]).optional(),

  // Background transparency - default: "auto"
  background: z.enum(["transparent", "opaque", "auto"]).optional(),

  // Output format - default: "png"
  output_format: z.enum(["png", "jpeg", "webp"]).optional(),

  // Compression level (0-100) for jpeg/webp - default: 100
  output_compression: z.number().min(0).max(100).optional(),

  // Content moderation level - default: "low"
  moderation: z.enum(["low", "auto"]).optional(),

  // Number of images to generate - default: 1
  n: z.number().min(1).max(10).optional(),
});

// Google-specific optional parameters (nano-banana only)
// These will be ignored by other providers
export const googImageInSchema = z.object({
  // Aspect ratio - default: "1:1"
  aspectRatio: z.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"]).optional(),

  // Image size - default: "1K"
  imageSize: z.enum(["1K", "2K", "4K"]).optional(),
});

// Generate schema extends base with prompt and optional provider-specific params
export const generateImageSchema = baseImageInSchema.extend({
  operation: z.literal("generate"),
  prompt: z.string().min(1, "Prompt cannot be empty"),
}).merge(oaiImageInSchema).merge(googImageInSchema);

// Edit schema extends base with prompt, images, and optional provider-specific params (including input_fidelity)
export const editImageSchema = baseImageInSchema.extend({
  operation: z.literal("edit"),
  prompt: z.string().min(1, "Prompt cannot be empty"),
  images: z.array(z.string().url("Invalid blob URL")).min(1, "At least one image is required"),
}).merge(oaiImageInSchema).merge(googImageInSchema).extend({
  // Input fidelity for preserving facial features/logos - default: "low" (OpenAI only)
  input_fidelity: z.enum(["high", "low"]).optional(),
});

// Export types
export type BaseGeneration = z.infer<typeof baseImageInSchema>;
export type GenerateImageInput = z.infer<typeof generateImageSchema>;
export type EditImageInput = z.infer<typeof editImageSchema>;
export type GenerationInput = GenerateImageInput | EditImageInput;

// Type for Output.input JSON field - used in gallery display
export type OutputMetadata = GenerationInput;


/**
 * 
 */