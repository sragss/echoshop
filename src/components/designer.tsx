"use client";

import { PromptBox } from '@/components/prompt-box';
import {
  type PromptInputMessage,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input';
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUpload } from '@/hooks/use-upload';
import { useGallery } from "@/contexts/gallery-context";
import { modelCategories } from '@/config/models';
import { toast } from "sonner";

interface DesignerProps {
  onAuthRequired: () => void;
}

export function Designer({ onAuthRequired }: DesignerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, string>>(new Map());
  const [selectedModel, setSelectedModel] = useState(modelCategories[0]?.models[0]?.id ?? "nano-banana");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  const { uploadFile, uploadProgress, isAnyUploading } = useUpload();
  const controller = usePromptInputController();
  const { addGenerating, addGenerated, addError } = useGallery();

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

    // Only support nano-banana for now
    if (selectedModel !== "nano-banana") {
      toast.error("Only nano-banana model is supported at this time");
      return;
    }

    // Get uploaded blob URLs from the attachments controller
    const attachmentIds = controller.attachments.files.map((f) => f.id);
    const imageUrls = attachmentIds
      .map((id) => uploadedFiles.get(id))
      .filter((url): url is string => Boolean(url));

    // Determine which endpoint to use
    const isEdit = imageUrls.length > 0;
    const endpoint = isEdit ? "/api/echo/edit-image" : "/api/echo/generate-image";
    const operation = isEdit ? "edit" : "generate";

    // 1. Generate client ID and add to generating
    const clientId = crypto.randomUUID();

    addGenerating({
      clientId,
      prompt: message.text || "",
      model: selectedModel,
      operation,
      timestamp: new Date(),
    });

    try {
      // 2. Call API and await response
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: message.text,
          ...(isEdit && { images: imageUrls }),
        }),
      });

      if (!response.ok) {
        const error: { error?: string } = await response.json() as { error?: string };
        throw new Error(error.error ?? "Image operation failed");
      }

      const result = await response.json() as { id: string; url: string };

      // 3. Add to generated (context will invalidate tRPC)
      void addGenerated(clientId, result.id);
    } catch (error) {
      console.error("Image operation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to process image";
      toast.error(errorMessage);
      // Add to error state
      addError(clientId, errorMessage);
    }
  };

  const handleClear = () => {
    setUploadedFiles(new Map());
  };

  return (
    <div className="w-full max-w-2xl">
      <PromptBox
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
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
