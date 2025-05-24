'use client';

import React from 'react';

// TODO: Implement wallet connection logic using wagmi for HaHa, Phantom, Backpack, Warpcast
// TODO: Initialize and fetch ZeroDev smart account address
// TODO: Display EOA & AA Wallet addresses and AA balance

export default function ConnectWallet() {
  return (
    <div>
      <h2>Wallet Info</h2>
      <p>EOA Address: <span>Loading...</span></p>
      <p>AA Address: <span>Loading...</span></p>
      <p>AA Balance: <span>Loading...</span></p>
      <button>Connect Wallet</button>
    </div>
  );
} 