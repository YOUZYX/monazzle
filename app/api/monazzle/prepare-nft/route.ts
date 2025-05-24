import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';
import { firestore } from '../../../lib/firebaseAdmin';


const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL || 'ivory-generous-turtle-964.mypinata.cloud';
const PINATA_GATEWAY_API_KEY = process.env.PINATA_GATEWAY_API_KEY || 'BL_S57NET7G6yg275PW2Y-xTC-89u-aT0SgedclZS10XjQ8NYVvFCzehZ-8tFJRH';
// const PINATA_JWT = process.env.PINATA_JWT; // Alternative auth

async function pinFileToIPFS(fileBuffer: Buffer, fileName: string, monazzleId: string) {
    if (!PINATA_API_KEY || !PINATA_API_SECRET /* && !PINATA_JWT */) {
        throw new Error('Pinata API Key/Secret or JWT not configured in environment variables.');
    }

    const formData = new FormData();
    // Use a readable stream instead of direct buffer for Node.js form-data
    const stream = Readable.from([fileBuffer]);
    formData.append('file', stream, {
        filename: fileName,
        contentType: 'image/png'
    });

    const pinataMetadata = {
        name: fileName,
        keyvalues: {
            monazzleId: monazzleId
        }
    };
    formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

    const pinataOptions = {
        cidVersion: 1
    };
    formData.append('pinataOptions', JSON.stringify(pinataOptions));

    const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
    const headers = {
        // Let form-data set its own boundaries
        ...formData.getHeaders(),
        'pinata_api_key': PINATA_API_KEY!,
        'pinata_secret_api_key': PINATA_API_SECRET!
        // ...(PINATA_JWT ? { 'Authorization': `Bearer ${PINATA_JWT}` } : { 
        //     'pinata_api_key': PINATA_API_KEY!, 
        //     'pinata_secret_api_key': PINATA_API_SECRET! 
        // })
    };

    try {
        const response = await axios.post(url, formData, { headers });
        return response.data.IpfsHash; // This is the imageCID
    } catch (error: any) {
        //console.error("Error uploading file to Pinata:", error.response?.data || error.message);
        throw new Error(`Failed to pin file to IPFS: ${error.response?.data?.error || error.message}`);
    }
}

async function pinJSONToIPFS(jsonContent: object, metadataName: string, monazzleId: string) {
    if (!PINATA_API_KEY || !PINATA_API_SECRET /* && !PINATA_JWT */) {
        throw new Error('Pinata API Key/Secret or JWT not configured in environment variables.');
    }
    
    const pinataContentPayload = {
        pinataContent: jsonContent,
        pinataMetadata: {
            name: metadataName,
            keyvalues: {
                monazzleId: monazzleId
            }
        },
        pinataOptions: {
            cidVersion: 1
        }
    };

    const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
    const headers = {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY!,
        'pinata_secret_api_key': PINATA_API_SECRET!
        // ...(PINATA_JWT ? { 'Authorization': `Bearer ${PINATA_JWT}` } : { 
        //     'pinata_api_key': PINATA_API_KEY!, 
        //     'pinata_secret_api_key': PINATA_API_SECRET! 
        // })
    };

    try {
        const response = await axios.post(url, pinataContentPayload, { headers });
        return response.data.IpfsHash; // This is the metadataCID
    } catch (error: any) {
        //console.error("Error pinning JSON to Pinata:", error.response?.data || error.message);
        throw new Error(`Failed to pin JSON to IPFS: ${error.response?.data?.error || error.message}`);
    }
}

export async function POST(request: NextRequest) {
    if (!firestore) {
        //console.error('Firestore not initialized. Check Firebase Admin SDK setup.');
        return NextResponse.json({ error: 'Server configuration error: Firestore not available.' }, { status: 500 });
    }

    try {
        const data = await request.formData();
        const imageFile = data.get('image') as File | null;
        const monazzleId = data.get('monazzleId') as string | null;
        const puzzleLevel = data.get('puzzleLevel') as string | null;
        
        // Get additional game statistics
        const moves = data.get('moves') as string | null;
        const hintsUsed = data.get('hintsUsed') as string | null;
        const time = data.get('time') as string | null; // Time in seconds
        const aiUsed = data.get('aiUsed') as string | null; // 'true' or 'false' as string

        if (!imageFile) {
            return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
        }
        if (!monazzleId) {
            return NextResponse.json({ error: 'monazzleId is required' }, { status: 400 });
        }

        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const imageName = imageFile.name || `monazzle-${monazzleId}-image.png`; // Ensure an extension

        const imageCID = await pinFileToIPFS(imageBuffer, imageName, monazzleId);
        //console.log(`Image uploaded to Pinata. CID: ${imageCID}`);

        // Convert time from seconds to a more readable format (if available)
        let timeDisplay = "";
        if (time) {
            const timeNum = parseInt(time);
            const minutes = Math.floor(timeNum / 60);
            const seconds = timeNum % 60;
            timeDisplay = `${minutes}m:${seconds}s`;
        }

        // Create a gateway URL for better image display
        const gatewayImageUrl = `https://${PINATA_GATEWAY_URL}/ipfs/${imageCID}?pinataGatewayToken=${PINATA_GATEWAY_API_KEY}`;

        const metadata = {
            name: `Monazzle Puzzle NFT - ID #${monazzleId}`,
            description: "A unique NFT commemorating the solution of this Monazzle puzzle.",
            image: `ipfs://${imageCID}`,
            external_url: gatewayImageUrl, // Add gateway URL for better compatibility
            attributes: [
                { trait_type: "Monazzle ID", value: monazzleId },
                ...(puzzleLevel ? [{ trait_type: "Difficulty", value: puzzleLevel }] : []),
                ...(moves ? [{ trait_type: "Total Moves", value: parseInt(moves) }] : []),
                ...(hintsUsed ? [{ trait_type: "Hints Used", value: parseInt(hintsUsed) }] : []),
                ...(time ? [{ trait_type: "Completion Time", value: timeDisplay }] : []),
                ...(aiUsed ? [{ trait_type: "AI Solver Used", value: aiUsed === 'true' ? 'Yes' : 'No' }] : [])
            ],
            // Add fields to help marketplaces display the image
            image_url: gatewayImageUrl,
            animation_url: gatewayImageUrl
        };

        const metadataCID = await pinJSONToIPFS(metadata, `Monazzle-${monazzleId}-metadata.json`, monazzleId);
        //console.log(`Metadata JSON uploaded to Pinata. CID: ${metadataCID}`);

        const tokenURI = `ipfs://${metadataCID}`;

        const firestoreData = {
            monazzleId,
            tokenURI,
            imageCID,
            metadataCID,
            puzzleLevel: puzzleLevel || null,
            moves: moves ? parseInt(moves) : null,
            hintsUsed: hintsUsed ? parseInt(hintsUsed) : null,
            time: time ? parseInt(time) : null,
            aiUsed: aiUsed === 'true',
            createdAt: new Date().toISOString(),
            gatewayImageUrl
        };

        await firestore.collection('monazzleData').doc(monazzleId).set(firestoreData);
        //console.log(`Saved tokenURI for monazzleId ${monazzleId} to Firestore:`, firestoreData);

        return NextResponse.json({ 
            success: true, 
            tokenURI: tokenURI, 
            imageCID: imageCID, 
            metadataCID: metadataCID 
        });

    } catch (error: any) {
        //console.error("Error in /api/prepare-nft:", error);
        const errorMessage = error.message || 'Internal Server Error';
        return NextResponse.json({ error: 'Failed to prepare NFT', details: errorMessage }, { status: 500 });
    }
} 