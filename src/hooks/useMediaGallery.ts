import { useEffect, useMemo } from "react";
import { api } from "@/trpc/react";
import { useMediaState } from "./useMediaState";
import { useMediaData } from "./useMediaData";
import type { GalleryItemData } from "@/types/generation";
import type { ImageStateItem, VideoStateItem } from "@/types/media-state";

/**
 * Composition hook that combines state management and data fetching
 * Handles all the complex logic for the gallery:
 * - Auto-cleanup of completed items
 * - Merging local state with server data
 * - Computing final display items
 */
export function useMediaGallery() {
  const utils = api.useUtils();

  // Pure state management (no side effects)
  const state = useMediaState();

  // Data fetching (no state mutations)
  const data = useMediaData();

  // ============================================
  // Auto-Cleanup: Remove completed items once they appear in loaded data
  // ============================================

  useEffect(() => {
    if (!data.loadedImages || data.loadedImages.length === 0) return;

    const loadedIds = new Set(data.loadedImages.map((o) => o.id));

    // Remove image items that are now in the database
    state.getImageItems().forEach((item) => {
      if (item.state === "completed" && loadedIds.has(item.serverId)) {
        state.removeImage(item.clientId);
      }
    });
  }, [data.loadedImages]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!data.loadedVideos || data.loadedVideos.length === 0) return;

    const loadedJobIds = new Set(data.loadedVideos.map((v) => v.id));

    // Remove video items that are now in the database
    state.getVideoItems().forEach((item) => {
      if (item.state === "processing" && loadedJobIds.has(item.jobId)) {
        state.removeVideo(item.clientId);
      }
    });
  }, [data.loadedVideos]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // Compute Final Display Items
  // ============================================

  const items = useMemo(() => {
    const allItems: Array<GalleryItemData & { sortTimestamp: Date }> = [];

    // Collect all error items
    state.items.forEach((item) => {
      if (item.state === "error") {
        if (item.mediaType === "image") {
          allItems.push({
            type: "error" as const,
            item: {
              clientId: item.clientId,
              prompt: item.prompt,
              model: item.model,
              operation: item.operation,
              timestamp: item.timestamp,
            },
            error: item.error,
            sortTimestamp: item.timestamp,
          });
        } else {
          allItems.push({
            type: "video-error" as const,
            item: {
              clientId: item.clientId,
              prompt: item.prompt,
              model: item.model,
              operation: item.operation,
              timestamp: item.timestamp,
            },
            error: item.error,
            sortTimestamp: item.timestamp,
          });
        }
      }
    });

    // Collect video loading and processing states
    state.items.forEach((item) => {
      if (item.mediaType === "video") {
        if (item.state === "generating") {
          allItems.push({
            type: "video-loading" as const,
            item: {
              clientId: item.clientId,
              prompt: item.prompt,
              model: item.model,
              operation: item.operation,
              timestamp: item.timestamp,
            },
            sortTimestamp: item.timestamp,
          });
        } else if (item.state === "processing") {
          allItems.push({
            type: "video-processing" as const,
            item: {
              clientId: item.clientId,
              jobId: item.jobId,
              status: "processing" as const,
              progress: item.progress,
              prompt: item.prompt,
              model: item.model,
              timestamp: item.timestamp,
            },
            sortTimestamp: item.timestamp,
          });
        }
      }
    });

    // Collect image loading states
    if (!data.loadedImages) {
      // Still loading initial data - show all generating images
      state.items.forEach((item) => {
        if (item.mediaType === "image" && item.state === "generating") {
          allItems.push({
            type: "loading" as const,
            item: {
              clientId: item.clientId,
              prompt: item.prompt,
              model: item.model,
              operation: item.operation,
              timestamp: item.timestamp,
            },
            sortTimestamp: item.timestamp,
          });
        }
      });
    } else {
      // Filter out images that have already loaded
      const loadedIds = new Set(data.loadedImages.map((o) => o.id));
      const completedClientIds = new Set(
        state.items
          .filter((item): item is Extract<ImageStateItem, { state: "completed" }> =>
            item.mediaType === "image" && item.state === "completed" && loadedIds.has(item.serverId)
          )
          .map((item) => item.clientId)
      );

      state.items.forEach((item) => {
        if (
          item.mediaType === "image" &&
          item.state === "generating" &&
          !completedClientIds.has(item.clientId)
        ) {
          allItems.push({
            type: "loading" as const,
            item: {
              clientId: item.clientId,
              prompt: item.prompt,
              model: item.model,
              operation: item.operation,
              timestamp: item.timestamp,
            },
            sortTimestamp: item.timestamp,
          });
        }
      });

      // Collect completed images and videos
      data.loadedImages.forEach((output) => {
        allItems.push({
          type: "completed" as const,
          output,
          sortTimestamp: output.createdAt,
        });
      });

      if (data.loadedVideos) {
        data.loadedVideos
          .filter((v) => v.status === "completed")
          .forEach((video) => {
            allItems.push({
              type: "video-completed" as const,
              video,
              sortTimestamp: video.updatedAt,
            });
          });
      }
    }

    // Sort all items chronologically (newest first)
    allItems.sort((a, b) => b.sortTimestamp.getTime() - a.sortTimestamp.getTime());

    // Remove sortTimestamp before returning (TypeScript cleanup)
    return allItems.map(({ sortTimestamp, ...item }) => item);
  }, [state.items, data.loadedImages, data.loadedVideos]);

  // ============================================
  // Public API
  // ============================================

  return {
    // Display data
    items,
    isLoading: data.isLoading,

    // Image operations
    addGenerating: (params: { clientId: string; prompt: string; model: string; operation: "generate" | "edit" }) => {
      state.addGeneratingImage(params);
    },
    addGenerated: async (clientId: string, serverId: string) => {
      state.markImageCompleted(clientId, serverId);
      await utils.output.getAll.invalidate();
    },
    addError: (clientId: string, error: string) => {
      state.addImageError(clientId, error);
    },
    removeGenerating: (clientId: string) => {
      state.removeImage(clientId);
    },

    // Video operations
    addGeneratingVideo: (params: { clientId: string; prompt: string; model: string }) => {
      state.addGeneratingVideo(params);
    },
    startPollingVideo: (clientId: string, jobId: string) => {
      state.startVideoProcessing(clientId, jobId);
    },
    updateVideoProgress: (jobId: string, _status: string, progress: number) => {
      state.updateVideoProgress(jobId, progress);
    },
    addVideoCompleted: async (clientId: string, _jobId: string) => {
      state.removeVideo(clientId);
      await utils.video.list.invalidate();
    },
    addVideoError: (clientId: string, error: string) => {
      state.addVideoError(clientId, error);
    },
    removeGeneratingVideo: (clientId: string) => {
      state.removeVideo(clientId);
    },
    processingVideos: state.getProcessingVideos().map((v) => ({
      clientId: v.clientId,
      jobId: v.jobId,
      status: "processing" as const,
      progress: v.progress,
      prompt: v.prompt,
      model: v.model,
      timestamp: v.timestamp,
    })),

    // Pagination
    loadMore: data.loadMore,
    hasMore: data.hasMore,
    isLoadingMore: data.isLoadingMore,
  };
}
