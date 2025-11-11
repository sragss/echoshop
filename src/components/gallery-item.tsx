"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { XCircle } from "lucide-react";
import type { GalleryItemData } from "@/types/generation";
import type { OutputMetadata } from "@/lib/generation-schema";
import { useGallery } from "@/contexts/gallery-context";

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
 * - Completed: Image from database
 */
export function GalleryItem({ data }: { data: GalleryItemData }) {
  const { removeGenerating } = useGallery();

  if (data.type === "loading") {
    // Render loading state
    return (
      <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="aspect-square relative">
          <div className="flex flex-col items-center justify-center h-full space-y-2 p-4 bg-gray-100 animate-pulse">
            <LoadingTimer startTime={data.item.timestamp} />
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm text-gray-700 line-clamp-2 mb-1">
            {data.item.prompt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="capitalize">{data.item.operation}</span>
            <span>{data.item.model}</span>
          </div>
        </div>
      </div>
    );
  }

  if (data.type === "error") {
    // Render error state
    return (
      <div className="group relative overflow-hidden rounded-lg border-2 border-red-300 bg-white shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="aspect-square relative">
          <div className="flex flex-col items-center justify-center h-full space-y-2 p-4 bg-red-50">
            <XCircle className="h-16 w-16 text-red-400" />
            <p className="text-xs text-red-600 text-center px-2">
              {data.error}
            </p>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm text-gray-700 line-clamp-2 mb-1">
            {data.item.prompt}
          </p>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <span className="capitalize">{data.item.operation}</span>
              <span>•</span>
              <span>{data.item.model}</span>
            </div>
            <button
              onClick={() => removeGenerating(data.item.clientId)}
              className="text-red-600 hover:text-red-700 font-medium"
              title="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render completed image
  const output = data.output;
  const metadata = output.input as OutputMetadata;
  const prompt = metadata.prompt;
  const model = metadata.model;
  const operation = metadata.operation;

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-square relative">
        <Image
          src={output.outputUrl}
          alt={prompt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      </div>
      <div className="p-3">
        <p className="text-sm text-gray-700 line-clamp-2 mb-1">
          {prompt}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="capitalize">{operation}</span>
          <span>{model}</span>
        </div>
      </div>
    </div>
  );
}
