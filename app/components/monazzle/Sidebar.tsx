'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui_placeholders'; // Using placeholder UI components
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink, RefreshCcw, MessageSquare } from 'lucide-react'; // Icons

// Placeholder types (these would ideally come from a shared types definition)
interface RecentMonazzle {
  id: string;
  imageUrl: string;
  level: 'Easy' | 'Medium' | 'Hard';
  moves: number;
  time: string; // Formatted time MM:SS
  solver?: string; // e.g., 'Completed by @username' or 'AI Solved'
  explorerLink?: string;
  warpcastThreadLink?: string;
}

interface ChallengeNotification {
  id: string;
  challenger: string; // e.g., '@alice'
  level: 'Easy' | 'Medium' | 'Hard';
  timestamp: number;
}

const placeholderRecentMonazzles: RecentMonazzle[] = [
  {
    id: 'monazzle_123',
    imageUrl: 'https://picsum.photos/seed/puzzle1/100/100',
    level: 'Medium',
    moves: 45,
    time: '03:15',
    solver: 'Completed by @dood',
    explorerLink: '#',
    warpcastThreadLink: '#',
  },
  {
    id: 'monazzle_124',
    imageUrl: 'https://picsum.photos/seed/puzzle2/100/100',
    level: 'Hard',
    moves: 102,
    time: '08:40',
    solver: 'AI Solved',
    explorerLink: '#',
  },
  {
    id: 'monazzle_125',
    imageUrl: 'https://picsum.photos/seed/puzzle3/100/100',
    level: 'Easy',
    moves: 15,
    time: '00:55',
    warpcastThreadLink: '#',
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true); // Default to open, can be changed
  const [recentMonazzles, setRecentMonazzles] = useState<RecentMonazzle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<ChallengeNotification[]>([]);

  useEffect(() => {
    // Fetch recent monazzles
    const fetchRecent = async () => {
      setIsLoading(true);
      // const response = await fetch('/api/monazzle/leaderboard?level=all');
      // const data = await response.json();
      // setRecentMonazzles(data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate fetch
      setRecentMonazzles(placeholderRecentMonazzles);
      setIsLoading(false);
    };
    fetchRecent();

    // Placeholder for WebPush listener & toast notifications
    const showChallengeToast = (notification: ChallengeNotification) => {
      console.log('New Challenge Toast:', notification);
      alert(`${notification.challenger} challenged you to a ${notification.level} Monazzle!`);
      // Here you would use a toast library to show a styled notification
      // For now, an alert will do. Add to a list for display if needed.
      setNotifications(prev => [notification, ...prev.slice(0,2)]); // Keep last 3
    };

    // Simulate receiving a challenge notification
    const challengeInterval = setInterval(() => {
        if (Math.random() < 0.2) { // Occasionally simulate a new challenge
            showChallengeToast({
                id: `chall_${Date.now()}`,
                challenger: '@bob',
                level: Math.random() > 0.5 ? 'Hard' : 'Medium',
                timestamp: Date.now(),
            });
        }
    }, 15000); // Check for new challenges periodically (example)

    return () => clearInterval(challengeInterval);
  }, []);

  const sidebarStyle = `fixed top-0 right-0 h-full bg-mona-onyx/60 backdrop-blur-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-30`;
  const sidebarWidth = isOpen ? 'w-72 md:w-80' : 'w-12 md:w-14'; // Width for open/closed states
  const contentPadding = isOpen ? 'p-4' : 'p-3';

  return (
    <div className={`${sidebarStyle} ${sidebarWidth}`}>
      {/* Toggle Button */} 
      <Button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`absolute top-1/2 -left-5 transform -translate-y-1/2 bg-mona-slate hover:bg-mona-slate/80 text-mona-cream p-2 rounded-full shadow-lg z-10 border-2 border-mona-onyx/50`}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </Button>

      {/* Sidebar Content */} 
      <div className={`overflow-y-auto h-full flex flex-col ${contentPadding} ${!isOpen ? 'items-center' : ''}`}>
        {isOpen && <h2 className="text-xl font-semibold text-mona-cream mb-4">Recent Monazzles</h2>}
        
        {isLoading && isOpen && <p className="text-mona-slate">Loading recent games...</p>}
        
        {!isLoading && isOpen && recentMonazzles.length === 0 && (
          <p className="text-mona-slate">No recent games found.</p>
        )}

        {!isLoading && isOpen && (
          <div className="space-y-3 flex-grow">
            {recentMonazzles.map((game) => (
              <div key={game.id} className="bg-mona-charcoal/50 p-2.5 rounded-lg shadow border border-mona-slate/30">
                <div className="flex items-center gap-3">
                  <Image src={game.imageUrl} alt={`Puzzle ${game.id}`} width={50} height={50} className="rounded" />
                  <div className="text-xs text-mona-eggshell flex-grow">
                    <p><strong>{game.level}</strong> - {game.moves} moves</p>
                    <p>Time: {game.time}</p>
                    {game.solver && <p className="text-mona-slate text-xxs">{game.solver}</p>}
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5 justify-end">
                  {game.explorerLink && (
                    <a href={game.explorerLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-mona-slate/30 hover:bg-mona-slate/50 rounded text-mona-cream">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {game.warpcastThreadLink && (
                    <a href={game.warpcastThreadLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-mona-slate/30 hover:bg-mona-slate/50 rounded text-mona-cream">
                      <MessageSquare size={14} />
                    </a>
                  )}
                  <Button className="p-1.5 bg-mona-purple/70 hover:bg-mona-purple/90 rounded text-mona-cream">
                    <RefreshCcw size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Challenge Notifications Toast Area (Simplified) */} 
        {isOpen && notifications.length > 0 && (
            <div className="mt-auto pt-4 space-y-2">
                 <h3 className="text-mona-cream text-sm font-semibold">Challenges:</h3>
                {notifications.map(notif => (
                    <div key={notif.id} className="p-2 bg-mona-lavender/20 border border-mona-lavender text-mona-cream rounded-md text-xs shadow-lg">
                        <p><strong>{notif.challenger}</strong> challenged you to a {notif.level} Monazzle!</p>
                        <Button className="text-xxs mt-1 bg-mona-purple/80 hover:bg-mona-purple px-2 py-0.5 rounded">
                            Click to play!
                        </Button>
                    </div>
                ))}
            </div>
        )}

        {!isOpen && (
            <div className="space-y-3 mt-10">
                <div className="p-1.5 bg-mona-slate/30 hover:bg-mona-slate/50 rounded text-mona-cream cursor-pointer" title="Recent Games">
                    <RefreshCcw size={20}/>
                </div>
                {notifications.length > 0 && (
                     <div className="p-1.5 bg-mona-lavender/30 hover:bg-mona-lavender/50 rounded text-mona-cream cursor-pointer relative" title="Challenges">
                        <MessageSquare size={20}/>
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xxs w-3.5 h-3.5 rounded-full flex items-center justify-center">{notifications.length}</span>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
} 