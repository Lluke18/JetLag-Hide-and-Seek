export interface Game {
  id: string
  code: string
  createdAt: any
  hider: string | null
  seekers: string[]
  status: 'waiting' | 'active' | 'hidingPeriod' | 'ended' | 'endGame'
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
  } | null
  gameSize?: 'small' | 'medium' | 'large'
  hidingPeriodEndsAt?: any
  hidingZoneRadius?: number // in meters
  chatMessages?: ChatMessage[]
  hiderDeck?: Card[] // Hider's deck (max 6 cards)
  usedQuestionIds?: string[] // IDs of questions already asked
}

export interface ChatMessage {
  id: string
  type: 'question' | 'answer' | 'system' | 'photo'
  content: string
  question?: string
  category?: string
  timestamp: any
  sender?: 'hider' | 'seeker'
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
