# JetLag Hide and Seek PWA

A real-time Hide and Seek Progressive Web App built with Next.js and Firebase.

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Firebase:**
   - Add your Firebase config to `.env.local` (see `FIREBASE_SETUP.md` for detailed instructions)
   - Enable Firestore Database and Anonymous Authentication in Firebase Console
   - Deploy Firestore rules: `firebase deploy --only firestore:rules`

3. **Seed initial data:**
   - Start dev server: `npm run dev`
   - Navigate to `http://localhost:3000/admin/seed`
   - Click "Seed All Collections"

4. **Add Google Maps API key:**
   - Get API key from [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Enable "Maps JavaScript API" and "Places API" (for transit/subway data)
   - Add to `.env.local`: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key`

5. **Add PWA icons (optional):**
   - Create `public/icon-192.png` (192x192 pixels)
   - Create `public/icon-512.png` (512x512 pixels)

6. **Run the app:**
   ```bash
   npm run dev
   ```

For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## Features

- Create or join games with 4-digit codes
- Real-time synchronization using Firestore
- Hider interface with map, card drawing, and coin counter
- Seeker interface with GPS tracking and question categories
- PWA support for mobile installation
- Curse overlays for Seekers when Hider plays curse cards
