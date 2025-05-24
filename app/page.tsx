'use client'; // This page will now be a client component due to state and hooks

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi'; // Import useAccount
// import { Metadata } from "next"; // Commented out or removed
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";
import { Toaster, toast } from 'sonner'; // Import Toaster and toast

// Import Frame Components
// import { ConnectAndTopUpFrame } from '@/app/components/monazzle/ConnectAndTopUpFrame'; // Original connect frame, now replaced by ConnectWalletFrame and ProfileFrame for wallet info
import { PuzzleFrame } from '@/app/components/monazzle/PuzzleFrame';
import { FinishMintFrame, PuzzleSummary } from '@/app/components/monazzle/FinishMintFrame';
import { FooterNav } from '@/app/components/monazzle/FooterNav'; 
import { ConnectWalletFrame } from '@/app/components/monazzle/ConnectWalletFrame'; 
import { ProfileFrame } from '@/app/components/monazzle/ProfileFrame'; 
import { PlaySetupFrame } from '@/app/components/monazzle/PlaySetupFrame'; 
import { HistoryFrame } from '@/app/components/monazzle/HistoryFrame'; 
import { ChallengesFrame } from '@/app/components/monazzle/ChallengesFrame'; 
// Import new Modals
import { ImagePreviewModal } from '@/app/components/monazzle/ImagePreviewModal';
import { DifficultySelectionModal } from '@/app/components/monazzle/DifficultySelectionModal';
import HomeFrame from "@/app/components/monazzle/HomeFrame"; 
// PuzzleBoard import is no longer needed here, as PuzzleFrame handles it.
// import PuzzleBoard, { Difficulty as PuzzleDifficultyType } from '@/components/PuzzleBoard'; 

// Define Navigational Tabs (for Footer)
export enum NavigationTab {
  PLAY = 'PLAY',
  CHALLENGES = 'CHALLENGES',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
  PROFILE = 'PROFILE',
}

// Updated AppFrame enum
export enum AppFrame {
  HOME, 
  CONNECT_WALLET,
  PLAY_SETUP,
  PLAY_PUZZLE,
  FINISH_MINT,
  PROFILE_VIEW,
  HOW_TO_PLAY_VIEW,
  CHALLENGES_VIEW,
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export default function MonazzlePage() {
  const [currentFrame, setCurrentFrame] = useState<AppFrame>(AppFrame.HOME); 
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.PLAY);
  
  // Use wagmi's useAccount for primary connection status and EOA address
  const { address: wagmiEoaAddress, isConnected: isWagmiConnected, status: wagmiStatus } = useAccount();

  // Local state for AA address (still needed as it's derived based on EOA)
  const [aaAddress, setAaAddress] = useState<string | null>(null);
  // Local EOA address can mirror wagmi's, useful for passing down or if needed before wagmi syncs
  const [localEoaAddress, setLocalEoaAddress] = useState<string | null>(wagmiEoaAddress || null);

  // States for the new modal flow
  const [imageForPreview, setImageForPreview] = useState<string | null>(null);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState<boolean>(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState<boolean>(false);

  // Final states for starting the puzzle
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);
  const [currentMonazzleId_string, setCurrentMonazzleId_string] = useState<string | null>(null); // String version for UI/logging if needed
  const [onChainPuzzleId, setOnChainPuzzleId] = useState<bigint | null>(null); // New state for on-chain bigint ID
  const [activePuzzleSummary, setActivePuzzleSummary] = useState<PuzzleSummary | null>(null);

