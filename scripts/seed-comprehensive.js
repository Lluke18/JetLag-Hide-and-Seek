// Comprehensive seed file for Jet Lag Hide and Seek game
// Based on Jet Lag game mechanics with questions, curses, powerups, and time bonuses
// Run with: node scripts/seed-comprehensive.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key)
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

const db = admin.firestore();

// Questions based on Jet Lag categories - following exact templates
const questions = [
  // Matching Questions (Draw 3, Keep 1) - 5 min time limit
  // Format: "Is your nearest _____ the same as my nearest _____?"
  {
    category: 'Matching',
    question: 'Is your nearest Commercial Airport the same as my nearest Commercial Airport?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Transit Line the same as my nearest Transit Line?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Station\'s Name Length the same as my nearest Station\'s Name Length?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Street or Path the same as my nearest Street or Path?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest State the same as my nearest State?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest County the same as my nearest County?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Municipality | City | Town the same as my nearest Municipality | City | Town?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Neighbourhood the same as my nearest Neighbourhood?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Sector the same as my nearest Sector?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Mountain the same as my nearest Mountain?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Park the same as my nearest Park?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Amusement Park the same as my nearest Amusement Park?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Zoo the same as my nearest Zoo?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Aquarium the same as my nearest Aquarium?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Museum the same as my nearest Museum?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Movie Theatre the same as my nearest Movie Theatre?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Hospital the same as my nearest Hospital?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Library the same as my nearest Library?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Matching',
    question: 'Is your nearest Foreign Consulate the same as my nearest Foreign Consulate?',
    answer: 'Yes or No',
    type: 'matching',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  },
  
  // Measuring Questions (Draw 2, Keep 1) - 5 min time limit
  // Format: "Compared to me, are you closer to or further from _____?"
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Commercial Airport?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Rail Station?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from an International Border?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from Sea Level?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from A body of Water?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Coastline?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Mountain?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Park?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from an Amusement Park?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Zoo?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from an Aquarium?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Museum?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Movie Theatre?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Hospital?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from Library?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Measuring',
    question: 'Compared to me, are you closer to or further from a Foreign Consulate?',
    answer: 'Closer or Further',
    type: 'measuring',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  
  // Thermometer Questions (Draw 1, Keep 1) - 5 min time limit
  // Format: "I've just traveled (at least)____. Am I hotter or colder?"
  {
    category: 'Thermometer',
    question: 'I\'ve just traveled (at least) 800m. Am I hotter or colder?',
    answer: 'Hotter or Colder',
    type: 'thermometer',
    drawCards: 1,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'all', // for all game sizes
  },
  {
    category: 'Thermometer',
    question: 'I\'ve just traveled (at least) 4.5 km. Am I hotter or colder?',
    answer: 'Hotter or Colder',
    type: 'thermometer',
    drawCards: 1,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'all', // for all game sizes
  },
  {
    category: 'Thermometer',
    question: 'I\'ve just traveled (at least) 15 km. Am I hotter or colder?',
    answer: 'Hotter or Colder',
    type: 'thermometer',
    drawCards: 1,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'medium,large', // medium & large
  },
  {
    category: 'Thermometer',
    question: 'I\'ve just traveled (at least) 80 km. Am I hotter or colder?',
    answer: 'Hotter or Colder',
    type: 'thermometer',
    drawCards: 1,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'large', // large only
  },
  
  // Radar Questions (Draw 2, Keep 1) - Reveals location for 10 seconds - 5 min time limit
  // Format: "Are you within [Distance] of me?"
  {
    category: 'Radar',
    question: 'Are you within 400m of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 800m of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 1.5km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 5km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 8km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 14km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 40km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 80km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  {
    category: 'Radar',
    question: 'Are you within 160km of me?',
    answer: 'Yes or No',
    type: 'radar',
    drawCards: 2,
    keepCards: 1,
    timeLimit: 300,
  },
  
  // Tentacle Questions (Draw 4, Keep 1) - 5 min time limit
  // Format: "Of all the [Places] within [Distance] of me, which are you closest to?"
  {
    category: 'Tentacle',
    question: 'Of all the Museums within 1.5km of me, which are you closest to?',
    answer: 'Answer with museum name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'medium,large', // for medium and large games
  },
  {
    category: 'Tentacle',
    question: 'Of all the Libraries within 1.5km of me, which are you closest to?',
    answer: 'Answer with library name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'medium,large', // for medium and large games
  },
  {
    category: 'Tentacle',
    question: 'Of all the Movie Theaters within 1.5km of me, which are you closest to?',
    answer: 'Answer with theater name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'medium,large', // for medium and large games
  },
  {
    category: 'Tentacle',
    question: 'Of all the Hospitals within 1.5km of me, which are you closest to?',
    answer: 'Answer with hospital name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'medium,large', // for medium and large games
  },
  {
    category: 'Tentacle',
    question: 'Of all the Metro Lines within 25km of me, which are you closest to?',
    answer: 'Answer with metro line name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'large', // large games only
  },
  {
    category: 'Tentacle',
    question: 'Of all the Zoos within 25km of me, which are you closest to?',
    answer: 'Answer with zoo name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'large', // large games only
  },
  {
    category: 'Tentacle',
    question: 'Of all the Aquariums within 25km of me, which are you closest to?',
    answer: 'Answer with aquarium name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'large', // large games only
  },
  {
    category: 'Tentacle',
    question: 'Of all the Amusement Parks within 25km of me, which are you closest to?',
    answer: 'Answer with amusement park name',
    type: 'tentacle',
    drawCards: 4,
    keepCards: 1,
    timeLimit: 300,
    gameSize: 'large', // large games only
  },
  
  // Photo Questions (Draw 3, Keep 2) - 10-20 min time limit
  // Format: "Send a photo of ______."
  // All games
  {
    category: 'Photo',
    question: 'Send a photo of a Tree (must include the entire tree).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'all',
  },
  {
    category: 'Photo',
    question: 'Send a photo of The Sky (Place phone on ground and shoot directly up).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'all',
  },
  {
    category: 'Photo',
    question: 'Send a photo of You (Selfie mode, arm parallel to the ground, fully extended).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'all',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Widest Street (Must include both sides of the street).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'all',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Tallest structure in your sightline (Tallest from your current perspective / sightline. Must include top and both sides. The top must be in the top 1/3rd of frame).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'all',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Any building visible from station (Must stand directly outside transit station entrance. If multiple entrance you may choose. Must include roof, both sides, with the top of the building in the top 1/3rd of frame).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'all',
  },
  // Medium and up
  {
    category: 'Photo',
    question: 'Send a photo of Tallest building visible from station (Tallest from your perspective / sightline. Must stand directly outside transit station entrance. If multiple entrance you may choose. Must include roof, both sides, with the top of the building in the top 1/3rd of frame).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Trace Nearest Street / Path (Street / Path must be visible on mapping app. Trace intersection to intersection).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Two Buildings (Must include 5\'x5\' section with three distinct elements).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Restaurant Interior (No zoom, must take photo from outside through window).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Train Platform (Must include 5\'x5\' section with three distinct elements).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Park (No zoom, phone perpendicular to ground, must stand 5\' away from any obstruction).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Grocery Store Aisle (No zoom, stand at the end of the aisle, shoot directly down aisle).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Place of Worship (Must include 5\'x5\' section with three distinct elements).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 600,
    gameSize: 'medium,large',
  },
  // Large only
  {
    category: 'Photo',
    question: 'Send a photo of 800m of streets traced (Must be continuous, include 5 turns, no doubling back, send N-S Oriented, streets must appear on mapping app).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 1200,
    gameSize: 'large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Tallest mountain visible from station (Tallest from your perspective / sightline. Must be 3x zoom. Top of mountain must be in top 1/3rd of frame).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 1200,
    gameSize: 'large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Biggest body of water in your zone (Max 3x zoom. Must include either both sides of water OR the horizon).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 1200,
    gameSize: 'large',
  },
  {
    category: 'Photo',
    question: 'Send a photo of Five buildings (Must include bottom, and up to four stories).',
    answer: 'Submit a photo',
    type: 'photo',
    drawCards: 3,
    keepCards: 2,
    timeLimit: 1200,
    gameSize: 'large',
  },
];

