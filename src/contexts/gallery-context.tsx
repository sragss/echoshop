"use client";

import { createContext, useContext } from "react";
import { useMediaGallery } from "@/hooks/useMediaGallery";
import type { GalleryItemData, GeneratingItem, ProcessingVideoItem } from "@/types/generation";

/**
 * Gallery context value - thin wrapper around useMediaGallery hook
 */
interface GalleryContextValue {
  items: GalleryItemData[];
  isLoading: boolean;
  // Image methods
  addGenerating: (item: GeneratingItem) => void;
  addGenerated: (clientId: string, serverId: string) => void;
  addError: (clientId: string, error: string) => void;
  removeGenerating: (clientId: string) => void;
  // Video methods
  addGeneratingVideo: (item: { clientId: string; prompt: string; model: string; operation: "generate"; timestamp: Date }) => void;
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

/**
 * Provider that wraps useMediaGallery hook
 * All logic lives in the hook - this is just the React Context wrapper
 */
export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const gallery = useMediaGallery();

  return (
    <GalleryContext.Provider value={gallery}>
      {children}
    </GalleryContext.Provider>
  );
}

/**
 * Hook to access gallery context
 */
export function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) {
    throw new Error("useGallery must be used within GalleryProvider");
  }
  return ctx;
}
