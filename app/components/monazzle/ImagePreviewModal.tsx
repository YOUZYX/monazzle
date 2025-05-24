'use client';

import React from 'react';
import { Button } from './ui_placeholders';
import Image from 'next/image';
import { X, Play } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onStartPlaying: () => void; // Changed from onConfirm to onStartPlaying for clarity
}

export function ImagePreviewModal({
  isOpen,
  imageUrl,
  onClose,
  onStartPlaying,
}: ImagePreviewModalProps) {
  if (!isOpen || !imageUrl) return null;

  const glassCardStyle = 'bg-mona-deep-purple/80 backdrop-blur-xl border border-mona-lavender/50 rounded-2xl p-6 shadow-2xl w-full max-w-lg mx-auto text-center space-y-6 relative';

  return (
    <div className="fixed inset-0 bg-mona-charcoal/70 backdrop-blur-md flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out" 
         style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}>
      <div className={glassCardStyle}>
        <Button 
            onClick={onClose} 
            className="absolute top-3 right-3 text-mona-slate hover:text-mona-cream p-1 bg-transparent hover:bg-mona-slate/20 rounded-full z-10"
            aria-label="Close image preview"
        >
            <X size={24} />
        </Button>
        <h2 className="text-2xl font-semibold text-mona-cream mb-4">Your Puzzle Image</h2>
        <div className="aspect-[3/2] bg-mona-charcoal rounded-lg overflow-hidden shadow-lg border border-mona-slate/50 relative w-full">
          <Image 
            src={imageUrl}
            alt="Generated puzzle image for preview"
            layout="fill"
            objectFit="contain" // Use contain to ensure whole image is visible
            className="rounded-md"
            priority
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={onStartPlaying} 
            className="flex-1 bg-mona-purple text-white hover:bg-mona-purple/90 py-3 text-lg font-semibold shadow-lg rounded-lg flex items-center justify-center space-x-2"
          >
            <Play size={20}/>
            <span>Start Playing</span>
          </Button>
          <Button 
            onClick={onClose} 
            className="flex-1 bg-mona-slate/40 text-mona-cream hover:bg-mona-slate/60 py-3 text-lg font-semibold shadow-md rounded-lg"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
} 