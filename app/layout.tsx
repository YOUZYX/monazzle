import type { Metadata } from "next";
// import { Inter } from "next/font/google"; // Assuming you might have custom fonts or remove if not used
import "./globals.css";

import { headers } from "next/headers"; 
import ContextProvider from '@/context'; // Import the new ContextProvider

// const inter = Inter({ subsets: ["latin"] }); // If using Inter font

// Metadata from your page.tsx or a new one
export const metadata: Metadata = {
  title: "Monazzle - Farcaster Puzzle Game",
  description: "Create and solve puzzles on Monad.",
  // Add other metadata like openGraph, icons etc. as needed
  //icons: { icon: '../public/images/'}, // Example
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
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
