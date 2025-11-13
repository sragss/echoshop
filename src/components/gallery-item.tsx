"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { XCircle, Copy, Plus, Download } from "lucide-react";
import { nanoid } from "nanoid";
import { usePromptInputAttachments } from "@/components/ai-elements/prompt-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { jobSettingsSchema, type ImageResult, type VideoResult, type JobSettings } from "@/lib/schema";

type JobWithResult = {
  id: string;
  type: string;
  input: unknown; // Prisma JsonValue
  status: string;
  progress: number;
  result: unknown; // Prisma JsonValue
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

interface GalleryItemProps {
  job: JobWithResult;
}

// Helper to safely parse job input using Zod discriminated union
function getJobInput(input: unknown): JobSettings | null {
  const result = jobSettingsSchema.safeParse(input);
  return result.success ? result.data : null;
}

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

// Helper to determine if a job type produces an image
const isImageJob = (type: string): boolean => {
  return type === "gpt-image-1-generate" ||
         type === "gpt-image-1-edit" ||
         type === "nano-banana-generate" ||
         type === "nano-banana-edit";
};

// Helper to determine if a job type produces a video
const isVideoJob = (type: string): boolean => {
  return type === "sora-2-video";
};

const CARD_CLASSES = "aspect-square relative overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500";

export function GalleryItem({ job: initialJob }: GalleryItemProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const attachments = usePromptInputAttachments();
  const utils = api.useUtils();

  // Self-poll if job is not complete
  const { data: liveJob } = api.job.getStatus.useQuery(
    { jobId: initialJob.id },
    {
      enabled: initialJob.status === "loading" || initialJob.status === "pending",
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === "complete" || status === "failed" ? false : 2000;
      },
    }
  );

  // Use live data if available, otherwise use initial data
  const job = liveJob ?? initialJob;

  // Load actual image dimensions from blob store when dialog opens
  useEffect(() => {
    if (!dialogOpen) {
      setImageDimensions(null);
      return;
    }

    const imageResult = job.result as ImageResult;
    if (!isImageJob(job.type) || !imageResult?.imageUrl) return;

    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = imageResult.imageUrl;
  }, [dialogOpen, job.result, job.type]);

  // Invalidate list when job completes
  useEffect(() => {
    if (job.status === "complete" || job.status === "failed") {
      void utils.job.list.invalidate();
    }
  }, [job.status, utils.job.list]);

  // Loading state
  if (job.status === "pending" || job.status === "loading") {
    // Show progress percentage only for video jobs (when progress > 0)
    if (isVideoJob(job.type)) {
      return (
        <div className={CARD_CLASSES}>
          <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-50 animate-pulse">
            {job.progress > 0 && (
              <p className="text-xs text-gray-500 font-mono mb-1">{job.progress}%</p>
            )}
            <LoadingTimer startTime={job.createdAt} />
          </div>
        </div>
      );
    }

    // For image jobs, just show a pulse animation
    return (
      <div className={CARD_CLASSES}>
        <div className="flex items-center justify-center h-full bg-gray-100 animate-pulse">
          <LoadingTimer startTime={job.createdAt} />
        </div>
      </div>
    );
  }

  // Error state
  if (job.status === "failed") {
    return (
      <div className="aspect-square relative overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
          <XCircle className="h-10 w-10 text-gray-400 mb-3 flex-shrink-0" />
          <p className="text-xs text-gray-500 text-center leading-relaxed break-words overflow-hidden max-w-full">
            {job.error ?? "Generation failed"}
          </p>
        </div>
      </div>
    );
  }

  // No result yet (shouldn't happen if status is complete, but defensive)
  if (!job.result) {
    return (
      <div className={CARD_CLASSES}>
        <div className="flex items-center justify-center h-full bg-gray-100">
          <p className="text-sm text-gray-500">No result</p>
        </div>
      </div>
    );
  }

  // Completed - render based on output type
  if (isImageJob(job.type)) {
    const imageResult = job.result as ImageResult;

    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const response = await fetch(imageResult.imageUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
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
      attachments.addPreUploaded(id, imageResult.imageUrl, "image/jpeg", "gallery-image.jpg");
    };

    const handleDownload = async () => {
      try {
        const response = await fetch(imageResult.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `generated-image-${job.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Image downloaded");
      } catch (error) {
        console.error("Failed to download image:", error);
        toast.error("Failed to download image");
      }
    };

    return (
      <>
        <div className={`${CARD_CLASSES} group cursor-pointer`}>
          <button onClick={() => setDialogOpen(true)} className="w-full h-full">
            <Image
              src={imageResult.imageUrl}
              alt="Generated image"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            />
          </button>
          <div className="absolute inset-0 bg-black/0 md:group-hover:bg-black/40 transition-colors duration-200 pointer-events-none" />
          <div className="absolute bottom-2 left-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
            <Button
              onClick={handleDownload}
              size="icon-sm"
              variant="outline"
              className="pointer-events-auto shadow-lg"
              title="Download image"
            >
              <Download />
            </Button>
          </div>
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
            <div className="relative w-full">
              {imageDimensions ? (
                <Image
                  src={imageResult.imageUrl}
                  alt="Generated image"
                  width={imageDimensions.width}
                  height={imageDimensions.height}
                  className="w-full h-auto"
                  unoptimized
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 animate-pulse" />
              )}
              {imageDimensions && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
                  {imageDimensions.width}×{imageDimensions.height}
                </div>
              )}
            </div>
            <div className="p-4 space-y-2">
              {(() => {
                const input = getJobInput(job.input);
                const images = input && 'images' in input ? input.images : undefined;
                return (
                  <>
                    <p className="text-sm text-gray-900">{input?.prompt ?? "No prompt"}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{input?.model ?? job.type}</span>
                      {images && (
                        <>
                          <span>•</span>
                          <span>Edit with {images.length} reference image{images.length > 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                    {images && images.length > 0 && (
                      <div className="flex gap-2 flex-wrap pt-2">
                        {images.map((url: string, idx: number) => (
                          <div key={idx} className="relative w-20 h-20 rounded border border-gray-200 overflow-hidden">
                            <Image
                              src={url}
                              alt={`Input ${idx + 1}`}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isVideoJob(job.type)) {
    const videoResult = job.result as VideoResult;

    return (
      <>
        <div className={`${CARD_CLASSES} group cursor-pointer`}>
          <button onClick={() => setDialogOpen(true)} className="w-full h-full relative">
            {videoResult.thumbnailUrl && (
              <Image
                src={videoResult.thumbnailUrl}
                alt="Video thumbnail"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
            )}
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
            {videoResult.videoUrl && (
              <div className="relative w-full">
                <video
                  src={videoResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-auto"
                  poster={videoResult.thumbnailUrl || undefined}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            <div className="p-4 space-y-2">
              {(() => {
                const input = getJobInput(job.input);
                const seconds = input && 'seconds' in input ? input.seconds : undefined;
                const size = input && 'size' in input ? input.size : undefined;
                return (
                  <>
                    <p className="text-sm text-gray-900">{input?.prompt ?? "No prompt"}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>{input?.model ?? job.type}</span>
                      {seconds && (
                        <>
                          <span>•</span>
                          <span>{seconds}s</span>
                        </>
                      )}
                      {size && (
                        <>
                          <span>•</span>
                          <span>{size}</span>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Unknown job type
  return (
    <div className={CARD_CLASSES}>
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-sm text-gray-500">Unknown type: {job.type}</p>
      </div>
    </div>
  );
}
