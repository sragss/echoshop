"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { XCircle, Copy, Plus } from "lucide-react";
import { nanoid } from "nanoid";
import type { GalleryItemData } from "@/types/generation";
import type { OutputMetadata } from "@/lib/generation-schema";
import { useGallery } from "@/contexts/gallery-context";
import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Loading timer that shows elapsed time during generation
 */
function LoadingTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime.getTime()) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-xs text-gray-500 font-mono">
      {elapsed.toFixed(1)}s
    </div>
  );
}

/**
 * Gallery item that shows loading, error, or completed image state
 * - Loading: Loading skeleton with timer
 * - Error: Red border with error message and dismiss button
 * - Completed: Clickable image that opens detail dialog
 */
export function GalleryItem({ data }: { data: GalleryItemData }) {
  const { removeGenerating, removeGeneratingVideo } = useGallery();
  const attachments = usePromptInputAttachments();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Image loading state
  if (data.type === "loading") {
    return (
      <div className="aspect-square relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center justify-center h-full bg-gray-100 animate-pulse">
          <LoadingTimer startTime={data.item.timestamp} />
        </div>
      </div>
    );
  }

  // Image error state
  if (data.type === "error") {
    return (
      <div className="aspect-square relative overflow-hidden rounded-md border-2 border-red-300 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50">
          <XCircle className="h-12 w-12 text-red-400 mb-2" />
          <p className="text-xs text-red-600 text-center mb-2">
            {data.error}
          </p>
          <button
            onClick={() => removeGenerating(data.item.clientId)}
            className="text-xs text-red-600 hover:text-red-700 font-medium underline"
            title="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Video loading state (initial submission)
  if (data.type === "video-loading") {
    return (
      <div className="aspect-square relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center justify-center h-full bg-gray-100 animate-pulse">
          <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-gray-600">Submitting...</div>
            <LoadingTimer startTime={data.item.timestamp} />
          </div>
        </div>
      </div>
    );
  }

  // Video processing state (polling with progress)
  if (data.type === "video-processing") {
    return (
      <div className="aspect-square relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50">
          {/* Progress bar */}
          <div className="w-3/4 h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${data.item.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mb-1">{data.item.progress}%</p>
          <LoadingTimer startTime={data.item.timestamp} />
        </div>
      </div>
    );
  }

  // Video error state
  if (data.type === "video-error") {
    return (
      <div className="aspect-square relative overflow-hidden rounded-md border-2 border-red-300 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex flex-col items-center justify-center h-full p-4 bg-red-50">
          <XCircle className="h-12 w-12 text-red-400 mb-2" />
          <p className="text-xs text-red-600 text-center mb-2">
            {data.error}
          </p>
          <button
            onClick={() => removeGeneratingVideo(data.item.clientId)}
            className="text-xs text-red-600 hover:text-red-700 font-medium underline"
            title="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Video completed state
  if (data.type === "video-completed") {
    const video = data.video;

    return (
      <>
        <div className="aspect-square relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm group cursor-pointer">
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full h-full relative"
          >
            {/* Thumbnail as poster */}
            {video.thumbnailUrl && (
              <Image
                src={video.thumbnailUrl}
                alt="Video thumbnail"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
            )}

            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[20px] border-l-black border-y-[12px] border-y-transparent ml-1" />
              </div>
            </div>
          </button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            <DialogTitle className="sr-only">Video Details</DialogTitle>

            {/* Video player */}
            {video.videoUrl && (
              <div className="relative w-full">
                <video
                  src={video.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-auto"
                  poster={video.thumbnailUrl || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Metadata */}
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-900">
                {(video.input as { prompt?: string })?.prompt || "Video"}
              </p>

              <div className="flex gap-2 text-xs text-gray-500">
                <span>{(video.input as { model?: string })?.model || "video"}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Render completed image
  const output = data.output;
  const metadata = output.input as OutputMetadata;
  const inputImages = metadata.operation === "edit" ? metadata.images : [];

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Fetch the image as a blob
      const response = await fetch(output.outputUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      toast.success("Image copied to clipboard");
    } catch (error) {
      console.error("Failed to copy image:", error);
      toast.error("Failed to copy image");
    }
  };

  const handleAddToPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    const id = nanoid();
    attachments.addPreUploaded(id, output.outputUrl, "image/jpeg", "gallery-image.jpg");
  };

  return (
    <>
      <div className="aspect-square relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm group cursor-pointer">
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full h-full"
        >
          <Image
            src={output.outputUrl}
            alt={metadata.prompt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
          />
        </button>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/40 transition-colors duration-200 pointer-events-none" />
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={handleCopy}
            size="icon-sm"
            variant="outline"
            className="pointer-events-auto shadow-lg"
            title="Copy image"
          >
            <Copy />
          </Button>
          <Button
            onClick={handleAddToPrompt}
            size="icon-sm"
            variant="outline"
            className="pointer-events-auto shadow-lg"
            title="Add to prompt"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">Image Details</DialogTitle>

          {/* Full size image - edge to edge */}
          <div className="relative w-full">
            <Image
              src={output.outputUrl}
              alt={metadata.prompt}
              width={1024}
              height={1024}
              className="w-full h-auto"
            />
          </div>

          {/* Metadata - compact */}
          <div className="px-6 py-4 space-y-2">
            <p className="text-sm text-gray-900">{metadata.prompt}</p>

            <div className="flex gap-2 text-xs text-gray-500">
              <span className="capitalize">{metadata.operation}</span>
              <span>•</span>
              <span>{metadata.model}</span>
            </div>

            {/* Input images for edit operations - smaller */}
            {inputImages.length > 0 && (
              <div className="flex gap-2 pt-2">
                {inputImages.map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16">
                    <Image
                      src={url}
                      alt={`Input ${idx + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
