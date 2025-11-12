import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateVideoSchema } from "@/lib/video-schema";
import {
  createVideoJob,
  getVideoJobStatus,
  cancelVideoJob,
  listVideoJobs,
} from "@/server/ai/video";

export const videoRouter = createTRPCRouter({
  /**
   * Create a new video generation job
   * Returns a job ID that can be used to poll for status
   */
  create: protectedProcedure
    .input(generateVideoSchema)
    .mutation(async ({ ctx, input }) => {
      return createVideoJob(input, ctx.session.user.id);
    }),

  /**
   * Get the status of a video generation job
   * Used for polling until completion
   */
  getStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      return getVideoJobStatus(input.jobId, ctx.session.user.id);
    }),

  /**
   * Cancel a pending or processing video generation job
   */
  cancel: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await cancelVideoJob(input.jobId, ctx.session.user.id);
      return { success: true };
    }),

  /**
   * List all video jobs for the current user
   * Optionally filter by status and limit results
   */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).optional(),
          status: z
            .enum(["pending", "processing", "completed", "failed", "cancelled"])
            .optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return listVideoJobs(ctx.session.user.id, input);
    }),
});
