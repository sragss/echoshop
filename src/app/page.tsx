"use client";

import { PromptBox } from '@/components/prompt-box';
import { AuthDialog } from '@/components/auth-dialog';
import {
  type PromptInputMessage,
  PromptInputProvider,
  usePromptInputController,
} from '@/components/ai-elements/prompt-input';
import { modelCategories } from '@/config/models';
import { useState, useRef, useEffect } from "react";
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
    // Only upload if user is authenticated
    if (!session?.user) {
      setShowAuthDialog(true);
      // Remove the files if not authenticated
      newFiles.forEach(file => controller.attachments.remove(file.id));
      return;
    }

    // Upload each new file
    for (const fileData of newFiles) {
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
        // Optionally remove failed uploads
        controller.attachments.remove(fileData.id);
      }
    }
  };

  const handleSubmit = (message: PromptInputMessage) => {
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

    // Map files to their uploaded URLs
    const filesWithUploadedUrls = message.files?.map((file) => {
      const uploadedUrl = uploadedUrls.get((file as any).id);
      if (uploadedUrl) {
        return {
          ...file,
          url: uploadedUrl,
        };
      }
      return file;
    });

    console.log("Submitted:", {
      text: message.text,
      model: selectedModel,
      files: filesWithUploadedUrls,
    });

    // Clear state
    setUploadedUrls(new Map());
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
