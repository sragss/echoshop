import { useState, useCallback } from "react";
import type { MediaStateItem, ImageStateItem, VideoStateItem } from "@/types/media-state";

/**
 * Pure state management hook for media items (images + videos)
 * No data fetching - just local state transformations
 * Uses discriminated unions for atomic state transitions
 */
export function useMediaState() {
  const [items, setItems] = useState<MediaStateItem[]>([]);

  // ============================================
  // Image Operations
  // ============================================

  const addGeneratingImage = useCallback(
    (params: { clientId: string; prompt: string; model: string; operation: "generate" | "edit" }) => {
      setItems((prev) => [
        {
          mediaType: "image" as const,
          state: "generating" as const,
          clientId: params.clientId,
          prompt: params.prompt,
          model: params.model,
          operation: params.operation,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    },
    []
  );

  const markImageCompleted = useCallback((clientId: string, serverId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.mediaType === "image" && item.clientId === clientId
          ? { ...item, state: "completed" as const, serverId }
          : item
      )
    );
  }, []);

  const addImageError = useCallback((clientId: string, error: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.mediaType === "image" && item.clientId === clientId && item.state !== "completed"
          ? { ...item, state: "error" as const, error }
          : item
      )
    );
  }, []);

  const removeImage = useCallback((clientId: string) => {
    setItems((prev) => prev.filter((item) => !(item.mediaType === "image" && item.clientId === clientId)));
  }, []);

  // ============================================
  // Video Operations
  // ============================================

  const addGeneratingVideo = useCallback(
    (params: { clientId: string; prompt: string; model: string }) => {
      setItems((prev) => [
        {
          mediaType: "video" as const,
          state: "generating" as const,
          clientId: params.clientId,
          prompt: params.prompt,
          model: params.model,
          operation: "generate" as const,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    },
    []
  );

  const startVideoProcessing = useCallback((clientId: string, jobId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.mediaType === "video" && item.state === "generating" && item.clientId === clientId
          ? {
              ...item,
              state: "processing" as const,
              jobId,
              progress: 10,
            }
          : item
      )
    );
  }, []);

  const updateVideoProgress = useCallback((jobId: string, progress: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.mediaType === "video" && item.state === "processing" && item.jobId === jobId
          ? { ...item, progress }
          : item
      )
    );
  }, []);

  const removeVideo = useCallback((clientId: string) => {
    setItems((prev) => prev.filter((item) => !(item.mediaType === "video" && item.clientId === clientId)));
  }, []);

  const addVideoError = useCallback((clientId: string, error: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.mediaType === "video" && item.clientId === clientId && item.state !== "error") {
          return {
            mediaType: "video" as const,
            state: "error" as const,
            clientId: item.clientId,
            prompt: item.prompt,
            model: item.model,
            operation: "generate" as const,
            timestamp: item.timestamp,
            error,
          };
        }
        return item;
      })
    );
  }, []);

  // ============================================
  // Selectors
  // ============================================

  const getImageItems = useCallback((): ImageStateItem[] => {
    return items.filter((item): item is ImageStateItem => item.mediaType === "image");
  }, [items]);

  const getVideoItems = useCallback((): VideoStateItem[] => {
    return items.filter((item): item is VideoStateItem => item.mediaType === "video");
  }, [items]);

  const getProcessingVideos = useCallback(() => {
    return items.filter(
      (item): item is Extract<VideoStateItem, { state: "processing" }> =>
        item.mediaType === "video" && item.state === "processing"
    );
  }, [items]);

  return {
    // State
    items,

    // Image operations
    addGeneratingImage,
    markImageCompleted,
    addImageError,
    removeImage,

    // Video operations
    addGeneratingVideo,
    startVideoProcessing,
    updateVideoProgress,
    removeVideo,
    addVideoError,

    // Selectors
    getImageItems,
    getVideoItems,
    getProcessingVideos,
  };
}
