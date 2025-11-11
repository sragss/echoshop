"use client";

import { GalleryItem } from "./gallery-item";
import { useGallery } from "@/contexts/gallery-context";

export function Gallery() {
  const { items, isLoading } = useGallery();

  if (isLoading && items.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8">
        <div className="text-gray-500">No generations yet. Create your first image above!</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <GalleryItem
            key={item.type === "completed" ? item.output.id : item.item.clientId}
            data={item}
          />
        ))}
      </div>
    </div>
  );
}