  // Helper to shorten strings for toasts (if needed)
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  // Effect to react to changes in wagmi's connection status
  useEffect(() => {
    // console.log("Wagmi status changed:", { isWagmiConnected, wagmiEoaAddress, wagmiStatus });

    if (wagmiStatus !== 'connected' && wagmiStatus !== 'disconnected') {
      // console.log("Wagmi status is intermediate, skipping state updates:", wagmiStatus);
      return;
    }

    setLocalEoaAddress(wagmiEoaAddress || null);

    if (isWagmiConnected && wagmiEoaAddress) {
      if (currentFrame === AppFrame.CONNECT_WALLET || currentFrame === AppFrame.HOME) {
        toast.info("Wallet connected, loading play setup...");
        setCurrentFrame(AppFrame.PLAY_SETUP);
        setActiveTab(NavigationTab.PLAY);
      }
    } else {
      // console.log("Wagmi reports disconnected. Setting frame to CONNECT_WALLET.");
      if (currentFrame !== AppFrame.HOME) { // Avoid immediate toast if already on HOME and disconnected
        toast.info("Wallet disconnected. Please connect to continue.");
      }
      setAaAddress(null); 
      setImageForPreview(null);
      setShowImagePreviewModal(false);
      setShowDifficultyModal(false);
      setGeneratedImageUrl(null);
      setSelectedDifficulty(null);
      setCurrentMonazzleId_string(null);
      setOnChainPuzzleId(null);
      setActivePuzzleSummary(null);
      
      if (currentFrame !== AppFrame.HOME) { // Don't force away from HOME immediately if that's the initial load
          setCurrentFrame(AppFrame.CONNECT_WALLET);
      }
    }
  }, [isWagmiConnected, wagmiEoaAddress, wagmiStatus, currentFrame]); // Added currentFrame back as it's used in conditions

  const handleWalletConnected = (connectedEoaAddress: string, connectedAaAddress: string) => {
    // This function is called by ConnectWalletFrame after it confirms connection and derives AA
    // console.log("handleWalletConnected (from ConnectWalletFrame):", { connectedEoaAddress, connectedAaAddress });
    toast.success(`Wallet connected: ${shortenString(connectedEoaAddress)}`);
    setLocalEoaAddress(connectedEoaAddress); 
    setAaAddress(connectedAaAddress);
    setCurrentFrame(AppFrame.PLAY_SETUP); 
    setActiveTab(NavigationTab.PLAY);
  };

  const handleHomeTimeout = () => {
    if (!isWagmiConnected) { // Use wagmi's status
      setCurrentFrame(AppFrame.CONNECT_WALLET);
    } else {
      setCurrentFrame(AppFrame.PLAY_SETUP);
      setActiveTab(NavigationTab.PLAY);
    }
  };

  const handleWalletDisconnected = () => {
    // This function is called by ProfileFrame's onDisconnect *before* wagmi's disconnect()
    // console.log("handleWalletDisconnected (from ProfileFrame): Order implies wagmi disconnect follows.");
    // The useEffect listening to isWagmiConnected should handle the state reset and frame change.
    setLocalEoaAddress(null);
    setAaAddress(null);
    // setCurrentFrame(AppFrame.CONNECT_WALLET); // Let useEffect handle this
    // console.log("Local EOA and AA cleared by handleWalletDisconnected.");
    // Toast for disconnect is handled by ProfileFrame or the useEffect above.
  };

  // Called by PlaySetupFrame when image is ready for modal preview
  const handleImageGeneratedForPreview = (imageUrl: string, altText: string | undefined, onChainId: bigint) => {
    setImageForPreview(imageUrl);
    setOnChainPuzzleId(onChainId); // Store the on-chain ID
    // We can still generate a string ID for other purposes if needed
    setCurrentMonazzleId_string(`monazzle_onchain_${onChainId.toString()}_${Date.now()}`); 
    setShowImagePreviewModal(true);
  };

  // Called from ImagePreviewModal to close it
  const handleCloseImagePreview = () => {
    setShowImagePreviewModal(false);
  };

  // Called from ImagePreviewModal to proceed to difficulty selection
  const handleStartPlayingFromPreview = () => {
    setShowImagePreviewModal(false);
    if (!imageForPreview) {
      // console.error("Attempted to start playing without an image for preview.");
      toast.error("Cannot start playing: Image not available. Please try generating again.");
      setCurrentFrame(AppFrame.PLAY_SETUP); 
      return;
    }
    setShowDifficultyModal(true);
  };

  // Called from DifficultySelectionModal to close it
  const handleCloseDifficultyModal = () => {
    setShowDifficultyModal(false);
  };

