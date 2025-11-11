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
import { XIcon } from 'lucide-react';
import type { RefObject } from 'react';
import type { FileUIPart } from 'ai';

// Custom attachment component - square icon without text, left-aligned
function CustomAttachment({ data }: { data: FileUIPart & { id: string } }) {
  const attachments = usePromptInputAttachments();
  const isImage = data.mediaType?.startsWith("image/") && data.url;
  const filename = data.filename || "";

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
          <Button
            aria-label="Remove attachment"
            className="absolute -right-2 -top-2 size-6 rounded-full bg-black p-0 opacity-0 shadow-md transition-opacity hover:bg-black/80 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              attachments.remove(data.id);
            }}
            size="icon"
            type="button"
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
  text: string;
  onTextChange: (text: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

export function PromptBox({
  text,
  onTextChange,
  selectedModel,
  onModelChange,
  onSubmit,
  textareaRef,
}: PromptBoxProps) {
  // Get the selected model name for display
  const selectedModelName = modelCategories
    .flatMap(cat => cat.models)
    .find(m => m.id === selectedModel)?.name;

  return (
    <PromptInput onSubmit={onSubmit} accept="image/*" globalDrop multiple>
      <PromptInputAttachments className="justify-start items-start w-full">
        {(attachment) => <CustomAttachment data={attachment} />}
      </PromptInputAttachments>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(e) => onTextChange(e.target.value)}
          ref={textareaRef}
          value={text}
          placeholder="Type your message..."
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
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
        <PromptInputSubmit disabled={!text} />
      </PromptInputFooter>
    </PromptInput>
  );
}
