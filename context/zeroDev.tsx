'use client'

import React, { createContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { http, createPublicClient, zeroAddress, Hex, SignableMessage, TypedDataDefinition, TypedData, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { monadTestnet } from '@/lib/chains'
import { createKernelAccount, createZeroDevPaymasterClient, createKernelAccountClient } from '@zerodev/sdk'
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator'
import { getEntryPoint, KERNEL_V2_2, KERNEL_V2_4, KERNEL_V3_1, KERNEL_V3_2 } from '@zerodev/sdk/constants'
import { polygonMumbai, sepolia, base, optimism } from "viem/chains"
import monazzleAbi from '@/contracts/monazzle_abi.json'

interface ZeroDevContextType {
  smartAccountAddress: string | null
  isSmartAccountReady: boolean
  isLoading: boolean
  error: Error | null
  kernelClient: any | null
  kernelAccount: any | null
  initializeSmartAccount: () => Promise<void>
  topUpAccount: (amount: bigint) => Promise<string | null>
  getSmartAccountBalance: () => Promise<bigint>
  swapPieceOnChain: (monazzleId: bigint, idxA: number, idxB: number) => Promise<any>
  executeAllPendingMoves: () => Promise<void>
  requestHint: (monazzleId: bigint) => Promise<any>
  activateAISolver: (monazzleId: bigint) => Promise<any>
}

export const ZeroDevContext = createContext<ZeroDevContextType>({
  smartAccountAddress: null,
  isSmartAccountReady: false,
  isLoading: false,
  error: null,
  kernelClient: null,
  kernelAccount: null,
  initializeSmartAccount: async () => { console.warn("[MonazzleZeroDevLog] initializeSmartAccount called before provider ready"); },
  topUpAccount: async () => { console.warn("[MonazzleZeroDevLog] topUpAccount called before provider ready"); return null; },
  getSmartAccountBalance: async () => { console.warn("[MonazzleZeroDevLog] getSmartAccountBalance called before provider ready"); return BigInt(0); },
  swapPieceOnChain: async () => { throw new Error("swapPieceOnChain called before provider ready"); },
  executeAllPendingMoves: async () => { throw new Error("executeAllPendingMoves called before provider ready"); },
  requestHint: async () => { throw new Error("requestHint called before provider ready"); },
  activateAISolver: async () => { throw new Error("activateAISolver called before provider ready"); }
})

export const ZeroDevProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  //console.log("[MonazzleZeroDevLog] ZeroDevProvider rendering");
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null)
  const [isSmartAccountReady, setIsSmartAccountReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [kernelClient, setKernelClient] = useState<any | null>(null)
  const [kernelAccount, setKernelAccount] = useState<any | null>(null)
  
  // Add state for move batching
  const [moveQueue, setMoveQueue] = useState<{monazzleId: bigint, moves: {idxA: number, idxB: number}[]}[]>([]);
  const MOVES_BATCH_SIZE = 3; // Only send transaction every 3 moves or on completion
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);

  const { address: eoa, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const zeroDevPublicClient = useMemo(() => {
    //console.log("[MonazzleZeroDevLog] zeroDevPublicClient useMemo: NEXT_PUBLIC_ZERODEV_RPC_URL is:", process.env.NEXT_PUBLIC_ZERODEV_RPC_URL);
    if (!process.env.NEXT_PUBLIC_ZERODEV_RPC_URL) {
      //console.warn("[MonazzleZeroDevLog] NEXT_PUBLIC_ZERODEV_RPC_URL is not set. zeroDevPublicClient will be null.");
      return null;
    }
    //console.log("[MonazzleZeroDevLog] monadTestnet object being used for zeroDevPublicClient:", monadTestnet);

    return createPublicClient({
      transport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC_URL),
      chain: monadTestnet
    });
  }, [process.env.NEXT_PUBLIC_ZERODEV_RPC_URL]);

  const initializeSmartAccount = useCallback(async () => {
    if (!isConnected || !walletClient || !process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID) {
      //console.log("[MonazzleZeroDevLog] Skipping initialization - missing isConnected, walletClient, or ZERODEV_PROJECT_ID");
      return;
    }
    if (!zeroDevPublicClient) {
        //console.error("[MonazzleZeroDevLog] Skipping initialization - zeroDevPublicClient is null or undefined. Check RPC URL env var.");
        setError(new Error("ZeroDev public client is not available. Check RPC URL."));
        setIsLoading(false);
        return;
    }

    //console.log("[MonazzleZeroDevLog] Starting initializeSmartAccount. zeroDevPublicClient available:", !!zeroDevPublicClient);
    setIsLoading(true)
    setError(null)

    try {
      if (!eoa || !walletClient || !zeroDevPublicClient) {
        setError(new Error("Required information (EOA, WalletClient, or ZeroDev PublicClient) is missing."))
        //console.error("[MonazzleZeroDevLog] EOA, WalletClient, or ZeroDev PublicClient is missing post-initial check.");
        setIsLoading(false)
        return
      }
      //console.log(`[MonazzleZeroDevLog] EOA address: ${eoa}`)
      
      const entryPointObject = getEntryPoint("0.7") 
      //console.log(`[MonazzleZeroDevLog] EntryPoint object from getEntryPoint("0.6"):`, entryPointObject);
      if (!entryPointObject || !entryPointObject.address) {
        //console.error("[MonazzleZeroDevLog] Failed to get valid entry point object for v0.6.");
        setError(new Error("Failed to get valid entry point object for v0.6."));
        setIsLoading(false);
        return;
      }
      //console.log(`[MonazzleZeroDevLog] Using EntryPoint Address (from object v0.6): ${entryPointObject.address}`);
      
      const kernelVersion = KERNEL_V3_2
      //console.log(`[MonazzleZeroDevLog] KernelVersion: ${kernelVersion}`)

      const adaptedSigner = {
        address: eoa,
        type: 'local' as 'local',
        signMessage: async (args: { message: SignableMessage } | SignableMessage): Promise<Hex> => {
          const message = (typeof args === 'object' && 'message' in args) ? args.message : args;
          if (!walletClient) throw new Error("Wallet client not available for signMessage");
          //console.log("[MonazzleZeroDevLog] adaptedSigner.signMessage called with:", message);
          return walletClient.signMessage({ account: eoa, message });
        },
        signTypedData: async <
            const TTypedData extends TypedData | { [key: string]: unknown },
            TPrimaryType extends string = string,
        >(
            typedData: TypedDataDefinition<TTypedData, TPrimaryType>
        ): Promise<Hex> => {
            if (!walletClient) throw new Error("Wallet client not available for signTypedData");
            //console.log("[MonazzleZeroDevLog] adaptedSigner.signTypedData called with:", typedData);
            return walletClient.signTypedData({
                account: eoa, 
                domain: typedData.domain,
                types: typedData.types,
                primaryType: typedData.primaryType,
                message: typedData.message,
            } as any);
        },
        signTransaction: async () => {
          //console.warn("[MonazzleZeroDevLog] adaptedSigner.signTransaction called but not implemented.");
          throw new Error('signTransaction is not implemented on this adapted signer.');
        },
        getPublicKey: async (): Promise<Hex> => {
            //console.log("[MonazzleZeroDevLog] adaptedSigner.getPublicKey called.");
            return eoa; 
        },
        source: 'wagmi',
      };
      //console.log("[MonazzleZeroDevLog] adaptedSigner created with type 'local':", adaptedSigner);

      //console.log(`[MonazzleZeroDevLog] Creating ECDSA validator with adaptedSigner, projectId: ${process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID}, entryPointObject (v0.6), kernelVersion: ${kernelVersion}`);
      const ecdsaValidator = await signerToEcdsaValidator(zeroDevPublicClient, {
        signer: adaptedSigner as any,
        entryPoint: entryPointObject,
        kernelVersion: kernelVersion,
      });
      //console.log("[MonazzleZeroDevLog] ECDSA validator created successfully (full object):", ecdsaValidator);

      //console.log(`[MonazzleZeroDevLog] Creating kernel account with kernelVersion: ${kernelVersion}, entryPointObject (v0.6), index: BigInt(0)`);
      const account = await createKernelAccount(zeroDevPublicClient, {
        plugins: {
          sudo: ecdsaValidator,
        },
        entryPoint: entryPointObject,
        kernelVersion: kernelVersion,
        index: BigInt(0),
      });
      //console.log(`[MonazzleZeroDevLog] Kernel account created successfully, address: ${account.address}`);
      
      setKernelAccount(account)
      setSmartAccountAddress(account.address)

      //console.log("[MonazzleZeroDevLog] Calling createZeroDevPaymasterClient...");
      const paymasterClient = createZeroDevPaymasterClient({
        chain: monadTestnet,
        transport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC_URL),
      })
      //console.log("[MonazzleZeroDevLog] paymasterClient created");

      //console.log("[MonazzleZeroDevLog] Calling createKernelAccountClient...");
      const client = createKernelAccountClient({
        account,
        chain: monadTestnet,
        bundlerTransport: http(process.env.NEXT_PUBLIC_ZERODEV_RPC_URL),
        client: zeroDevPublicClient
      })
      //console.log("[MonazzleZeroDevLog] kernelClient created");

      setKernelClient(client)
      setIsSmartAccountReady(true)
      //console.log(`[MonazzleZeroDevLog] Smart account initialized. Address: ${account.address}, Ready: true`);
    } catch (err) {
      //console.error("[MonazzleZeroDevLog] Error initializing ZeroDev account:", err);
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
      //console.log("[MonazzleZeroDevLog] initializeSmartAccount finished.");
    }
  }, [isConnected, walletClient, process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID])
  const topUpAccount = useCallback(async (amount: bigint): Promise<string | null> => {
    if (!walletClient || !eoa || !smartAccountAddress) return null
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Direct transfer from EOA to AA wallet using walletClient
      // This is a regular transaction, not a UserOperation
      const hash = await walletClient.sendTransaction({
        account: eoa as `0x${string}`,
        to: smartAccountAddress as `0x${string}`,
        value: amount,
        chain: monadTestnet, // Explicitly specify the chain
      })
      
      //console.log(`[MonazzleZeroDevLog] Direct transfer from EOA (${eoa}) to AA wallet (${smartAccountAddress}), hash: ${hash}`)
      
      // Wait for transaction to be mined
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash })
        //console.log(`[MonazzleZeroDevLog] Top-up transaction confirmed: ${receipt.transactionHash}`)
      }
      
      return hash
    } catch (err) {
      //console.error("[MonazzleZeroDevLog] Error topping up account:", err)
      setError(err instanceof Error ? err : new Error(String(err)))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [walletClient, eoa, smartAccountAddress, publicClient])

  const getSmartAccountBalance = useCallback(async (): Promise<bigint> => {
    if (!smartAccountAddress || !publicClient) return BigInt(0)
    
    try {
      const balance = await publicClient.getBalance({
        address: smartAccountAddress as `0x${string}`,
      })
      
      return balance
    } catch (err) {
      //console.error("Error getting smart account balance:", err)
      return BigInt(0)
    }
  }, [smartAccountAddress, publicClient])

  // Modified swapPieceOnChain function with batching
  const swapPieceOnChain = useCallback(
    async (monazzleId: bigint, idxA: number, idxB: number) => {
      if (!kernelClient || !kernelAccount) throw new Error('AA wallet not ready');
      
      // First, add the move to the queue
      setMoveQueue(prevQueue => {
        // Find if we already have moves for this monazzleId
        const existingMonazzleIndex = prevQueue.findIndex(
          item => item.monazzleId.toString() === monazzleId.toString()
        );
        
        if (existingMonazzleIndex >= 0) {
          // Add move to existing monazzle's queue
          const updatedQueue = [...prevQueue];
          updatedQueue[existingMonazzleIndex].moves.push({ idxA, idxB });
          return updatedQueue;
        } else {
          // Create new entry for this monazzle
          return [...prevQueue, { monazzleId, moves: [{ idxA, idxB }] }];
        }
      });
      
      // Find the moves for this monazzleId to check if we've reached batch size
      let currentMonazzleMoves = 0;
      setMoveQueue(prevQueue => {
        const monazzleEntry = prevQueue.find(
          item => item.monazzleId.toString() === monazzleId.toString()
        );
        currentMonazzleMoves = monazzleEntry?.moves.length || 0;
        return prevQueue;
      });
      
      // Only execute transaction if we've reached batch size and not already executing
      if (currentMonazzleMoves >= MOVES_BATCH_SIZE && !isExecutingBatch) {
        return await executeBatchedMoves(monazzleId);
      }
      
      // Return a placeholder receipt for non-batched moves
      return { 
        receipt: { 
          transactionHash: "pending-batch", 
          status: "queued" 
        },
        logs: []
      };
    },
    [kernelClient, kernelAccount, isExecutingBatch]
  );
  
  // New function to execute batched moves
  const executeBatchedMoves = useCallback(
    async (monazzleId: bigint) => {
      if (!kernelClient || !kernelAccount) throw new Error('AA wallet not ready');
      setIsExecutingBatch(true);
      
      try {
        // Find the queued moves for this monazzleId
        let movesToExecute: {idxA: number, idxB: number}[] = [];
        
        setMoveQueue(prevQueue => {
          const monazzleIndex = prevQueue.findIndex(
            item => item.monazzleId.toString() === monazzleId.toString()
          );
          
          if (monazzleIndex >= 0) {
            movesToExecute = [...prevQueue[monazzleIndex].moves];
            
            // Remove these moves from the queue
            const updatedQueue = [...prevQueue];
            updatedQueue[monazzleIndex].moves = [];
            return updatedQueue;
          }
          return prevQueue;
        });
        
        if (movesToExecute.length === 0) {
          return null;
        }
        
        //console.log(`[MonazzleZeroDevLog] Executing batch of ${movesToExecute.length} moves for Monazzle #${monazzleId}`);
        
        // For simplicity, just execute the last move in the batch
        // In a real implementation, you might want to combine these into a multicall
        const lastMove = movesToExecute[movesToExecute.length - 1];
        
        const contractAddress = '0xe017111996F228D727E34adBF1B98942FbF9639C';
        const calldata = encodeFunctionData({
          abi: monazzleAbi,
          functionName: 'swapPiece',
          args: [monazzleId, lastMove.idxA, lastMove.idxB],
        });
        
        const callData = await kernelAccount.encodeCalls([
          { to: contractAddress, value: 0n, data: calldata },
        ]);
        
        const userOpHash = await kernelClient.sendUserOperation({ callData });
        const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });
        //console.log(`[MonazzleZeroDevLog] Batch transaction completed for Monazzle #${monazzleId}`);
        
        return receipt;
      } catch (error) {
        //console.error(`[MonazzleZeroDevLog] Error executing batched moves:`, error);
        throw error;
      } finally {
        setIsExecutingBatch(false);
      }
    },
    [kernelClient, kernelAccount]
  );
  
  // Add a function to execute all pending moves (useful for game completion)
  const executeAllPendingMoves = useCallback(
    async () => {
      if (!kernelClient || !kernelAccount) return;
      
      // Process each monazzle's moves
      for (const monazzleEntry of moveQueue) {
        if (monazzleEntry.moves.length > 0) {
          await executeBatchedMoves(monazzleEntry.monazzleId);
        }
      }
    },
    [kernelClient, kernelAccount, moveQueue, executeBatchedMoves]
  );

  // Add after executeAllPendingMoves function
  // Constants for hint and AI solver costs from the contract
  const HINT_COST = BigInt(0.1 * 1e18); // 0.1 MON as defined in the contract
  const AI_COST = BigInt(1 * 1e18); // 1 MON as defined in the contract
  
  // Function to request a hint
  const requestHint = useCallback(
    async (monazzleId: bigint) => {
      if (!kernelClient || !kernelAccount) throw new Error('AA wallet not ready');
      
      const contractAddress = '0xe017111996F228D727E34adBF1B98942FbF9639C';
      
      try {
        //console.log(`[MonazzleZeroDevLog] Requesting hint for Monazzle #${monazzleId} with payment of ${HINT_COST} wei`);
        
        const calldata = encodeFunctionData({
          abi: monazzleAbi,
          functionName: 'requestHint',
          args: [monazzleId],
        });
        
        // Need to include value in the call
        const callData = await kernelAccount.encodeCalls([
          { to: contractAddress, value: HINT_COST, data: calldata },
        ]);
        
        const userOpHash = await kernelClient.sendUserOperation({ callData });
        const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });
        //console.log(`[MonazzleZeroDevLog] Hint request transaction completed:`, receipt);
        
        return receipt;
      } catch (error) {
        //console.error(`[MonazzleZeroDevLog] Error requesting hint:`, error);
        throw error;
      }
    },
    [kernelClient, kernelAccount]
  );
  
  // Function to activate AI solver
  const activateAISolver = useCallback(
    async (monazzleId: bigint) => {
      if (!kernelClient || !kernelAccount) throw new Error('AA wallet not ready');
      
      const contractAddress = '0xe017111996F228D727E34adBF1B98942FbF9639C';
      
      try {
        //console.log(`[MonazzleZeroDevLog] Activating AI solver for Monazzle #${monazzleId} with payment of ${AI_COST} wei`);
        
        const calldata = encodeFunctionData({
          abi: monazzleAbi,
          functionName: 'activateAISolver',
          args: [monazzleId],
        });
        
        // Need to include value in the call
        const callData = await kernelAccount.encodeCalls([
          { to: contractAddress, value: AI_COST, data: calldata },
        ]);
        
        const userOpHash = await kernelClient.sendUserOperation({ callData });
        const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });
        //console.log(`[MonazzleZeroDevLog] AI solver activation transaction completed:`, receipt);
        
        return receipt;
      } catch (error) {
        //console.error(`[MonazzleZeroDevLog] Error activating AI solver:`, error);
        throw error;
      }
    },
    [kernelClient, kernelAccount]
  );

  useEffect(() => {
    if (!isConnected) {
      setSmartAccountAddress(null)
      setIsSmartAccountReady(false)
      setKernelClient(null)
      setKernelAccount(null)
      setMoveQueue([]) // Clear move queue on disconnect
    }
  }, [isConnected])

  const value = {
    smartAccountAddress,
    isSmartAccountReady,
    isLoading,
    error,
    kernelClient,
    kernelAccount,
    initializeSmartAccount,
    topUpAccount,
    getSmartAccountBalance,
    swapPieceOnChain,
    executeAllPendingMoves,
    requestHint,
    activateAISolver
  }

  return (
    <ZeroDevContext.Provider value={value}>
      {children}
    </ZeroDevContext.Provider>
  )
}