  // Called from DifficultySelectionModal to confirm difficulty and start the game
  const handleConfirmDifficultyAndStart = (difficulty: Difficulty) => {
    setShowDifficultyModal(false);
    if (!imageForPreview || !onChainPuzzleId) { // Check for onChainPuzzleId
      // console.error("Image for preview or onChainPuzzleId was lost before confirming difficulty.");
      toast.error("Cannot start game: Critical data missing. Please try generating again.");
      setCurrentFrame(AppFrame.PLAY_SETUP); 
      return;
    }
    setGeneratedImageUrl(imageForPreview); 
    setSelectedDifficulty(difficulty); 
    
    setLocalEoaAddress(wagmiEoaAddress || null); 
    setCurrentFrame(AppFrame.PLAY_PUZZLE);
    // console.log(`Starting Monazzle with difficulty: ${difficulty}, image: ${imageForPreview}, EOA: ${wagmiEoaAddress}, AA: ${aaAddress}, OnChainID: ${onChainPuzzleId}`);
    toast.info(`Starting ${difficulty} Monazzle puzzle...`);
  };

  // This function is now effectively REDUNDANT because PuzzleFrame calls onNavigateToFinish directly with its own summary.
  // The handlePuzzleBoardSolved within PuzzleFrame triggers its own useEffect to call onNavigateToFinish.
  // Keeping it commented out for reference, but it should be removed if PuzzleFrame handles the summary entirely.
  /*
  const handlePuzzleSolved = () => {
    console.log("Puzzle Solved in page.tsx! This will be handled by PuzzleFrame now.");
    // This logic is now inside PuzzleFrame's useEffect when isPuzzleComponentSolved is true.
    // if (generatedImageUrl && selectedDifficulty && currentMonazzleId && localEoaAddress) {
    //   const summary: PuzzleSummary = {
    //     monazzleId: currentMonazzleId,
    //     // These were incorrect for the actual PuzzleSummary type:
    //     // imageUrl: generatedImageUrl, 
    //     // difficulty: selectedDifficulty,
    //     // playerAddress: localEoaAddress, 
    //     // status: 'completed',
    //     // datePlayed: new Date().toISOString(),

    //     // These are correct, but PuzzleFrame will provide them:
    //     moves: 0, // Placeholder, as PuzzleFrame will manage this
    //     time: 0, // Placeholder, as PuzzleFrame will manage this
    //     hintsUsed: 0, // Placeholder
    //     aiUsed: false // Placeholder
    //   };
    //   setActivePuzzleSummary(summary);
    //   setCurrentFrame(AppFrame.FINISH_MINT);
    // } else {
    //   console.error("Missing data to finalize puzzle summary in page.tsx. Navigating back to setup.");
    //   setCurrentFrame(AppFrame.PLAY_SETUP);
    // }
  };
  */

  const handleGiveUp = () => {
    // console.log("User gave up the puzzle.");
    toast.info("Puzzle abandoned. You can start a new one!");
    setSelectedDifficulty(null);
    setCurrentMonazzleId_string(null);
    setOnChainPuzzleId(null);
    setCurrentFrame(AppFrame.PLAY_SETUP); 
    setActiveTab(NavigationTab.PLAY);
  };

  const handleNavigateToFinish = (summary: PuzzleSummary) => {
    // console.log("Puzzle finished, navigating to mint screen with summary:", summary);
    toast.success("Puzzle complete! Proceeding to mint your achievement.");
    setActivePuzzleSummary(summary);
    setCurrentFrame(AppFrame.FINISH_MINT);
  };

  const handlePlayAgain = () => {
    // console.log("User wants to play again.");
    toast.info("Let's play again! Setting up a new game...");
    setImageForPreview(null);
    setGeneratedImageUrl(null);
    setSelectedDifficulty(null);
    // setCurrentMonazzleId(null); // Old string ID
    setCurrentMonazzleId_string(null);
    setOnChainPuzzleId(null); // Reset on-chain ID
    setActivePuzzleSummary(null);
    setCurrentFrame(AppFrame.PLAY_SETUP);
    setActiveTab(NavigationTab.PLAY);
  };
  
