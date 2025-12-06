import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from '@/trpc/react';
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "EchotoShop - AI Image & Video Generation",
  description: "Generate and edit stunning images and videos with AI. Powered by Nano Banana, GPT Image, and Sora 2. Pay-as-you-go with Echo.",
  keywords: ["AI image generation", "AI video generation", "Sora 2", "GPT Image", "Nano Banana", "image editing", "AI art"],
  authors: [{ name: "EchotoShop" }],
  metadataBase: new URL("https://echotoshop.com"),
  openGraph: {
    title: "EchotoShop - AI Image & Video Generation",
    description: "Generate and edit stunning images and videos with AI. Powered by Nano Banana, GPT Image, and Sora 2.",
    url: "https://echotoshop.com",
    siteName: "EchotoShop",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EchotoShop - AI Image & Video Generation",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EchotoShop - AI Image & Video Generation",
    description: "Generate and edit stunning images and videos with AI. Powered by Nano Banana, GPT Image, and Sora 2.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
