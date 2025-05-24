'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import useZeroDev from '@/hooks/useZeroDev'
import { truncateAddress } from '@/lib/utils'

export default function SmartAccountWidget() {
  const { isConnected, address: eoaAddress } = useAccount()
  const { 
    smartAccountAddress, 
    isSmartAccountReady, 
    status, 
    error, 
    isLoading, 
    balanceFormatted,
    initialize, 
    topUp,
    updateBalance
  } = useZeroDev()

  const [amount, setAmount] = useState('0.01')
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Initialize the smart account when the EOA is connected
  useEffect(() => {
    if (isConnected && !isSmartAccountReady && !isLoading) {
      initialize()
    }
  }, [isConnected, isSmartAccountReady, isLoading, initialize])

  // Refresh balance every 15 seconds
  useEffect(() => {
    if (isSmartAccountReady) {
      updateBalance()
      const interval = setInterval(() => {
        updateBalance()
      }, 15000)
      return () => clearInterval(interval)
    }
  }, [isSmartAccountReady, updateBalance])

  const handleTopUp = async () => {
    if (!isSmartAccountReady || isDepositing) return
    
    setIsDepositing(true)
    try {
      const txHash = await topUp(amount)
      if (txHash) {
        setDepositTxHash(txHash)
        await updateBalance()
      }
    } catch (err) {
      console.error('Error during deposit:', err)
    } finally {
      setIsDepositing(false)
    }
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-md text-white">
        <h2 className="text-xl font-bold mb-2">Smart Account</h2>
        <p className="text-gray-300 mb-4">Connect your wallet to create a smart account</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md p-4 bg-gray-800 rounded-lg shadow-md text-white">
      <h2 className="text-xl font-bold mb-2">Smart Account</h2>
      
      {/* Status indicator */}
      <div className="flex items-center mb-4">
        <div 
          className={`w-3 h-3 rounded-full mr-2 ${
            status === 'ready' 
              ? 'bg-green-500' 
              : status === 'connecting' 
                ? 'bg-yellow-500' 
                : status === 'error' 
                  ? 'bg-red-500' 
                  : 'bg-gray-500'
          }`}
        />
        <span className="text-sm">
          {status === 'ready' 
            ? 'Smart Account Ready' 
            : status === 'connecting' 
              ? 'Initializing...' 
              : status === 'error' 
                ? 'Error' 
                : 'Not Initialized'}
        </span>
      </div>

      {/* Account addresses */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">EOA Address:</span>
          <span className="font-mono text-sm">{truncateAddress(eoaAddress || '')}</span>
        </div>
        
        {smartAccountAddress && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Smart Account:</span>
            <span className="font-mono text-sm">{truncateAddress(smartAccountAddress)}</span>
          </div>
        )}

        {isSmartAccountReady && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Balance:</span>
            <span>{balanceFormatted} MON</span>
          </div>
        )}
      </div>

      {/* Top-up form */}
      {isSmartAccountReady && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Top-up Smart Account</h3>
          <div className="flex space-x-2 mb-2">
            <input 
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Amount in MON"
            />
            <button 
              onClick={handleTopUp}
              disabled={isDepositing || !isSmartAccountReady}
              className={`px-4 py-2 rounded font-medium ${
                isDepositing || !isSmartAccountReady
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isDepositing ? 'Depositing...' : 'Deposit'}
            </button>
          </div>
          
          {depositTxHash && (
            <div className="mt-2 text-sm">
              <span className="text-gray-300">Transaction: </span>
              <a 
                href={`https://testnet.monadexplorer.com/tx/${depositTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline break-all"
              >
                {truncateAddress(depositTxHash, 12, 12)}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          <p className="font-semibold">Error:</p>
          <p>{error.message}</p>
          <a 
            href="https://docs.zerodev.app/sdk/core-api/create-account"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline mt-1 block"
          >
            View ZeroDev documentation
          </a>
        </div>
      )}

      {/* Advanced info toggle */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-4 text-xs text-gray-400 hover:text-gray-300 focus:outline-none"
      >
        {showAdvanced ? '- Hide advanced info' : '+ Show advanced info'}
      </button>

      {showAdvanced && smartAccountAddress && (
        <div className="mt-2 p-3 bg-gray-700/50 border border-gray-600 rounded text-xs">
          <p className="mb-1"><span className="text-gray-400">EOA: </span>{eoaAddress}</p>
          <p><span className="text-gray-400">Smart Account: </span>{smartAccountAddress}</p>
        </div>
      )}
    </div>
  )
} 