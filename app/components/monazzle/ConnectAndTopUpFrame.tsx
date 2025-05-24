'use client';

import { useEffect, useState, useContext } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors'; // Assuming 'injected' is a desired default
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/app/components/monazzle/ui_placeholders'; // Using placeholders
import { ZeroDevContext } from '@/context/zeroDev'; // Import ZeroDevContext
import { monadTestnet } from '@/lib/chains'; // Import your chain definition
import { Toaster, toast } from 'sonner'; // Import Toaster and toast

interface ConnectAndTopUpFrameProps {
  onWalletsConnected: (eoaAddress: string, aaAddress: string) => void;
  onDisconnect: () => void;
}

export function ConnectAndTopUpFrame({ onWalletsConnected, onDisconnect }: ConnectAndTopUpFrameProps) {
  // console.log("[MonazzleZeroDevLog] ConnectAndTopUpFrame rendering NOW"); // Direct log

  // Helper to shorten strings for toasts
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  const { address: eoaAddress, connector: activeConnector, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error: connectError, status } = useConnect(); // Use status to get pending state
  const { disconnect } = useDisconnect();

  // Get ZeroDev context
  const { 
    initializeSmartAccount, 
    smartAccountAddress, 
    isSmartAccountReady, 
    isLoading: isZeroDevLoading, 
    error: zeroDevError,
    kernelClient // Get kernelClient for top-up
  } = useContext(ZeroDevContext);

  const isConnectingWallet = status === 'pending';

  const { data: eoaBalance } = useBalance({ address: eoaAddress });
  
  const { data: aaBalance, refetch: refetchAaBalance } = useBalance({ 
    address: smartAccountAddress as `0x${string}` | undefined, 
    chainId: monadTestnet.id 
  }); 

  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('0.01');
  const [isToppingUp, setIsToppingUp] = useState(false);


  useEffect(() => {
    // console.log('[MonazzleZeroDevLog] ConnectAndTopUpFrame useEffect - eoaAddress:', eoaAddress, 'isConnected:', isConnected, 'isSmartAccountReady:', isSmartAccountReady, 'isZeroDevLoading:', isZeroDevLoading);
    if (isConnected && eoaAddress && !isSmartAccountReady && !isZeroDevLoading && !smartAccountAddress) { // Added !smartAccountAddress to prevent re-trigger
      // console.log('[MonazzleZeroDevLog] ConnectAndTopUpFrame: EOA connected, attempting to initialize smart account.');
      toast.info("Initializing Smart Account...");
      initializeSmartAccount();
    }
  }, [isConnected, eoaAddress, initializeSmartAccount, isSmartAccountReady, isZeroDevLoading, smartAccountAddress]);

  useEffect(() => {
    if (eoaAddress && smartAccountAddress && isSmartAccountReady) {
      // console.log(`[MonazzleZeroDevLog] ConnectAndTopUpFrame: EOA and AA ready. EOA: ${eoaAddress}, AA: ${smartAccountAddress}`);
      toast.success(`Wallets ready! EOA: ${shortenString(eoaAddress)}, Smart Account: ${shortenString(smartAccountAddress)}`);
      onWalletsConnected(eoaAddress, smartAccountAddress);
      refetchAaBalance(); // Refetch AA balance once ready
    }
  }, [eoaAddress, smartAccountAddress, isSmartAccountReady, onWalletsConnected, refetchAaBalance]);

  // Toast for EOA connection success
  useEffect(() => {
    if (isConnected && eoaAddress && activeConnector) {
        toast.success(`EOA connected: ${shortenString(eoaAddress)} via ${activeConnector.name}`);
    }
  }, [isConnected, eoaAddress, activeConnector]);

  // Toast for EOA connection error
  useEffect(() => {
    if (connectError) {
      toast.error(`EOA Connection Failed: ${connectError.message}`);
    }
  }, [connectError]);

  // Toast for Smart Account initialization error
  useEffect(() => {
    if (zeroDevError) {
      toast.error(`Smart Account Error: ${zeroDevError.message}`);
    }
  }, [zeroDevError]);


  const handleConnect = (connector: any) => {
    if (!isConnected) {
      // toast.info(`Connecting with ${connector.name}...`); // This might be too quick if wagmi shows its own modal
      connect({ connector });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info("Wallet disconnected.");
    onDisconnect(); // Notify parent to change frame
  };

  const handleTopUp = async () => {
    if (!kernelClient || !smartAccountAddress || !eoaAddress) {
      // console.error("[MonazzleZeroDevLog] TopUp Error: Missing kernelClient, smartAccountAddress or eoaAddress");
      toast.error("Top-up Error: Required wallet information is missing.");
      return;
    }
    setIsToppingUp(true);
    const topUpToastId = toast.loading(`Topping up Smart Account (${shortenString(smartAccountAddress)}) with ${topUpAmount} MON...`);
    // console.log(`[MonazzleZeroDevLog] Attempting to top up AA wallet ${smartAccountAddress} with ${topUpAmount} MON from ${eoaAddress}`);
    try {
      // ... (rest of your top-up logic)
      // For now, let's assume you want to use the `topUpAccount` function from your context
      // which is designed to send a UserOperation from the AA to itself.
      // This means the AA needs to be funded with gas (or use a paymaster) first.
      const { topUpAccount: zeroDevTopUp } = useContext(ZeroDevContext); // Get it directly
      const amountInWei = BigInt(parseFloat(topUpAmount) * 1e18); // Simple conversion, use a library for precision
      
      const txHash = await zeroDevTopUp(amountInWei); // This was how it was before, assuming it's what's intended.

      if (txHash) {
        // console.log("[MonazzleZeroDevLog] Top-up UserOperation successful, hash:", txHash);
        toast.success(`Top-up successful! Tx: ${shortenString(txHash as string)}`, { id: topUpToastId });
        // Wait for balance to update
        setTimeout(() => refetchAaBalance(), 5000); // Simple delay, or use event listening
      } else {
        // console.error("[MonazzleZeroDevLog] Top-up UserOperation failed.");
        toast.error("Top-up failed. No transaction hash returned.", { id: topUpToastId });
      }
    } catch (e) {
      // console.error("[MonazzleZeroDevLog] Error during top-up:", e);
      toast.error(`Top-up Error: ${(e as Error).message}`, { id: topUpToastId });
    } finally {
      setIsToppingUp(false);
      setShowTopUpModal(false);
    }
  };

  const availableConnectors = connectors.filter(c => c.id !== 'frame'); // Exclude Farcaster Frame connector for direct connection

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-mona-deep-purple text-mona-cream">
      <Toaster position="top-center" duration={3500} richColors />
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-mona-lavender/50 rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-mona-cream">
            {isConnected && eoaAddress ? 'Wallet Connected' : 'Connect Your Wallet'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConnected && eoaAddress ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-mona-lavender">EOA Wallet</h3>
                <p className="text-sm truncate">Address: {eoaAddress}</p>
                <p className="text-sm">Balance: {eoaBalance?.formatted} {eoaBalance?.symbol}</p>
                {activeConnector && <p className="text-sm">Connected via: {activeConnector.name}</p>}
              </div>
              
              {isZeroDevLoading && !smartAccountAddress && (
                <div>
                  <h3 className="text-lg font-semibold text-mona-lavender">Smart Account (AA)</h3>
                  <p className="text-sm text-mona-ash">Initializing Smart Account...</p>
                </div>
              )}

              {smartAccountAddress && (
                <div>
                  <h3 className="text-lg font-semibold text-mona-lavender">Smart Account (AA)</h3>
                  <p className="text-sm truncate">Address: {smartAccountAddress}</p>
                  <p className="text-sm">
                    Balance: {aaBalance?.formatted || '0.00'} {aaBalance?.symbol || eoaBalance?.symbol || 'MON'}
                  </p>
                  {!isSmartAccountReady && isZeroDevLoading && <p className="text-sm text-mona-ash">Finalizing Smart Account...</p>}
                </div>
              )}

              {zeroDevError && (
                 <div>
                    <h3 className="text-lg font-semibold text-red-400">Smart Account Error</h3>
                    <p className="text-sm text-red-300">Details: {zeroDevError.message}</p>
                  </div>
              )}

              <Button
                onClick={() => setShowTopUpModal(true)}
                className="w-full bg-mona-purple hover:bg-mona-violet text-mona-cream font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
                disabled={!smartAccountAddress || !isSmartAccountReady || isZeroDevLoading || isToppingUp}
              >
                Top Up AA Wallet
              </Button>
              <Button
                onClick={handleDisconnect}
                className="w-full bg-mona-red hover:opacity-90 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {availableConnectors.map((connector) => (
                <Button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={isConnectingWallet || isConnecting} 
                  className="w-full bg-mona-purple hover:bg-mona-violet text-mona-cream font-semibold py-3 px-4 rounded-lg transition-colors duration-150"
                >
                  {isConnectingWallet || isConnecting ? `Connecting to ${connector.name}...` : `Connect with ${connector.name}`}
                </Button>
              ))}
              {/* Error display for EOA connection is now handled by toast, but can keep this as a fallback or remove */}
              {/* {error && <p className="text-center text-red-400">Error connecting EOA: {error.message}</p>} */}
            </div>
          )}
        </CardContent>
      </Card>

      {showTopUpModal && smartAccountAddress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm bg-mona-charcoal border border-mona-slate rounded-xl">
            <CardHeader>
              <CardTitle className="text-mona-cream">Top Up AA Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-mona-ash truncate">AA Address: {smartAccountAddress}</p>
              <div>
                <label htmlFor="topUpAmount" className="block text-sm font-medium text-mona-ash">Amount (MON)</label>
                <Input
                  id="topUpAmount"
                  type="text"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="0.01"
                  className="mt-1 w-full bg-mona-deep-purple/50 border-mona-slate text-mona-cream rounded-md focus:ring-mona-purple focus:border-mona-purple"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleTopUp}
                  disabled={isToppingUp}
                  className="flex-1 bg-mona-purple hover:bg-mona-violet text-mona-cream rounded-md"
                >
                  {isToppingUp ? 'Topping Up...' : 'Confirm Top Up'}
                </Button>
                <Button
                  onClick={() => setShowTopUpModal(false)}
                  disabled={isToppingUp}
                  className="flex-1 bg-mona-slate hover:bg-opacity-80 text-mona-cream rounded-md"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 