import * as admin from 'firebase-admin';

// Ensure your environment variables are set. Example:
// FIREBASE_PROJECT_ID="your-project-id"
// FIREBASE_CLIENT_EMAIL="your-client-email@gserviceaccount.com"
// FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

// Handle the private key format (it often comes from .env as a single line with \n literals)
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com` // Optional: if using Realtime Database
    });
    //console.log("Firebase Admin SDK initialized.");
  } catch (error) {
    //console.error("Firebase Admin SDK initialization error:", error);
    // Optionally, throw the error or handle it as critical if your app can't run without Firebase
    // throw new Error("Failed to initialize Firebase Admin SDK");
  }
} else {
  // console.log("Firebase Admin SDK already initialized.");
}

export const firestore = admin.firestore();
export const auth = admin.auth(); // If you need auth features
export const storage = admin.storage(); // If you need storage features
// Add other Firebase services if needed 