"use client";

import { GalleryItem } from "./gallery-item";
import { useGallery } from "@/contexts/gallery-context";
import { Button } from "@/components/ui/button";

export function Gallery() {
  const { items, isLoading, loadMore, hasMore, isLoadingMore } = useGallery();

  if (isLoading && items.length === 0) {
    return null;
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

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outline"
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
