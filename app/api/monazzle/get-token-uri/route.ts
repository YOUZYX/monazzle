import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '../../../../lib/firebaseAdmin';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const monazzleId = searchParams.get('monazzleId');

        if (!monazzleId) {
            return NextResponse.json({ error: 'monazzleId query parameter is required' }, { status: 400 });
        }

        //console.log(`Fetching tokenURI for monazzleId: ${monazzleId}`);
        
        // Get the document from Firestore
        const docRef = firestore.collection('monazzleData').doc(monazzleId);
        const docSnapshot = await docRef.get();
        
        if (!docSnapshot.exists) {
            return NextResponse.json({ 
                error: 'TokenURI not found for the given monazzleId or game not yet processed' 
            }, { status: 404 });
        }
        
        const data = docSnapshot.data();
        const tokenURI = data?.tokenURI;
        
        if (!tokenURI) {
            return NextResponse.json({ 
                error: 'TokenURI exists but is empty or invalid' 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            tokenURI: tokenURI,
            // Optionally include other metadata if needed by the frontend
            imageCID: data?.imageCID,
            metadataCID: data?.metadataCID,
            puzzleLevel: data?.puzzleLevel
        });

    } catch (error) {
        if (error instanceof Error) {
            //console.error("Error in /api/get-token-uri:", error);
            return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
        } else {
            //console.error("Unknown error in /api/get-token-uri:", error);
            return NextResponse.json({ error: 'Internal Server Error', details: 'An unknown error occurred' }, { status: 500 });
        }
    }
}