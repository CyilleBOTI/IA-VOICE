// This is a workaround for the build process
// During build, we'll use a mock implementation of the Firebase admin SDK
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';

// Use mock implementation during build time
if (isBuildTime) {
  console.log('Build time detected, using mock Firebase Admin SDK');
  const { auth, db } = require('./firebase-admin-mock');
  module.exports = { auth, db };
} else {
  // Use real implementation during runtime
  const admin = require('firebase-admin');

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      });
      console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
      // Initialize with a dummy app if there's an error
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId: 'dummy-project',
        });
      }
    }
  }

  module.exports = {
    auth: admin.auth(),
    db: admin.firestore(),
  };
}
