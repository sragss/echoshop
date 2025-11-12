"use client";

import { useEffect } from "react";
import { api } from "@/trpc/react";
import { useGallery } from "@/contexts/gallery-context";
import type { ProcessingVideoItem } from "@/types/generation";

/**
 * Component that polls a single video job for status updates
 * Updates GalleryContext when status changes
 */
function VideoPoller({ video }: { video: ProcessingVideoItem }) {
  const { addVideoCompleted, addVideoError, updateVideoProgress } = useGallery();

  const { data, error } = api.video.getStatus.useQuery(
    { jobId: video.jobId },
    {
      // Poll every 2 seconds
      refetchInterval: (query) => {
        // Stop polling if completed or failed
        const queryData = query.state.data;
        if (queryData?.status === "completed" || queryData?.status === "failed") {
          return false;
        }
        return 2000;
      },
      // Retry on error
      retry: 3,
    }
  );

  useEffect(() => {
    if (!data) return;

    if (data.status === "completed") {
      // Video is complete, move to completed state
      addVideoCompleted(video.clientId, video.jobId);
    } else if (data.status === "failed" || data.status === "cancelled") {
      // Video failed or was cancelled
      addVideoError(video.clientId, data.errorMessage || "Video generation failed");
    } else if (data.status === "processing" || data.status === "pending") {
      // Update progress
      updateVideoProgress(video.jobId, data.status, data.progress);
    }
    // Only depend on the actual values, not the callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status, data?.progress, data?.errorMessage, video.clientId, video.jobId]);

  useEffect(() => {
    if (error) {
      console.error(`Error polling video ${video.jobId}:`, error);
      addVideoError(video.clientId, "Failed to poll video status");
    }
  }, [error, video.clientId, video.jobId, addVideoError]);

  return null;
}

/**
 * Manager component that creates a VideoPoller for each processing video
 * Should be mounted inside GalleryProvider
 */
export function VideoPollingManager() {
  const { processingVideos } = useGallery();

  return (
    <>
      {processingVideos.map((video) => (
        <VideoPoller key={video.jobId} video={video} />
      ))}
    </>
  );
}