// Time Bonus Cards
const timeBonusCards = [
  {
    type: 'timeBonus',
    name: 'Quick Boost',
    description: 'Add 30 seconds to your hiding time',
    value: 30,
  },
  {
    type: 'timeBonus',
    name: 'Extra Minute',
    description: 'Add 60 seconds to your hiding time',
    value: 60,
  },
  {
    type: 'timeBonus',
    name: 'Time Boost',
    description: 'Add 120 seconds to your hiding time',
    value: 120,
  },
  {
    type: 'timeBonus',
    name: 'Bonus Round',
    description: 'Add 180 seconds to your hiding time',
    value: 180,
  },
  {
    type: 'timeBonus',
    name: 'Extended Hide',
    description: 'Add 300 seconds to your hiding time',
    value: 300,
  },
];

// Powerup Cards
const powerupCards = [
  {
    type: 'powerup',
    name: 'Hand Expansion',
    description: 'Increase hand size by 2 cards (temporary)',
    effect: 'handSize+2',
  },
  {
    type: 'powerup',
    name: 'Double Draw',
    description: 'Draw twice as many cards next time',
    effect: 'doubleDraw',
  },
  {
    type: 'powerup',
    name: 'Question Shield',
    description: 'Skip the next question without penalty',
    effect: 'skipQuestion',
  },
  {
    type: 'powerup',
    name: 'Location Blur',
    description: 'Hide your location for 2 minutes',
    effect: 'hideLocation',
    value: 120,
  },
  {
    type: 'powerup',
    name: 'Speed Boost',
    description: 'Move at double speed for 3 minutes',
    effect: 'speedBoost',
    value: 180,
  },
  {
    type: 'powerup',
    name: 'Card Draw Plus',
    description: 'Draw 2 extra cards on next question',
    effect: 'extraDraw',
    value: 2,
  },
];

