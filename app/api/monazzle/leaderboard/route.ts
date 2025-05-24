import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level') || 'all';

  // TODO: Fetch leaderboard data from backend
  //console.log('Leaderboard API called for level:', level);

  // Mock response
  const mockLeaderboard = [
    { id: '1', user: '0xAlice', level: 'Easy', timeSpent: 120000, moves: 30, hints: 1, aiUsed: false, mintedLink: 'https://example.com/nft/1' },
    { id: '2', user: '0xBob', level: 'Medium', timeSpent: 300000, moves: 50, hints: 0, aiUsed: true, mintedLink: 'https://example.com/nft/2' },
    { id: '3', user: '0xCharlie', level: 'Easy', timeSpent: 90000, moves: 25, hints: 0, aiUsed: false, mintedLink: 'https://example.com/nft/3' },
  ];

  const filteredLeaderboard = level === 'all' 
    ? mockLeaderboard 
    : mockLeaderboard.filter(item => item.level.toLowerCase() === level.toLowerCase());

  return NextResponse.json(filteredLeaderboard);
} 