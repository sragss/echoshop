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
  const { refetch: createPaymentLink } = api.balance.createPaymentLink.useQuery(undefined, {
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
                <button className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-[0_10px_35px_-25px_rgba(15,23,42,0.5)] transition-all hover:shadow-[0_12px_40px_-25px_rgba(15,23,42,0.6)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400">
                  <div className="relative h-5 w-5 rounded-full bg-gradient-to-br from-slate-100 to-white ring-1 ring-slate-200/60 flex items-center justify-center">
                    <Image
                      src="/logo/light.svg"
                      alt="Echo"
                      width={14}
                      height={14}
                      className="opacity-80"
                    />
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-slate-200/80 bg-white shadow-[0_20px_70px_-45px_rgba(15,23,42,0.5)] p-2"
              >
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 pt-2 pb-2">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-200/60" />
                <div className="px-3 py-4 my-2">
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Balance
                    </div>
                  </div>
                  <div className="text-3xl font-mono font-bold tabular-nums bg-gradient-to-br from-slate-600 to-slate-900 bg-clip-text text-transparent">
                    {balanceData?.balance !== undefined
                      ? `$${balanceData.balance.toFixed(2)}`
                      : '...'
                    }
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-200/60" />
                <DropdownMenuItem
                  onClick={handleAddCredits}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100 cursor-pointer transition-colors"
                >
                  Add $10
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 focus:text-slate-900 cursor-pointer transition-colors"
                >
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
