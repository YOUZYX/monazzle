'use client';

import React, { useState, useContext, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from './ui_placeholders';
import { Sparkles, Shuffle } from 'lucide-react';
import { ZeroDevContext } from '@/context/zeroDev';
import { parseAbi, encodeFunctionData, keccak256, stringToBytes, decodeEventLog } from 'viem';
import monazzleAbi from '@/contracts/monazzle_abi.json';
import { Toaster, toast } from 'sonner';

const MIN_AA_BALANCE = BigInt(0.002 * 1e18); // 0.002 MON

interface PlaySetupFrameProps {
  onImageGeneratedForPreview: (imageUrl: string, altText: string | undefined, onChainMonazzleId: bigint) => void;
  onGoToProfile: () => void;
}

export function PlaySetupFrame({ onImageGeneratedForPreview, onGoToProfile }: PlaySetupFrameProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Helper to shorten strings for toasts
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  // Access AA wallet and helpers
  const {
    smartAccountAddress,
    kernelClient,
    kernelAccount,
    getSmartAccountBalance,
    isSmartAccountReady,
  } = useContext(ZeroDevContext);

  // Use the provided contract address and ABI
  const contractAddress = '0xe017111996F228D727E34adBF1B98942FbF9639C';

  // Helper: Check AA balance and prompt top-up if needed
  const ensureAABalance = async () => {
    if (!getSmartAccountBalance) throw new Error('AA wallet not ready');
    const balance = await getSmartAccountBalance();
    if (balance < MIN_AA_BALANCE) {
      toast.error('AA wallet balance too low (needs 0.002 MON). Please top up.');
      setShowTopUpModal(true);
      throw new Error('AA wallet balance too low. Please top up.');
    }
  };

  // Handler for puzzle generation (on-chain)
  const handleGenerate = async (mode: 'prompt' | 'surprise') => {
    setIsLoadingImage(true);
    setError(null);
    let toastId: string | number | undefined = undefined;

    try {
      toastId = toast.loading("Initializing puzzle generation...");
      // 1. Get prompt
      let puzzlePrompt = '';
      if (mode === 'surprise') {
        puzzlePrompt = 'Surprise me!';
      } else if (prompt.trim()) {
        puzzlePrompt = prompt.trim();
      } else {
        setError('Please enter a prompt or use Surprise Me.');
        toast.error('Please enter a prompt or use Surprise Me.', { id: toastId });
        setIsLoadingImage(false);
        return;
      }

      // 2. Check AA balance
      toast.info("Step 1/4: Checking Smart Account balance...", { id: toastId });
      await ensureAABalance(); // This will throw and show its own toast if balance is low
      toast.success("Smart Account balance OK!", { id: toastId });

      // 3. Commit image (on-chain)
      if (!kernelClient || !kernelAccount || !smartAccountAddress) {
        toast.error("Smart Account not ready. Please reconnect.", { id: toastId });
        throw new Error('AA wallet not ready');
      }
      toast.info("Step 2/4: Committing image to blockchain...", { id: toastId });
      const imageHash = keccak256(stringToBytes(puzzlePrompt));
      const commitCalldata = encodeFunctionData({
        abi: monazzleAbi,
        functionName: 'commitImage',
        args: [imageHash],
      });
      const commitCallData = await kernelAccount.encodeCalls([
        { to: contractAddress, value: 0n, data: commitCalldata },
      ]);
      const commitUserOpHash = await kernelClient.sendUserOperation({ callData: commitCallData });
      const commitReceipt = await kernelClient.waitForUserOperationReceipt({ hash: commitUserOpHash });
      toast.success(`Image committed! Tx: ${shortenString(commitReceipt.transactionHash)}`, { id: toastId });

      // 4. Parse MonazzleCommitted event for monazzleId
      toast.info("Parsing transaction for Monazzle ID...", { id: toastId });
      let monazzleId: bigint | null = null;
      const eventSig = 'MonazzleCommitted(uint256,bytes32)';
      const eventTopic = keccak256(stringToBytes(eventSig));
      for (const log of commitReceipt.logs) {
        try {
          const parsed = decodeEventLog({
            abi: monazzleAbi,
            data: log.data,
            topics: log.topics,
          });
          if (
            parsed.eventName === 'MonazzleCommitted' &&
            parsed.args &&
            typeof parsed.args === 'object' &&
            'monazzleId' in parsed.args
          ) {
            monazzleId = (parsed.args as any).monazzleId as bigint;
            break;
          }
        } catch {}
      }
      if (!monazzleId) {
        toast.error("Failed to get Monazzle ID from blockchain event.", { id: toastId });
        throw new Error('Failed to get monazzleId from commitImage event.');
      }
      toast.success(`Monazzle ID ${monazzleId.toString()} obtained!`, { id: toastId });

      // 5. Start monazzle (on-chain)
      toast.info("Step 3/4: Starting Monazzle on blockchain...", { id: toastId });
      const startCalldata = encodeFunctionData({
        abi: monazzleAbi,
        functionName: 'startMonazzle',
        args: [monazzleId, 1],
      });
      const startCallData = await kernelAccount.encodeCalls([
        { to: contractAddress, value: 0n, data: startCalldata },
      ]);
      const startUserOpHash = await kernelClient.sendUserOperation({ callData: startCallData });
      const startReceipt = await kernelClient.waitForUserOperationReceipt({ hash: startUserOpHash });
      toast.success(`Monazzle started! Tx: ${shortenString(startReceipt.transactionHash)}`, { id: toastId });

      // 6. Optionally, fetch the generated image from your backend or contract event
      toast.info("Step 4/4: Generating puzzle image via API...", { id: toastId });
      const fetchUrl = `/api/monazzle/generate?mode=${mode}&prompt=${encodeURIComponent(puzzlePrompt)}`;
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || `API Error: Failed to generate image (Status: ${response.status})`, { id: toastId });
        throw new Error(errorData.error || `Failed to generate image. Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.imageUrl) {
        if (monazzleId !== null) { 
          onImageGeneratedForPreview(data.imageUrl, data.altText, monazzleId);
          toast.success("Puzzle image ready for preview!", { id: toastId });
        } else {
          toast.error("Critical: On-chain Monazzle ID was lost before image preview.", { id: toastId });
          throw new Error('On-chain monazzleId was not obtained after commitImage.');
        }
      } else {
        toast.error(data.error || "API Error: Image URL not found in response.", { id: toastId });
        throw new Error(data.error || 'Image URL not found in response.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not generate puzzle.';
      setError(errorMessage); // Keep this for UI display
      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    }
    setIsLoadingImage(false);
  };

  useEffect(() => {
    // Check if Generate or Surprise are deactivated and AA wallet is not initialized
    if ((!prompt.trim() || !isSmartAccountReady) && !isSmartAccountReady) {
      setShowPopup(true);
    }
  }, [prompt, isSmartAccountReady]);

  const handleRedirectToProfile = () => {
    onGoToProfile();
  };

  const glassCardStyle = 'bg-white/10 backdrop-blur-xl border border-mona-lavender/30 rounded-2xl p-6 shadow-2xl w-full';

  return (
    <div className="p-4 md:p-8 max-w-xl mx-auto w-full space-y-6">
      <Toaster position="top-center" duration={3500} richColors />
      <Card className={`${glassCardStyle} text-center`}>
        <CardHeader>
          <CardTitle className="text-mona-cream text-2xl md:text-3xl font-semibold">Craft Your Puzzle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your puzzle image..."
            className="w-full bg-mona-charcoal/70 border-mona-slate text-mona-cream focus:ring-mona-purple focus:border-mona-purple p-3.5 rounded-lg text-md shadow-inner min-h-[80px] resize-none"
            disabled={isLoadingImage}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleGenerate('prompt')}
              disabled={isLoadingImage || !prompt.trim() || !isSmartAccountReady}
              className="bg-mona-lavender text-mona-deep-purple hover:bg-mona-lavender/90 py-3 font-semibold rounded-lg shadow-md flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Sparkles size={18} />
              <span>{isLoadingImage && prompt.trim() ? 'Creating...' : 'Generate'}</span>
            </Button>
            <Button
              onClick={() => handleGenerate('surprise')}
              disabled={isLoadingImage || !isSmartAccountReady}
              className="bg-mona-violet text-white hover:bg-mona-violet/90 py-3 font-semibold rounded-lg shadow-md flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Shuffle size={18} />
              <span>{isLoadingImage && !prompt.trim() ? 'Creating...' : 'Surprise Me'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-red-400 bg-red-500/20 p-3 rounded-lg text-center text-sm">{error}</p>
      )}

      {isLoadingImage && (
        <div className="text-center text-mona-lavender p-3">
          <p className="text-lg animate-pulse">Brewing your image...</p>
        </div>
      )}

      {/* Top-up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-mona-charcoal p-8 rounded-xl shadow-2xl text-center">
            <h2 className="text-xl text-mona-cream mb-4">AA Wallet Balance Too Low</h2>
            <p className="text-mona-light-gray mb-6">You need at least 0.002 MON in your smart account to generate a puzzle.</p>
            <Button
              className="bg-mona-purple text-white px-6 py-2 rounded-lg"
              onClick={() => setShowTopUpModal(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

{showPopup && (
  <>
    {/* blurred backdrop */}
    <div
      className="
        fixed inset-0
        bg-black/30
        backdrop-blur-md
        z-40
      "
    />

    {/* centered modal with side padding */}
    <div
      className="
        fixed inset-0
        flex items-center justify-center
        px-4            /* ← 1rem padding on left/right */
        z-50
        pointer-events-none
      "
    >
      <div
        className="
          bg-mona-charcoal
          p-6
          rounded-xl
          shadow-2xl
          text-center
          pointer-events-auto
          max-w-md       /* ← cap width at ~28rem */
          w-full         /* ← let it shrink down on small screens */
        "
      >
        <h2 className="text-xl text-mona-cream mb-4">
          Feature Deactivated
        </h2>
        <p className="text-mona-light-gray mb-6">
          Check if your AA wallet is already initialized and has enough funds to play.
        </p>
        <Button
          className="bg-mona-purple text-white px-6 py-2 rounded-lg"
          onClick={handleRedirectToProfile}
        >
          Go to Profile
        </Button>
      </div>
    </div>
  </>
)}



    </div>
  );
} 