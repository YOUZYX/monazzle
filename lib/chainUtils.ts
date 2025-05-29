import { monadTestnet } from './chains';
import { toast } from 'sonner';

/**
 * Utility function to ensure we're on Monad Testnet before executing wallet operations
 * @param chainId Current chain ID from wallet
 * @param switchChain Function to switch chains
 * @param operation Name of the operation being performed (for toast messages)
 * @param silent Whether to suppress toast messages (for automatic switches)
 * @returns Promise<boolean> - true if on correct chain or successfully switched, false otherwise
 */
export async function ensureMonadTestnet(
  chainId: number | undefined,
  switchChain: (args: { chainId: number }) => Promise<any>,
  operation: string = 'operation',
  silent: boolean = false
): Promise<boolean> {
  if (chainId === monadTestnet.id) {
    return true; // Already on correct chain
  }

  if (!silent) {
    toast.info(`The chain is switched to Monad Testnet`);
  }
  
  try {
    await switchChain({ chainId: monadTestnet.id });
    if (!silent) {
      toast.success("Successfully switched to Monad Testnet");
    }
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (!silent) {
      toast.error(`Failed to switch to Monad Testnet: ${errorMessage}`);
    }
    console.error(`Chain switch failed for ${operation}:`, error);
    return false;
  }
}

/**
 * Check if the current chain is Monad Testnet
 * @param chainId Current chain ID
 * @returns boolean - true if on Monad Testnet
 */
export function isMonadTestnet(chainId: number | undefined): boolean {
  return chainId === monadTestnet.id;
}

/**
 * Get a human-readable chain name for display
 * @param chainId Chain ID
 * @returns string - Chain name or "Unknown Chain"
 */
export function getChainName(chainId: number | undefined): string {
  if (chainId === monadTestnet.id) return 'Monad Testnet';
  if (chainId === 8453) return 'Base';
  if (chainId === 1) return 'Ethereum Mainnet';
  if (chainId === 137) return 'Polygon';
  if (chainId === 42161) return 'Arbitrum One';
  if (chainId === 10) return 'Optimism';
  return `Chain ${chainId || 'Unknown'}`;
}

/**
 * Detect if we're running in Farcaster mobile app
 * @returns boolean - true if running in Farcaster mobile
 */
export function isFarcasterMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for Farcaster mobile specific user agents or properties
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check for Farcaster specific indicators
  const isFarcaster = userAgent.includes('farcaster') || 
                     userAgent.includes('warpcast') ||
                     // Check for window properties that might indicate Farcaster
                     !!(window as any).farcaster ||
                     !!(window as any).warpcast ||
                     // Check if we're in an iframe (common for Farcaster frames)
                     window.parent !== window;
  
  return isMobile && isFarcaster;
}

/**
 * Auto-switch to Monad Testnet if running in Farcaster mobile and on wrong chain
 * @param chainId Current chain ID
 * @param switchChain Function to switch chains  
 * @returns Promise<boolean> - true if on correct chain or successfully switched
 */
export async function autoSwitchToMonadTestnet(
  chainId: number | undefined,
  switchChain: (args: { chainId: number }) => Promise<any>
): Promise<boolean> {
  // Only auto-switch if we're in Farcaster mobile and not on Monad Testnet
  if (!isFarcasterMobile() || chainId === monadTestnet.id) {
    return true;
  }

  console.log('Farcaster mobile detected, auto-switching to Monad Testnet...');
  
  try {
    await switchChain({ chainId: monadTestnet.id });
    toast.info("The chain is switched to Monad Testnet");
    return true;
  } catch (error) {
    console.error('Auto chain switch failed:', error);
    return false;
  }
}