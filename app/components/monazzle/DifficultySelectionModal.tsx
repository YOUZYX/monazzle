'use client';

import React, { useState } from 'react';
import { Button } from './ui_placeholders';
import { Difficulty } from '../../page'; // Assuming page.tsx is in app directory
import { X, CheckCircle } from 'lucide-react';
import { Toaster, toast } from 'sonner'; // Import Toaster and toast

interface DifficultySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDifficulty: (difficulty: Difficulty) => void;
}

export function DifficultySelectionModal({
  isOpen,
  onClose,
  onConfirmDifficulty,
}: DifficultySelectionModalProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedDifficulty) {
      onConfirmDifficulty(selectedDifficulty);
    } else {
      // Optionally, show an error message if no difficulty is selected
      toast.error("Please select a difficulty level.");
    }
  };
  
  const glassCardStyle = 'bg-mona-deep-purple/80 backdrop-blur-xl border border-mona-lavender/50 rounded-2xl p-6 shadow-2xl w-full max-w-md mx-auto text-center space-y-6 relative';

  return (
    <div className="fixed inset-0 bg-mona-charcoal/70 backdrop-blur-md flex items-center justify-center p-4 z-[110] transition-opacity duration-300 ease-in-out" 
         style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}>
      <Toaster position="top-center" duration={3500} richColors />
      <div className={glassCardStyle}>
        <Button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-mona-slate hover:text-mona-cream p-1 bg-transparent hover:bg-mona-slate/20 rounded-full z-10"
            aria-label="Close difficulty selection"
        >
            <X size={24} />
        </Button>
        <h2 className="text-2xl font-semibold text-mona-cream mb-6">Select Difficulty</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
            <Button 
              key={level} 
              onClick={() => setSelectedDifficulty(level)}
              className={`px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md w-full text-lg
                         ${selectedDifficulty === level 
                           ? 'bg-mona-purple text-white ring-2 ring-mona-cream' 
                           : 'bg-mona-charcoal text-mona-cream hover:bg-mona-slate'}`}
            >
              {level}
            </Button>
          ))}
        </div>
        <Button 
          onClick={handleConfirm} 
          disabled={!selectedDifficulty}
          className="w-full bg-gradient-to-r from-mona-violet to-mona-purple text-white hover:opacity-90 py-3.5 text-xl font-bold rounded-lg shadow-xl hover:scale-105 transition transform focus:outline-none focus:ring-2 focus:ring-mona-cream disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <CheckCircle size={22} />
          <span>Confirm & Start</span>
        </Button>
      </div>
    </div>
  );
} 