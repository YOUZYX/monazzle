'use client';

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useAccount, useDisconnect, useBalance, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { entryPointContractAddress } from '../../lib/contracts'; // Assuming contracts.ts is in app/lib
import { monadTestnet } from '@/lib/chains';
import { ensureMonadTestnet, getChainName, autoSwitchToMonadTestnet, isFarcasterMobile } from '@/lib/chainUtils';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from './ui_placeholders';
import { ethers } from 'ethers';
import { ZeroDevContext} from '@/context/zeroDev';
import { Copy, LogOut, TrendingUp, CheckCircle, AlertTriangle, RotateCw } from 'lucide-react';
import { parseEther, type Hex } from 'viem'; // Added for easy ETH to WEI conversion and Hex type
import { Toaster, toast } from 'sonner'; // Import Toaster and toast

// This should ideally come from .env, but for now, keeping it as it was in ConnectAndTopUpFrame
const zeroDevProjectId = "b8f9fdbcd95c3c14aea486a0e78293a4"; 

interface ProfileFrameProps {
  eoaAddress: string | null;
  onDisconnect: () => void; // Renamed from onWalletDisconnected to match page.tsx
}

export function ProfileFrame({ eoaAddress: eoaAddressFromProp, onDisconnect }: ProfileFrameProps) {
  // Helper to shorten strings for toasts
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  // console.log("[MonazzleZeroDevLog] ProfileFrame rendering NOW. EOA from prop:", eoaAddressFromProp);

  const { disconnect } = useDisconnect();
  const { data: eoaBalance } = useBalance({ address: eoaAddressFromProp as `0x${string}` | undefined });
  const { connector, chainId } = useAccount(); // Get connector and chainId info
  const { switchChain } = useSwitchChain(); // Add chain switching capability

  const {
    initializeSmartAccount,
    smartAccountAddress,
    isSmartAccountReady,
    isLoading: isZeroDevLoading,
    error: zeroDevError,
    getSmartAccountBalance
  } = useContext(ZeroDevContext);

  const [txHash, setTxHash] = useState<Hex | undefined>(undefined);
  
  const { 
    data: txData,
    isPending: isSendingTransaction, 
    sendTransaction,
    error: sendTxError
  } = useSendTransaction();
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('0.01');
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [aaBalanceDisplay, setAaBalanceDisplay] = useState<string | null>(null);
  const [isFetchingAaBalance, setIsFetchingAaBalance] = useState(false);
  const [prevIsZeroDevLoading, setPrevIsZeroDevLoading] = useState(isZeroDevLoading);

  const fetchAndUpdateAaBalance = useCallback(async (options?: { showSuccessToast?: boolean }) => {
    if (smartAccountAddress && isSmartAccountReady) {
      setIsFetchingAaBalance(true);
      // console.log("[MonazzleZeroDevLog] ProfileFrame: Fetching AA balance for", smartAccountAddress);
      try {
        const balance = await getSmartAccountBalance();
        const formattedBalance = (Number(balance) / 1e18).toFixed(4); 
        setAaBalanceDisplay(`${formattedBalance} MON`);
        if (options?.showSuccessToast) {
          toast.success(`Smart Account balance: ${formattedBalance} MON`);
        }
        // console.log("[MonazzleZeroDevLog] ProfileFrame: AA balance fetched:", formattedBalance);
      } catch (e) {
        // console.error("[MonazzleZeroDevLog] ProfileFrame: Error fetching AA balance", e);
        toast.error(`Failed to fetch AA balance: ${(e as Error).message}`);
        setAaBalanceDisplay("Error");
      } finally {
        setIsFetchingAaBalance(false);
      }
    }
  }, [smartAccountAddress, isSmartAccountReady, getSmartAccountBalance]);
  
  useEffect(() => {
    if (txData) {
      // console.log("[MonazzleZeroDevLog] Transaction hash received:", txData);
      toast.info(`Transaction submitted, awaiting confirmation. Tx: ${shortenString(txData)}`);
      setTxHash(txData);
    }
  }, [txData]);

  useEffect(() => {
    if (isConfirmed && !isConfirming && txHash) {
      // console.log("[MonazzleZeroDevLog] Top-up transaction confirmed:", txHash);
      toast.success(`Top-up confirmed! Tx: ${shortenString(txHash)}`);
      fetchAndUpdateAaBalance({ showSuccessToast: true });
      setTxHash(undefined); // Reset for future transactions
      setIsToppingUp(false); // Ensure this is reset
    }
  }, [isConfirmed, isConfirming, txHash, fetchAndUpdateAaBalance]);

  useEffect(() => {
    // console.log('[MonazzleZeroDevLog] ProfileFrame useEffect - eoaAddressFromProp:', eoaAddressFromProp, 'isSmartAccountReady:', isSmartAccountReady, 'isZeroDevLoading:', isZeroDevLoading);
    if (eoaAddressFromProp && !isSmartAccountReady && !isZeroDevLoading && !smartAccountAddress) {
      // console.log('[MonazzleZeroDevLog] ProfileFrame: EOA prop available, attempting to initialize smart account.');
      toast.info("Initializing Smart Account...");
      initializeSmartAccount();
    }
  }, [eoaAddressFromProp, initializeSmartAccount, isSmartAccountReady, isZeroDevLoading, smartAccountAddress]);

  useEffect(() => {
    if (prevIsZeroDevLoading && !isZeroDevLoading && smartAccountAddress && !zeroDevError) {
      toast.success(`Smart Account initialized: ${shortenString(smartAccountAddress)}`);
    }
    setPrevIsZeroDevLoading(isZeroDevLoading);
  }, [isZeroDevLoading, smartAccountAddress, zeroDevError, prevIsZeroDevLoading]);

  useEffect(() => {
    if (zeroDevError) {
      toast.error(`Smart Account error: ${zeroDevError.message.substring(0,100)}...`);
    }
  }, [zeroDevError]);

  useEffect(() => {
    if (sendTxError) {
      toast.error(`Transaction error: ${(sendTxError as Error).message}`);
    }
  }, [sendTxError]);

  useEffect(() => {
    fetchAndUpdateAaBalance();
  }, [fetchAndUpdateAaBalance]);

  // Auto-switch to Monad Testnet when running in Farcaster mobile
  useEffect(() => {
    const handleAutoSwitch = async () => {
      if (chainId && switchChain) {
        await autoSwitchToMonadTestnet(chainId, (args) => Promise.resolve(switchChain(args)));
      }
    };

    // Only auto-switch once when component mounts and we have chain info
    if (chainId !== undefined) {
      handleAutoSwitch();
    }
  }, [chainId, switchChain]);

  const handleDisconnectClick = () => {
    onDisconnect(); 
    disconnect(); 
    toast.info("Wallet disconnected.");
  };  const handleTopUp = async () => {
    if (!smartAccountAddress) {
      // console.error("[MonazzleZeroDevLog] TopUp Error: Missing smartAccountAddress");
      return;
    }

    if (!topUpAmount || isNaN(parseFloat(topUpAmount)) || parseFloat(topUpAmount) <= 0) {
      // console.error("[MonazzleZeroDevLog] TopUp Error: Invalid amount");
      return;
    }

    setIsToppingUp(true);
    
    // Ensure we're on Monad Testnet before proceeding
    const chainSwitchSuccess = await ensureMonadTestnet(chainId, (args) => Promise.resolve(switchChain(args)), 'top-up');
    if (!chainSwitchSuccess) {
      setIsToppingUp(false);
      return;
    }

    // console.log(`[MonazzleZeroDevLog] Attempting direct top up of AA wallet ${smartAccountAddress} with ${topUpAmount} MON from EOA`);
    
    const topUpToastId = toast.loading(`Topping up ${topUpAmount} MON on Monad Testnet...`);
    
    try {
      sendTransaction({ 
        to: smartAccountAddress as `0x${string}`,
        value: parseEther(topUpAmount),
        gas: BigInt(300000),
        chainId: monadTestnet.id, // Explicitly specify chain ID
      }, {
        onSuccess: (data) => {
          toast.dismiss(topUpToastId);
        },
        onError: (error) => {
          toast.error(`Top-up failed: ${error.message}`, { id: topUpToastId });
          setIsToppingUp(false);
        }
      });
      
      setShowTopUpModal(false);
    } catch (e) {
      // console.error("[MonazzleZeroDevLog] Error during top-up:", e);
      toast.error(`Top-up Error: ${(e as Error).message}`, { id: topUpToastId });
      setIsToppingUp(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // console.log("Copied to clipboard:", text);
      toast.success("Address copied to clipboard!");
    }).catch(err => {
      // console.error("Failed to copy to clipboard:", err);
      toast.error(`Failed to copy: ${(err as Error).message}`);
    });
  };

  const GlassCard: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className }) => (
    <div className={`bg-white/5 backdrop-blur-2xl border border-mona-lavender/20 rounded-2xl p-6 md:p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="w-full max-w-lg mx-auto p-4 md:p-0">
      <Toaster position="top-center" duration={3500} richColors />
      <GlassCard className="text-mona-cream">
        <h1 className="text-3xl font-bold text-center mb-8 text-mona-cream">Profile & Wallets</h1>
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-mona-purple mb-3">Funding Wallet - EOA</h2>
            {eoaAddressFromProp ? (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span>Address: {`${eoaAddressFromProp.substring(0, 6)}...${eoaAddressFromProp.substring(eoaAddressFromProp.length - 4)}`}</span>
                  <Button variant="ghost" className="sm" onClick={() => copyToClipboard(eoaAddressFromProp)}><Copy size={14} /></Button>
                </div>
                <p>Balance: {eoaBalance?.formatted ? `${parseFloat(eoaBalance.formatted).toFixed(4)} ${eoaBalance.symbol}` : 'Loading...'}</p>
                <p className="text-xs text-mona-light-gray/70">Connected via {connector?.name || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-mona-light-gray/80">EOA Wallet not connected.</p>
            )}
          </section>

          <hr className="border-mona-slate/30" />

          <section>
            <h2 className="text-xl font-semibold text-mona-purple mb-3">Smart Account - AA</h2>
            {isZeroDevLoading && !smartAccountAddress && (
              <div className="flex items-center space-x-2 text-mona-light-gray/80">
                <RotateCw size={18} className="animate-spin" />
                <span>Initializing Smart Account...</span>
              </div>
            )}
            {zeroDevError && !smartAccountAddress && (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertTriangle size={18} />
                <span>Error: {zeroDevError.message.substring(0, 100)}...</span>
              </div>
            )}
            {smartAccountAddress && (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                   <span>Address: {`${smartAccountAddress.substring(0, 6)}...${smartAccountAddress.substring(smartAccountAddress.length - 4)}`}</span>
                   <Button variant="ghost" className="sm" onClick={() => copyToClipboard(smartAccountAddress)}><Copy size={14} /></Button>
                </div>
                <p>
                  Balance: {isFetchingAaBalance ? 'Fetching...' : (aaBalanceDisplay || 'N/A')}
                </p>
                {isSmartAccountReady && (
                   <div className="flex items-center space-x-1 text-green-400 text-xs">
                     <CheckCircle size={14} />
                     <span>Ready</span>
                   </div>
                )}
                 <Button
                  onClick={() => setShowTopUpModal(true)}
                  disabled={!isSmartAccountReady || isToppingUp || isZeroDevLoading}
                  className="w-full mt-3 bg-mona-purple hover:bg-mona-purple/90 text-white font-semibold py-2 px-4 rounded-lg text-sm">
                  {/*<TrendingUp size={16} className="mr-2" />*/}
                  Refill Gas
                </Button>
              </div>
            )}
            {!isZeroDevLoading && !smartAccountAddress && !zeroDevError && !eoaAddressFromProp && (
                 <p className="text-mona-light-gray/80">Connect EOA to see Smart Account.</p>
            )}
             {!isZeroDevLoading && !smartAccountAddress && !zeroDevError && eoaAddressFromProp && (
                 <p className="text-mona-light-gray/80">Smart Account not available or still deriving.</p>
            )}
          </section>
        </div>

        <Button
          onClick={handleDisconnectClick}
          className="w-full mt-10 bg-mona-red hover:bg-mona-red/90 text-white font-semibold py-3 px-6 rounded-lg">
          {/*<LogOut size={18} className="mr-2" />*/}
          Disconnect Wallet
        </Button>
      </GlassCard>

      {showTopUpModal && smartAccountAddress && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <GlassCard className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-mona-cream text-xl text-center">Top Up Smart Account</CardTitle>
              {/*<CardContent className="text-mona-light-gray/70 text-xs text-center">{`${smartAccountAddress}`}</CardContent>*/}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-mona-gray/50 text-xs text-center">{`${smartAccountAddress}`}</p>
              <div>
                <label htmlFor="topUpAmount" className="block text-sm font-medium text-mona-ash mb-1">Amount (MON)</label>
                <Input
                  id="topUpAmount"
                  type="text"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="0.01"
                  className="w-full bg-mona-deep-purple/50 border-mona-slate text-mona-cream rounded-md focus:ring-mona-purple focus:border-mona-purple"
                />
              </div>
              <div className="flex gap-3 pt-2">
              <Button
  onClick={handleTopUp}
  disabled={isToppingUp}
  className="
    flex-1          /* grow to fill */
    flex            /* make it a flex container */
    items-center    /* vertical align center */
    justify-center  /* horizontal align center */
    space-x-2       /* 0.5rem gap between children */
    bg-mona-green
    hover:bg-mona-green/90
    text-white
    rounded-md
    py-2
  "
>
  {isToppingUp
    ? <RotateCw size={16} className="animate-spin" />
    : <CheckCircle size={16} />}
  <span>{isToppingUp ? 'Processing...' : 'Confirm'}</span>
</Button>

                <Button
                  variant="outline"
                  onClick={() => setShowTopUpModal(false)}
                  disabled={isToppingUp}
                  className="flex-1 border-mona-slate text-mona-light-gray hover:bg-mona-slate/30 hover:text-mona-cream rounded-md py-2"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      )}
    </div>
  );
}