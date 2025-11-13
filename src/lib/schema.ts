import { z } from 'zod';


export const gptBaseSchema = z.object({
    model: z.literal('gpt-image-1'),
    prompt: z.string().min(1, "Prompt cannot be empty"),

    // Image dimensions - default: "auto"
    size: z.enum(["1024x1024", "1536x1024", "1024x1536", "auto"]).optional(),

    // Rendering quality - default: "auto"
    quality: z.enum(["low", "medium", "high", "auto"]).default("auto").optional(),

    // Background transparency - default: "auto"
    background: z.enum(["transparent", "opaque", "auto"]).default("auto").optional(),

    // Output format - default: "png"
    output_format: z.enum(["png", "jpeg", "webp"]).default("png").optional(),

    // Compression level (0-100) for jpeg/webp - default: 100
    output_compression: z.number().min(0).max(100).default(0).optional(),

    // Content moderation level - default: "low"
    moderation: z.enum(["low", "auto"]).default("low").optional(),
})

export const gptEditSchema = gptBaseSchema.extend({
    type: z.literal("gpt-image-1-edit"),
    input_fidelity: z.enum(["high", "low"]).default("high").optional(),
    images: z.array(z.string().url("Invalid blob URL")).min(1, "At least one image is required"),
})

export const gptGenerateSchema = gptBaseSchema.extend({
    type: z.literal("gpt-image-1-generate"),
})

export const bananaBaseSchema = z.object({
    model: z.literal('nano-banana'),
    prompt: z.string().min(1, "Prompt cannot be empty"),

    // Aspect ratio - default: "1:1"
    aspectRatio: z.enum(["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"]).default("1:1").optional(),
});

export const bananaEditSchema = bananaBaseSchema.extend({
    type: z.literal("nano-banana-edit"),
    images: z.array(z.string().url("Invalid blob URL")).min(1, "At least one image is required"),
})

export const bananaGenerateSchema = bananaBaseSchema.extend({
    type: z.literal("nano-banana-generate"),
})





export const soraSchema = z.object({
    model: z.literal('sora-2'),
    type: z.literal("sora-2-video"),

    prompt: z.string().min(1, "Prompt cannot be empty"),

    // OpenAI Sora supports 4, 8, or 12 second videos
    seconds: z.enum(['4', '8', '12']).default('4').optional(),
    // OpenAI Sora supported sizes (portrait, landscape only)
    size: z.enum(['720x1280', '1280x720']).optional(),
    input_reference: z.string().url("Invalid blob URL").optional(),
})

export const jobSettingsSchema = z.discriminatedUnion("type", [
    gptEditSchema, 
    gptGenerateSchema, 
    bananaEditSchema, 
    bananaGenerateSchema, 
    soraSchema
]);

export type JobSettings = z.infer<typeof jobSettingsSchema>;

export type JobKind = z.infer<typeof jobSettingsSchema>['type'];

// Export individual settings types for type-safe processor mapping
export type GptImage1GenSettings = z.infer<typeof gptGenerateSchema>;
export type GptImage1EditSettings = z.infer<typeof gptEditSchema>;
export type NanoBananaGenSettings = z.infer<typeof bananaGenerateSchema>;
export type NanoBananaEditSettings = z.infer<typeof bananaEditSchema>;
export type Sora2GenSettings = z.infer<typeof soraSchema>;

// Output Schemas
export const imageResultSchema = z.object({
    imageUrl: z.string().url("Invalid image URL"),
});

export const videoResultSchema = z.object({
    videoUrl: z.string().url("Invalid video URL"),
    thumbnailUrl: z.string().url("Invalid thumbnail URL"),
});

export type ImageResult = z.infer<typeof imageResultSchema>;
export type VideoResult = z.infer<typeof videoResultSchema>;