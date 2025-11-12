# 11/12/25 -- Video Implementation
*We have working 2x image gen, now working on Video*

# Relevant Settings
## Gemini Veo3.1
- `[first_frame (image), config.last_frame]` or `config.reference_images`
- `config.seed`
- `config.durationSeconds` -- `[4,6,8]` -- unless reference image only `8`
- config.personGeneration = `allow_adult`
- `config.negativePrompt: string`
- `config.generateAudio: string`
- `config.mask: Image`
- `config.compressionQuality`


## Sora2
```typescript
export interface VideoCreateParams {
  /**
   * Text prompt that describes the video to generate.
   */
  prompt: string;

  /**
   * Optional image reference that guides generation.
   */
  input_reference?: Uploadable;

  /**
   * The video generation model to use. Defaults to `sora-2`.
   */
  model?: VideoModel;

  /**
   * Clip duration in seconds. Defaults to 4 seconds.
   */
  seconds?: VideoSeconds;

  /**
   * Output resolution formatted as width x height. Defaults to 720x1280.
   */
  size?: VideoSize;
}
```


After waiting for the job to complete we can download a `thumbnail` variant so we can display a thumbnail. Both Sora2 and Veo3.1 support this.