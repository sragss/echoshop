import type { Output } from "../../generated/prisma";

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
 * Gallery item types - loading, completed, or error
 */
export type GalleryItemData =
  | { type: "loading"; item: GeneratingItem }
  | { type: "completed"; output: Output }
  | { type: "error"; item: GeneratingItem; error: string };
