// Firebase Admin SDK script to seed the deck collection with 100 cards
// Run with: node scripts/seed-deck.js
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS or use service account

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to download service account key)
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

const db = admin.firestore();

// Helper function to create multiple copies of a card
function createCards(cardTemplate, count) {
  const cards = [];
  for (let i = 0; i < count; i++) {
    cards.push({ ...cardTemplate });
  }
  return cards;
}

const deckCards = [
  // ============================================
  // TIME BONUS CARDS (55 total)
  // ============================================

  // Red Time Bonus - 25 cards (25%)
  ...createCards({
    type: 'timeBonus',
    name: 'Red Time Bonus',
    description: 'Small: +2m | Medium: +3m | Large: +5m',
    color: 'red',
    smallValue: 120,   // 2 minutes in seconds
    mediumValue: 180,  // 3 minutes
    largeValue: 300,   // 5 minutes
  }, 25),

  // Orange Time Bonus - 15 cards (15%)
  ...createCards({
    type: 'timeBonus',
    name: 'Orange Time Bonus',
    description: 'Small: +4m | Medium: +6m | Large: +10m',
    color: 'orange',
    smallValue: 240,   // 4 minutes
    mediumValue: 360,  // 6 minutes
    largeValue: 600,   // 10 minutes
  }, 15),

  // Yellow Time Bonus - 10 cards (10%)
  ...createCards({
    type: 'timeBonus',
    name: 'Yellow Time Bonus',
    description: 'Small: +6m | Medium: +9m | Large: +15m',
    color: 'yellow',
    smallValue: 360,   // 6 minutes
    mediumValue: 540,  // 9 minutes
    largeValue: 900,   // 15 minutes
  }, 10),

  // Green Time Bonus - 3 cards (3%)
  ...createCards({
    type: 'timeBonus',
    name: 'Green Time Bonus',
    description: 'Small: +8m | Medium: +12m | Large: +20m',
    color: 'green',
    smallValue: 480,   // 8 minutes
    mediumValue: 720,  // 12 minutes
    largeValue: 1200,  // 20 minutes
  }, 3),

  // Blue Time Bonus - 2 cards (2%)
  ...createCards({
    type: 'timeBonus',
    name: 'Blue Time Bonus',
    description: 'Small: +12m | Medium: +18m | Large: +30m',
    color: 'blue',
    smallValue: 720,   // 12 minutes
    mediumValue: 1080, // 18 minutes
    largeValue: 1800,  // 30 minutes
  }, 2),

  // ============================================
  // POWERUP CARDS (19 total)
  // ============================================

  // Randomize - 4 cards (4%)
  ...createCards({
    type: 'powerup',
    name: 'Randomize',
    description: 'Randomize seeker question selection',
    effect: 'randomize',
  }, 4),

  // Veto - 4 cards (4%)
  ...createCards({
    type: 'powerup',
    name: 'Veto',
    description: 'Veto a seeker question',
    effect: 'veto',
  }, 4),

  // Move - 1 card (1%)
  ...createCards({
    type: 'powerup',
    name: 'Move',
    description: 'Force seekers to move locations',
    effect: 'move',
  }, 1),

  // Discard 1 Draw 2 - 4 cards (4%)
  ...createCards({
    type: 'powerup',
    name: 'Discard 1 Draw 2',
    description: 'Discard 1 card, then draw 2 new cards',
    effect: 'discard1draw2',
  }, 4),

  // Discard 2 Draw 3 - 4 cards (4%)
  ...createCards({
    type: 'powerup',
    name: 'Discard 2 Draw 3',
    description: 'Discard 2 cards, then draw 3 new cards',
    effect: 'discard2draw3',
  }, 4),

  // Draw 1 Expand 1 - 2 cards (2%)
  ...createCards({
    type: 'powerup',
    name: 'Draw 1 Expand 1',
    description: 'Draw 1 card and expand deck capacity by 1',
    effect: 'draw1expand1',
  }, 2),

  // Duplicate - 2 cards (2%)
  ...createCards({
    type: 'powerup',
    name: 'Duplicate',
    description: 'Duplicate a card from your deck',
    effect: 'duplicate',
  }, 2),

  // ============================================
  // CURSE CARDS (24 total, 24%)
  // ============================================

  { type: 'curse', name: 'Curse 1', description: 'Apply curse to seekers', curseEffect: 'curse1', value: 300 },
  { type: 'curse', name: 'Curse 2', description: 'Apply curse to seekers', curseEffect: 'curse2', value: 300 },
  { type: 'curse', name: 'Curse 3', description: 'Apply curse to seekers', curseEffect: 'curse3', value: 300 },
  { type: 'curse', name: 'Curse 4', description: 'Apply curse to seekers', curseEffect: 'curse4', value: 300 },
  { type: 'curse', name: 'Curse 5', description: 'Apply curse to seekers', curseEffect: 'curse5', value: 300 },
  { type: 'curse', name: 'Curse 6', description: 'Apply curse to seekers', curseEffect: 'curse6', value: 300 },
  { type: 'curse', name: 'Curse 7', description: 'Apply curse to seekers', curseEffect: 'curse7', value: 300 },
  { type: 'curse', name: 'Curse 8', description: 'Apply curse to seekers', curseEffect: 'curse8', value: 300 },
  { type: 'curse', name: 'Curse 9', description: 'Apply curse to seekers', curseEffect: 'curse9', value: 300 },
  { type: 'curse', name: 'Curse 10', description: 'Apply curse to seekers', curseEffect: 'curse10', value: 300 },
  { type: 'curse', name: 'Curse 11', description: 'Apply curse to seekers', curseEffect: 'curse11', value: 300 },
  { type: 'curse', name: 'Curse 12', description: 'Apply curse to seekers', curseEffect: 'curse12', value: 300 },
  { type: 'curse', name: 'Curse 13', description: 'Apply curse to seekers', curseEffect: 'curse13', value: 300 },
  { type: 'curse', name: 'Curse 14', description: 'Apply curse to seekers', curseEffect: 'curse14', value: 300 },
  { type: 'curse', name: 'Curse 15', description: 'Apply curse to seekers', curseEffect: 'curse15', value: 300 },
  { type: 'curse', name: 'Curse 16', description: 'Apply curse to seekers', curseEffect: 'curse16', value: 300 },
  { type: 'curse', name: 'Curse 17', description: 'Apply curse to seekers', curseEffect: 'curse17', value: 300 },
  { type: 'curse', name: 'Curse 18', description: 'Apply curse to seekers', curseEffect: 'curse18', value: 300 },
  { type: 'curse', name: 'Curse 19', description: 'Apply curse to seekers', curseEffect: 'curse19', value: 300 },
  { type: 'curse', name: 'Curse 20', description: 'Apply curse to seekers', curseEffect: 'curse20', value: 300 },
  { type: 'curse', name: 'Curse 21', description: 'Apply curse to seekers', curseEffect: 'curse21', value: 300 },
  { type: 'curse', name: 'Curse 22', description: 'Apply curse to seekers', curseEffect: 'curse22', value: 300 },
  { type: 'curse', name: 'Curse 23', description: 'Apply curse to seekers', curseEffect: 'curse23', value: 300 },
  { type: 'curse', name: 'Curse 24', description: 'Apply curse to seekers', curseEffect: 'curse24', value: 300 },
];

