"use client";

import { GalleryItem } from "./gallery-item";
import { api } from "@/trpc/react";

export function Gallery() {
  const { data: jobs, isLoading } = api.job.list.useQuery({ limit: 50 });

  if (isLoading || !jobs) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent results</h3>
            <p className="text-sm text-slate-500">Your latest generations will appear here.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-8 text-center shadow-[0_18px_70px_-50px_rgba(15,23,42,0.6)]">
          <h3 className="text-lg font-semibold text-slate-900">No generations yet</h3>
          <p className="text-sm text-slate-500 mt-2">Create your first image above to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Recent results</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <GalleryItem key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
