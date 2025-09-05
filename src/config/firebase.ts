// Firebase Configuration for Cricket Scoring App
// 
// To enable Firebase integration:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. Enable Firestore Database
// 3. Get your project configuration
// 4. Update the config below with your Firebase credentials
// 5. Call configureDatabaseService() in your app initialization

import { configureDatabaseService } from '@/services/databaseService';

// Firebase configuration interface
export interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Your actual Firebase configuration
const firebaseConfig: FirebaseConfig = {
  projectId: 'cricscore-a97a7',
  apiKey: 'AIzaSyChoE4GF_jjpeoiUVF68pyIlog1OoyyBdk',
  authDomain: 'cricscore-a97a7.firebaseapp.com',
  storageBucket: 'cricscore-a97a7.firebasestorage.app',
  messagingSenderId: '864459233449',
  appId: '1:864459233449:web:0a9ba89e1c05c4f42b31b8'
};

// Initialize Firebase database service
export const initializeFirebaseDatabase = () => {
  try {
    // Validate Firebase configuration
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      throw new Error('Invalid Firebase configuration. projectId and apiKey are required.');
    }

    // Initialize database service with Firebase config
    configureDatabaseService({
      type: 'firebase',
      projectId: firebaseConfig.projectId,
      apiKey: firebaseConfig.apiKey
    });

    console.log('Firebase database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return false;
  }
};

// Export configuration for manual setup
export { firebaseConfig };
