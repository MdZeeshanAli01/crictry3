# 🔥 Firebase Setup Guide for Celestial Cricket Scoring App

## Overview
This guide will help you set up Firebase integration for persistent team and player data storage in your cricket scoring application.

## Current Status
- ✅ **Playing XI Selection**: Fixed with quick-add sample players feature
- ✅ **Firebase Integration**: Implemented with REST API approach
- ✅ **Fallback System**: Automatically uses localStorage if Firebase is not configured

## Quick Start (Using Sample Players)

### 1. Test the App Immediately
The app now includes a **Quick Add** feature that lets you instantly add sample players:

1. Start the app: `npm run dev`
2. Navigate to Team Setup
3. For each team, click **"Quick Add X"** button to instantly add the required players
4. Once both teams have 11+ players, you can select Playing XI
5. Start your match!

### 2. Sample Players Included
The app includes 15 professional cricket players:
- **Batsmen**: Virat Kohli, Rohit Sharma, KL Rahul, Shikhar Dhawan, Suryakumar Yadav
- **Bowlers**: Jasprit Bumrah, Mohammed Shami, Yuzvendra Chahal, Bhuvneshwar Kumar
- **All-rounders**: Ravindra Jadeja, Hardik Pandya, Washington Sundar
- **Wicket-keepers**: MS Dhoni, Rishabh Pant, Ishan Kishan

## Firebase Setup (Optional - For Persistent Storage)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "cricket-scoring-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore Database
1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

### Step 3: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web app" icon (`</>`)
4. Register your app with a nickname
5. Copy the configuration object

### Step 4: Configure the App
1. Open `src/config/firebase.ts`
2. Replace the placeholder values with your Firebase config:

```typescript
const firebaseConfig: FirebaseConfig = {
  projectId: 'your-actual-project-id',        // Replace this
  apiKey: 'your-actual-api-key',              // Replace this
  authDomain: 'your-project-id.firebaseapp.com',
  storageBucket: 'your-project-id.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef123456'
};
```

### Step 5: Set Firestore Security Rules (Development)
In Firebase Console > Firestore Database > Rules, use these rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Important**: Change these rules for production to secure your data!

### Step 6: Test Firebase Integration
1. Restart your app: `npm run dev`
2. Check browser console - you should see "Firebase database initialized successfully"
3. Save a team - it will be stored in Firebase Firestore
4. Refresh the page - your teams should persist

## Troubleshooting

### Issue: "Firebase not configured" warning
**Solution**: Update `src/config/firebase.ts` with your actual Firebase credentials.

### Issue: Teams not saving to Firebase
**Possible causes**:
1. Incorrect Firebase configuration
2. Firestore security rules too restrictive
3. Network connectivity issues

**Solution**: Check browser console for error messages and verify your Firebase setup.

### Issue: Can't select Playing XI
**Solution**: Each team needs at least 11 players. Use the "Quick Add" button to instantly add sample players.

### Issue: CORS errors with Firebase
**Solution**: The app uses Firebase REST API which should work without CORS issues. If you encounter problems, consider using the Firebase SDK instead.

## Features

### ✅ What's Working
- **Team Management**: Save, load, duplicate, and delete teams
- **Player Management**: Add players manually or browse from database
- **Quick Setup**: Instant sample player addition
- **Playing XI Selection**: Choose 11 players from squad
- **Persistent Storage**: Firebase integration with localStorage fallback
- **Professional UI**: Glassmorphism design with accessibility compliance

### 🚧 Coming Soon
- Advanced match statistics
- Undo/edit scoring functionality
- Wagon wheel and pitch map visualization
- Player career tracking
- Tournament management

## Database Structure

### Teams Collection
```json
{
  "id": "team-123",
  "name": "Mumbai Indians",
  "fullRoster": [...players],
  "captain": "player-id",
  "wicketKeeper": "player-id",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastUsed": "2024-01-01T00:00:00Z",
  "matchesPlayed": 0,
  "wins": 0,
  "losses": 0,
  "draws": 0
}
```

### Players Collection
```json
{
  "id": "player-123",
  "name": "Virat Kohli",
  "role": "batsman",
  "teamId": "team-123",
  "careerStats": {
    "matchesPlayed": 100,
    "runsScored": 5000,
    "wicketsTaken": 0,
    "catches": 50,
    "runOuts": 10
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "lastUsed": "2024-01-01T00:00:00Z"
}
```

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure Firestore security rules allow read/write access
4. Try the localStorage fallback by not configuring Firebase

The app is designed to work seamlessly with or without Firebase - you can start playing immediately with the sample players feature!
