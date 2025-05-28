import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers"; 
import ContextProvider from '@/context';
import { FrameProvider } from '@/components/farcaster-provider';
import { APP_URL } from "@/lib/constants";

// Farcaster Frame metadata
const frame = {
  version: "next",
  imageUrl: `${APP_URL}/images/monazzle_feed.png`,
  button: {
    title: "Launch Monazzle",
    action: {
      type: "launch_frame",
      name: "Monazzle",
      url: APP_URL
    },
  },
};

export const metadata: Metadata = {
  title: "Monazzle - Farcaster Puzzle Game",
  description: "Create and solve puzzles on Monad.",
  openGraph: {
    title: "Monazzle - Farcaster Puzzle Game",
    description: "Create and solve puzzles on Monad.",
    images: [`${APP_URL}/images/homestarter.png`],
    url: APP_URL,
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookies = headers().get('cookie') ?? null; // Ensure null if no cookie
  return (
    <html lang="en">
      {/* <body className={inter.className}> */}
      <body> {/* Remove font className if not using Inter or similar */}
        <ContextProvider cookies={cookies}>
          <FrameProvider>
            {children}
          </FrameProvider>
        </ContextProvider>
      </body>
    </html>
  );
}