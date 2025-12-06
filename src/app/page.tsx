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
  const { data: paymentLink, refetch: createPaymentLink } = api.balance.createPaymentLink.useQuery(undefined, {
    enabled: false,
  });

  const handleAddCredits = async () => {
    const result = await createPaymentLink();
    if (result.data?.url) {
      window.open(result.data.url, '_blank');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-white/60 to-[#f3f5fb]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <div className="mx-auto flex items-center justify-between px-6 py-5 max-w-5xl">
          <div className="flex items-center gap-3">
            <Image
              src="/logo_v2.png"
              alt="Echo"
              width={44}
              height={44}
              priority
            />
            <h1 className="text-xl font-semibold leading-tight text-slate-900">
              EchotoShop
            </h1>
          </div>
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary">
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
                <DropdownMenuItem onClick={handleAddCredits}>
                  Add $10
                </DropdownMenuItem>
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

      <main className="flex flex-1 flex-col items-center px-4 py-10">
        <section className="w-full max-w-3xl">
          <Designer onAuthRequired={() => setShowAuthDialog(true)} />
        </section>
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
