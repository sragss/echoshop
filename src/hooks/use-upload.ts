"use client";

import { upload } from '@vercel/blob/client';
import { useState, useCallback } from 'react';

export interface UploadProgress {
  progress: number; // 0-100
  isUploading: boolean;
}

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
}

export function useUpload() {
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());

  const uploadFile = useCallback(async (file: File, fileId: string): Promise<UploadResult> => {
    // Set initial progress
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.set(fileId, { progress: 0, isUploading: true });
      return next;
    });

    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/uploads',
        onUploadProgress: ({ loaded, total }) => {
          if (total) {
            const percentage = Math.round((loaded / total) * 100);
            setUploadProgress((prev) => {
              const next = new Map(prev);
              next.set(fileId, { progress: percentage, isUploading: percentage < 100 });
              return next;
            });
          }
        },
      });

      // Mark as complete
      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.set(fileId, { progress: 100, isUploading: false });
        return next;
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
      };
    } catch (error) {
      // Mark as failed
      setUploadProgress((prev) => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
      throw error;
    }
  }, []);

  const clearProgress = useCallback((fileId: string) => {
    setUploadProgress((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  const isAnyUploading = Array.from(uploadProgress.values()).some((p) => p.isUploading);

  return {
    uploadFile,
    uploadProgress,
    clearProgress,
    isAnyUploading,
  };
}
