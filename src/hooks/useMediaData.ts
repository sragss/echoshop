import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";

/**
 * Data fetching hook for media items
 * Handles tRPC queries for images and videos
 * Separated from state management for clear concerns
 */
export function useMediaData() {
  const { data: session } = useSession();

  // ============================================
  // Image Data Fetching
  // ============================================

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

  // Flatten paginated results
  const loadedImages = imageData?.pages.flatMap((page) => page.items) ?? null;

  // ============================================
  // Video Data Fetching
  // ============================================

  const {
    data: videoData,
    isLoading: isLoadingVideos,
  } = api.video.list.useQuery(
    { limit: 50 },
    {
      enabled: !!session?.user,
    }
  );

  const loadedVideos = videoData ?? null;

  // Note: video.list doesn't support pagination yet
  // When it does, add fetchNextVideoPage, hasNextVideoPage, etc.
  const fetchNextVideoPage = () => {};
  const hasNextVideoPage = false;
  const isFetchingNextVideoPage = false;

  // ============================================
  // Combined Loading States
  // ============================================

  const isLoading = isLoadingImages || isLoadingVideos;
  const hasMore = (hasNextImagePage ?? false) || (hasNextVideoPage ?? false);
  const isLoadingMore = isFetchingNextImagePage || isFetchingNextVideoPage;

  const loadMore = () => {
    if (hasNextImagePage && !isFetchingNextImagePage) {
      void fetchNextImagePage();
    }
    if (hasNextVideoPage && !isFetchingNextVideoPage) {
      void fetchNextVideoPage();
    }
  };

  return {
    // Image data
    loadedImages,
    isLoadingImages,

    // Video data
    loadedVideos,
    isLoadingVideos,

    // Combined states
    isLoading,
    hasMore,
    isLoadingMore,
    loadMore,
  };
}
