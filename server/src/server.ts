import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import config from './config'; // Adjusted import path

const app = express();
const port = config.port;

// Middleware
app.use(express.json());

// Basic Ping Route
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// TODO: Implement GET /api/monazzle/{id}/board route (e.g., app.use('/api', monazzleRoutes);)

// Create HTTP server
const httpServer = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  console.log('[WebSocket] Client connected');

  // Example: Extract monazzleId from connection URL if needed
  // const Gist: client_connected_ws.ts
  // const requestUrl = req.url ? new URL(req.url, `ws://${req.headers.host}`) : null;
  // const monazzleId = requestUrl?.searchParams.get('monazzleId');
  // if (monazzleId) {
  //   console.log(`[WebSocket] Connection for Monazzle ID: ${monazzleId}`);
  //   // TODO: Associate ws connection with monazzleId for targeted messages
  // }

  ws.on('message', (message) => {
    console.log('[WebSocket] Received: %s', message);
    ws.send(`Hello, you sent -> ${message}`); // Echo for now
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error);
  });

  ws.send('Welcome to the Monazzle WebSocket server!');
});

// TODO: Setup ethers.js provider and contract instance (e.g., in a service)
// TODO: Implement on-chain event listeners (MonazzleStarted, PieceSwapped, etc.)
// TODO: Setup Pinata SDK service
// TODO: Setup Firebase Admin SDK service
// TODO: Setup Database connection and models

httpServer.listen(port, () => {
  console.log(`Monazzle server running on http://localhost:${port}`);
  console.log(`WebSocket server is listening on ws://localhost:${port}`);
  console.log(`Using Monad RPC URL: ${config.monadRpcUrl}`);
  console.log(`Monazzle Contract Address: ${config.monazzleContractAddress}`);
});

export default httpServer; 