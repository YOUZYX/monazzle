const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

async function initializeFirebase() {
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

    return admin.firestore();
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
}

async function addTestData() {
  const firestore = await initializeFirebase();
  
  // Generate test data for monazzle IDs 1-30
  const testData = [];
  for (let i = 1; i <= 30; i++) {
    const imageCID = `test-image-cid-${i}`;
    const metadataCID = `test-metadata-cid-${i}`;
    const tokenURI = `ipfs://${metadataCID}`;
    
    testData.push({
      monazzleId: i.toString(),
      imageCID,
      metadataCID,
      tokenURI,
      puzzleLevel: i % 3 === 0 ? 'Hard' : (i % 2 === 0 ? 'Medium' : 'Easy'),
      createdAt: new Date()
    });
  }
  
  console.log(`Adding ${testData.length} test records to monazzleData collection...`);
  
  // Add data to Firestore
  const batch = firestore.batch();
  testData.forEach(data => {
    const docRef = firestore.collection('monazzleData').doc(data.monazzleId);
    batch.set(docRef, data);
  });
  
  try {
    await batch.commit();
    console.log('Test data added successfully!');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

addTestData().catch(console.error); 