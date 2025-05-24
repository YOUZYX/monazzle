"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback, useContext } from "react";
import { JigsawPuzzle } from "react-jigsaw-puzzle/lib";
import "react-jigsaw-puzzle/lib/jigsaw-puzzle.css";
import { ZeroDevContext } from "@/context/zeroDev";
import { Toaster, toast } from 'sonner';

export type Difficulty = "Easy" | "Medium" | "Hard";

interface PuzzleBoardProps {
  imageSrc: string;
  altText?: string;
  difficulty: Difficulty;
  onSolvedPuzzle: (moves: number) => void;
  onPuzzleMove: (moves: number) => void;
  monazzleId: bigint;
}

const difficultySettings = {
  Easy: { rows: 3, columns: 3, label: "Easy (3x3)" },
  Medium: { rows: 4, columns: 4, label: "Medium (4x4)" },
  Hard: { rows: 5, columns: 5, label: "Hard (5x5)" },
};

const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  imageSrc,
  altText = "Puzzle image",
  difficulty,
  onSolvedPuzzle,
  onPuzzleMove,
  monazzleId
}) => {
  const [puzzleKey, setPuzzleKey] = useState<number>(Date.now());
  const [currentMoves, setCurrentMoves] = useState<number>(0);
  const [isBoardSolved, setIsBoardSolved] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [lastProcessedMove, setLastProcessedMove] = useState<number>(0);
  const [movesBatched, setMovesBatched] = useState<number>(0);

  const puzzleContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingPieceRef = useRef<boolean>(false);

  // Helper to shorten strings for toasts
  const shortenString = (str: string | undefined | null, startChars = 6, endChars = 4): string => {
    if (!str) return '';
    return str.length > startChars + endChars
      ? `${str.substring(0, startChars)}...${str.substring(str.length - endChars)}`
      : str;
  };

  // Get the swapPieceOnChain function from ZeroDevContext
  const { swapPieceOnChain, executeAllPendingMoves } = useContext(ZeroDevContext);

  const { rows, columns } = useMemo(() => {
    return difficultySettings[difficulty];
  }, [difficulty]);

  useEffect(() => {
    setCurrentMoves(0);
    setPuzzleKey(Date.now());
    setIsBoardSolved(false);
    setLastProcessedMove(0);
    setTxPending(false);
    setTxError(null);
    setMovesBatched(0);
  }, [imageSrc, difficulty]);

  useEffect(() => {
    onPuzzleMove(currentMoves);
  }, [currentMoves, onPuzzleMove]);

  // Effect to call swapPieceOnChain when currentMoves changes
  useEffect(() => {
    // Skip on initialization (when currentMoves is 0) or if already solved
    if (currentMoves === 0 || currentMoves === lastProcessedMove || isBoardSolved) return;
    
    const callSwapPiece = async () => {
      setTxPending(true);
      setTxError(null);
      
      try {
        // Since react-jigsaw-puzzle doesn't expose which pieces were swapped,
        // we'll use idxA=0, idxB=1 as dummy values for the on-chain record.
        const idxA = 0; 
        const idxB = 1;
        
        // No toast here for individual batch add, as it might be too noisy.
        // The batch execution toast will cover it.
        const result = await swapPieceOnChain(monazzleId, idxA, idxB);
        
        if (result.receipt.transactionHash === "pending-batch") {
          //toast.info("Move batched locally.");
          setMovesBatched(prev => prev + 1);
          setTxPending(false);
        } else {
          toast.success(`Move batch recorded on-chain! Tx: ${shortenString(result.receipt.transactionHash)}`);
          setMovesBatched(0);
          setTxPending(false);
        }
        
        setLastProcessedMove(currentMoves);
      } catch (error) {
        toast.error(`On-chain move recording failed: ${(error as Error).message}`);
        setTxError(error instanceof Error ? error.message : "Failed to record move on blockchain");
        setTxPending(false);
      }
    };
    
    callSwapPiece();
  }, [currentMoves, lastProcessedMove, monazzleId, swapPieceOnChain, isBoardSolved]);

  useEffect(() => {
    const container = puzzleContainerRef.current;
    if (!container) return;

    const handlePointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement).classList.contains("jigsaw-puzzle__piece")) {
        isDraggingPieceRef.current = true;
      }
    };

    const handlePointerUp = () => {
      if (isDraggingPieceRef.current) {
        setCurrentMoves(prevMoves => prevMoves + 1);
        isDraggingPieceRef.current = false;
      }
    };

    container.addEventListener("pointerdown", handlePointerDown as EventListener);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown as EventListener);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleLibrarySolved = useCallback(() => {
    setIsBoardSolved(true);
  }, []);

  // When puzzle is solved, execute any pending moves and then notify parent
  useEffect(() => {
    if (isBoardSolved) {
      const finalizePuzzle = async () => {
        if (movesBatched > 0) {
          toast.info(`Puzzle solved! Finalizing ${movesBatched} pending moves on-chain...`);
          setTxPending(true);
          try {
            const finalReceipt = await executeAllPendingMoves();
            const txHash = (finalReceipt as any)?.transactionHash ?? (finalReceipt as any)?.hash;
            if (txHash) {
              toast.success(`All pending moves finalized! Tx: ${shortenString(txHash)}`);
            } else {
              toast.success("All pending moves finalized on-chain!");
            }
          } catch (error) {
            toast.error(`Error finalizing pending moves: ${(error as Error).message}`);
          } finally {
            setTxPending(false);
          }
        }
        onSolvedPuzzle(currentMoves);
      };
      
      finalizePuzzle();
    }
  }, [isBoardSolved, currentMoves, onSolvedPuzzle, executeAllPendingMoves, movesBatched]);

  if (!imageSrc) {
    return <p className="text-center text-gray-400">Waiting for puzzle image...</p>;
  }

  return (
    <div ref={puzzleContainerRef} className="flex flex-col items-center space-y-2 p-1 md:p-2">
      <Toaster position="top-center" duration={3500} richColors />
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto relative">
        {txPending && (
          <div className="absolute top-2 right-2 bg-mona-purple text-white text-xs px-2 py-1 rounded-full animate-pulse z-10">
            {isBoardSolved ? "Finalizing moves on-chain..." : "Recording move..."}
          </div>
        )}
        {movesBatched > 0 && !txPending && (
          <div className="absolute top-2 right-2 bg-mona-slate/70 text-white text-xs px-2 py-1 rounded-full z-10">
            {movesBatched} {movesBatched === 1 ? 'move' : 'moves'} batched
          </div>
        )}
        <JigsawPuzzle
          key={puzzleKey}
          imageSrc={imageSrc}
          rows={rows}
          columns={columns}
          onSolved={handleLibrarySolved}
        />
      </div>
      {txError && (
        <p className="text-xs text-red-500 bg-red-100/20 px-2 py-1 rounded">
          {txError}
        </p>
      )}
      {altText && <p className="text-xs text-gray-500 mt-1 text-center">{altText}</p>}
    </div>
  );
};

export default PuzzleBoard; 