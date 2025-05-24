'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui_placeholders'; // Using placeholder UI components
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';
import monazzleContractABI from '../../../contracts/monazzle_abi.json'; // Adjust path if necessary
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { Share2Icon, LinkIcon } from 'lucide-react'; // Using lucide-react for icons

// !!! IMPORTANT: Replace with your deployed contract address !!!
const MONAZZLE_CONTRACT_ADDRESS = '0xe017111996F228D727E34adBF1B98942FbF9639C'; 
const MONAD_TESTNET_EXPLORER_BASE_URL = 'https://testnet.monadexplorer.com';

export interface PuzzleSummary {
  monazzleId: string;
  moves: number;
  hintsUsed: number;
  aiUsed: boolean;
  time: number; // in seconds
  level?: string; 
  originalImageUrl?: string; // <-- Added field for the AI-generated image URL
}

interface FinishMintFrameProps {
  summary: PuzzleSummary;
  onPlayAgain: () => void; // Callback to reset to initial frame or difficulty selection
}

export function FinishMintFrame({ summary, onPlayAgain }: FinishMintFrameProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  // const [mintTxHash, setMintTxHash] = useState<string | null>(null); // Replaced by mintData.hash directly
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [finalNftLink, setFinalNftLink] = useState<string | null>(null); 
  const [transactionLink, setTransactionLink] = useState<string | null>(null);
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null); // For Farcaster share
  const [currentMintToastId, setCurrentMintToastId] = useState<string | number | null>(null); // For managing the loading toast

  // Helper to shorten strings for toasts
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  const { address: playerAddress } = useAccount();

  const { data: mintDataHash, writeContract: mintNFT, isPending: isMintWritePending, error: mintWriteError } = useWriteContract();

  const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt, error: txError } = useWaitForTransactionReceipt({
    hash: mintDataHash,
    query: { enabled: !!mintDataHash }
  });

  useEffect(() => {
    if (mintDataHash) {
      // setMintTxHash(mintDataHash);
      setTransactionLink(`${MONAD_TESTNET_EXPLORER_BASE_URL}/tx/${mintDataHash}`);
      toast.info(`Transaction submitted: ${shortenString(mintDataHash)}. Awaiting confirmation...`);
    }
  }, [mintDataHash]);

  useEffect(() => {
    // Success case: NFT minted and event processed, or transaction confirmed even if event parsing failed
    if (isTxSuccess && txReceipt) {
      if (currentMintToastId) {
        toast.dismiss(currentMintToastId); // Dismiss the main loading toast
        setCurrentMintToastId(null);
      }
      // The existing toast messages for specific success scenarios (e.g., NFT minted, event found/not found)
      // will then appear as new, auto-dismissing toasts.
      // console.log('Transaction successful:', txReceipt);
      let eventFoundAndProcessed = false;
      try {
        for (const log of txReceipt.logs) {
          if (log.address.toLowerCase() === MONAZZLE_CONTRACT_ADDRESS.toLowerCase()) {
            const decodedLog = decodeEventLog({
              abi: monazzleContractABI, 
              data: log.data,
              topics: log.topics,
              strict: false 
            });
            if (decodedLog.eventName === 'MonazzleMinted') {
              const args = decodedLog.args as { monazzleId?: bigint; tokenId?: bigint; owner?: string; tokenURI?: string }; 
              if (args && typeof args.tokenId === 'bigint') {
                const tokenIdFromEvent = args.tokenId.toString();
                setMintedTokenId(tokenIdFromEvent);
                const nftLink = `${MONAD_TESTNET_EXPLORER_BASE_URL}/token/${MONAZZLE_CONTRACT_ADDRESS}`;
                setFinalNftLink(nftLink);
                // console.log(`NFT Minted! Token ID: ${tokenIdFromEvent}, Link: ${nftLink}`);
                toast.success(`NFT Minted! Token ID: ${tokenIdFromEvent}. Tx: ${shortenString(txReceipt.transactionHash)}`);
                // handleShareToWarpcast(nftLink); // REMOVED: Now triggered by button
                eventFoundAndProcessed = true;
                return; 
              } else {
                // console.warn('MonazzleMinted event decoded, but tokenId argument is missing or not a bigint.', args);
                toast.info('Mint event decoded, but tokenId missing. Tx: ' + shortenString(txReceipt.transactionHash));
              }
            }
          }
        }
        if (!eventFoundAndProcessed) {
            // console.warn('MonazzleMinted event not found in transaction receipt logs.');
            toast.info('Mint successful, but MonazzleMinted event not found. Tx: ' + shortenString(txReceipt.transactionHash));
            // handleShareToWarpcast(`${MONAD_TESTNET_EXPLORER_BASE_URL}/tx/${mintDataHash}`); // REMOVED: Now triggered by button
        }

      } catch (e) {
        // console.error("Error decoding event log:", e);
        toast.error(`Error decoding mint event: ${(e as Error).message}. Tx: ${shortenString(txReceipt.transactionHash)}`);
        // handleShareToWarpcast(`${MONAD_TESTNET_EXPLORER_BASE_URL}/tx/${mintDataHash}`); // REMOVED: Now triggered by button
      }
    } 
    // Error case: Transaction failed or write error occurred
    if (txError || mintWriteError) {
        if (currentMintToastId) {
          toast.dismiss(currentMintToastId); // Dismiss the main loading toast
          setCurrentMintToastId(null);
        }
        const resolvedTxError = txError as Error | null;
        const resolvedMintWriteError = mintWriteError as Error | null;
        const errorMsg = resolvedTxError?.message || resolvedMintWriteError?.message || 'An unknown error occurred during minting.';
        setMintError(errorMsg); // Keep for UI display
        // console.error("Minting failed:", errorMsg);
        toast.error(`Minting Failed: ${errorMsg}`); // This will be a new, auto-dismissing toast
    }
  }, [isTxSuccess, txReceipt, txError, mintWriteError, mintDataHash, currentMintToastId]);


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleMintNFT = async () => {
    if (!playerAddress) {
      setMintError('Please connect your wallet.'); // Keep for UI
      toast.error('Please connect your wallet to mint.');
      return;
    }
    if (!MONAZZLE_CONTRACT_ADDRESS.startsWith('0x')) { 
        setMintError('Contract address appears invalid. Please contact support.'); // Keep for UI
        // console.error('MONAZZLE_CONTRACT_ADDRESS does not start with 0x:', MONAZZLE_CONTRACT_ADDRESS);
        toast.error('Contract address invalid. Cannot mint.');
        return;
    }

    // const mintProcessToastId = toast.loading("Starting mint process..."); // Old way
    const localToastId = toast.loading("Starting mint process..."); // Use local var for updates within this function
    setCurrentMintToastId(localToastId); // Store it in state for dismissal from useEffect

    setIsMinting(true); 
    setMintError(null);
    setTransactionLink(null);
    setFinalNftLink(null);
    setMintedTokenId(null);
    // console.log(`Attempting to mint NFT for Monazzle ID: ${summary.monazzleId}`);

    try {
      toast.info("Step 1/4: Marking game as finished...", { id: localToastId });
      // console.log('Calling finish-game API...');
      
      const finishResponse = await fetch('/api/monazzle/finish-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monazzleId: summary.monazzleId,
          playerAddress: playerAddress,
          timeSpent: summary.time
        }),
      });
      
      const finishData = await finishResponse.json();
      
      if (!finishResponse.ok && !finishData.alreadyFinished) {
        toast.error(`Failed to mark game as finished: ${finishData.error || 'Unknown API error'}`, { id: localToastId });
        throw new Error(finishData.error || 'Failed to mark game as finished on blockchain');
      }
      toast.success("Step 1/4: Game finish marked!", { id: localToastId });
      // console.log('Game marked as finished:', finishData);
      
      toast.info("Step 2/4: Preparing NFT image & metadata...", { id: localToastId });
      
      if (!summary.originalImageUrl) {
        toast.error("Original image URL is missing from summary. Cannot prepare NFT image.", { id: localToastId });
        throw new Error("Original image URL missing in summary. Please ensure PuzzleFrame provides it.");
      }

      toast.info("Fetching original puzzle image for NFT...", { id: localToastId });
      let imageBlob: Blob;
      try {
        const imageResponse = await fetch(summary.originalImageUrl);
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          toast.error(`Failed to fetch original image: ${imageResponse.status} ${imageResponse.statusText}. ${errorText.substring(0, 100)}`, { id: localToastId });
          throw new Error(`Failed to fetch original image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        imageBlob = await imageResponse.blob();
        if (!imageBlob.type.startsWith('image/')) {
          toast.error(`Fetched file is not an image. MIME type: ${imageBlob.type}`, { id: localToastId });
          throw new Error(`Fetched file is not an image. MIME type: ${imageBlob.type}`);
        }
        toast.success("Original puzzle image fetched successfully!", { id: localToastId });
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown error fetching image";
        toast.error(`Error fetching original image: ${errorMessage}`, { id: localToastId });
        throw new Error(`Error fetching original image: ${errorMessage}`);
      }
      
      // Create form data for the API
      const formData = new FormData();
      // Use a generic name or derive from URL; ensure it has an extension.
      const fileName = summary.originalImageUrl.split('/').pop() || `monazzle-nft-image`;
      const fileExtension = fileName.split('.').pop() || 'png'; // default to png if no extension
      const finalFileName = fileName.includes('.') ? fileName : `${fileName}.${fileExtension}`;

      formData.append('image', new File([imageBlob], finalFileName , { type: imageBlob.type || 'image/png' }));
      formData.append('monazzleId', summary.monazzleId);
      formData.append('puzzleLevel', summary.level || 'Unknown');
      formData.append('moves', summary.moves.toString());
      formData.append('hintsUsed', summary.hintsUsed.toString());
      formData.append('time', summary.time.toString());
      formData.append('aiUsed', summary.aiUsed.toString());
      
      // Call prepare-nft API
      const prepareResponse = await fetch('/api/monazzle/prepare-nft', {
        method: 'POST',
        body: formData
      });
      
      if (!prepareResponse.ok) {
        const errorText = await prepareResponse.text();
        toast.error(`Failed to prepare NFT: ${errorText.substring(0,100)}...`, { id: localToastId });
        throw new Error('Failed to prepare NFT metadata');
      }
      
      const prepareData = await prepareResponse.json();
      if (prepareData.imageUrl) {
        setNftImageUrl(prepareData.imageUrl);
      } else if (prepareData.imageCID) { // Check for imageCID as a fallback
        const gatewayBaseUrl = 'https://ipfs.io/ipfs/'; // You can change this to your preferred IPFS gateway
        const constructedImageUrl = `${gatewayBaseUrl}${prepareData.imageCID}`;
        setNftImageUrl(constructedImageUrl);
        console.log("DEBUG: Constructed nftImageUrl from imageCID:", constructedImageUrl);
        toast.info("Image URL constructed from CID. Prepare-NFT API should ideally return a full imageUrl.");
      } else {
        console.warn("DEBUG: prepareData.imageUrl AND prepareData.imageCID are missing or falsy. prepareData:", prepareData);
        toast.info("NFT image URL not received from server. Sharing will be text-only.");
      }
      toast.success("Step 2/4: NFT prepared!", { id: localToastId });
      
      toast.info("Step 3/4: Fetching Token URI...", { id: localToastId });
      const apiResponse = await fetch(`/api/monazzle/get-token-uri?monazzleId=${summary.monazzleId}`);
      // console.log('API Response Status:', apiResponse.status);
      const responseText = await apiResponse.text();
      // console.log('API Response Text:', responseText);
      
      let apiData;
      try {
        apiData = JSON.parse(responseText);
      } catch (parseError) {
        // console.error('Failed to parse API response as JSON:', parseError);
        toast.error('Server returned invalid data for Token URI.', { id: localToastId });
        throw new Error('Invalid response format from server');
      }

      if (!apiResponse.ok || !apiData.success) {
        toast.error(`Failed to fetch tokenURI: ${apiData.error || 'Unknown API error'}`, { id: localToastId });
        throw new Error(apiData.error || 'Failed to fetch tokenURI from server.');
      }
      const tokenURI = apiData.tokenURI;
      // console.log(`Received tokenURI: ${tokenURI}`);
      toast.success(`Step 3/4: Token URI fetched: ${shortenString(tokenURI, 10,10)}`, { id: localToastId });

      if (!tokenURI || !tokenURI.startsWith('ipfs://')) {
        toast.error('Invalid tokenURI format. Must start with ipfs://', { id: localToastId }); // Update toast to error
        setCurrentMintToastId(null); // Clear toast ID as this is a terminal error for this process
        setIsMinting(false);
        throw new Error('Invalid tokenURI format received. Must start with ipfs://');
      }

      // Step 4 is the actual transaction submission. Keep it as loading.
      // The useEffect above will handle dismissing this toast upon transaction completion or error.
      toast.loading("Step 4/4: Sending mint transaction to wallet...", { id: localToastId });
      mintNFT({
        address: MONAZZLE_CONTRACT_ADDRESS,
        abi: monazzleContractABI,
        functionName: 'mintMonazzleNFT',
        args: [BigInt(summary.monazzleId), tokenURI],
      });

    } catch (err) {
      // console.error("Minting preparation failed:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to prepare minting NFT.';
      setMintError(errorMsg); // Keep for UI
      if (currentMintToastId) { // Check currentMintToastId from state
        toast.error(`Minting Preparation Failed: ${errorMsg}`, { id: currentMintToastId }); // Update the existing toast to error
        setCurrentMintToastId(null); // Clear the toast ID as the process has failed
      } else if (localToastId) { // Fallback to localToastId if currentMintToastId wasn't set or cleared prematurely
        toast.error(`Minting Preparation Failed: ${errorMsg}`, { id: localToastId });
      } else {
        toast.error(`Minting Preparation Failed: ${errorMsg}`); // Show a new error toast if no ID is available
      }
      setIsMinting(false); 
    }
  };
  
  useEffect(() => {
    setIsMinting(isMintWritePending || isTxLoading);
  }, [isMintWritePending, isTxLoading]);

  const handleShareToWarpcast = () => {
    if (!summary) {
      toast.error("Cannot share: Puzzle summary not available.");
      return;
    }
    if (!nftImageUrl) {
        toast.info("NFT Image URL not available for sharing. Cast will not include image.");
    }

    const difficultyText = summary.level || "Unknown Level";
    const timeFormatted = formatTime(summary.time);
    const aiText = summary.aiUsed ? 'Yes' : 'No';
    
    const linkToEmbedInText = finalNftLink || transactionLink || "Minting in progress or failed";

    let shareText = 
      `🔲 I Monazzled a ${difficultyText} puzzle!\n` +
      `Moves: ${summary.moves}, Time: ${timeFormatted}\n` +
      `Hints: ${summary.hintsUsed}, AI Used: ${aiText}\n` +
      `NFT: ${linkToEmbedInText}\n`;

    if (nftImageUrl) {
      shareText += `![Monazzle NFT](${nftImageUrl})\n`; // Markdown for image
    }
    // shareText += `Challenge me: /monazzle @user ${difficultyText}!`; // User commented this out
    
    let warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}`;
    
    // Add direct image embed for Farcaster clients that support it
    if (nftImageUrl) {
        warpcastUrl += `&embeds[]=${encodeURIComponent(nftImageUrl)}`;
    }

    // ---- START DEBUG LOGS ----
    // console.log("DEBUG: nftImageUrl for Farcaster cast:", nftImageUrl); // Removed for cleanup
    // console.log("DEBUG: Final warpcastUrl:", warpcastUrl); // Removed for cleanup
    // ---- END DEBUG LOGS ----

    window.open(warpcastUrl, '_blank');
    toast.info("Opening Warpcast to share...");
  };

  const cardStyle = 'bg-mona-deep-purple/70 backdrop-blur-xl border border-mona-lavender/50 rounded-2xl p-6 md:p-8 shadow-2xl w-full max-w-lg mx-auto text-center space-y-6';
  const activePuzzleSummary = summary; 

  return (
    <div className="fixed inset-0 bg-mona-charcoal/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <Toaster position="top-center" duration={3500} richColors />
      <div className={cardStyle}>
        <h1 className="text-4xl md:text-5xl font-bold text-mona-purple">Congrats!</h1>
        <div className="text-mona-cream space-y-2 text-lg">
          <p>You conquered the Monazzle!</p>
          <hr className="border-mona-slate/50 my-3"/>
        </div>

        {(isTxSuccess || finalNftLink || transactionLink) && ( // Show this section if any link is available or tx was successful
          <div className="p-3 bg-mona-purple/20 rounded-lg border border-mona-lavender space-y-3">
            <p className="text-mona-green-300 font-semibold">
              {finalNftLink ? 'NFT Minted Successfully!' : (transactionLink ? 'Mint Transaction Submitted!' : 'Processing Mint...')}
            </p>
            
            <div className="flex justify-center items-center space-x-3">
              {transactionLink && (
                <a 
                  href={transactionLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center w-12 h-12 bg-mona-violet hover:bg-mona-violet/80 text-white rounded-full transition-all duration-150 ease-in-out"
                  title="View Transaction"
                >
                  <LinkIcon size={24} />
                </a>
              )}

              {/* Show share button if transaction has been initiated or NFT minted, regardless of image URL presence initially */}
              {(isTxSuccess || finalNftLink || transactionLink) && ( 
                <Button
                  onClick={handleShareToWarpcast}
                  className="flex items-center justify-center w-12 h-12 bg-mona-blue hover:bg-mona-blue/80 text-white rounded-full transition-all duration-150 ease-in-out"
                  title="Share on Farcaster"
                >
                  <Share2Icon size={24} />
                </Button>
              )}
            </div>
            {finalNftLink && (
                 <a 
                 href={finalNftLink} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="text-xs text-mona-lavender hover:text-mona-cream underline break-all block mt-2 opacity-80 hover:opacity-100"
               >
                 (View NFT Details: {shortenString(finalNftLink, 15, 15)})
               </a>
            )}
             {!finalNftLink && transactionLink && (
                 <p className="text-xs text-mona-lavender opacity-80 mt-1">
                    {mintedTokenId ? `Token ID: ${mintedTokenId}` : "Waiting for NFT details..."}
                 </p>
            )}
          </div>
        )}
        
        {/* Fallback display for transaction link if NFT link isn't resolved but tx succeeded - covered by above section now */}
        {/* 
        {isTxSuccess && !finalNftLink && transactionLink && (
             <div className="p-3 bg-mona-purple/20 rounded-lg border border-mona-lavender">
                 <p className="text-mona-green-300 font-semibold">NFT Minted! (Event parsing may have failed or is slow)</p>
                 // ... old link display removed ...
           </div>
        )}
        */}

        {mintError && (
          <p className="text-red-400 bg-red-500/10 p-3 rounded-lg">Error: {mintError}</p>
        )}

        {!(isTxSuccess || finalNftLink) && (
          <Button
            onClick={handleMintNFT}
            disabled={isMinting}
            className="w-full max-w-xs mx-auto bg-mona-violet text-white hover:bg-mona-violet/90 py-3 text-xl font-semibold rounded-lg shadow-xl hover:scale-105 transition transform"
          >
            {isMinting ? 'Minting NFT...' : 'Mint Monazzle NFT'}
          </Button>
        )}

        <Button
            onClick={onPlayAgain}
            className="w-full max-w-xs mx-auto bg-mona-slate/50 text-mona-cream hover:bg-mona-slate/70 py-2.5 text-lg font-medium rounded-lg shadow-md hover:scale-105 transition transform"
          >
            Play Again
          </Button>
      </div>
    </div>
  );
} 