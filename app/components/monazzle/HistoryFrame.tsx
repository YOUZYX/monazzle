'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui_placeholders';

export function HistoryFrame() {
  const glassCardStyle = 'bg-white/10 backdrop-blur-xl border border-mona-lavender/30 rounded-2xl p-6 shadow-2xl w-full';

  // Placeholder data - replace with actual data fetching and display logic
  const recentMonazzles = [
    { id: '1', imageUrl: 'https://picsum.photos/seed/history1/100/100', moves: 35, time: '02:15', difficulty: 'Easy' },
    { id: '2', imageUrl: 'https://picsum.photos/seed/history2/100/100', moves: 55, time: '05:30', difficulty: 'Medium' },
    { id: '3', imageUrl: 'https://picsum.photos/seed/history3/100/100', moves: 120, time: '12:45', difficulty: 'Hard' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8">
      <Card className={`${glassCardStyle} text-center`}>
        <CardHeader>
          <CardTitle className="text-mona-cream text-2xl md:text-3xl font-semibold">
            {'Monazzle History'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentMonazzles.length === 0 ? (
            <p className="text-mona-slate">
              {'You haven\'t played any Monazzles yet.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {recentMonazzles.map((monazzle) => (
                <li
                  key={monazzle.id}
                  className="flex items-center space-x-4 p-3 bg-mona-charcoal/50 rounded-lg border border-mona-slate/30"
                >
                  <img
                    src={monazzle.imageUrl}
                    alt={`Puzzle ${monazzle.id}`}
                    className="w-16 h-16 rounded-md object-cover"
                  />
                  <div className="text-left">
                    <p className="text-mona-cream font-semibold">
                      {'Difficulty: '} {monazzle.difficulty}
                    </p>
                    <p className="text-mona-slate text-sm">
                      {'Moves: '} {monazzle.moves} {' | Time: '} {monazzle.time}
                    </p>
                  </div>
                  {/* Add action buttons like 'Play Again' or 'View Details' if needed */}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-mona-slate mt-4">
            {'Full history and leaderboard coming soon!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
