"use client";

import { signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const handleSignIn = async () => {
    await signIn("echo", { callbackUrl: "/" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>
            Sign in with Echo to access this feature.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleSignIn} className="w-full">
          <Image
            src="/logo/dark.svg"
            alt="Echo"
            width={20}
            height={20}
            className="mr-2"
          />
          Sign in with Echo
        </Button>
      </DialogContent>
    </Dialog>
  );
}