// Curse Cards
const curseCards = [
  {
    type: 'curse',
    name: 'FREEZE',
    description: 'Stay still for 3 minutes',
    value: 3, // minutes
  },
  {
    type: 'curse',
    name: 'SLOW MOTION',
    description: 'Move at half speed for 5 minutes',
    value: 5,
  },
  {
    type: 'curse',
    name: 'BLIND',
    description: 'Hide your location from seekers for 2 minutes',
    value: 2,
  },
  {
    type: 'curse',
    name: 'STUN',
    description: 'Cannot use cards for 4 minutes',
    value: 4,
  },
  {
    type: 'curse',
    name: 'REVEAL',
    description: 'Your location is revealed to seekers for 1 minute',
    value: 1,
  },
  {
    type: 'curse',
    name: 'TIME DRAIN',
    description: 'Lose 60 seconds from your hiding time',
    value: -60, // negative for time drain
  },
  {
    type: 'curse',
    name: 'CARD LOCK',
    description: 'Cannot draw new cards for 3 minutes',
    value: 3,
  },
];

async function seedQuestions() {
  const batch = db.batch();
  
  questions.forEach((question) => {
    const docRef = db.collection('questions').doc();
    batch.set(docRef, question);
  });
  
  await batch.commit();
  console.log(`✅ Seeded ${questions.length} questions to questions collection`);
}

async function seedDeck() {
  const batch = db.batch();
  
  const allCards = [...timeBonusCards, ...powerupCards, ...curseCards];
  
  allCards.forEach((card) => {
    const docRef = db.collection('deck').doc();
    batch.set(docRef, card);
  });
  
  await batch.commit();
  console.log(`✅ Seeded ${allCards.length} cards to deck collection`);
  console.log(`   - ${timeBonusCards.length} Time Bonus cards`);
  console.log(`   - ${powerupCards.length} Powerup cards`);
  console.log(`   - ${curseCards.length} Curse cards`);
}

async function seedAll() {
  try {
    await seedQuestions();
    await seedDeck();
    console.log('\n✅ All seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Uncomment to run:
// seedAll().catch(console.error);

module.exports = { seedQuestions, seedDeck, seedAll, questions, timeBonusCards, powerupCards, curseCards };
