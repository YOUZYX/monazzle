'use client';

import { useState, useEffect, useCallback } from 'react';
import useZeroDev from './useZeroDev';
import { encodeFunctionData } from 'viem';

// TODO: Implement ZeroDev SDK interactions for UserOperations
// TODO: Implement ethers.js event listening (MonazzleStarted, HintRequested, AISolverRequested)

// Replace with actual contract address
const MONAZZLE_CONTRACT_ADDRESS = '0xMonazzleContractAddress'; 

// Replace with actual ABI (simplified for now)
const MONAZZLE_ABI = [
  {
    name: 'commitImage',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string', name: 'imageHash' }],
    outputs: []
  },
  {
    name: 'startMonazzle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint8', name: 'difficulty' }],
    outputs: []
  },
  {
    name: 'swapPiece',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'uint256', name: 'monazzleId' },
      { type: 'uint8', name: 'fromIndex' },
      { type: 'uint8', name: 'toIndex' }
    ],
    outputs: []
  },
  {
    name: 'requestHint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'monazzleId' }],
    outputs: []
  },
  {
    name: 'activateAISolver',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'monazzleId' }],
    outputs: []
  },
  {
    name: 'mintMonazzleNFT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'uint256', name: 'monazzleId' },
      { type: 'string', name: 'tokenURI' }
    ],
    outputs: []
  }
];

export default function useMonazzle(monazzleId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ZeroDev for AA-powered interactions
  const { 
    kernelClient, 
    smartAccountAddress, 
    isSmartAccountReady, 
    initialize: initializeZeroDev
  } = useZeroDev();

  // Initialize ZeroDev if needed
  useEffect(() => {
    if (!isSmartAccountReady) {
      initializeZeroDev();
    }
  }, [isSmartAccountReady, initializeZeroDev]);

  // Send a transaction using ZeroDev's AA
  const sendUserOp = useCallback(async (functionName: string, params: any[]) => {
    if (!kernelClient || !isSmartAccountReady) {
      throw new Error('ZeroDev smart account not ready');
    }

    setLoading(true);
    setError(null);
    
    try {
      // Encode the function call data
      const callData = encodeFunctionData({
        abi: MONAZZLE_ABI,
        functionName,
        args: params,
      });

      // Send the user operation
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await kernelClient.account.encodeCalls([
          {
            to: MONAZZLE_CONTRACT_ADDRESS as `0x${string}`,
            value: BigInt(0),
            data: callData,
          },
        ]),
      });

      console.log(`${functionName} UserOp sent, hash:`, userOpHash);

      // Wait for the transaction receipt
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });
      
      console.log(`${functionName} transaction mined, tx hash:`, receipt.receipt.transactionHash);
      
      return receipt.receipt.transactionHash;
    } catch (e) {
      console.error(`Error sending ${functionName} UserOp:`, e);
      setError(e instanceof Error ? e : new Error(String(e)));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [kernelClient, isSmartAccountReady]);

  // Contract interaction methods
  const commitImageAndStartMonazzle = useCallback(async (imageHash: string, difficulty: number) => {
    await sendUserOp('commitImage', [imageHash]);
    await sendUserOp('startMonazzle', [difficulty]);
  }, [sendUserOp]);

  const swapPiece = useCallback(async (fromIndex: number, toIndex: number) => {
    if (!monazzleId) throw new Error('No monazzleId provided');
    await sendUserOp('swapPiece', [BigInt(monazzleId), fromIndex, toIndex]);
  }, [sendUserOp, monazzleId]);

  const requestHint = useCallback(async () => {
    if (!monazzleId) throw new Error('No monazzleId provided');
    await sendUserOp('requestHint', [BigInt(monazzleId)]);
  }, [sendUserOp, monazzleId]);

  const activateAISolver = useCallback(async () => {
    if (!monazzleId) throw new Error('No monazzleId provided');
    await sendUserOp('activateAISolver', [BigInt(monazzleId)]);
  }, [sendUserOp, monazzleId]);

  const mintMonazzleNFT = useCallback(async (tokenURI: string) => {
    if (!monazzleId) throw new Error('No monazzleId provided');
    await sendUserOp('mintMonazzleNFT', [BigInt(monazzleId), tokenURI]);
  }, [sendUserOp, monazzleId]);

  // Event listening example (conceptual)
  useEffect(() => {
    if (!monazzleId /* || !provider */) return;
    // const provider = new ethers.BrowserProvider(window.ethereum); // Or your ZeroDev provider
    // const contract = new ethers.Contract(MONAZZLE_CONTRACT_ADDRESS, MONAZZLE_ABI, provider);

    // contract.on('MonazzleStarted', (id, difficulty, event) => {
    //   if (id.toString() === monazzleId) {
    //     console.log('MonazzleStarted event:', id, difficulty);
    //     // Fetch board: GET /api/monazzle/{id}/board
    //   }
    // });

    // return () => {
    //   contract.removeAllListeners('MonazzleStarted');
    // };
  }, [monazzleId]);

  return {
    loading,
    error,
    smartAccountAddress,
    isSmartAccountReady,
    commitImageAndStartMonazzle,
    swapPiece,
    requestHint,
    activateAISolver,
    mintMonazzleNFT,
  };
} 