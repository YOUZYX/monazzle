import { useEffect, useRef } from 'react';
import { useFrame } from '@/components/farcaster-provider';

/**
 * Custom hook to call sdk.actions.ready() when the Farcaster Frame interface is ready
 * This should be called once when your main app component is mounted and ready
 */
export function useFarcasterReady() {
  const { actions, isSDKLoaded, error } = useFrame();
  const hasCalledReady = useRef(false);

  useEffect(() => {
    const callReady = async () => {
      if (
        isSDKLoaded && 
        actions && 
        !error && 
        !hasCalledReady.current
      ) {
        try {
          await actions.ready();
          hasCalledReady.current = true;
          console.log('[Farcaster] SDK ready() called successfully');
        } catch (err) {
          console.error('[Farcaster] Error calling ready():', err);
        }
      }
    };

    // Small delay to ensure DOM is fully rendered before calling ready
    const timeoutId = setTimeout(callReady, 100);

    return () => clearTimeout(timeoutId);
  }, [isSDKLoaded, actions, error]);

  return {
    isReady: hasCalledReady.current,
    isSDKLoaded,
    error
  };
}