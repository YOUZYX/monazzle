'use client';

import React from 'react';
import { Button } from './ui_placeholders';

interface PuzzleControlsProps {
  onHint: () => void;
  onAISolve: () => void;
  onGiveUp: () => void;
  isSolved: boolean;
  isLoadingAction: boolean; // To disable buttons during an action (hint, AI solve)
}

export function PuzzleControls({
  onHint,
  onAISolve,
  onGiveUp,
  isSolved,
  isLoadingAction,
}: PuzzleControlsProps) {
  if (isSolved) {
    return null; // Don't show controls if puzzle is solved
  }

  const toolbarStyle =
    'bg-white/10 backdrop-blur-[20px] border border-white/20 rounded-xl p-3 shadow-xl flex gap-2 md:gap-3';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className={toolbarStyle}>
        <Button
          onClick={onHint}
          disabled={isLoadingAction}
          className="bg-mona-lavender text-mona-deep-purple hover:bg-mona-lavender/80 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base font-semibold rounded-lg shadow-md hover:scale-105 transition transform whitespace-nowrap"
        >
          Hint (0.1 MON)
        </Button>
        <Button
          onClick={onAISolve}
          disabled={isLoadingAction}
          className="bg-mona-violet text-white hover:bg-mona-violet/80 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base font-semibold rounded-lg shadow-md hover:scale-105 transition transform whitespace-nowrap"
        >
          AI Solve (1 MON)
        </Button>
        <Button
          onClick={onGiveUp}
          disabled={isLoadingAction}
          className="bg-mona-deep-purple text-mona-ash hover:bg-opacity-80 border border-mona-ash/50 px-3 py-2 md:px-4 md:py-2.5 text-sm md:text-base font-semibold rounded-lg shadow-md hover:scale-105 transition transform whitespace-nowrap"
        >
          Give Up
        </Button>
      </div>
    </div>
  );
} 