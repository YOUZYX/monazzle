'use client';

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Button } from './ui_placeholders';
import { Difficulty } from '../../page'; // Assuming AppFrame might be useful for some internal logic or logging
import { PuzzleSummary } from './FinishMintFrame'; 
import { Lightbulb, BrainCircuit, RotateCcw, FlagOff } from 'lucide-react';
import PuzzleBoard, { Difficulty as PuzzleDifficultyType } from '@/components/PuzzleBoard'; // Import PuzzleBoard
import { ZeroDevContext } from '@/context/zeroDev';
import { Toaster, toast } from 'sonner'; // Import Toaster and toast
import { AppFrame } from '@/app/lib/appFrame';
// Tile interface and related logic for tile slicing can be removed if PuzzleBoard handles its own display.
// interface Tile { ... }

interface PuzzleFrameProps {
  imageUrl: string;
  difficulty: Difficulty;
  monazzleId: bigint;
  eoaAddress: string | null; // Added eoaAddress
  aaAddress: string | null;  // Added aaAddress
  onNavigateToFinish: (summary: PuzzleSummary) => void;
  onGiveUp: () => void;
  // Removed: children prop, as PuzzleBoard will be directly integrated
}

// getGridSize might still be useful if some UI elements in PuzzleFrame depend on it, otherwise remove.
/*
const getGridSize = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'Easy': return 3;
    case 'Medium': return 4;
    case 'Hard': return 5;
    default: return 3;
  }
};
*/

