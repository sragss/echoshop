import { z } from 'zod';
import { gptBaseSchema, gptEditSchema, bananaBaseSchema, soraSchema } from './schema';

// Extract only the settings (omit model, type, prompt, images)
// For GPT, merge base + edit schema to get all settings including input_fidelity
export const gptImageSettingsSchema = gptBaseSchema
  .omit({ model: true, prompt: true })
  .merge(gptEditSchema.omit({ model: true, prompt: true, type: true, images: true }));

export const nanoBananaSettingsSchema = bananaBaseSchema.omit({ model: true, prompt: true });
export const soraSettingsSchema = soraSchema.omit({ model: true, type: true, prompt: true, input_reference: true });

export type GptImageSettings = z.infer<typeof gptImageSettingsSchema>;
export type NanoBananaSettings = z.infer<typeof nanoBananaSettingsSchema>;
export type SoraSettings = z.infer<typeof soraSettingsSchema>;

// Per-model settings map
export type ModelSettings = {
  'gpt-image-1': Partial<GptImageSettings>;
  'nano-banana': Partial<NanoBananaSettings>;
  'sora-2': Partial<SoraSettings>;
};

// Default settings for each model (all optional, will use schema defaults)
export const defaultModelSettings: ModelSettings = {
  'gpt-image-1': {},
  'nano-banana': {},
  'sora-2': {},
};
