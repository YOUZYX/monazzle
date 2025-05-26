"use client";

import Image from "next/image";
import React, { useEffect } from 'react';
import { useFrame } from '@/components/farcaster-provider'; // Import useFrame hook

interface HomeFrameProps {
  onTimeout: () => void;
}

export default function HomeFrame({ onTimeout }: HomeFrameProps) {
  // Safely get Farcaster actions (might not be available outside Farcaster)
  let actions = null;
  let isSDKLoaded = false;
  
  try {
    const frameContext = useFrame();
    actions = frameContext.actions;
    isSDKLoaded = frameContext.isSDKLoaded;
  } catch {
    // Not in Farcaster context, that's ok
  }

  // Call ready() when the frame is mounted and SDK is loaded
  useEffect(() => {
    if (actions && isSDKLoaded) {
      actions.ready().catch(console.error);
      console.log("HomeFrame: Called SDK ready()");
    }
  }, [actions, isSDKLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onTimeout();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-mona-dark text-mona-light-gray p-4">
      <div className="mb-8 animate-pulse">
        <Image
          src="/images/monazzle_jigsaw.gif"
          alt="Monazzle Loading"
          width={250}
          height={250}
          priority
        />
      </div>
      <h1 className="text-3xl font-bold text-mona-yellow mb-4">MONAZZLE</h1>
      <p className="text-md text-mona-light-gray">Loading your puzzling adventure...</p>
    </div>
  );
}