export function PuzzleFrame({
  imageUrl,
  difficulty,
  monazzleId,
  eoaAddress, // Added
  aaAddress,  // Added
  onNavigateToFinish,
  onGiveUp
}: PuzzleFrameProps) {
  // const gridSize = getGridSize(difficulty); // Potentially remove if not used elsewhere in this frame
  // const totalTiles = gridSize * gridSize; // Potentially remove

  // const [tiles, setTiles] = useState<Tile[]>([]); // Removed, PuzzleBoard handles tiles
  const [moves, setMoves] = useState(0); // This will now be updated by PuzzleBoard
  const [time, setTime] = useState(0);
  const [isPuzzleComponentSolved, setIsPuzzleComponentSolved] = useState(false); 
  const [isLoadingAction, setIsLoadingAction] = useState(false); 
  const [hintsUsed, setHintsUsed] = useState(0);
  const [aiUsed, setAiUsed] = useState(false);
  const [finalMovesFromBoard, setFinalMovesFromBoard] = useState(0); // Store final moves from PuzzleBoard
  const [showHintImage, setShowHintImage] = useState(false); // Show solved image overlay
  const [aiSolving, setAiSolving] = useState(false); // Track if AI is solving
  const [txError, setTxError] = useState<string | null>(null);
  const [aaBalance, setAaBalance] = useState<bigint>(BigInt(0));

  // Get ZeroDevContext for on-chain interactions
  const { 
    requestHint: requestHintOnChain, 
    activateAISolver: activateAISolverOnChain,
    getSmartAccountBalance 
  } = useContext(ZeroDevContext);

  // Timer logic
  useEffect(() => {
    if (isPuzzleComponentSolved) return; 
    const timerInterval = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [isPuzzleComponentSolved]);

  // Fetch AA wallet balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await getSmartAccountBalance();
        setAaBalance(balance);
        // console.log(`AA wallet balance: ${balance} wei`); // Replaced with toast for significant updates if needed, or removed for polling
      } catch (error) {
        // console.error("Error fetching AA wallet balance:", error);
        toast.error(`Error fetching AA balance: ${(error as Error).message}`);
      }
    };

    // Fetch initially and every 15 seconds
    fetchBalance();
    const balanceInterval = setInterval(fetchBalance, 15000);
    return () => clearInterval(balanceInterval);
  }, [getSmartAccountBalance]);

  // Callback for PuzzleBoard to update moves in real-time
  const handlePuzzleMove = useCallback((newMoveCount: number) => {
    setMoves(newMoveCount);
  }, []);

  const handlePuzzleBoardSolved = useCallback((movesFromBoard: number) => {
    // console.log(`PuzzleBoard component reported solved within PuzzleFrame with ${movesFromBoard} moves.`);
    toast.info(`Puzzle solved internally with ${movesFromBoard} moves. Preparing summary.`);
    setFinalMovesFromBoard(movesFromBoard); // Store the final moves from PuzzleBoard
    setMoves(movesFromBoard); // Also update the displayed moves to the final count
    setIsPuzzleComponentSolved(true);
  }, []);

  // Effect to call onNavigateToFinish when isPuzzleComponentSolved is true
  useEffect(() => {
    if (isPuzzleComponentSolved) {
      const summary: PuzzleSummary = { 
        monazzleId: monazzleId.toString(),
        moves: finalMovesFromBoard,
        hintsUsed, 
        aiUsed, 
        time,
        originalImageUrl: imageUrl,
        level: difficulty
      };
      const timeoutId = setTimeout(() => onNavigateToFinish(summary), 500); 
      return () => clearTimeout(timeoutId);
    }
  }, [isPuzzleComponentSolved, monazzleId, finalMovesFromBoard, hintsUsed, aiUsed, time, imageUrl, difficulty, onNavigateToFinish]);


  // --- Updated Puzzle Actions for on-chain interactions ---
  const requestHint = async () => {
    if (isPuzzleComponentSolved || isLoadingAction) return;
    setIsLoadingAction(true);
    setTxError(null);
    
    const hintToastId = toast.loading("Requesting hint...");
    try {
      // Call the contract function through ZeroDevContext
      // console.log(`Requesting hint for Monazzle #${monazzleId}`);
      const receipt = await requestHintOnChain(monazzleId);
      // console.log("Hint request transaction completed:", receipt);
      toast.success(`Hint received! Tx: ${shortenString(receipt.transactionHash)}`, { id: hintToastId });
      
      // Show the hint UI (original functionality)
      setShowHintImage(true);
      setHintsUsed(prev => prev + 1);
      
      // Refresh the balance
      const newBalance = await getSmartAccountBalance();
      setAaBalance(newBalance);
      
      // Hide the hint after 5 seconds
      setTimeout(() => {
        setShowHintImage(false);
        setIsLoadingAction(false);
      }, 5000);
    } catch (error) {
      // console.error("Error requesting hint:", error);
      toast.error(`Error requesting hint: ${(error as Error).message}`, { id: hintToastId });
      setTxError(error instanceof Error ? error.message : "Failed to request hint");
      setIsLoadingAction(false);
    }
  };

  const activateAISolver = async () => {
    if (isPuzzleComponentSolved || isLoadingAction) return;
    setIsLoadingAction(true);
    setTxError(null);
    
    const aiToastId = toast.loading("Activating AI solver...");
    try {
      // Call the contract function through ZeroDevContext
      // console.log(`Activating AI solver for Monazzle #${monazzleId}`);
      const receipt = await activateAISolverOnChain(monazzleId);
      // console.log("AI solver activation transaction completed:", receipt);
      toast.success(`AI solver activated! Tx: ${shortenString(receipt.transactionHash)}`, { id: aiToastId });
      
      // Show AI solving UI and mark puzzle as solved by AI
      setAiSolving(true);
      setAiUsed(true);
      
      // Refresh the balance
      const newBalance = await getSmartAccountBalance();
      setAaBalance(newBalance);
      
      // Simulate the AI solving process
      setTimeout(() => {
        handlePuzzleBoardSolved(moves);
        setIsLoadingAction(false);
      }, 1500); // Slightly longer for dramatic effect
    } catch (error) {
      // console.error("Error activating AI solver:", error);
      toast.error(`Error activating AI solver: ${(error as Error).message}`, { id: aiToastId });
      setTxError(error instanceof Error ? error.message : "Failed to activate AI solver");
      setIsLoadingAction(false);
      setAiSolving(false);
    }
  };
  
  const handleShuffle = () => {
      if (isLoadingAction || isPuzzleComponentSolved) return;
      // console.log("Shuffle requested. PuzzleBoard should re-shuffle if its key changes.");
      // This would typically be handled by changing the `key` prop on PuzzleBoard in page.tsx
      // or PuzzleBoard itself might have a shuffle method (it doesn't by default).
      // For now, this button is a placeholder for that functionality.
      // alert("Shuffle clicked. The puzzle board component might need a key change to re-shuffle effectively.");
      toast.info("Shuffle clicked. Puzzle board may need a key change to re-shuffle.");
      setMoves(0); 
      setTime(0); 
      setHintsUsed(0);
      setAiUsed(false);
      // setIsPuzzleComponentSolved(false); // If we could truly re-shuffle, we'd reset this.
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const difficultyLabel = useMemo(() => {
    const setting = { Easy: "Easy", Medium: "Medium", Hard: "Hard" };
    return setting[difficulty] || "Unknown";
  }, [difficulty]);

  // Helper to shorten strings for toasts
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  // Calculate if there's enough balance for hint and AI solver
  const hasEnoughForHint = aaBalance >= BigInt(0.11 * 1e18); // 0.11 MON
  const hasEnoughForAI = aaBalance >= BigInt(1.01 * 1e18); // 1.01 MON

  // Styles
  const mainContainerStyle = "w-full flex flex-col items-center justify-start p-2 sm:p-4 space-y-3 sm:space-y-4 bg-mona-deep-purple/30 backdrop-blur-lg rounded-2xl shadow-xl min-h-[calc(100vh-180px)] sm:min-h-[calc(100vh-200px)] max-h-[calc(100vh-100px)] overflow-y-auto";
  const statsBarContainerStyle = "grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 w-full max-w-2xl";
  const statsBarItemStyle = "flex flex-col items-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-mona-charcoal/60 border border-mona-slate/50 min-w-[70px] shadow-md";
  const statsLabelStyle = "text-xs text-mona-slate uppercase tracking-wider";
  const statsValueStyle = "text-md sm:text-lg font-bold text-mona-cream";
  const puzzleAreaStyle = "w-full max-w-md md:max-w-lg lg:max-w-xl p-1 bg-mona-charcoal/40 rounded-lg shadow-inner border border-mona-slate/30";
  const controlsContainerStyle = "flex justify-center items-center space-x-4 w-full max-w-xs sm:max-w-sm mx-auto mt-3 sm:mt-4";
  const iconButtonBaseStyle = "p-3 sm:p-3.5 font-semibold rounded-full shadow-lg flex items-center justify-center transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-60 aspect-square hover:scale-105 active:scale-95";

  // Loading state for the image URL itself (passed as prop, so assume it's loaded before this frame is shown)
  // if (!imageUrl) { ... }

  if (isPuzzleComponentSolved && !aiUsed) { // Show a brief solved message if not AI solved
    return (
      <div className={`${mainContainerStyle} items-center justify-center`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-mona-purple animate-bounce">Puzzle Solved!</h2>
        <p className="text-mona-cream text-lg sm:text-xl">Moves: {finalMovesFromBoard}</p>
        <p className="text-mona-cream text-lg sm:text-xl">Time: {formatTime(time)}</p>
        <p className="text-mona-lavender text-md sm:text-lg mt-2">Proceeding to mint summary...</p>
      </div>
    );
  }
  
  if (isPuzzleComponentSolved && aiUsed) { // Show a brief AI solved message
    return (
      <div className={`${mainContainerStyle} items-center justify-center`}>
        <h2 className="text-3xl sm:text-4xl font-bold text-mona-purple">AI Solved the Puzzle!</h2>
        <p className="text-mona-lavender text-md sm:text-lg mt-2">Proceeding to mint summary...</p>
      </div>
    );
  }

  return (
    <div className={mainContainerStyle}>
      <Toaster position="top-center" duration={3500} richColors />
      {/* Stats Bar */}
      <div className={statsBarContainerStyle}>
        <div className={statsBarItemStyle}>
          <span className={statsLabelStyle}>Time</span>
          <span className={statsValueStyle}>{formatTime(time)}</span>
        </div>
        {/*<div className={statsBarItemStyle}>
          <span className={statsLabelStyle}>Moves</span>
          {/* react-jigsaw-puzzle doesn't expose moves. This is a placeholder. 
          <span className={statsValueStyle}>{moves}</span> 
        </div>*/}
        {/* Puzzle ID removed as requested 
        <div className={statsBarItemStyle}>
          <span className={statsLabelStyle}>Difficulty</span>
          <span className={statsValueStyle}>{difficultyLabel}</span>
        </div>*/}
        <div className={statsBarItemStyle}>
          <span className={statsLabelStyle}>Hints</span>
          <span className={statsValueStyle}>{hintsUsed}</span>
        </div>
      </div>

      {/* Puzzle Board Area */}
      <div className={puzzleAreaStyle} style={{position: 'relative'}}>
        {imageUrl && difficulty ? (
          <>
            <PuzzleBoard 
              imageSrc={imageUrl}
              altText={`Monazzle Puzzle - ${difficulty}`}
              difficulty={difficulty as PuzzleDifficultyType} 
              onSolvedPuzzle={handlePuzzleBoardSolved} 
              onPuzzleMove={handlePuzzleMove}
              monazzleId={monazzleId}
            />
            {(showHintImage || aiSolving) && (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-lg"
                style={{ pointerEvents: 'none' }}
              >
                <img
                  src={imageUrl}
                  alt="Solved hint"
                  className="w-full h-full object-cover rounded-lg border-4 border-mona-purple shadow-2xl opacity-90"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
                <span className="absolute bottom-2 right-2 bg-mona-purple text-white text-xs px-2 py-1 rounded shadow-lg opacity-90">
                  {aiSolving ? 'AI Solved!' : 'Hint: Solved Image'}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-mona-lavender">
            <p>Loading puzzle image...</p>
          </div>
        )}
      </div>

      {/* Display transaction errors */}
      {txError && (
        <div className="w-full max-w-md bg-red-500/20 text-red-400 p-2 rounded-lg text-center text-sm">
          {txError}
        </div>
      )}

      {/* Display balance warnings if insufficient funds */}
      {!hasEnoughForHint && (
        <div className="w-full max-w-md bg-yellow-500/20 text-yellow-400 p-2 rounded-lg text-center text-sm">
          Need at least 0.11 MON for hints
        </div>
      )}
      {!hasEnoughForAI && hasEnoughForHint && (
        <div className="w-full max-w-md bg-yellow-500/20 text-yellow-400 p-2 rounded-lg text-center text-sm">
          Need at least 1.01 MON for AI solver
        </div>
      )}

      {/* Action Buttons - Updated for icon-only and single row */}
      <div className={controlsContainerStyle}>
        <Button 
          onClick={requestHint} 
          disabled={isLoadingAction || isPuzzleComponentSolved || !hasEnoughForHint}
          aria-label="Hint"
          title={!hasEnoughForHint ? "Need at least 0.11 MON" : "Hint"}
          className={`${iconButtonBaseStyle} ${hasEnoughForHint ? "bg-mona-teal/80 text-white hover:bg-mona-teal focus:ring-mona-teal" : "bg-mona-teal/30 text-white/60 cursor-not-allowed"}`}
        >
          <Lightbulb size={22} />
        </Button>
        <Button 
          onClick={activateAISolver} 
          disabled={isLoadingAction || isPuzzleComponentSolved || !hasEnoughForAI}
          aria-label="AI Solve"
          title={!hasEnoughForAI ? "Need at least 1.01 MON" : "AI Solve"}
          className={`${iconButtonBaseStyle} ${hasEnoughForAI ? "bg-mona-blue/80 text-white hover:bg-mona-blue focus:ring-mona-blue" : "bg-mona-blue/30 text-white/60 cursor-not-allowed"}`}
        >
          <BrainCircuit size={22} />
        </Button>
        <Button 
          onClick={onGiveUp} 
          disabled={isLoadingAction && !isPuzzleComponentSolved} 
          aria-label="Give Up"
          title="Give Up"
          className={`${iconButtonBaseStyle} bg-red-600/80 text-white hover:bg-red-500 focus:ring-red-500`}
        >
          <FlagOff size={22} />
        </Button>
      </div>
    </div>
  );
}