"use client";

import { PromptBox } from '@/components/prompt-box';
import {
  type PromptInputMessage,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input';
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUpload } from '@/hooks/use-upload';

interface DesignerProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onAuthRequired: () => void;
}

export function Designer({ selectedModel, onModelChange, onAuthRequired }: DesignerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, string>>(new Map());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();
  const { uploadFile, uploadProgress, isAnyUploading } = useUpload();
  const controller = usePromptInputController();

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
      alert("Only nano-banana model is supported at this time");
      return;
    }

    try {
      // Get uploaded blob URLs from the attachments controller
      // The message.files doesn't preserve IDs, so we need to get them from controller
      const attachmentIds = controller.attachments.files.map((f) => f.id);
      console.log("Attachment IDs from controller:", attachmentIds);
      console.log("Uploaded files map:", uploadedFiles);

      const imageUrls = attachmentIds
        .map((id) => uploadedFiles.get(id))
        .filter((url): url is string => Boolean(url));

      console.log("Final image URLs:", imageUrls);

      // Determine which endpoint to use
      const isEdit = imageUrls.length > 0;
      const endpoint = isEdit ? "/api/echo/edit-image" : "/api/echo/generate-image";

      console.log(`Using ${isEdit ? 'EDIT' : 'GENERATE'} endpoint:`, endpoint);
      console.log("Prompt:", message.text);
      if (isEdit) {
        console.log("Input image URLs:", imageUrls);
      }

      // Call the appropriate API
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
        const error = await response.json();
        throw new Error(error.error || "Image operation failed");
      }

      const result = await response.json();
      console.log("Result:", result);

      // TODO: Display the image result
      alert(`Image ${isEdit ? 'edited' : 'generated'}! URL: ${result.url}`);

      // Clear state
      setUploadedFiles(new Map());
    } catch (error) {
      console.error("Image operation error:", error);
      alert(error instanceof Error ? error.message : "Failed to process image");
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <PromptBox
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        onSubmit={handleSubmit}
        textareaRef={textareaRef}
        onFilesAdded={handleFilesAdded}
        uploadProgress={uploadProgress}
        isUploading={isAnyUploading}
      />
    </div>
  );
}
