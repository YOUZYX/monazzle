import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const monazzleId = params.id;

  // TODO: Fetch board state for the given monazzleId from backend/contract
  //console.log('Get board API called for monazzleId:', monazzleId);

  // Mock response
  const mockBoard = {
    id: monazzleId,
    difficulty: 'Easy',
    tiles: Array.from({ length: 9 }, (_, i) => ({ id: i, position: i, imageUrl: `https://picsum.photos/seed/tile${i}/100/100` })),
    startTime: Date.now() - 60000, // Mock: started 1 minute ago
  };

  return NextResponse.json(mockBoard);
} 