  const handleTabChange = (tab: NavigationTab) => {
    if (!isWagmiConnected) { // Use wagmi's status
      return; 
    }
    setActiveTab(tab);
    setShowImagePreviewModal(false);
    setShowDifficultyModal(false);

    switch (tab) {
      case NavigationTab.PLAY:
        setCurrentFrame(AppFrame.PLAY_SETUP);
        break;
      case NavigationTab.PROFILE:
        setCurrentFrame(AppFrame.PROFILE_VIEW);
        break;
      case NavigationTab.HOW_TO_PLAY:
        setCurrentFrame(AppFrame.HOW_TO_PLAY_VIEW);
        break;
      case NavigationTab.CHALLENGES:
        setCurrentFrame(AppFrame.CHALLENGES_VIEW);
        break;
      default:
        setCurrentFrame(AppFrame.PLAY_SETUP);
    }
  };

  useEffect(() => {
    if (currentFrame === AppFrame.HOME || currentFrame === AppFrame.CONNECT_WALLET) {
      setCurrentFrame(AppFrame.PLAY_SETUP);
      setActiveTab(NavigationTab.PLAY);
    }
  }, [currentFrame]);

  const renderCurrentFrame = () => {
    /* console.log("Rendering frame - Top:", { 
      currentFrame, 
      isWagmiConnected,
      wagmiEoaAddress,
      localEoaAddress,
      aaAddress,
      activeTab,
      generatedImageUrl, 
      selectedDifficulty 
    }); */

    if (!isWagmiConnected) { 
      if (currentFrame === AppFrame.HOME) { 
        // console.log("Not connected, rendering HomeFrame.");
        return <HomeFrame onTimeout={handleHomeTimeout} />; 
      }
      // console.log("Not connected, rendering ConnectWalletFrame.");
      return <ConnectWalletFrame onWalletConnected={handleWalletConnected} />;
    }

    if (!wagmiEoaAddress) {
        // console.warn("Wagmi connected but no EOA address. Showing ConnectWalletFrame.");
        toast.error("Wallet connected, but address not found. Please reconnect or try a different wallet.");
        return <ConnectWalletFrame onWalletConnected={handleWalletConnected} />;
    }
    
    if (currentFrame === AppFrame.HOME || currentFrame === AppFrame.CONNECT_WALLET) {
        // console.log("Connected, but on HOME/CONNECT_WALLET frame, redirecting to PLAY_SETUP");
        return <p>Loading...</p>; 
    }

    switch (currentFrame) {
      case AppFrame.PLAY_PUZZLE:
        if (generatedImageUrl && selectedDifficulty && onChainPuzzleId && localEoaAddress !== undefined) { 
          return (
            <PuzzleFrame
              eoaAddress={localEoaAddress} 
              aaAddress={aaAddress}       
              monazzleId={onChainPuzzleId} // Pass onChainPuzzleId (bigint)
              imageUrl={generatedImageUrl} 
              difficulty={selectedDifficulty} 
              onGiveUp={handleGiveUp}
              onNavigateToFinish={handleNavigateToFinish} 
            />
          );
        }
        toast.error("Error starting puzzle: Missing critical data. Redirecting to setup.");
        setCurrentFrame(AppFrame.PLAY_SETUP); 
        return <PlaySetupFrame onImageGeneratedForPreview={handleImageGeneratedForPreview} onGoToProfile={() => { setCurrentFrame(AppFrame.PROFILE_VIEW); setActiveTab(NavigationTab.PROFILE); }} />; 
      case AppFrame.FINISH_MINT:
        if (!activePuzzleSummary || !onChainPuzzleId) { 
          toast.error("Error loading results: Missing puzzle summary. Redirecting.");
          setTimeout(() => setCurrentFrame(AppFrame.PLAY_SETUP), 0); 
          return <p>Error: Missing puzzle summary. Redirecting...</p>;
        }
        return <FinishMintFrame summary={{
          ...activePuzzleSummary, 
          monazzleId: onChainPuzzleId.toString(),
          level: selectedDifficulty || undefined 
        }} onPlayAgain={handlePlayAgain} />;
      case AppFrame.PLAY_SETUP:
        return <PlaySetupFrame onImageGeneratedForPreview={handleImageGeneratedForPreview} onGoToProfile={() => { setCurrentFrame(AppFrame.PROFILE_VIEW); setActiveTab(NavigationTab.PROFILE); }} />;
      case AppFrame.PROFILE_VIEW:
        return <ProfileFrame 
                  eoaAddress={localEoaAddress} 
                  onDisconnect={handleWalletDisconnected}
                />;
      case AppFrame.HOW_TO_PLAY_VIEW:
        return (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="bg-mona-charcoal/80 border border-mona-lavender/30 rounded-2xl shadow-2xl p-8 max-w-xl w-full text-center">
              <h2 className="text-3xl mb-6 text-mona-purple font-bold">How To Play + Costs</h2>
              <blockquote className="max-w-xl mx-auto text-center italic text-mona-cream border-l-4 border-mona-purple pl-4">
                Initialize and fund your AA wallet with enough MON tokens, then generate or use “Surprise Me” to get your puzzle, solve it as quickly as you can (using hints or AI solve if needed), mint your NFT after finishing to save your achievement on-chain, and cast your puzzle on Farcaster.
                <hr className="border-mona-slate/30" />
                Hint: Reveals full puzzle for 5 seconds
                <br></br>
                AI Solve:  Auto-solves the entire puzzle
              </blockquote>
              <div className="mt-4 text-mona-light-gray text-base text-left bg-mona-deep-purple/40 rounded-xl p-4">
                <strong className="block mb-2 text-mona-purple">Costs:</strong>
                <ul className="list-disc list-inside space-y-1">
                  <li>Puzzle Generation: <span className="text-mona-green-300">0.002 MON</span></li>
                  <li>Hint + fees: <span className="text-mona-green-300">0.11 MON [Puzzle revealed for 5 sec]</span></li>
                  <li>AI Solve + fees: <span className="text-mona-green-300">1.01 MON [Puzzle autosolved]</span></li>
                  <li>Minting NFT: <span className="text-mona-green-300">(gas only)</span></li>
                </ul>
              </div>
            </div>
          </div>
        );
      case AppFrame.CHALLENGES_VIEW:
        return <div className="text-center p-8"><h2 className="text-2xl mb-4">Challenges</h2><p>Challenge notifications.</p></div>;
      default:
        // console.warn("Unknown application state, defaulting to PLAY_SETUP as connected.");
        toast.info("Unknown application state. Redirecting to Play Setup.");
        setTimeout(() => {
            setCurrentFrame(AppFrame.PLAY_SETUP);
            setActiveTab(NavigationTab.PLAY);
        },0);
        return <p>Loading...</p>;
    }
  };

  const FrameContainer: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <main className="flex flex-col items-center justify-center flex-grow bg-gradient-to-br from-mona-deep-purple via-mona-charcoal to-mona-deep-purple text-mona-cream p-4 md:p-8 relative overflow-y-auto">
        {children}
    </main>
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Toaster position="top-center" duration={3500} richColors />
      <div className="flex-grow flex flex-col overflow-y-auto"> {/* Ensure this allows content to scroll if needed */}
        <FrameContainer>
            {renderCurrentFrame()}
        </FrameContainer>
      </div>
      
      {isWagmiConnected && wagmiEoaAddress && ( // Show footer only if truly connected
        <FooterNav activeTab={activeTab} onNavigate={handleTabChange} />
      )}

      <ImagePreviewModal 
        isOpen={showImagePreviewModal}
        imageUrl={imageForPreview}
        onClose={handleCloseImagePreview}
        onStartPlaying={handleStartPlayingFromPreview}
      />

      <DifficultySelectionModal 
        isOpen={showDifficultyModal}
        onClose={handleCloseDifficultyModal}
        onConfirmDifficulty={handleConfirmDifficultyAndStart}
      />

    </div>
  );
}