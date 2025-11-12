import { z } from 'zod';

// Sora2 video model types
export const videoModelSchema = z.enum(['sora-2']);
export const videoSecondsSchema = z.enum(['4', '6', '10']);
export const videoSizeSchema = z.enum([
  '720x1280',  // Portrait (9:16)
  '1280x720',  // Landscape (16:9)
  '1024x1024', // Square (1:1)
]);

// Base video generation schema
export const generateVideoSchema = z.object({
  // Required fields
  prompt: z.string().min(1, "Prompt cannot be empty"),
  model: videoModelSchema.default('sora-2'),

  // Optional fields
  seconds: videoSecondsSchema.optional(),
  size: videoSizeSchema.optional(),
  input_reference: z.string().url("Invalid blob URL").optional(),
});

// Export types
export type GenerateVideoInput = z.infer<typeof generateVideoSchema>;
export type VideoModel = z.infer<typeof videoModelSchema>;
export type VideoSeconds = z.infer<typeof videoSecondsSchema>;
export type VideoSize = z.infer<typeof videoSizeSchema>;

// Type for VideoJob.input JSON field
export type VideoJobMetadata = GenerateVideoInput;
