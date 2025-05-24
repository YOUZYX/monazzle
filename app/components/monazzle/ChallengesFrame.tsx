'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui_placeholders';

export function ChallengesFrame() {
  const glassCardStyle = 'bg-white/10 backdrop-blur-xl border border-mona-lavender/30 rounded-2xl p-6 shadow-2xl w-full';
  const challenges: any[] = []; // Placeholder

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8">
      <Card className={`${glassCardStyle} text-center`}>
        <CardHeader>
          <CardTitle className="text-mona-cream text-2xl md:text-3xl font-semibold">Monazzle Challenges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {challenges.length === 0 ? (
            <p className="text-mona-slate">
              No active challenges right now. <br />
              Challenge a friend or check back soon!
            </p>
          ) : (
            <ul className="space-y-3">
              {/* Map through challenges once data structure is defined */}
            </ul>
          )}
          <p className="text-xs text-mona-slate mt-6">
            Full challenge system with notifications and direct invites is on the way!
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 