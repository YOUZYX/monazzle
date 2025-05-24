'use client';

import React from 'react';

// TODO: Implement Monazzle game board UI
// TODO: Handle tile swaps (optimistic UI + send swapPiece UserOp)
// TODO: Listen to WebSocket for real-time updates (HintResponse, AISolveSteps, MonazzleFinishedNotification)
// TODO: Display timer

interface GameBoardProps {
  monazzleId: string;
  // difficulty: 'Easy' | 'Medium' | 'Hard';
  // initialBoardData: any; // Type this properly later
}

export default function GameBoard({ monazzleId }: GameBoardProps) {
  // const [board, setBoard] = React.useState(initialBoardData);
  // const [timer, setTimer] = React.useState(0);

  React.useEffect(() => {
    // Fetch board data GET /api/monazzle/{id}/board
    // Connect to WebSocket monazzle:{id}
    //console.log('GameBoard mounted for monazzleId:', monazzleId);
    return () => {
      // Disconnect WebSocket
    };
  }, [monazzleId]);

  return (
    <div>
      <h3>Monazzle Board (ID: {monazzleId})</h3>
      <p>Timer: 00:00</p>
      {/* Mock Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 100px)', gap: '5px' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ width: '100px', height: '100px', border: '1px solid #ccc', display:'flex', alignItems:'center', justifyContent:'center'}}>
            Tile {i + 1}
          </div>
        ))}
      </div>
      <div>
        <button>Hint</button>
        <button>AI Solve</button>
      </div>
    </div>
  );
} 