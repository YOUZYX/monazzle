import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "@/lib/chains"; // Use our custom Monad chain
import { injected, walletConnect } from "wagmi/connectors";

// TODO: Replace with your actual WalletConnect Project ID if you use WalletConnect directly
const walletConnectProjectId = process.env.REOWN_PROJECT_ID as string;

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({ projectId: walletConnectProjectId }),
    farcasterFrame(),
  ],
  ssr: true,
});

const queryClient = new QueryClient();

export default function FrameWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
