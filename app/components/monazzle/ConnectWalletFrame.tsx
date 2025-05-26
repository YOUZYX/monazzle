'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/app/components/ui/button'; // Using your placeholder button
import { appKitModal } from '@/context'; // Import the Reown AppKit modal instance
import { Wallet } from 'lucide-react'; // Assuming you use lucide-react for icons
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { sdk } from '@farcaster/frame-sdk';

interface ConnectWalletFrameProps {
  onWalletConnected: (eoaAddress: string, aaAddress: string) => void;
}

export function ConnectWalletFrame({ onWalletConnected }: ConnectWalletFrameProps) {
  const { isConnected, address: eoaAddress, connector } = useAccount();
  const [derivedAaAddress, setDerivedAaAddress] = useState<string | null>(null);

  // Helper to shorten strings for toasts
  const shortenString = (
    str: string | undefined | null,
    startChars = 6,
    endChars = 4
  ): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  // Call ready() when the frame is mounted to dismiss Farcaster splash screen
  useEffect(() => {
    const dismissSplash = async () => {
      try {
        await sdk.actions.ready();
        console.log("ConnectWalletFrame: Called SDK ready() - splash screen dismissed");
      } catch (error) {
        // Not in Farcaster context or SDK not available, that's ok
        console.log("ConnectWalletFrame: SDK ready() not available (not in Farcaster)");
      }
    };
    
    dismissSplash();
  }, []);

  useEffect(() => {
    if (isConnected && eoaAddress) {
      // Simulate AA address derivation (replace with actual ZeroDev logic)
      const aa = `0xAA${eoaAddress.slice(4).toLowerCase()}`; // Placeholder derivation
      setDerivedAaAddress(aa);
      toast.success(
        `Wallet connected: ${shortenString(eoaAddress)}. Derived AA: ${shortenString(aa)}`
      );
      onWalletConnected(eoaAddress, aa);
    }
  }, [isConnected, eoaAddress, connector, onWalletConnected]);

  const handleOpenModal = () => {
    appKitModal.open();
  };

  const glassCardStyle =
    'bg-white/5 backdrop-blur-2xl border border-mona-lavender/20 rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-md text-center';
  const textMutedStyle = 'text-mona-light-gray/70 text-sm';  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${glassCardStyle}`}>
      <Toaster position="top-center" duration={3500} richColors />
      
      <Wallet size={48} className="text-mona-purple mb-6" />

      <h2 className="text-2xl md:text-3xl font-semibold text-mona-cream mb-3">
        {'Connect Your Wallet'}
      </h2>
      <hr className="w-2/3 border-mona-slate/50 mb-6" />

      <p className="text-mona-light-gray mb-4 leading-relaxed">
        {'Connect your wallet to start your Monazzle journey.'}
      </p>
      <p className={`${textMutedStyle} mb-8`}>
        {'Some wallets may require their browser extension to be active.'}
      </p>

      <Button
        onClick={handleOpenModal}
        className="
          bg-mona-purple hover:bg-mona-purple/90 text-white
          font-semibold py-3 px-8 rounded-lg shadow-lg
          transition duration-300 ease-in-out transform
          hover:scale-105 w-full text-lg
        "
        size="lg"
      >
        {'Connect Wallet'}
      </Button>
    </div>
  );
}