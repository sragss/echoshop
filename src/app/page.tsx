"use client";

import { PromptBox } from '@/components/prompt-box';
import { AuthDialog } from '@/components/auth-dialog';
import {
  type PromptInputMessage,
  PromptInputProvider,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input';
import { modelCategories } from '@/config/models';
import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useUpload } from '@/hooks/use-upload';

function HomeContent() {
  const [selectedModel, setSelectedModel] = useState(modelCategories[0]?.models[0]?.id ?? "nano-banana");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<Map<string, string>>(new Map());
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
      setShowAuthDialog(true);
      // Remove the files if not authenticated
      validFiles.forEach(file => controller.attachments.remove(file.id));
      return;
    }

    // Upload each valid file
    for (const fileData of validFiles) {
      // Skip if already uploaded or uploading
      if (uploadedUrls.has(fileData.id) || uploadProgress.has(fileData.id)) {
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

        // Store the uploaded URL
        setUploadedUrls((prev) => {
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
      setShowAuthDialog(true);
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

    // Don't support image attachments yet
    if (hasFiles) {
      alert("Image attachments not yet supported");
      return;
    }

    try {
      console.log("Generating image with prompt:", message.text);

      // Call the image generation API
      const response = await fetch("/api/echo/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: message.text,
          images: [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Image generation failed");
      }

      const result = await response.json();
      console.log("Generated image:", result);

      // TODO: Display the image result
      alert(`Image generated! URL: ${result.url}`);

      // Clear state
      setUploadedUrls(new Map());
    } catch (error) {
      console.error("Image generation error:", error);
      alert(error instanceof Error ? error.message : "Failed to generate image");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            EchoShop
          </h1>
          {session?.user && (
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          )}
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <PromptBox
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onSubmit={handleSubmit}
            textareaRef={textareaRef}
            onFilesAdded={handleFilesAdded}
            uploadProgress={uploadProgress}
            isUploading={isAnyUploading}
          />
        </div>
      </main>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}

export default function Home() {
  return (
    <PromptInputProvider>
      <HomeContent />
    </PromptInputProvider>
  );
}
