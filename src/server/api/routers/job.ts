import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { jobSettingsSchema, type JobKind } from "@/lib/schema";
import { createAndProcessJob, getJobStatus, listJobs } from "@/server/ai/job-runner";
import type { ProcessorRegistry } from "@/server/ai/job-processor";

// Import all processors
import { gptImageGenProcessor } from "@/server/ai/processors/gpt-image-gen_v2";
import { gptImageEditProcessor } from "@/server/ai/processors/gpt-image-edit_v2";
import { nanoBananaGenProcessor } from "@/server/ai/processors/nano-banana-gen_v2";
import { nanoBananaEditProcessor } from "@/server/ai/processors/nano-banana-edit_v2";
import { soraVideoProcessor } from "@/server/ai/processors/sora-video_v2";

/**
 * Processor registry mapping job types to their implementations
 */
const processorRegistry: ProcessorRegistry = {
    "gpt-image-1-generate": gptImageGenProcessor,
    "gpt-image-1-edit": gptImageEditProcessor,
    "nano-banana-generate": nanoBananaGenProcessor,
    "nano-banana-edit": nanoBananaEditProcessor,
    "sora-2-video": soraVideoProcessor,
};

export const jobRouter = createTRPCRouter({
    /**
     * Create a new job
     * Accepts JobSettings (discriminated union) and starts processing
     * Returns job ID for polling
     */
    create: protectedProcedure
        .input(jobSettingsSchema)
        .mutation(async ({ ctx, input }) => {
            return createAndProcessJob(
                input.type as JobKind,
                input as any, // Type is guaranteed by discriminated union
                ctx.session.user.id,
                processorRegistry
            );
        }),

    /**
     * Get the status of a job
     * Returns job info and result if complete
     */
    getStatus: protectedProcedure
        .input(z.object({ jobId: z.string() }))
        .query(async ({ ctx, input }) => {
            return getJobStatus(input.jobId, ctx.session.user.id);
        }),

    /**
     * List all jobs for the current user
     * Optionally filter by status, type, and limit results
     */
    list: protectedProcedure
        .input(
            z
                .object({
                    limit: z.number().min(1).max(100).optional(),
                    status: z
                        .enum(["pending", "loading", "complete", "failed"])
                        .optional(),
                    type: z
                        .enum([
                            "gpt-image-1-generate",
                            "gpt-image-1-edit",
                            "nano-banana-generate",
                            "nano-banana-edit",
                            "sora-2-video",
                        ])
                        .optional(),
                })
                .optional()
        )
        .query(async ({ ctx, input }) => {
            return listJobs(ctx.session.user.id, input);
        }),
});
