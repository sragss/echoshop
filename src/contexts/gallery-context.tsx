"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import type { GeneratingItem, GeneratedItem, GalleryItemData } from "@/types/generation";

interface ErrorItem {
  item: GeneratingItem;
  error: string;
}

interface GalleryContextValue {
  items: GalleryItemData[];
  isLoading: boolean;
  addGenerating: (item: GeneratingItem) => void;
  addGenerated: (clientId: string, serverId: string) => void;
  addError: (clientId: string, error: string) => void;
  removeGenerating: (clientId: string) => void;
  loadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [generating, setGenerating] = useState<GeneratingItem[]>([]);
  const [generated, setGenerated] = useState<GeneratedItem[]>([]);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const { data: session } = useSession();
  const utils = api.useUtils();

  // Subscribe to loaded outputs from tRPC with pagination - only if authenticated
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.output.getAll.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!session?.user, // Only fetch if user is authenticated
    }
  );

  // Flatten all pages into a single array
  const loaded = data?.pages.flatMap((page) => page.items) ?? null;

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
    // Find the generating item and move it to errors
    setGenerating((prev) => {
      const item = prev.find((gen) => gen.clientId === clientId);
      if (item) {
        setErrors((prevErrors) => [...prevErrors, { item, error }]);
      }
      return prev.filter((gen) => gen.clientId !== clientId);
    });
  }, []);

  const removeGenerating = useCallback((clientId: string) => {
    setGenerating((prev) => prev.filter((item) => item.clientId !== clientId));
    setErrors((prev) => prev.filter((err) => err.item.clientId !== clientId));
  }, []);

  // Auto-cleanup: Remove items from state arrays once they appear in loaded data
  useEffect(() => {
    if (!loaded || loaded.length === 0) return;

    const loadedIds = new Set(loaded.map((o) => o.id));

    // Find which client IDs are now loaded
    const loadedClientIds = new Set(
      generated.filter((g) => loadedIds.has(g.serverId)).map((g) => g.clientId)
    );

    // Clean up state arrays
    if (loadedClientIds.size > 0) {
      setGenerating((prev) => prev.filter((gen) => !loadedClientIds.has(gen.clientId)));
      setGenerated((prev) => prev.filter((g) => !loadedIds.has(g.serverId)));
    }
  }, [loaded, generated]);

  // Compute final display items (pure computation, no side effects)
  const items = useMemo(() => {
    if (!loaded) {
      // Show all generating items while waiting for initial load
      return [
        ...generating.map((item) => ({
          type: "loading" as const,
          item,
        })),
        ...errors.map(({ item, error }) => ({
          type: "error" as const,
          item,
          error,
        })),
      ];
    }

    const loadedIds = new Set(loaded.map((o) => o.id));

    // Find which client IDs are now loaded
    const loadedClientIds = new Set(
      generated.filter((g) => loadedIds.has(g.serverId)).map((g) => g.clientId)
    );

    // Filter to items still loading
    const stillLoading = generating.filter((gen) => !loadedClientIds.has(gen.clientId));

    // Combine: errors (first) + stillLoading (skeletons) + loaded (real images)
    return [
      ...errors.map(({ item, error }) => ({
        type: "error" as const,
        item,
        error,
      })),
      ...stillLoading.map((item) => ({
        type: "loading" as const,
        item,
      })),
      ...loaded.map((output) => ({
        type: "completed" as const,
        output,
      })),
    ];
  }, [generating, generated, loaded, errors]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const contextValue = {
    items,
    isLoading,
    addGenerating,
    addGenerated: (clientId: string, serverId: string) => void addGenerated(clientId, serverId),
    addError,
    removeGenerating,
    loadMore,
    hasMore: hasNextPage ?? false,
    isLoadingMore: isFetchingNextPage,
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
