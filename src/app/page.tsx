"use client";

import { AuthDialog } from '@/components/auth-dialog';
import { Designer } from '@/components/designer';
import { Gallery } from '@/components/gallery';
import { PromptInputProvider } from '@/components/ai-elements/prompt-input';
import { useState } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { api } from "@/trpc/react";

function HomeContent() {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { data: session } = useSession();
  const { data: balanceData } = api.balance.get.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            EchoShop
          </h1>
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Image
                    src="/logo/light.svg"
                    alt="Echo"
                    width={20}
                    height={20}
                  />
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-3">
                  <div className="text-xs text-gray-500 mb-1">Balance</div>
                  <div className="text-lg font-mono font-semibold">
                    {balanceData?.balance !== undefined
                      ? `$${balanceData.balance.toFixed(2)}`
                      : '...'
                    }
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={() => signIn("echo")}>
              <Image
                src="/logo/light.svg"
                alt="Echo"
                width={20}
                height={20}
                className="mr-2"
              />
              Sign in
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
      <HomeContent />
    </PromptInputProvider>
  );
}