async function seedDeck() {
  console.log(`Preparing to seed ${deckCards.length} cards...`);

  // Delete existing cards first
  const existingCards = await db.collection('deck').get();
  console.log(`Found ${existingCards.size} existing cards, deleting...`);

  const batch = db.batch();
  existingCards.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log('✅ Deleted existing cards');

  // Add new cards in batches (Firestore has a 500 operation limit per batch)
  const batchSize = 500;
  for (let i = 0; i < deckCards.length; i += batchSize) {
    const batchCards = deckCards.slice(i, i + batchSize);
    const newBatch = db.batch();

    batchCards.forEach((card) => {
      const docRef = db.collection('deck').doc();
      newBatch.set(docRef, card);
    });

    await newBatch.commit();
    console.log(`✅ Seeded batch ${Math.floor(i / batchSize) + 1}: ${batchCards.length} cards`);
  }

  console.log(`\n✅ Successfully seeded ${deckCards.length} total cards to deck collection`);
  console.log('\nCard distribution:');
  console.log('- Time Bonuses: 55 cards (55%)');
  console.log('  - Red: 25 cards (25%)');
  console.log('  - Orange: 15 cards (15%)');
  console.log('  - Yellow: 10 cards (10%)');
  console.log('  - Green: 3 cards (3%)');
  console.log('  - Blue: 2 cards (2%)');
  console.log('- Powerups: 21 cards (21%)');
  console.log('  - Randomize: 4 cards (4%)');
  console.log('  - Veto: 4 cards (4%)');
  console.log('  - Move: 1 card (1%)');
  console.log('  - Discard 1 Draw 2: 4 cards (4%)');
  console.log('  - Discard 2 Draw 3: 4 cards (4%)');
  console.log('  - Draw 1 Expand 1: 2 cards (2%)');
  console.log('  - Duplicate: 2 cards (2%)');
  console.log('- Curses: 24 cards (24%)');
  console.log('  - Curse 1-24: 24 cards (24%)');
}

// Uncomment to run:
// seedDeck().catch(console.error);

module.exports = { seedDeck, deckCards };
