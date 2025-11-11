"use client";

import { api } from "@/trpc/react";
import Image from "next/image";

export function Gallery() {
  const { data: outputs, isLoading } = api.output.getAll.useQuery();

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Your Generations</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!outputs || outputs.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-4">Your Generations</h2>
        <div className="text-gray-500">No generations yet. Create your first image above!</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold mb-4">Your Generations</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {outputs.map((output) => {
          const input = output.input as { prompt?: string; model?: string; operation?: string };

          return (
            <div key={output.id} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square relative">
                <Image
                  src={output.outputUrl}
                  alt={input.prompt || "Generated image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                />
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                  {input.prompt || "No prompt"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="capitalize">{input.operation || "generate"}</span>
                  <span>{input.model || "nano-banana"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
