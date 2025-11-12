import type { Output, VideoJob } from "../../generated/prisma";

/**
 * Item currently being generated (Designer added, API in flight)
 */
export interface GeneratingItem {
  clientId: string;
  prompt: string;
  model: string;
  operation: "generate" | "edit";
  timestamp: Date;
}

/**
 * Mapping between client ID and server ID
 * API returned, waiting for tRPC to load from DB
 */
export interface GeneratedItem {
  clientId: string;
  serverId: string;
}

/**
 * Video item currently being submitted (API call in flight)
 */
export interface GeneratingVideoItem {
  clientId: string;
  jobId?: string; // Set after tRPC returns
  prompt: string;
  model: string;
  operation: "generate";
  timestamp: Date;
}

/**
 * Video item being processed (polling for status)
 */
export interface ProcessingVideoItem {
  clientId: string;
  jobId: string;
  status: "processing";
  progress: number; // 0-100
  prompt: string;
  model: string;
  timestamp: Date;
}

/**
 * Gallery item types - images and videos with various states
 */
export type GalleryItemData =
  // Image states
  | { type: "loading"; item: GeneratingItem }
  | { type: "completed"; output: Output }
  | { type: "error"; item: GeneratingItem; error: string }
  // Video states
  | { type: "video-loading"; item: GeneratingVideoItem }
  | { type: "video-processing"; item: ProcessingVideoItem }
  | { type: "video-completed"; video: VideoJob }
  | { type: "video-error"; item: GeneratingVideoItem; error: string };
