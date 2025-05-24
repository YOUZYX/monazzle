// app/api/monazzle/get-token-uri/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../../lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Ensure Firestore is initialized
    if (!firestore) {
      return NextResponse.json(
        { error: 'Internal Server Error', details: 'Firestore not initialized' },
        { status: 500 }
      );
    }

    const { searchParams } = request.nextUrl;
    const monazzleId = searchParams.get('monazzleId');
    if (!monazzleId) {
      return NextResponse.json(
        { error: 'monazzleId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch document from Firestore
    const docRef = firestore.collection('monazzleData').doc(monazzleId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: 'TokenURI not found for the given monazzleId or game not yet processed' },
        { status: 404 }
      );
    }

    const data = docSnapshot.data()!;
    const tokenURI = data.tokenURI;
    if (!tokenURI) {
      return NextResponse.json(
        { error: 'TokenURI exists but is empty or invalid' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tokenURI,
      imageCID: data.imageCID,
      metadataCID: data.metadataCID,
      puzzleLevel: data.puzzleLevel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal Server Error', details: message },
      { status: 500 }
    );
  }
}