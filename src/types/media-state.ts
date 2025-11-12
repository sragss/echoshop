/**
 * Unified media state management types
 * Uses discriminated unions to eliminate race conditions
 * Consistent pattern for both images and videos
 */

/**
 * Base item with common fields for all media types
 */
interface BaseMediaItem {
  clientId: string;
  prompt: string;
  model: string;
  timestamp: Date;
}

/**
 * Image-specific state machine
 */
export type ImageStateItem =
  | (BaseMediaItem & {
      mediaType: "image";
      state: "generating";
      operation: "generate" | "edit";
    })
  | (BaseMediaItem & {
      mediaType: "image";
      state: "completed";
      serverId: string; // Maps to Output.id in DB
    })
  | (BaseMediaItem & {
      mediaType: "image";
      state: "error";
      error: string;
      operation: "generate" | "edit";
    });

/**
 * Video-specific state machine
 */
export type VideoStateItem =
  | (BaseMediaItem & {
      mediaType: "video";
      state: "generating";
      operation: "generate";
    })
  | (BaseMediaItem & {
      mediaType: "video";
      state: "processing";
      jobId: string;
      progress: number; // 0-100
    })
  | (BaseMediaItem & {
      mediaType: "video";
      state: "error";
      error: string;
      operation: "generate";
    });

/**
 * Union of all media state items
 */
export type MediaStateItem = ImageStateItem | VideoStateItem;

/**
 * Type guards for narrowing
 */
export function isImageState(item: MediaStateItem): item is ImageStateItem {
  return item.mediaType === "image";
}

export function isVideoState(item: MediaStateItem): item is VideoStateItem {
  return item.mediaType === "video";
}

/**
 * Helper to get a display label for the current state
 */
export function getStateLabel(item: MediaStateItem): string {
  if (item.state === "generating") return "Generating...";
  if (item.state === "processing") return `Processing ${item.progress}%`;
  if (item.state === "error") return "Failed";
  if (item.state === "completed") return "Completed";
  return "Unknown";
}
