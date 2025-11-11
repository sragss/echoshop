import { z } from 'zod';

/**
 * Schema for blob upload result returned from Vercel Blob client
 * This matches the response from the @vercel/blob upload() function
 */
export const uploadResultSchema = z.object({
  url: z.string().url('Invalid blob URL'),
  pathname: z.string(),
  contentType: z.string(),
});

export type UploadResult = z.infer<typeof uploadResultSchema>;

/**
 * Schema for upload progress tracking
 */
export const uploadProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  isUploading: z.boolean(),
});

export type UploadProgress = z.infer<typeof uploadProgressSchema>;
