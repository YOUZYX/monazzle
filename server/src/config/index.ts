import dotenv from 'dotenv';

// Ensure environment variables are loaded.
// Assumes the server process will be started with monazzle/server/ as the CWD,
// so .env will be found in monazzle/server/.env
dotenv.config();

interface AppConfig {
  port: number;
  monadRpcUrl: string;
  zeroDevProjectId: string;
  monazzleContractAddress: string;
  backendOraclePrivateKey: string;
  pinataApiKey?: string; // Optional if JWT is used
  pinataApiSecret?: string; // Optional if JWT is used
  pinataJwt?: string; // Preferred for Pinata auth
  firebaseProjectId?: string;
  firebaseClientEmail?: string;
  firebasePrivateKey?: string;
  googleApplicationCredentials?: string;
}

function getEnvVar(name: string, isOptional: boolean = false): string {
  const value = process.env[name];
  if (!value && !isOptional) {
    throw new Error(`Missing crucial environment variable: ${name}`);
  }
  return value || '';
}

const config: AppConfig = {
  port: parseInt(getEnvVar('PORT', true) || '3001', 10),
  monadRpcUrl: getEnvVar('MONAD_RPC_URL'),
  zeroDevProjectId: getEnvVar('ZERODEV_PROJECT_ID'),
  monazzleContractAddress: getEnvVar('MONAZZLE_CONTRACT_ADDRESS'),
  backendOraclePrivateKey: getEnvVar('BACKEND_ORACLE_PRIVATE_KEY'),
  pinataJwt: getEnvVar('PINATA_JWT', true),
  pinataApiKey: getEnvVar('PINATA_API_KEY', true),
  pinataApiSecret: getEnvVar('PINATA_API_SECRET', true),
  firebaseProjectId: getEnvVar('FIREBASE_PROJECT_ID', true),
  firebaseClientEmail: getEnvVar('FIREBASE_CLIENT_EMAIL', true),
  firebasePrivateKey: getEnvVar('FIREBASE_PRIVATE_KEY', true),
  googleApplicationCredentials: getEnvVar('GOOGLE_APPLICATION_CREDENTIALS', true),
};

if (config.pinataJwt) {
  //console.log('[Server Config] Using Pinata JWT for authentication.');
} else if (config.pinataApiKey && config.pinataApiSecret) {
 // console.log('[Server Config] Using Pinata API Key and Secret for authentication.');
} else {
  //console.warn('[Server Config] Pinata JWT or API Key/Secret not fully configured. Pinata dependent features may not work.');
}

if (config.googleApplicationCredentials) {
  //console.log(`[Server Config] Using GOOGLE_APPLICATION_CREDENTIALS for Firebase Admin SDK: ${config.googleApplicationCredentials}`);
} else if (config.firebaseProjectId && config.firebaseClientEmail && config.firebasePrivateKey) {
  //console.log('[Server Config] Using individual Firebase Admin SDK credentials from .env.');
} else {
  //console.warn('[Server Config] Firebase Admin SDK not fully configured. Firebase dependent features may not work.');
}

export default config; 