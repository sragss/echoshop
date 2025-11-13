import type {
    GptImage1GenSettings,
    GptImage1EditSettings,
    NanoBananaGenSettings,
    NanoBananaEditSettings,
    Sora2GenSettings,
    ImageResult,
    VideoResult,
    JobKind,
} from '@/lib/schema';

/**
 * Job handle returned from starting a job
 * - "sync": Job completed synchronously, result is included
 * - string: Async job ID for polling
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type JobHandle = "sync" | string;

/**
 * Result from a job execution
 * progress is optional - only include if the API provides real progress info
 */
export type JobResult<TOutput> =
    | { success: true; data: TOutput; progress?: number }
    | { success: false; error: string; progress?: number };

/**
 * Poll result that can indicate still processing with optional progress
 */
export type PollResult<TOutput> =
    | JobResult<TOutput>  // Complete or failed
    | { processing: true; progress?: number };  // Still processing

/**
 * Interface that all job processors must implement
 * Handles the AI API calls (sync or async)
 */
export interface JobProcessor<TInput, TOutput> {
    /**
     * Start the job execution
     * For sync jobs: returns "sync" handle with immediate result
     * For async jobs: returns remote job ID for polling
     */
    start(input: TInput): Promise<{
        handle: JobHandle;
        result?: JobResult<TOutput>; // Only present for sync jobs
    }>;

    /**
     * Poll an async job for completion (optional, only for async jobs)
     * Returns PollResult with optional progress info
     */
    poll?(handle: string): Promise<PollResult<TOutput>>;
}

/**
 * Type-safe mapping from job kind to input settings
 */
export type JobInputMap = {
    "gpt-image-1-generate": GptImage1GenSettings;
    "gpt-image-1-edit": GptImage1EditSettings;
    "nano-banana-generate": NanoBananaGenSettings;
    "nano-banana-edit": NanoBananaEditSettings;
    "sora-2-video": Sora2GenSettings;
};

/**
 * Type-safe mapping from job kind to output result
 */
export type JobOutputMap = {
    "gpt-image-1-generate": ImageResult;
    "gpt-image-1-edit": ImageResult;
    "nano-banana-generate": ImageResult;
    "nano-banana-edit": ImageResult;
    "sora-2-video": VideoResult;
};

/**
 * Registry of all job processors
 * Maps job kind to its processor implementation
 */
export type ProcessorRegistry = {
    [K in JobKind]: JobProcessor<JobInputMap[K], JobOutputMap[K]>;
};
