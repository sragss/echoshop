"use client";

import { PromptBox } from '@/components/prompt-box';
import { AuthDialog } from '@/components/auth-dialog';
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input';
import { modelCategories } from '@/config/models';
import { useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState(modelCategories[0]?.models[0]?.id ?? "nano-banana");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: session } = useSession();

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

    console.log("Submitted:", {
      text: message.text,
      model: selectedModel,
      files: message.files?.length || 0,
    });
    setText("");
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
            text={text}
            onTextChange={setText}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onSubmit={handleSubmit}
            textareaRef={textareaRef}
          />
        </div>
      </main>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}
