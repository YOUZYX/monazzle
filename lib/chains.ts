import { type Chain } from 'viem';

export const monadTestnet = {
    id: 10143, // Monad Public Testnet https://docs.monad.xyz/using-monad/networks
    name: 'Monad Testnet',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://monad-testnet.g.alchemy.com/v2/ogmHSRoIOjVfzPOYkGLK6OWieVj143q6'] },
      public: { http: ['https://testnet.monad.xyz/'] },
    },
    blockExplorers: {
      default: { name: 'MonadScan', url: 'https://testnet.monadexplorer.com/' },
    },
    testnet: true,
  } as const satisfies Chain; 