"use client";

import { GalleryItem } from "./gallery-item";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";

export function Gallery() {
  const { data: jobs, isLoading } = api.job.list.useQuery({ limit: 50 });

  if (isLoading || !jobs) {
    return null;
  }

  if (jobs.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8">
        <div className="text-gray-500">No generations yet. Create your first image above!</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <GalleryItem key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
