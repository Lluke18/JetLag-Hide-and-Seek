import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB-xxxxx",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "buc-n-seek.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "buc-n-seek",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    const querySnapshot = await getDocs(collection(db, "games"));
    const games = [];
    querySnapshot.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data() });
    });

    games.sort((a, b) => {
        const at = a.createdAt?.seconds || 0;
        const bt = b.createdAt?.seconds || 0;
        return bt - at;
    });

    if (games.length > 0) {
        const latest = games[0];
        console.log("Latest game ID:", latest.id);
        console.log("Status:", latest.status);
        console.log("Map Radius (gameAreaRadius):", latest.gameAreaRadius);
        console.log("Hiding Radius (hidingZoneRadius):", latest.hidingZoneRadius);
        console.log("Game Area Center:", latest.gameAreaCenter);
        console.log("Hiding Zone Center:", latest.hidingZoneCenter);
    } else {
        console.log("No games found.");
    }
}

check().catch(console.error);
