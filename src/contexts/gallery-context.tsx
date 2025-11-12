"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import type { GeneratingItem, GeneratedItem, GalleryItemData, GeneratingVideoItem, ProcessingVideoItem, VideoItem } from "@/types/generation";

interface ErrorItem {
  item: GeneratingItem;
  error: string;
}

interface GalleryContextValue {
  items: GalleryItemData[];
  isLoading: boolean;
  // Image methods
  addGenerating: (item: GeneratingItem) => void;
  addGenerated: (clientId: string, serverId: string) => void;
  addError: (clientId: string, error: string) => void;
  removeGenerating: (clientId: string) => void;
  // Video methods
  addGeneratingVideo: (item: GeneratingVideoItem) => void;
  startPollingVideo: (clientId: string, jobId: string) => void;
  updateVideoProgress: (jobId: string, status: string, progress: number) => void;
  addVideoCompleted: (clientId: string, jobId: string) => void;
  addVideoError: (clientId: string, error: string) => void;
  removeGeneratingVideo: (clientId: string) => void;
  processingVideos: ProcessingVideoItem[];
  // Pagination
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  // Image state
  const [generating, setGenerating] = useState<GeneratingItem[]>([]);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);
  const [errors, setErrors] = useState<ErrorItem[]>([]);

  // Video state - single array with discriminated union
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);

  const { data: session } = useSession();
  const utils = api.useUtils();

  // Subscribe to loaded image outputs from tRPC with pagination
  const {
    data: imageData,
    isLoading: isLoadingImages,
    fetchNextPage: fetchNextImagePage,
    hasNextPage: hasNextImagePage,
    isFetchingNextPage: isFetchingNextImagePage,
  } = api.output.getAll.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!session?.user,
    }
  );

  // Subscribe to loaded video jobs from tRPC (NOT infinite query - video.list returns simple array)
  const {
    data: videoData,
    isLoading: isLoadingVideos,
  } = api.video.list.useQuery(
    { limit: 50 },
    {
      enabled: !!session?.user,
    }
  );

  // Flatten all pages into single arrays
  const loadedImages = imageData?.pages.flatMap((page) => page.items) ?? null;
  const loadedVideos = videoData ?? null;

  // Video pagination stubs (not implemented yet - video.list doesn't support pagination)
  const fetchNextVideoPage = () => {};
  const hasNextVideoPage = false;
  const isFetchingNextVideoPage = false;

  const isLoading = isLoadingImages || isLoadingVideos;

  const addGenerating = useCallback((item: GeneratingItem) => {
    setGenerating((prev) => [item, ...prev]);
  }, []);

  const addGenerated = useCallback(
    async (clientId: string, serverId: string) => {
      // Add to generated list
      setGenerated((prev) => [...prev, { clientId, serverId }]);

      // Invalidate tRPC to fetch new data (NOT Designer's job)
      await utils.output.getAll.invalidate();
    },
    [utils]
  );

  const addError = useCallback((clientId: string, error: string) => {
    // Find the generating item, add to errors, and remove from generating
    // Use two sequential setState calls to avoid race condition
    let foundItem: GeneratingItem | undefined;

    setGenerating((prev) => {
      foundItem = prev.find((gen) => gen.clientId === clientId);
      return prev.filter((gen) => gen.clientId !== clientId);
    });

    if (foundItem) {
      setErrors((prev) => [...prev, { item: foundItem!, error }]);
    }
  }, []);

  const removeGenerating = useCallback((clientId: string) => {
    setGenerating((prev) => prev.filter((item) => item.clientId !== clientId));
    setErrors((prev) => prev.filter((err) => err.item.clientId !== clientId));
  }, []);

  // Video methods - atomic updates with single array
  const addGeneratingVideo = useCallback((item: GeneratingVideoItem) => {
    setVideoItems((prev) => [
      {
        state: "generating" as const,
        clientId: item.clientId,
        prompt: item.prompt,
        model: item.model,
        timestamp: item.timestamp,
      },
      ...prev,
    ]);
  }, []);

  const startPollingVideo = useCallback((clientId: string, jobId: string) => {
    setVideoItems((prev) =>
      prev.map((item) =>
        item.state === "generating" && item.clientId === clientId
          ? {
              state: "processing" as const,
              clientId,
              jobId,
              progress: 10,
              prompt: item.prompt,
              model: item.model,
              timestamp: item.timestamp,
            }
          : item
      )
    );
  }, []);

  const updateVideoProgress = useCallback((jobId: string, status: string, progress: number) => {
    setVideoItems((prev) =>
      prev.map((item) =>
        item.state === "processing" && item.jobId === jobId
          ? { ...item, progress }
          : item
      )
    );
  }, []);

  const addVideoCompleted = useCallback(
    async (clientId: string, jobId: string) => {
      setVideoItems((prev) => prev.filter((v) => v.clientId !== clientId));
      await utils.video.list.invalidate();
    },
    [utils]
  );

  const addVideoError = useCallback((clientId: string, error: string) => {
    setVideoItems((prev) =>
      prev.map((item) =>
        item.clientId === clientId
          ? {
              state: "error" as const,
              clientId,
              prompt: item.prompt,
              model: item.model,
              timestamp: item.timestamp,
              error,
            }
          : item
      )
    );
  }, []);

  const removeGeneratingVideo = useCallback((clientId: string) => {
    setVideoItems((prev) => prev.filter((v) => v.clientId !== clientId));
  }, []);

  // Auto-cleanup: Remove image items from state arrays once they appear in loaded data
  useEffect(() => {
    if (!loadedImages || loadedImages.length === 0) return;

    const loadedIds = new Set(loadedImages.map((o) => o.id));
    const loadedClientIds = new Set(
      generated.filter((g) => loadedIds.has(g.serverId)).map((g) => g.clientId)
    );

    if (loadedClientIds.size > 0) {
      setGenerating((prev) => prev.filter((gen) => !loadedClientIds.has(gen.clientId)));
      setGenerated((prev) => prev.filter((g) => !loadedIds.has(g.serverId)));
    }
  }, [loadedImages, generated]);

  // Auto-cleanup: Remove video items from state once they appear in loaded data
  useEffect(() => {
    if (!loadedVideos || loadedVideos.length === 0) return;

    const loadedJobIds = new Set(loadedVideos.map((v) => v.id));
    setVideoItems((prev) =>
      prev.filter((v) => v.state !== "processing" || !loadedJobIds.has(v.jobId))
    );
  }, [loadedVideos]);

  // Compute final display items (pure computation, no side effects)
  const items = useMemo(() => {
    const result: GalleryItemData[] = [];

    // All errors first
    result.push(
      ...errors.map(({ item, error }) => ({
        type: "error" as const,
        item,
        error,
      }))
    );

    // Video items mapped from discriminated union
    videoItems.forEach((videoItem) => {
      if (videoItem.state === "generating") {
        result.push({
          type: "video-loading" as const,
          item: {
            clientId: videoItem.clientId,
            prompt: videoItem.prompt,
            model: videoItem.model,
            operation: "generate" as const,
            timestamp: videoItem.timestamp,
          },
        });
      } else if (videoItem.state === "processing") {
        result.push({
          type: "video-processing" as const,
          item: {
            clientId: videoItem.clientId,
            jobId: videoItem.jobId,
            status: "processing" as const,
            progress: videoItem.progress,
            prompt: videoItem.prompt,
            model: videoItem.model,
            timestamp: videoItem.timestamp,
          },
        });
      } else if (videoItem.state === "error") {
        result.push({
          type: "video-error" as const,
          item: {
            clientId: videoItem.clientId,
            prompt: videoItem.prompt,
            model: videoItem.model,
            operation: "generate" as const,
            timestamp: videoItem.timestamp,
          },
          error: videoItem.error,
        });
      }
    });

    // Images being generated
    if (!loadedImages) {
      result.push(
        ...generating.map((item) => ({
          type: "loading" as const,
          item,
        }))
      );
    } else {
      const loadedIds = new Set(loadedImages.map((o) => o.id));
      const loadedClientIds = new Set(
        generated.filter((g) => loadedIds.has(g.serverId)).map((g) => g.clientId)
      );
      const stillLoading = generating.filter((gen) => !loadedClientIds.has(gen.clientId));

      result.push(
        ...stillLoading.map((item) => ({
          type: "loading" as const,
          item,
        }))
      );

      // Merge completed images and videos by completion time
      const completedImages = loadedImages.map((output) => ({
        type: "completed" as const,
        output,
        completedAt: output.createdAt,
      }));

      const completedVideos = loadedVideos
        ? loadedVideos
            .filter((v) => v.status === "completed")
            .map((video) => ({
              type: "video-completed" as const,
              video,
              completedAt: video.updatedAt,
            }))
        : [];

      const allCompleted = [...completedImages, ...completedVideos].sort(
        (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
      );

      result.push(...allCompleted);
    }

    return result;
  }, [generating, generated, loadedImages, errors, videoItems, loadedVideos]);

  const loadMore = useCallback(() => {
    // Load more for both images and videos
    if (hasNextImagePage && !isFetchingNextImagePage) {
      void fetchNextImagePage();
    }
    if (hasNextVideoPage && !isFetchingNextVideoPage) {
      void fetchNextVideoPage();
    }
  }, [hasNextImagePage, isFetchingNextImagePage, fetchNextImagePage, hasNextVideoPage, isFetchingNextVideoPage, fetchNextVideoPage]);

  const contextValue: GalleryContextValue = {
    items,
    isLoading,
    // Image methods
    addGenerating,
    addGenerated: (clientId: string, serverId: string) => void addGenerated(clientId, serverId),
    addError,
    removeGenerating,
    // Video methods
    addGeneratingVideo,
    startPollingVideo,
    updateVideoProgress,
    addVideoCompleted: (clientId: string, jobId: string) => void addVideoCompleted(clientId, jobId),
    addVideoError,
    removeGeneratingVideo,
    processingVideos: videoItems.filter((v): v is Extract<VideoItem, { state: "processing" }> => v.state === "processing").map((v) => ({
      clientId: v.clientId,
      jobId: v.jobId,
      status: "processing" as const,
      progress: v.progress,
      prompt: v.prompt,
      model: v.model,
      timestamp: v.timestamp,
    })),
    // Pagination
    loadMore,
    hasMore: (hasNextImagePage ?? false) || (hasNextVideoPage ?? false),
    isLoadingMore: isFetchingNextImagePage || isFetchingNextVideoPage,
  };

  return (
    <GalleryContext.Provider value={contextValue}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) {
    throw new Error("useGallery must be used within GalleryProvider");
  }
  return ctx;
}
