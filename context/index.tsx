'use client'

import { wagmiAdapter, projectId } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react'; 
import { monadTestnet } from '@/lib/chains'; // Our primary network
// Import other networks if you want them explicitly available in Reown modal, though it often populates common ones.
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider, type Config as WagmiConfig } from 'wagmi';
import { ZeroDevProvider } from './zeroDev';

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error('Project ID is not defined for Reown AppKit context');
}

// Set up metadata for Reown AppKit modal
const metadata = {
  name: 'Monazzle',
  description: 'Monazzle - A Farcaster Mini-App Puzzle Game on Monad',
  url: 'https://monazzle.vercel.app', // Replace with your actual app URL
  icons: ['/images/homestarter.png'] // Assuming homestarter.png is in public/images/
};

// Create the Reown AppKit modal instance
// We include monadTestnet and also other common networks. Reown might show its own list regardless.
export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [monadTestnet], // monadTestnet listed first
  defaultNetwork: monadTestnet, // Set Monad Testnet as the default
  metadata: metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, // is set to true by default
    socials: false,
    // You might explore other features like `embeddedWallets` if Reown supports them for your project
  }
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  // Ensure wagmiAdapter.wagmiConfig is correctly typed for cookieToInitialState
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as WagmiConfig, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as WagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ZeroDevProvider>
          {children}
        </ZeroDevProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider; 
