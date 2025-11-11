"use client";

import {
  PromptInput,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputFooter,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputSelect,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSelectContent,
  PromptInputSelectItem,
  type PromptInputMessage,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { modelCategories } from '@/config/models';
import { XIcon, PlusIcon } from 'lucide-react';
import { useEffect, useRef, type RefObject } from 'react';
import type { FileUIPart } from 'ai';
import type { UploadProgress } from '@/hooks/use-upload';

// Custom attachment component - square icon without text, left-aligned
function CustomAttachment({
  data,
  uploadProgress
}: {
  data: FileUIPart & { id: string };
  uploadProgress?: { progress: number; isUploading: boolean };
}) {
  const attachments = usePromptInputAttachments();
  const isImage = data.mediaType?.startsWith("image/") && data.url;
  const filename = data.filename || "";
  const isUploading = uploadProgress?.isUploading ?? false;
  const progress = uploadProgress?.progress ?? 0;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="group relative size-16 shrink-0">
          <div className="size-16 overflow-hidden rounded-md border border-border">
            {isImage ? (
              <img
                alt={filename || "attachment"}
                className="size-full object-cover"
                src={data.url}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">File</span>
              </div>
            )}
          </div>

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
              <div className="relative flex size-10 items-center justify-center">
                {/* Progress circle */}
                <svg className="size-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    className="stroke-white/20"
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    strokeWidth="2"
                  />
                  <circle
                    className="stroke-white transition-all duration-300"
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray={`${(progress / 100) * 100}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xs font-semibold text-white">
                  {progress}%
                </span>
              </div>
            </div>
          )}

          <Button
            aria-label="Remove attachment"
            className="absolute -right-2 -top-2 size-6 rounded-full bg-black p-0 opacity-0 shadow-md transition-opacity hover:bg-black/80 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              attachments.remove(data.id);
            }}
            size="icon"
            type="button"
            disabled={isUploading}
          >
            <XIcon className="size-3 text-white" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-2">
        {isImage && (
          <div className="flex max-h-96 w-96 items-center justify-center overflow-hidden rounded-md border">
            <img
              alt={filename || "attachment preview"}
              className="max-h-full max-w-full object-contain"
              src={data.url}
            />
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

interface PromptBoxProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onFilesAdded?: (files: (FileUIPart & { id: string })[]) => void;
  uploadProgress?: Map<string, UploadProgress>;
  isUploading?: boolean;
}

// Component to watch for new attachments and trigger callback
function AttachmentWatcher({ onFilesAdded }: { onFilesAdded?: (files: (FileUIPart & { id: string })[]) => void }) {
  const attachments = usePromptInputAttachments();
  const prevIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(attachments.files.map(f => f.id));
    const prevIds = prevIdsRef.current;

    // Find newly added files
    const newFiles = attachments.files.filter(f => !prevIds.has(f.id));

    if (newFiles.length > 0 && onFilesAdded) {
      onFilesAdded(newFiles);
    }

    prevIdsRef.current = currentIds;
  }, [attachments.files, onFilesAdded]);

  return null;
}

// Component to access file dialog
function FileDialogButton() {
  const attachments = usePromptInputAttachments();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={() => attachments.openFileDialog()}
      aria-label="Add files"
    >
      <PlusIcon className="size-4" />
    </Button>
  );
}

export function PromptBox({
  selectedModel,
  onModelChange,
  onSubmit,
  textareaRef,
  onFilesAdded,
  uploadProgress,
  isUploading,
}: PromptBoxProps) {
  // Get the selected model name for display
  const selectedModelName = modelCategories
    .flatMap(cat => cat.models)
    .find(m => m.id === selectedModel)?.name;

  return (
    <PromptInput onSubmit={onSubmit} accept="image/*" globalDrop multiple>
      <AttachmentWatcher onFilesAdded={onFilesAdded} />
      <PromptInputAttachments className="justify-start items-start w-full">
        {(attachment) => (
          <CustomAttachment
            data={attachment}
            uploadProgress={uploadProgress?.get(attachment.id)}
          />
        )}
      </PromptInputAttachments>
      <PromptInputBody>
        <PromptInputTextarea
          ref={textareaRef}
          placeholder="Type your message..."
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <FileDialogButton />
          <PromptInputSelect
            value={selectedModel}
            onValueChange={onModelChange}
          >
            <PromptInputSelectTrigger>
              <PromptInputSelectValue>
                {selectedModelName}
              </PromptInputSelectValue>
            </PromptInputSelectTrigger>
            <PromptInputSelectContent>
              {modelCategories.map((category) => (
                <div key={category.name}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {category.name}
                  </div>
                  {category.models.map((model) => (
                    <PromptInputSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputSelectItem>
                  ))}
                </div>
              ))}
            </PromptInputSelectContent>
          </PromptInputSelect>
        </PromptInputTools>
        <PromptInputSubmit disabled={isUploading} />
      </PromptInputFooter>
    </PromptInput>
  );
}
