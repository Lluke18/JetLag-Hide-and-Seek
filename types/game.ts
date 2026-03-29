export interface Player {
  uid: string
  name: string
  role: 'hider' | 'seeker'
  ready: boolean
  isCreator: boolean
}

export interface POIMarker {
  id: string
  type: 'point' | 'area' | 'measuring_circles' | 'matching_points'
  name: string
  answerStatus?: 'CLOSER' | 'FURTHER' | 'YES' | 'NO' | 'NULL'
  center?: { lat: number; lng: number }
  bounds?: { north: number; south: number; east: number; west: number }
  circles?: { center: { lat: number; lng: number }; radius: number }[]
  points?: { center: { lat: number; lng: number }; isMatch: boolean; name: string }[]
}

export interface Game {
  id: string
  code: string
  createdAt: any
  hider: string | null
  seekers: string[]
  status: 'lobby' | 'waiting' | 'active' | 'hidingPeriod' | 'moving' | 'ended' | 'endGame'
  totalHidingTime: number
  activeCurses: Curse[]
  hiderLocation: {
    lat: number
    lng: number
  } | null
  seekerLocations: {
    [userId: string]: {
      lat: number
      lng: number
    }
  }
  pendingQuestion?: {
    category: string
    question: Question
    timestamp: any
    expiresAt?: any
    askerUid?: string
    askerLocation?: { lat: number; lng: number }
    thermometerStartLocation?: { lat: number; lng: number }
  } | null
  gameSize?: 'small' | 'medium' | 'large' | 'custom'
  hidingPeriodEndsAt?: any
  gameStartedAt?: any
  travelEndsAt?: any                      // When the travel phase ends
  hidingZoneCenter?: { lat: number; lng: number } // Fixed zone center locked when travel ends
  hidingDurationMs?: number               // Hiding phase duration in milliseconds
  hidingZoneRadius?: number               // Fixed zone radius locked when travel ends
  gameAreaCenter?: { lat: number; lng: number } // Center of the game Area (where seekers started)
  gameAreaRadius?: number // Radius of the game boundary (formerly mapRadiusMeters)
  outOfBoundsSince?: any // Timestamp when the Hider went out of bounds
  restrictedAreas?: { center: { lat: number; lng: number }; radius: number }[] // Radar 'No' areas
  thermometerZones?: { point1: { lat: number; lng: number }; point2: { lat: number; lng: number }; isHotter: boolean }[] // Thermometer 'Hotter/Colder' half-planes
  activeThermometer?: { askerUid: string; startLocation: { lat: number; lng: number }; startTime: any; question: Question } | null // Active tracking state for seekers walking
  chatMessages?: ChatMessage[]
  deck?: Card[] // The main draw deck
  hiderDeck?: Card[] // Hider's hand (max 6 cards)
  usedQuestionIds?: string[] // IDs of questions already asked
  players?: { [uid: string]: Player } // Lobby players
  customSettings?: CustomGameSettings
  maxHandSize?: number // Expanded hand size
  movePhaseEndsAt?: any // When the move phase ends
  originalHidingTime?: number // Track remaining hiding time when paused
  poiMarkers?: POIMarker[] // Persistent POIs that remain on map for both teams
}

export interface CustomGameSettings {
  durationHours: number           // Game duration in hours
  mapRadiusMeters: number         // Hiding zone radius in meters
  enabledCategories: string[]     // Which question categories are enabled
  enabledQuestionIds?: string[]   // Specific question IDs enabled (if set, overrides category filter)
  travelDurationMinutes?: number  // Time to hide before zone locks (minutes)
}

export interface ChatMessage {
  id: string
  type: 'question' | 'answer' | 'system' | 'photo'
  content: string
  question?: string
  category?: string
  timestamp: any
  sender?: 'hider' | 'seeker' | 'system'
  photoUrl?: string
}

export interface Curse {
  id: string
  name: string
  description: string
  duration: number
  timestamp: any
}

export interface Card {
  id: string
  type: 'timeBonus' | 'curse' | 'powerup'
  name: string
  description: string
  value?: number // Legacy field, still used for curses and simple effects
  effect?: string // For powerup effects
  // Time bonus specific fields
  color?: string // Color tier: red, orange, yellow, green, blue
  smallValue?: number // Time bonus for small games (in seconds)
  mediumValue?: number // Time bonus for medium games (in seconds)
  largeValue?: number // Time bonus for large games (in seconds)
  // Curse specific fields
  curseEffect?: string // Describes the curse effect
}

export interface Question {
  id: string
  category: 'Matching' | 'Measuring' | 'Radar' | 'Thermometer' | 'Photo' | 'Tentacle'
  question: string
  answer: string
  type: 'matching' | 'measuring' | 'radar' | 'thermometer' | 'photo' | 'tentacle'
  drawCards?: number // number of cards to draw
  keepCards?: number // number of cards to keep
  timeLimit?: number // time limit in seconds (300 for normal, 600-1200 for photos)
  gameSize?: string // 'all', 'medium,large', 'large', etc.
}

export interface PresetConfig {
  label: string
  desc: string
  hours: number
  radius: number
  travelMinutes: number
}

// Allow dynamic string IDs instead of literal unions so admins can add their own modes
export type PresetMode = string
