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
import { api } from "@/trpc/react";

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
  const {
    addGenerating,
    addGenerated,
    addError,
    addGeneratingVideo,
    startPollingVideo,
    addVideoError,
  } = useGallery();

  const generateMutation = api.image.generate.useMutation();
  const editMutation = api.image.edit.useMutation();
  const createVideoMutation = api.video.create.useMutation();

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

    // Detect if video model is selected
    const isVideoModel = selectedModel === "sora-2";

    if (isVideoModel) {
      // Video generation flow
      const clientId = crypto.randomUUID();

      // Get optional reference image (only first one for now)
      const attachmentIds = controller.attachments.files.map((f) => f.id);
      const firstAttachmentId = attachmentIds[0];
      const referenceImageUrl = firstAttachmentId ? uploadedFiles.get(firstAttachmentId) : undefined;

      addGeneratingVideo({
        clientId,
        prompt: message.text || "",
        model: selectedModel,
        operation: "generate",
        timestamp: new Date(),
      });

      try {
        const result = await createVideoMutation.mutateAsync({
          model: "sora-2",
          prompt: message.text || "",
          ...(referenceImageUrl && { input_reference: referenceImageUrl }),
        });

        // Start polling with the returned job ID
        startPollingVideo(clientId, result.jobId);

        // Clear the form
        controller.textInput.clear();
        controller.attachments.clear();
        setUploadedFiles(new Map());
      } catch (error) {
        console.error("Video generation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate video";
        toast.error(errorMessage);
        addVideoError(clientId, errorMessage);
      }
    } else {
      // Image generation flow (existing code)
      const attachmentIds = controller.attachments.files.map((f) => f.id);
      const imageUrls = attachmentIds
        .map((id) => uploadedFiles.get(id))
        .filter((url): url is string => Boolean(url));

      const isEdit = imageUrls.length > 0;
      const operation = isEdit ? "edit" : "generate";
      const clientId = crypto.randomUUID();

      addGenerating({
        clientId,
        prompt: message.text || "",
        model: selectedModel as "nano-banana" | "gpt-image-1",
        operation,
        timestamp: new Date(),
      });

      try {
        const result = isEdit
          ? await editMutation.mutateAsync({
              model: selectedModel as "nano-banana" | "gpt-image-1",
              operation: "edit",
              prompt: message.text || "",
              images: imageUrls,
            })
          : await generateMutation.mutateAsync({
              model: selectedModel as "nano-banana" | "gpt-image-1",
              operation: "generate",
              prompt: message.text || "",
            });

        void addGenerated(clientId, result.id);
      } catch (error) {
        console.error("Image operation error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to process image";
        toast.error(errorMessage);
        addError(clientId, errorMessage);
      }
    }
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
