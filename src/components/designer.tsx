"use client";

import { PromptBox } from '@/components/prompt-box';
import {
  type PromptInputMessage,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input';
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUpload } from '@/hooks/use-upload';
import { modelCategories } from '@/config/models';
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { jobSettingsSchema, type JobSettings } from "@/lib/schema";
import type { Prisma } from "@/../../generated/prisma";

interface DesignerProps {
  onAuthRequired: () => void;
}

export function Designer({ onAuthRequired }: DesignerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, string>>(new Map());
  const [selectedModel, setSelectedModel] = useState<string>(modelCategories[0]?.models[0]?.id ?? "nano-banana");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  const { uploadFile, uploadProgress, isAnyUploading } = useUpload();
  const controller = usePromptInputController();
  const utils = api.useUtils();

  const jobCreate = api.job.create.useMutation({
    onSuccess: (data, variables) => {
      // Optimistically add the new job to the cache immediately
      utils.job.list.setData({ limit: 50 }, (oldData) => {
        if (!oldData) return oldData;

        // Create optimistic job entry matching the exact return type
        // Use Zod to ensure the input is properly validated and typed
        const parsedInput = jobSettingsSchema.parse(variables);
        const newJob: typeof oldData[0] = {
          id: data.jobId,
          type: variables.type,
          input: parsedInput as Prisma.JsonValue, // Zod-validated input is safe to use as JsonValue
          status: 'pending',
          progress: 0,
          result: undefined,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add to beginning of list
        return [newJob, ...oldData];
      });

      // Background refetch to ensure consistency
      void utils.job.list.invalidate();
    },
    onError: (error) => {
      console.error("Job creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create job";
      toast.error(errorMessage);
    },
  });

  // Handle newly added files
  const handleFilesAdded = async (newFiles: Array<{ id: string; url: string; filename?: string; mediaType?: string }>) => {
    // Define allowed image types (must match API route validation)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    // Filter out unsupported file types immediately
    const validFiles: typeof newFiles = [];
    for (const fileData of newFiles) {
      const mediaType = fileData.mediaType?.toLowerCase() ?? '';

      if (!allowedTypes.includes(mediaType)) {
        console.warn(`File type not supported: ${mediaType}. Removing attachment.`);
        controller.attachments.remove(fileData.id);
        continue;
      }

      validFiles.push(fileData);
    }

    // Only upload if user is authenticated
    if (!session?.user) {
      onAuthRequired();
      // Remove the files if not authenticated
      validFiles.forEach(file => controller.attachments.remove(file.id));
      return;
    }

    // Upload each valid file
    for (const fileData of validFiles) {
      // Skip if already uploaded or uploading
      if (uploadedFiles.has(fileData.id) || uploadProgress.has(fileData.id)) {
        continue;
      }

      // Check if this is a pre-uploaded Vercel Blob URL (starts with https://)
      // If so, skip upload and use it directly
      if (fileData.url.startsWith('https://')) {
        setUploadedFiles((prev) => {
          const next = new Map(prev);
          next.set(fileData.id, fileData.url);
          return next;
        });
        continue;
      }

      try {
        // Convert blob URL back to File object for upload
        const response = await fetch(fileData.url);
        const blob = await response.blob();
        const file = new File([blob], fileData.filename ?? 'file', {
          type: fileData.mediaType ?? 'application/octet-stream',
        });

        const result = await uploadFile(file, fileData.id);

        // Store the blob URL - this is what we'll pass to the API
        setUploadedFiles((prev) => {
          const next = new Map(prev);
          next.set(fileData.id, result.url);
          return next;
        });
      } catch (error) {
        console.error('Upload failed:', error);
        // Remove failed uploads
        controller.attachments.remove(fileData.id);
      }
    }
  };

  const handleSubmit = async (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasFiles = Boolean(message.files?.length);

    if (!(hasText || hasFiles)) {
      return;
    }

    // Check if user is authenticated
    if (!session?.user) {
      onAuthRequired();
      return;
    }

    // Prevent submission while files are uploading
    if (isAnyUploading) {
      console.log("Cannot submit: files are still uploading");
      return;
    }

    const prompt = message.text || "";

    // Get uploaded image URLs
    const attachmentIds = controller.attachments.files.map((f) => f.id);
    const imageUrls = attachmentIds
      .map((id) => uploadedFiles.get(id))
      .filter((url): url is string => Boolean(url));

    const isEdit = imageUrls.length > 0;

    // Build job settings based on model and operation
    let jobSettings: JobSettings;

    if (selectedModel === "sora-2") {
      // Video generation
      jobSettings = {
        type: "sora-2-video",
        model: "sora-2",
        prompt,
        seconds: "4",
        ...(imageUrls[0] && { input_reference: imageUrls[0] }),
      };
    } else if (selectedModel === "gpt-image-1") {
      // GPT image generation or edit
      if (isEdit) {
        jobSettings = {
          type: "gpt-image-1-edit",
          model: "gpt-image-1",
          prompt,
          images: imageUrls,
          quality: "high",
        };
      } else {
        jobSettings = {
          type: "gpt-image-1-generate",
          model: "gpt-image-1",
          prompt,
          quality: "high",
        };
      }
    } else {
      // Nano banana generation or edit
      if (isEdit) {
        jobSettings = {
          type: "nano-banana-edit",
          model: "nano-banana",
          prompt,
          images: imageUrls,
          aspectRatio: "16:9",
        };
      } else {
        jobSettings = {
          type: "nano-banana-generate",
          model: "nano-banana",
          prompt,
          aspectRatio: "16:9",
        };
      }
    }

    // Create the job
    await jobCreate.mutateAsync(jobSettings);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
  };

  const handleClear = () => {
    setUploadedFiles(new Map());
  };

  return (
    <div className="w-full max-w-2xl">
      <PromptBox
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        onSubmit={handleSubmit}
        textareaRef={textareaRef}
        onFilesAdded={handleFilesAdded}
        uploadProgress={uploadProgress}
        isUploading={isAnyUploading}
        onClear={handleClear}
      />
    </div>
  );
}
