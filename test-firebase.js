const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Firebase Admin SDK environment variables not fully set.');
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  }

  const firestore = admin.firestore();
  console.log("Firestore initialized:", !!firestore);
  
  // Try to get a document from the monazzleData collection
  console.log("Attempting to get a document from the monazzleData collection...");
  firestore.collection('monazzleData').limit(1).get()
    .then(snapshot => {
      console.log(`Found ${snapshot.size} document(s) in monazzleData collection`);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        console.log('Document ID:', doc.id);
        console.log('Document data:', doc.data());
      }
    })
    .catch(err => {
      console.error("Error getting documents:", err);
    });
} catch (error) {
  console.error("Error initializing Firebase:", error);
} 