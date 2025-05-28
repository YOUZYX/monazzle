import { cookieStorage, createStorage } from 'wagmi'; // Reown docs mention @wagmi/core, but latest wagmi often has these in root
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { monadTestnet } from '@/lib/chains'; // Our custom chain
import { farcasterFrame } from '@farcaster/frame-wagmi-connector';
// import { mainnet, arbitrum } from '@reown/appkit/networks'; // We will primarily use monadTestnet

// Get projectId from https://cloud.reown.com
export const projectId =  process.env.REOWN_PROJECT_ID as string; // Your provided Project ID

if (!projectId) {
  throw new Error('Project ID is not defined for Reown AppKit');
}

// Define the networks you want to support. For Monazzle, it's primarily Monad Testnet.
// Reown AppKit might also list other networks in its modal by default depending on its own config.
export const supportedNetworks = [monadTestnet]; 

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks: supportedNetworks, // Pass our defined networks here
  connectors: [
    farcasterFrame(), // Add Farcaster connector to main config
  ],
});

export const config = wagmiAdapter.wagmiConfig; 