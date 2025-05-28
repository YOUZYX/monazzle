'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { Button } from '@/app/components/ui/button'; // Using your placeholder button
import { appKitModal } from '@/context'; // Import the Reown AppKit modal instance
import { Wallet } from 'lucide-react'; // Assuming you use lucide-react for icons
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { sdk } from '@farcaster/frame-sdk';
import { useMiniAppContext } from '@/hooks/use-miniapp-context';
import Image from 'next/image';

interface ConnectWalletFrameProps {
  onWalletConnected: (eoaAddress: string, aaAddress: string) => void;
}

export function ConnectWalletFrame({ onWalletConnected }: ConnectWalletFrameProps) {
  const { isConnected, address: eoaAddress, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const [derivedAaAddress, setDerivedAaAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Check if we're in Farcaster environment
  const farcasterContext = useMiniAppContext();
  const isFarcasterEnvironment = farcasterContext.context !== null;

  // Debug logging
  useEffect(() => {
    //console.log('ConnectWalletFrame - Available connectors:', connectors);
    //console.log('ConnectWalletFrame - Farcaster environment:', isFarcasterEnvironment);
    //console.log('ConnectWalletFrame - appKitModal:', appKitModal);
  }, [connectors, isFarcasterEnvironment]);

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
        //console.log("ConnectWalletFrame: Called SDK ready() - splash screen dismissed");
      } catch (error) {
        // Not in Farcaster context or SDK not available, that's ok
        //console.log("ConnectWalletFrame: SDK ready() not available (not in Farcaster)");
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
    }  }, [isConnected, eoaAddress, connector, onWalletConnected]);  const handleOpenModal = () => {
    //console.log('handleOpenModal called');
    //console.log('appKitModal:', appKitModal);
    //console.log('appKitModal.open:', typeof appKitModal?.open);
    
    try {
      if (appKitModal && typeof appKitModal.open === 'function') {
        //console.log('Calling appKitModal.open()');
        appKitModal.open();
        //console.log('appKitModal.open() called successfully');
      } else {
        //console.error('appKitModal or appKitModal.open is not available');
        toast.error('Wallet connection modal is not available');
      }
    } catch (error) {
      //console.error('Error opening appKitModal:', error);
      toast.error('Failed to open wallet connection modal');
    }
  };const handleFarcasterConnect = async () => {
    if (!isFarcasterEnvironment) {
      toast.error('Farcaster wallet is only available in Farcaster apps');
      return;
    }
    
    setIsConnecting(true);
    try {
      // Find the Farcaster connector from the available connectors
      const farcasterConnector = connectors.find(
        connector => connector.id === 'farcasterFrame'
      );
      
      if (!farcasterConnector) {
        // Fallback: create the connector if not found
        const { farcasterFrame } = await import('@farcaster/frame-wagmi-connector');
        await connect({ connector: farcasterFrame() });
      } else {
        await connect({ connector: farcasterConnector });
      }
      
      toast.success('Connecting with Farcaster wallet...');
    } catch (error) {
      toast.error('Failed to connect with Farcaster wallet');
    } finally {
      setIsConnecting(false);
    }
  };
  const glassCardStyle =
    'bg-white/5 backdrop-blur-2xl border border-mona-lavender/20 rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-md text-center';
  const textMutedStyle = 'text-mona-light-gray/70 text-sm';

  return (
    <div className={`flex flex-col items-center justify-center h-full p-4 ${glassCardStyle}`}>
      <Toaster position="top-center" duration={3500} richColors />
      
      <Wallet size={48} className="text-mona-purple mb-6" />

      <h2 className="text-2xl md:text-3xl font-semibold text-mona-cream mb-3">
        {'Connect Your Wallet'}
      </h2>
      <hr className="w-2/3 border-mona-slate/50 mb-6" />      <p className="text-mona-light-gray mb-4 leading-relaxed">
        {'Connect your wallet to start your Monazzle journey.'}
      </p>
      <p className={`${textMutedStyle} mb-8`}>
        {'Some wallets may require their browser extension to be active.'}
      </p>

      <div className="space-y-4 w-full">
        {/* Farcaster Wallet Button */}
        <Button
          onClick={handleFarcasterConnect}
          disabled={!isFarcasterEnvironment || isConnecting}
          className={`
            w-full text-lg font-semibold py-3 px-8 rounded-lg shadow-lg
            transition duration-300 ease-in-out transform
            hover:scale-105 flex items-center justify-center gap-3
            ${isFarcasterEnvironment 
              ? 'bg-[#835CCA] hover:bg-[#835CCA]/90 text-white' 
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }
          `}
          size="lg"
        >
          <Image 
            src="/images/farcaster.png" 
            alt="Farcaster" 
            width={24} 
            height={24}
            className="rounded"
          />
          {isConnecting ? 'Connecting...' : 'Farcaster Wallet'}
        </Button>

        {/* Connect with Wallet Providers Button */}
        <Button
          onClick={handleOpenModal}
          className="
            bg-mona-purple hover:bg-mona-purple/90 text-white
            font-semibold py-3 px-8 rounded-lg shadow-lg
            transition duration-300 ease-in-out transform
            hover:scale-105 w-full text-lg flex items-center justify-center gap-3
          "
          size="lg"
        >
          <Wallet size={24} />
          {'Connect Wallet'}
        </Button>
      </div>
    </div>
  );
}