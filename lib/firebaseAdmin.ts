import * as admin from 'firebase-admin';

// Ensure your environment variables are set in .env.local or your hosting provider's settings.
// FIREBASE_PROJECT_ID="your-project-id"
// FIREBASE_CLIENT_EMAIL="your-client-email@gserviceaccount.com"
// FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY:', privateKey ? 'Exists' : 'Not Set');

if (!admin.apps.length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Firebase Admin SDK environment variables not fully set. Check .env.local or Vercel/hosting environment variables.');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    //console.log("Firebase Admin SDK initialized (monazzle/lib).");
  } catch (error) {
    //console.error("Firebase Admin SDK (monazzle/lib) initialization error:", error);
  }
} 

const firestoreDb = admin.apps.length ? admin.firestore() : null;

if (!firestoreDb) {
    //console.warn("Firestore DB could not be initialized. Check environment variables and Firebase setup.");
} else {
    //console.log("Firestore DB initialized successfully.");
}

export { firestoreDb as firestore }; 