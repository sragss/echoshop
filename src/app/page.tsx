"use client";

import { AuthDialog } from '@/components/auth-dialog';
import { Designer } from '@/components/designer';
import { Gallery } from '@/components/gallery';
import { PromptInputProvider } from '@/components/ai-elements/prompt-input';
import { GalleryProvider } from '@/contexts/gallery-context';
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

function HomeContent() {
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

      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <Designer onAuthRequired={() => setShowAuthDialog(true)} />
        {session?.user && <Gallery />}
      </main>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  );
}

export default function Home() {
  return (
    <PromptInputProvider>
      <GalleryProvider>
        <HomeContent />
      </GalleryProvider>
    </PromptInputProvider>
  );
}
