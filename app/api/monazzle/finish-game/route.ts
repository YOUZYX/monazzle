import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import monazzleAbi from '../../../../contracts/monazzle_abi.json';

// Configure your contract address and private key
const MONAZZLE_CONTRACT_ADDRESS = '0xe017111996F228D727E34adBF1B98942FbF9639C';
const MONAD_RPC_URL = process.env.MONAD_RPC_URL || 'https://testnet.monad.xyz/';
const BACKEND_ORACLE_PRIVATE_KEY = process.env.BACKEND_ORACLE_PRIVATE_KEY;

export async function POST(request: NextRequest) {
    try {
        if (!BACKEND_ORACLE_PRIVATE_KEY) {
            //console.error('Backend oracle private key not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Get data from request body
        const data = await request.json();
        const { monazzleId, playerAddress, timeSpent } = data;

        if (!monazzleId || !playerAddress || timeSpent === undefined) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        //console.log(`Marking game as finished: monazzleId=${monazzleId}, playerAddress=${playerAddress}, timeSpent=${timeSpent}`);

        // Connect to provider and create contract instance
        const provider = new ethers.JsonRpcProvider(MONAD_RPC_URL);
        const wallet = new ethers.Wallet(BACKEND_ORACLE_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(MONAZZLE_CONTRACT_ADDRESS, monazzleAbi, wallet);

        // Call finishMonazzle function
        const tx = await contract.finishMonazzle(monazzleId, playerAddress, timeSpent);
        const receipt = await tx.wait();

        //console.log(`Game finished successfully! Transaction hash: ${receipt.hash}`);

        return NextResponse.json({ 
            success: true, 
            transactionHash: receipt.hash 
        });
    } catch (error) {
        //console.error('Error finishing game:', error);
        
        // Check if it's already finished
        if (error instanceof Error && error.message.includes('Game already finished')) {
            return NextResponse.json({ 
                success: true,
                alreadyFinished: true,
                message: 'Game was already marked as finished'
            });
        }

        if (error instanceof Error) {
            return NextResponse.json({ 
                error: 'Failed to mark game as finished', 
                details: error.message 
            }, { status: 500 });
        } else {
            return NextResponse.json({ 
                error: 'Failed to mark game as finished', 
                details: 'Unknown error occurred' 
            }, { status: 500 });
        }
    }
} 