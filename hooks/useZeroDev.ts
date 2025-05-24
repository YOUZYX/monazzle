'use client'

import { useContext, useState, useEffect, useCallback } from 'react'
import { ZeroDevContext } from '@/context/zeroDev'
import { formatEther, parseEther } from 'viem'

export type ZeroDevStatus = 'disconnected' | 'connecting' | 'ready' | 'error'

export default function useZeroDev() {
  const {
    smartAccountAddress,
    isSmartAccountReady,
    isLoading,
    error,
    kernelClient,
    initializeSmartAccount,
    topUpAccount,
    getSmartAccountBalance
  } = useContext(ZeroDevContext)

  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [balanceFormatted, setBalanceFormatted] = useState<string>('0')
  const [status, setStatus] = useState<ZeroDevStatus>('disconnected')

  // Get the current status based on context state
  useEffect(() => {
    if (error) {
      setStatus('error')
    } else if (isLoading) {
      setStatus('connecting')
    } else if (isSmartAccountReady) {
      setStatus('ready')
    } else {
      setStatus('disconnected')
    }
  }, [isSmartAccountReady, isLoading, error])

  // Initialize the account when this hook is called
  const initialize = useCallback(async () => {
    if (!isSmartAccountReady && !isLoading) {
      await initializeSmartAccount()
    }
  }, [isSmartAccountReady, isLoading, initializeSmartAccount])

  // Top up the account with a specified amount of MON
  const topUp = useCallback(async (amountInEther: string): Promise<string | null> => {
    try {
      const amountInWei = parseEther(amountInEther)
      const txHash = await topUpAccount(amountInWei)
      await updateBalance()
      return txHash
    } catch (err) {
      console.error("Error in topUp:", err)
      return null
    }
  }, [topUpAccount])

  // Update the smart account balance
  const updateBalance = useCallback(async () => {
    if (smartAccountAddress) {
      const newBalance = await getSmartAccountBalance()
      setBalance(newBalance)
      setBalanceFormatted(formatEther(newBalance))
    }
  }, [smartAccountAddress, getSmartAccountBalance])

  // Refresh balance when account becomes ready or on manual update
  useEffect(() => {
    if (isSmartAccountReady) {
      updateBalance()
    }
  }, [isSmartAccountReady, updateBalance])

  return {
    smartAccountAddress,
    balance,
    balanceFormatted,
    status,
    isSmartAccountReady,
    isLoading,
    error,
    kernelClient,
    initialize,
    topUp,
    updateBalance
  }
} 