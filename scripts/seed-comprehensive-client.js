// Client-side comprehensive seed file for Jet Lag Hide and Seek game
// This can be run in the browser console or as a one-time setup page

import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

// Helper function to create multiple copies of a card
const createCards = (card, count) => {
  return Array(count).fill(null).map((_, index) => ({
    ...card,
  }));
};

// TIME BONUS CARDS (55 total, 55%)
const timeBonusCards = [
  // Red - 25 cards (25%, 25% chance) - Small: +2m, Medium: +3m, Large: +5m
  ...createCards({
    type: 'timeBonus',
    name: 'Time Bonus',
    description: 'Add bonus time based on game size (Small: +2m | Medium: +3m | Large: +5m)',
    color: 'red',
    smallValue: 120,
    mediumValue: 180,
    largeValue: 300,
  }, 25),

  // Orange - 15 cards (15%, 15% chance) - Small: +4m, Medium: +6m, Large: +10m
  ...createCards({
    type: 'timeBonus',
    name: 'Time Bonus',
    description: 'Add bonus time based on game size (Small: +4m | Medium: +6m | Large: +10m)',
    color: 'orange',
    smallValue: 240,
    mediumValue: 360,
    largeValue: 600,
  }, 15),

  // Yellow - 10 cards (10%, 10% chance) - Small: +6m, Medium: +9m, Large: +15m
  ...createCards({
    type: 'timeBonus',
    name: 'Time Bonus',
    description: 'Add bonus time based on game size (Small: +6m | Medium: +9m | Large: +15m)',
    color: 'yellow',
    smallValue: 360,
    mediumValue: 540,
    largeValue: 900,
  }, 10),

  // Green - 3 cards (3%, 3% chance) - Small: +8m, Medium: +12m, Large: +20m
  ...createCards({
    type: 'timeBonus',
    name: 'Time Bonus',
    description: 'Add bonus time based on game size (Small: +8m | Medium: +12m | Large: +20m)',
    color: 'green',
    smallValue: 480,
    mediumValue: 720,
    largeValue: 1200,
  }, 3),

  // Blue - 2 cards (2%, 2% chance) - Small: +12m, Medium: +18m, Large: +30m
  ...createCards({
    type: 'timeBonus',
    name: 'Time Bonus',
    description: 'Add bonus time based on game size (Small: +12m | Medium: +18m | Large: +30m)',
    color: 'blue',
    smallValue: 720,
    mediumValue: 1080,
    largeValue: 1800,
  }, 2),
];

// POWERUP CARDS (21 total, 21%)
const powerupCards = [
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
];

// CURSE CARDS (24 total, 24%)
const curseCards = [
  { type: 'curse', name: 'Curse 1', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse1', value: 300 },
  { type: 'curse', name: 'Curse 2', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse2', value: 300 },
  { type: 'curse', name: 'Curse 3', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse3', value: 300 },
  { type: 'curse', name: 'Curse 4', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse4', value: 300 },
  { type: 'curse', name: 'Curse 5', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse5', value: 300 },
  { type: 'curse', name: 'Curse 6', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse6', value: 300 },
  { type: 'curse', name: 'Curse 7', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse7', value: 300 },
  { type: 'curse', name: 'Curse 8', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse8', value: 300 },
  { type: 'curse', name: 'Curse 9', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse9', value: 300 },
  { type: 'curse', name: 'Curse 10', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse10', value: 300 },
  { type: 'curse', name: 'Curse 11', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse11', value: 300 },
  { type: 'curse', name: 'Curse 12', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse12', value: 300 },
  { type: 'curse', name: 'Curse 13', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse13', value: 300 },
  { type: 'curse', name: 'Curse 14', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse14', value: 300 },
  { type: 'curse', name: 'Curse 15', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse15', value: 300 },
  { type: 'curse', name: 'Curse 16', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse16', value: 300 },
  { type: 'curse', name: 'Curse 17', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse17', value: 300 },
  { type: 'curse', name: 'Curse 18', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse18', value: 300 },
  { type: 'curse', name: 'Curse 19', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse19', value: 300 },
  { type: 'curse', name: 'Curse 20', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse20', value: 300 },
  { type: 'curse', name: 'Curse 21', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse21', value: 300 },
  { type: 'curse', name: 'Curse 22', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse22', value: 300 },
  { type: 'curse', name: 'Curse 23', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse23', value: 300 },
  { type: 'curse', name: 'Curse 24', description: 'Active curse effect on seekers (5 min)', curseEffect: 'curse24', value: 300 },
];



export async function clearAllData() {
  if (!db) {
    console.error('Firebase db is not initialized');
    return false;
  }
  try {
    // Clear questions
    const questionsSnapshot = await getDocs(collection(db, 'questions'));
    const questionsPromises = questionsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(questionsPromises);

    // Clear deck
    const deckSnapshot = await getDocs(collection(db, 'deck'));
    const deckPromises = deckSnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deckPromises);

    console.log('✅ Cleared all existing data');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

export async function seedDeck() {
  if (!db) {
    console.error('Firebase db is not initialized');
    return false;
  }
  try {
    const allCards = [...timeBonusCards, ...powerupCards, ...curseCards];
    for (const card of allCards) {
      await addDoc(collection(db, 'deck'), card);
    }
    console.log(`✅ Seeded ${allCards.length} cards to deck collection`);
    console.log(`   - ${timeBonusCards.length} Time Bonus cards`);
    console.log(`   - ${powerupCards.length} Powerup cards`);
    console.log(`   - ${curseCards.length} Curse cards`);
    return true;
  } catch (error) {
    console.error('Error seeding deck:', error);
    return false;
  }
}

export async function seedQuestions() {
  if (!db) {
    console.error('Firebase db is not initialized');
    return false;
  }
  try {
    for (const question of questions) {
      await addDoc(collection(db, 'questions'), question);
    }
    console.log(`✅ Seeded ${questions.length} questions to questions collection`);
    return true;
  } catch (error) {
    console.error('Error seeding questions:', error);
    return false;
  }
}

export async function seedAll() {
  const clearResult = await clearAllData();
  if (!clearResult) {
    console.error('Failed to clear existing data');
    return false;
  }
  const deckResult = await seedDeck();
  const questionsResult = await seedQuestions();
  return deckResult && questionsResult;
}
