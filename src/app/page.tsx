"use client";

import { AuthDialog } from '@/components/auth-dialog';
import { Designer } from '@/components/designer';
import { PromptInputProvider } from '@/components/ai-elements/prompt-input';
import { modelCategories } from '@/config/models';
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

function HomeContent() {
  const [selectedModel, setSelectedModel] = useState(modelCategories[0]?.models[0]?.id ?? "nano-banana");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { data: session } = useSession();

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
        <Designer
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onAuthRequired={() => setShowAuthDialog(true)}
        />
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
