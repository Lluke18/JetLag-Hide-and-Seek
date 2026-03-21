'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Game, Curse, Question, ChatMessage } from '@/types/game'
import GoogleMapWrapper from './GoogleMapWrapper'
import { MapPin, X, MessageSquare, HelpCircle, Navigation } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { playAnswerSound } from '@/lib/audio'

interface SeekerInterfaceProps {
  game: Game
}

const OutOfBoundsWarning = ({ since }: { since: any }) => {
  const [timeLeft, setTimeLeft] = useState(300)

  useEffect(() => {
    if (!since) return
    const startObj = since?.toDate?.() || new Date(since.seconds ? since.seconds * 1000 : since)
    if (!startObj || isNaN(startObj.getTime())) return

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startObj.getTime()) / 1000)
      setTimeLeft(Math.max(0, 300 - elapsed))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [since])

  if (!since || timeLeft <= 0) return null

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const secs = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <div className="absolute top-4 left-4 right-4 z-40 pointer-events-none">
      <div className="bg-red-600/90 backdrop-blur border-2 border-red-400 rounded-xl p-4 shadow-2xl flex flex-col items-center justify-center animate-pulse">
        <h3 className="text-white font-black text-xl uppercase tracking-widest flex items-center gap-2">
          <span className="text-2xl">⚠️</span> Out of Bounds
        </h3>
        <p className="text-red-100 font-bold text-lg mt-1">
          Return to game area in: <span className="text-white text-2xl font-mono ml-2">{mins}:{secs}</span>
        </p>
      </div>
    </div>
  )
}

export default function SeekerInterface({ game }: SeekerInterfaceProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeCurse, setActiveCurse] = useState<Curse | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [confirmingQuestion, setConfirmingQuestion] = useState<Question | null>(null)
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [googleMapsApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
  const [showHiderLocation, setShowHiderLocation] = useState(false)
  const [currentGame, setCurrentGame] = useState<Game>(game)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [geoRetry, setGeoRetry] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [questionsDrawerOpen, setQuestionsDrawerOpen] = useState(false)
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0)
  const [travelTimeLeft, setTravelTimeLeft] = useState<number | null>(null)
  const [moveTimeLeft, setMoveTimeLeft] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const initialLocationRef = useRef<{ lat: number; lng: number } | null>(null)

  // Load map settings from localStorage immediately (client-side only)
  const loadMapSettings = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mapSettings')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Error loading map settings:', e)
        }
      }
    }
    return null
  }

  const [mapSettings, setMapSettings] = useState<any>(loadMapSettings())

  // Listen for localStorage changes and reload settings
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mapSettings') {
        if (e.newValue) {
          try {
            setMapSettings(JSON.parse(e.newValue))
          } catch (error) {
            console.error('Error parsing map settings:', error)
          }
        } else {
          setMapSettings(null)
        }
      }
    }

    // Listen for storage events (from other tabs/windows)
    window.addEventListener('storage', handleStorageChange)

    // Also check for changes in the same tab (custom event)
    const handleCustomStorageChange = () => {
      const saved = localStorage.getItem('mapSettings')
      if (saved) {
        try {
          setMapSettings(JSON.parse(saved))
        } catch (error) {
          console.error('Error parsing map settings:', error)
        }
      }
    }

    // Listen for custom event (when settings are applied in same tab)
    window.addEventListener('mapSettingsUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('mapSettingsUpdated', handleCustomStorageChange)
    }
  }, [])

  useEffect(() => {
    if (!db) return
    const gameRef = doc(db, 'games', game.id)
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (!snapshot.exists()) return
      const gameData = { id: snapshot.id, ...snapshot.data() } as Game
      setCurrentGame(gameData)

      const curses = gameData.activeCurses || []
      if (curses.length > 0) {
        setActiveCurse(curses[curses.length - 1])
      } else {
        setActiveCurse(null)
      }

      if (gameData.pendingQuestion) {
        const questionType = gameData.pendingQuestion.question?.type
        if (questionType === 'radar') {
          setShowHiderLocation(true)
          setTimeout(() => {
            setShowHiderLocation(false)
          }, 10000)
        }
      }
    })

    return () => unsubscribe()
  }, [game.id])

  // Travel phase countdown for seekers
  useEffect(() => {
    if (currentGame.status !== 'hidingPeriod' || !currentGame.travelEndsAt) {
      setTravelTimeLeft(null)
      return
    }
    const tick = () => {
      const endsAt = currentGame.travelEndsAt?.toDate
        ? currentGame.travelEndsAt.toDate()
        : new Date(currentGame.travelEndsAt)
      setTravelTimeLeft(Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000)))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [currentGame.status, currentGame.travelEndsAt])

  // Move phase countdown for seekers
  useEffect(() => {
    if (currentGame.status !== 'moving' || !currentGame.movePhaseEndsAt) {
      setMoveTimeLeft(null)
      return
    }
    const tick = () => {
      const endsAt = currentGame.movePhaseEndsAt?.toDate
        ? currentGame.movePhaseEndsAt.toDate()
        : new Date(currentGame.movePhaseEndsAt)
      setMoveTimeLeft(Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000)))
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [currentGame.status, currentGame.movePhaseEndsAt])

  const lastMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }

    // Check for new incoming messages to play sound
    const messages = currentGame.chatMessages;
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessageIdRef.current !== lastMessage.id) {
        lastMessageIdRef.current = lastMessage.id || null;
        if (lastMessage.sender === 'hider' && (lastMessage.type === 'answer' || lastMessage.type === 'photo')) {
          playAnswerSound();
        }
      }
    }
  }, [currentGame.chatMessages, chatOpen])

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }

    setGeoError(null)

    // First quick attempt without high accuracy (faster on slow GPS)
    const fallbackTimer = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude }
          if (!initialLocationRef.current) {
            initialLocationRef.current = loc
          }
          setLocation(loc)
          updateSeekerLocation(loc)
        },
        () => { }, // already handled by main watcher
        { enableHighAccuracy: false, timeout: 5000 }
      )
    }, 8000) // only fires if high-accuracy hasn't resolved in 8s

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        clearTimeout(fallbackTimer)
        setGeoError(null)
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude }
        if (!initialLocationRef.current) {
          initialLocationRef.current = loc
        }
        setLocation(loc)
        updateSeekerLocation(loc)
      },
      (error) => {
        clearTimeout(fallbackTimer)
        console.error('Geolocation error:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please enable it in your browser/device settings.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoError('Location unavailable. Make sure GPS is enabled and try again.')
        } else {
          setGeoError('Could not get your location. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )

    return () => {
      clearTimeout(fallbackTimer)
      navigator.geolocation.clearWatch(watchId)
    }
  }, [geoRetry])

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    // Filter questions based on usedQuestionIds, game size, and custom settings
    if (questions.length === 0) {
      setAvailableQuestions([])
      return
    }

    const usedIds = currentGame.usedQuestionIds || []
    const gameSizeStr = currentGame.gameSize || 'small'

    // For custom games, filter by enabledQuestionIds
    const enabledIds = gameSizeStr === 'custom' && currentGame.customSettings?.enabledQuestionIds
      ? new Set(currentGame.customSettings.enabledQuestionIds)
      : null

    const filtered = questions.filter(q => {
      // Filter out used questions
      if (usedIds.includes(q.id)) return false

      // For custom games, only allow explicitly enabled questions
      if (enabledIds) return enabledIds.has(q.id)

      // Filter by game size for preset games
      if (q.gameSize) {
        if (q.gameSize === 'all') return true
        if (q.gameSize.includes(gameSizeStr)) return true
        return false
      }

      return true
    })

    setAvailableQuestions(filtered)
  }, [questions, currentGame.usedQuestionIds, currentGame.gameSize, currentGame.customSettings])

  const initializedCenterRef = useRef(false)
  const lastDbUpdateRef = useRef<number>(0)

  const updateSeekerLocation = async (loc: { lat: number; lng: number }) => {
    if (!db || !auth) return

    const now = Date.now()
    if (now - lastDbUpdateRef.current < 3000) return
    lastDbUpdateRef.current = now

    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const gameRef = doc(db, 'games', game.id)
      const updates: any = {
        [`seekerLocations.${userId}`]: loc,
      }

      if (!initializedCenterRef.current) {
        const snap = await getDoc(gameRef)
        const freshGame = snap.data() as Game
        if (!freshGame.gameAreaCenter) {
          updates.gameAreaCenter = loc
        }
        initializedCenterRef.current = true
      }

      await updateDoc(gameRef, updates)
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  const loadQuestions = async () => {
    if (!db) {
      console.error('Firebase db is not initialized')
      setQuestionsLoading(false)
      return
    }
    try {
      console.log('Loading questions from Firestore...')
      const questionsRef = collection(db, 'questions')
      const snapshot = await getDocs(questionsRef)
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[]
      console.log(`Loaded ${questionsData.length} questions`)
      console.log('Questions:', questionsData)
      setQuestions(questionsData)
      setQuestionsLoading(false)
    } catch (error) {
      console.error('Error loading questions:', error)
      setQuestionsLoading(false)
    }
  }

  const getCategories = () => {
    const categories = new Set(availableQuestions.map((q) => q.category))
    return Array.from(categories)
  }

  // Returns a compact label for the card face, stripping verbose question text
  const getShortLabel = (question: Question): string => {
    const q = question.question
    const type = question.type

    if (type === 'radar') {
      // "Are you within 400m of me?" → "400m"
      const match = q.match(/within\s+(\d+(?:\.\d+)?\s*(?:km|m))\s+of/i)
      return match ? match[1].replace(/\s+/, '') : q
    }

    if (type === 'thermometer') {
      // "I've just traveled (at least) 4.5 km. Am I hotter or colder?" → "4.5 km"
      const match = q.match(/\(at least\)\s*(\d+(?:\.\d+)?)\s*(km|m)\b/i)
      return match ? `${match[1]} ${match[2].toLowerCase()}` : q
    }

    if (type === 'measuring') {
      // "Compared to me, are you closer to or further from a Commercial Airport?"
      // → "Commercial Airport"
      const match = q.match(/further from\s+(?:a\s+|an\s+)?(.+?)\??$/i)
      if (match) return match[1].trim()
      return q
    }

    if (type === 'matching') {
      // "Is your nearest Commercial Airport the same as my nearest Commercial Airport?"
      // → "Commercial Airport"
      const match = q.match(/nearest\s+(.+?)\s+the same/i)
      if (match) return match[1].trim()
      return q
    }

    if (type === 'tentacle') {
      // "Of all the Museums within 1.5km of me, which are you closest to?"
      // → "Museums · 1.5km"
      const placeMatch = q.match(/all the\s+(.+?)\s+within/i)
      const distMatch = q.match(/within\s+(\d+(?:\.\d+)?\s*(?:km|m))\s+of/i)
      if (placeMatch && distMatch) {
        return `${placeMatch[1]} · ${distMatch[1].replace(/\s+/, '')}`
      }
      return placeMatch ? placeMatch[1] : q
    }

    if (type === 'photo') {
      // "Send a photo of a Tree (must include the entire tree)." → "Tree"
      // "Send a photo of Tallest structure in your sightline (...)" → "Tallest Structure"
      const match = q.match(/photo of\s+(?:a\s+|an\s+)?(.+?)(?:\s*\(|\.?\s*$)/i)
      if (match) {
        const label = match[1].trim()
        // Capitalise first letter of each word, limit length
        const titled = label.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1))
        return titled.length > 24 ? titled.slice(0, 22) + '…' : titled
      }
      return q
    }

    // Fallback
    return q.length > 22 ? q.slice(0, 20) + '…' : q
  }

  const sendQuestionRequest = async (question: Question) => {
    if (!db) {
      console.error('Firebase db is not initialized')
      return
    }
    try {
      // Check if there's already a pending question
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      const currentGame = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      if (currentGame.pendingQuestion) {
        alert('Please wait for the current question to be answered before asking another one.')
        return
      }

      console.log('Sending question request:', question)

      // Create chat message for the question
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'question',
        content: question.question,
        question: question.question,
        category: question.category,
        timestamp: new Date(),
        sender: 'seeker',
      }

      const currentMessages = currentGame.chatMessages || []
      const updatedMessages = [...currentMessages, chatMessage]

      // Add to used questions
      const usedQuestionIds = currentGame.usedQuestionIds || []
      const updatedUsedIds = [...usedQuestionIds, question.id]

      await updateDoc(gameRef, {
        pendingQuestion: {
          category: question.category,
          question: question,
          timestamp: new Date(),
          askerUid: auth?.currentUser?.uid || null,
          askerLocation: location ? { lat: location.lat, lng: location.lng } : null,
        },
        chatMessages: updatedMessages,
        usedQuestionIds: updatedUsedIds
      })

      console.log('Question sent successfully')
      setSelectedCategory(null)
      setSelectedQuestion(null)
      setQuestionsDrawerOpen(false)
    } catch (error) {
      console.error('Error sending question request:', error)
      alert('Failed to send question. Check console for details.')
    }
  }

  const startThermometer = async (question: Question) => {
    if (!db || !location) {
      console.error('Firebase db is not initialized or location missing')
      return
    }
    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      const currentGame = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      if (currentGame.pendingQuestion || currentGame.activeThermometer) {
        alert('Please wait for current question or thermometer to finish.')
        return
      }

      console.log('Starting thermometer:', question)

      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `A Seeker has started a Thermometer! Distance tracking has begun.`,
        timestamp: new Date(),
        sender: 'system',
      }

      const currentMessages = currentGame.chatMessages || []
      const updatedMessages = [...currentMessages, chatMessage]

      await updateDoc(gameRef, {
        activeThermometer: {
          askerUid: auth?.currentUser?.uid || 'unknown',
          startLocation: { lat: location.lat, lng: location.lng },
          startTime: new Date(),
          question: question,
        },
        chatMessages: updatedMessages,
      })

      console.log('Thermometer started successfully')
      setSelectedCategory(null)
      setSelectedQuestion(null)
      setQuestionsDrawerOpen(false)
    } catch (error) {
      console.error('Error starting thermometer:', error)
      alert('Failed to start thermometer. Check console for details.')
    }
  }

  const submitThermometer = async () => {
    if (!db || !location || !currentGame.activeThermometer) return
    const { activeThermometer } = currentGame

    // Dynamic Distance Check Enforcement
    const parseThermometerDistanceMeters = (questionText: string): number => {
      const m = questionText.match(/([\d.]+)\s*(km|m)/i)
      if (!m) return 50 // fallback
      const value = parseFloat(m[1])
      return m[2].toLowerCase() === 'km' ? value * 1000 : value
    }

    const requiredDistance = parseThermometerDistanceMeters(activeThermometer.question.question || '')

    const haversineDistanceMeters = (loc1: { lat: number, lng: number }, loc2: { lat: number, lng: number }) => {
      const R = 6371e3
      const p1 = loc1.lat * Math.PI / 180
      const p2 = loc2.lat * Math.PI / 180
      const dp = (loc2.lat - loc1.lat) * Math.PI / 180
      const dl = (loc2.lng - loc1.lng) * Math.PI / 180
      const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2)
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
    }

    const dist = haversineDistanceMeters(activeThermometer.startLocation, location)
    if (dist < requiredDistance) {
      alert(`You must walk at least ${requiredDistance} meters from your start point. (Current: ${Math.round(dist)}m)`)
      return
    }

    try {
      const gameRef = doc(db, 'games', game.id)

      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'question',
        content: activeThermometer.question.question,
        question: activeThermometer.question.question,
        category: activeThermometer.question.category,
        timestamp: new Date(),
        sender: 'seeker',
      }

      const currentMessages = currentGame.chatMessages || []
      const updatedMessages = [...currentMessages, chatMessage]

      const usedQuestionIds = currentGame.usedQuestionIds || []
      const updatedUsedIds = [...usedQuestionIds, activeThermometer.question.id]

      await updateDoc(gameRef, {
        activeThermometer: null, // clear it
        pendingQuestion: {
          category: activeThermometer.question.category,
          question: activeThermometer.question,
          timestamp: new Date(),
          askerUid: auth?.currentUser?.uid || null,
          askerLocation: { lat: location.lat, lng: location.lng }, // end location
          thermometerStartLocation: activeThermometer.startLocation, // original start
        },
        chatMessages: updatedMessages,
        usedQuestionIds: updatedUsedIds
      })

      console.log('Thermometer submitted successfully')
    } catch (error) {
      console.error('Error submitting thermometer:', error)
      alert('Failed to submit thermometer.')
    }
  }

  if (!googleMapsApiKey) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center max-w-md">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Google Maps API Key Missing</h2>
          <p className="text-gray-300 mb-4">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file
          </p>
          <p className="text-sm text-gray-400">
            Get your API key from: https://console.cloud.google.com/google/maps-apis
          </p>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="text-center max-w-sm space-y-4">
          <MapPin className={`w-12 h-12 mx-auto ${geoError ? 'text-red-400' : 'animate-pulse'}`} />
          {geoError ? (
            <>
              <h2 className="text-xl font-bold">Location Error</h2>
              <p className="text-gray-300 text-sm">{geoError}</p>
              <button
                onClick={() => setGeoRetry(r => r + 1)}
                className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <p className="text-gray-300">Getting your location…</p>
          )}
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center max-w-md">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Map Error</h2>
          <p className="text-gray-300">{mapError}</p>
        </div>
      </div>
    )
  }

  // Ensure settings are loaded
  if (mapSettings === null && typeof window !== 'undefined') {
    const saved = localStorage.getItem('mapSettings')
    if (saved) {
      try {
        const loaded = JSON.parse(saved)
        if (loaded) {
          setTimeout(() => {
            setMapSettings(loaded)
          }, 0)
        }
      } catch (e) {
        // Invalid JSON, continue with null
      }
    }
  }

  // Parse radar question to show radius circle for the asking seeker
  const parseRadarRadiusMeters = (questionText: string): number | null => {
    const m = questionText.match(/within\s+([\d.]+)\s*(km|m)\s+of/i)
    if (!m) return null
    const value = parseFloat(m[1])
    return m[2].toLowerCase() === 'km' ? value * 1000 : value
  }

  const isRadarQuestion = currentGame.pendingQuestion?.question?.type === 'radar'
  const radarRadiusMeters = isRadarQuestion
    ? parseRadarRadiusMeters(currentGame.pendingQuestion?.question?.question || '')
    : null

  // If a radar question is pending, draw the circle around the asker's location
  const radarCircle = (isRadarQuestion && currentGame.pendingQuestion?.askerLocation && radarRadiusMeters !== null)
    ? { center: currentGame.pendingQuestion.askerLocation, radiusMeters: radarRadiusMeters }
    : undefined

  return (
    <div className="h-dvh w-screen relative">
      <OutOfBoundsWarning since={currentGame.outOfBoundsSince} />

      {/* Travel phase waiting overlay */}
      {travelTimeLeft !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="text-5xl mb-4">🏃</div>
            <h2 className="text-2xl font-bold text-white mb-2">Hider is travelling</h2>
            <p className="text-gray-400 mb-6 text-sm">Wait for the hider to reach their hiding spot before asking questions.</p>
            <div className="bg-gray-800 rounded-xl px-6 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Questions unlock in</p>
              <p className={`text-3xl font-bold tabular-nums ${travelTimeLeft <= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
                {travelTimeLeft <= 0
                  ? 'Almost ready…'
                  : `${Math.floor(travelTimeLeft / 60)}m ${String(travelTimeLeft % 60).padStart(2, '0')}s`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Move phase waiting overlay */}
      {moveTimeLeft !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm pointer-events-auto">
          <div className="bg-gray-900 border border-indigo-500 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div className="text-5xl mb-4 text-indigo-400">
              <Navigation className="w-16 h-16 mx-auto animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hider is Moving!</h2>
            <p className="text-indigo-200 mb-6 text-sm">Wait for the hider to establish their new zone before resuming questions.</p>
            <div className="bg-gray-800 rounded-xl px-6 py-4">
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Zone establishes in</p>
              <p className={`text-4xl font-bold tabular-nums ${moveTimeLeft <= 60 ? 'text-orange-400' : 'text-indigo-400'}`}>
                {moveTimeLeft <= 0
                  ? 'Connecting…'
                  : `${Math.floor(moveTimeLeft / 60)}m ${String(moveTimeLeft % 60).padStart(2, '0')}s`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Move phase waiting overlay */}
      {moveTimeLeft !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm pointer-events-auto">
          <div className="bg-gray-900 border border-indigo-500 rounded-2xl p-8 text-center max-w-sm mx-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div className="text-5xl mb-4 text-indigo-400">
              <Navigation className="w-16 h-16 mx-auto animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Hider is Moving!</h2>
            <p className="text-indigo-200 mb-6 text-sm">Wait for the hider to establish their new zone before resuming questions.</p>
            <div className="bg-gray-800 rounded-xl px-6 py-4">
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-1">Zone establishes in</p>
              <p className={`text-4xl font-bold tabular-nums ${moveTimeLeft <= 60 ? 'text-orange-400' : 'text-indigo-400'}`}>
                {moveTimeLeft <= 0
                  ? 'Connecting…'
                  : `${Math.floor(moveTimeLeft / 60)}m ${String(moveTimeLeft % 60).padStart(2, '0')}s`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Thermometer Overlay (for the active seeker) */}
      {currentGame.activeThermometer && currentGame.activeThermometer.askerUid === auth?.currentUser?.uid && (
        <div className="absolute top-20 left-4 right-4 z-40">
          <div className="bg-red-600/95 backdrop-blur-md border-2 border-red-400 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.4)] text-center animate-pulse-slow">
            <div className="text-3xl mb-2">🌡️</div>
            <h2 className="text-xl font-bold text-white mb-1">Thermometer Active</h2>
            <p className="text-red-100 text-sm mb-4">Walk to your destination, then submit to check your distance.</p>
            <button
              onClick={submitThermometer}
              className="w-full bg-white text-red-600 hover:bg-red-50 font-bold py-3 px-4 rounded-xl transition-colors shadow-lg"
            >
              Submit Thermometer
            </button>
          </div>
        </div>
      )}

      {/* Active Thermometer Info (for other players waiting) */}
      {currentGame.activeThermometer && currentGame.activeThermometer.askerUid !== auth?.currentUser?.uid && (
        <div className="absolute top-20 left-4 right-4 z-40 pointer-events-none">
          <div className="bg-orange-600/90 backdrop-blur-md rounded-xl p-3 shadow-xl text-center">
            <p className="text-white font-semibold text-sm">🌡️ Another Seeker is running a Thermometer...</p>
          </div>
        </div>
      )}

      <GoogleMapWrapper
        key={JSON.stringify(mapSettings)} // Force remount when settings change
        center={initialLocationRef.current || { lat: location.lat, lng: location.lng }}
        zoom={mapSettings?.zoom || 15}
        onLoad={(map) => {
          setMapReady(true)
        }}
        onError={(error) => {
          console.error('Map error:', error)
          setMapError('Failed to load map. Please check your Google Maps API key.')
        }}
        seekerLocations={location ? { seeker: location } : {}}
        hiderLocation={null}
        showHiderLocation={false}
        showTransitLayer={mapSettings?.showTransitLayer !== false}
        mapTypeId={mapSettings?.mapTypeId || 'roadmap'}
        hiderMarkerColor={mapSettings?.hiderMarkerColor}
        seekerMarkerColor={mapSettings?.seekerMarkerColor}
        circleColor={mapSettings?.circleColor}
        circleOpacity={mapSettings?.circleOpacity}
        circleStrokeOpacity={mapSettings?.circleStrokeOpacity}
        circleStrokeWeight={mapSettings?.circleStrokeWeight}
        circleRadiusMeters={currentGame.hidingZoneRadius || 400}
        hiderMarkerSize={mapSettings?.hiderMarkerSize}
        seekerMarkerSize={mapSettings?.seekerMarkerSize}
        hiderMarkerStrokeColor={mapSettings?.hiderMarkerStrokeColor}
        seekerMarkerStrokeColor={mapSettings?.seekerMarkerStrokeColor}
        hiderMarkerStrokeWeight={mapSettings?.hiderMarkerStrokeWeight}
        seekerMarkerStrokeWeight={mapSettings?.seekerMarkerStrokeWeight}
        circleStrokeColor={mapSettings?.circleStrokeColor}
        showZoomControl={mapSettings?.showZoomControl !== false}
        showMapTypeControl={mapSettings?.showMapTypeControl}
        showStreetViewControl={mapSettings?.showStreetViewControl}
        showFullscreenControl={mapSettings?.showFullscreenControl}
        showPOILabels={mapSettings?.showPOILabels}
        showTransitLabels={mapSettings?.showTransitLabels !== false}
        showRoadLabels={mapSettings?.showRoadLabels !== false}
        showAdministrativeLabels={mapSettings?.showAdministrativeLabels !== false}
        showWaterLabels={mapSettings?.showWaterLabels !== false}
        showLandscapeLabels={mapSettings?.showLandscapeLabels !== false}
        radarCircle={radarCircle}
        showTransitLines={mapSettings?.showTransitLines !== false}
        showTransitStations={mapSettings?.showTransitStations !== false}
        showBusStops={mapSettings?.showBusStops !== false}
        showTramStops={mapSettings?.showTramStops !== false}
        showSubwayStations={mapSettings?.showSubwayStations !== false}
        showRailStations={mapSettings?.showRailStations !== false}
        showBusLines={mapSettings?.showBusLines !== false}
        showTramLines={mapSettings?.showTramLines !== false}
        showSubwayLines={mapSettings?.showSubwayLines !== false}
        showRailLines={mapSettings?.showRailLines !== false}
        showRoads={mapSettings?.showRoads !== false}
        showBuildings={mapSettings?.showBuildings !== false}
        showWater={mapSettings?.showWater !== false}
        showParks={mapSettings?.showParks !== false}
        showHighways={mapSettings?.showHighways !== false}
        showLocalRoads={mapSettings?.showLocalRoads !== false}
        showArterialRoads={mapSettings?.showArterialRoads !== false}
        darkMode={mapSettings?.darkMode}
        minZoom={mapSettings?.minZoom}
        maxZoom={mapSettings?.maxZoom}
        gestureHandling={mapSettings?.gestureHandling}
        disableDoubleClickZoom={mapSettings?.disableDoubleClickZoom}
        disableScrollWheel={mapSettings?.disableScrollWheel}
        draggable={mapSettings?.draggable !== false}
        keyboardShortcuts={mapSettings?.keyboardShortcuts !== false}
        clickableIcons={mapSettings?.clickableIcons}
        mapLanguage={mapSettings?.mapLanguage}
        tilt={mapSettings?.tilt}
        heading={mapSettings?.heading}
        restrictedAreas={currentGame.restrictedAreas || []}
        gameArea={currentGame.gameAreaCenter && currentGame.gameAreaRadius ? {
          center: currentGame.gameAreaCenter,
          radiusMeters: currentGame.gameAreaRadius
        } : undefined}
        thermometerZones={currentGame.thermometerZones || []}
        poiMarkers={currentGame.poiMarkers || []}
      />

      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => {
                setChatOpen(!chatOpen)
                if (!chatOpen) {
                  setQuestionsDrawerOpen(false)
                  setLastSeenMessageCount(currentGame.chatMessages?.length || 0)
                }
              }}
              className="bg-gray-900 border border-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors relative"
            >
              <MessageSquare className="w-6 h-6" />
              {currentGame.chatMessages && currentGame.chatMessages.length > lastSeenMessageCount && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (currentGame.status === 'hidingPeriod') return
                setQuestionsDrawerOpen(!questionsDrawerOpen)
                if (!questionsDrawerOpen) setChatOpen(false)
              }}
              disabled={currentGame.status === 'hidingPeriod'}
              className={`bg-gray-900 text-white p-3 rounded-lg shadow-lg transition-colors ${currentGame.status === 'hidingPeriod' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-800'
                }`}
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Active Curses - Stack underneath game code */}
        <AnimatePresence>
          {currentGame.activeCurses && currentGame.activeCurses.length > 0 && (
            <div className="flex flex-col gap-2 items-end">
              {currentGame.activeCurses.map((curse, index) => (
                <motion.div
                  key={curse.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-red-900 border-2 border-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3 max-w-md"
                >
                  <div className="flex-1">
                    <div className="font-bold text-sm">{curse.name}</div>
                    <div className="text-xs text-red-200">{curse.description}</div>
                  </div>
                  <div className="text-xs text-red-300 whitespace-nowrap">
                    {Math.floor(curse.duration / 60)}m
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-16 left-4 bottom-20 w-80 bg-gray-900 text-white z-20 shadow-2xl rounded-lg overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Chat</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-400">Game Code:</span>
                  <span className="text-sm font-bold text-blue-400">{currentGame.code}</span>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentGame.chatMessages && currentGame.chatMessages.length > 0 ? (
                <>
                  {currentGame.chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${message.type === 'question'
                        ? 'bg-blue-900/50 border border-blue-700'
                        : message.type === 'answer'
                          ? 'bg-green-900/50 border border-green-700'
                          : message.type === 'photo'
                            ? 'bg-yellow-900/50 border border-yellow-700'
                            : message.type === 'system'
                              ? 'bg-gray-800/80 border border-gray-700'
                              : 'bg-gray-800'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400">
                          {message.sender === 'system' ? 'System' : message.sender === 'hider' ? 'Hider' : 'Seeker'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp?.toDate
                            ? new Date(message.timestamp.toDate()).toLocaleTimeString()
                            : new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {message.type === 'question' && (
                        <div>
                          <p className="text-xs text-blue-300 mb-1">{message.category}</p>
                          <p className="text-sm font-medium">{message.question}</p>
                        </div>
                      )}
                      {message.type === 'answer' && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 line-through">{message.question}</p>
                          <p className="text-sm font-medium">
                            {message.content.includes('Yes') || message.content.includes('✓') ? (
                              <span className="text-green-400">{message.content}</span>
                            ) : message.content.includes('Random') ? (
                              <span className="text-orange-400">{message.content}</span>
                            ) : message.content.includes('Veto') ? (
                              <span className="text-red-400 font-bold uppercase">{message.content}</span>
                            ) : (
                              <span className="text-red-400">{message.content}</span>
                            )}
                          </p>
                          {message.photoUrl && (
                            <div className="mt-2">
                              <img
                                src={message.photoUrl}
                                alt="Answer photo"
                                className="w-full rounded-lg max-h-48 object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {message.type === 'photo' && (
                        <div>
                          <p className="text-xs text-yellow-300 mb-1">Photo Question: {message.question}</p>
                          {message.photoUrl ? (
                            <div className="mt-2">
                              <img
                                src={message.photoUrl}
                                alt="Hider's photo"
                                className="w-full rounded-lg max-h-64 object-cover"
                              />
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Photo pending...</p>
                          )}
                        </div>
                      )}
                      {message.type === 'system' && (
                        <div>
                          <p className="text-sm text-gray-300 italic">{message.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No messages yet</p>
                  <p className="text-sm mt-2">Questions and answers will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {questionsDrawerOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-16 right-4 bottom-20 w-80 bg-gray-900 text-white z-20 shadow-2xl rounded-lg overflow-hidden flex flex-col"
          >
            {/* Fixed header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between shrink-0">
              {selectedCategory ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedCategory(null); setSelectedQuestion(null) }}
                    className="p-1 hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <h3 className="text-xl font-bold">{selectedCategory}</h3>
                </div>
              ) : (
                <h3 className="text-xl font-bold">Questions</h3>
              )}
              <button
                onClick={() => setQuestionsDrawerOpen(false)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4">
              {questionsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading questions...</p>
                </div>
              ) : getCategories().length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-gray-400">No questions available</p>
                  <p className="text-sm text-gray-500">Questions need to be seeded into Firestore.</p>
                  <a
                    href="/admin/seed"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Go to Seed Page
                  </a>
                </div>
              ) : !selectedCategory ? (
                // Category grid — 2 columns
                <div className="grid grid-cols-2 gap-3">
                  {getCategories().map((category) => {
                    let icon = '❓'
                    if (category.toLowerCase().includes('match')) icon = '🔗'
                    else if (category.toLowerCase().includes('measur')) icon = '📏'
                    else if (category.toLowerCase().includes('radar')) icon = '📡'
                    else if (category.toLowerCase().includes('therm')) icon = '🌡️'
                    else if (category.toLowerCase().includes('photo')) icon = '📸'
                    else if (category.toLowerCase().includes('tentacle')) icon = '🐙'

                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className="bg-gradient-to-br from-gray-700 to-gray-900 p-3 rounded-xl border-2 border-white/10 hover:border-blue-400/50 cursor-pointer hover:scale-105 transition-all shadow-lg aspect-[5/6] w-full"
                      >
                        <div className="h-full flex flex-col items-center justify-between text-white">
                          <span className="text-4xl mt-1">{icon}</span>
                          <div className="flex-1 flex flex-col items-center justify-center px-1">
                            <p className="text-sm font-bold text-center leading-tight">{category}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                // Question grid — 2 columns
                <div className="grid grid-cols-2 gap-3">
                  {availableQuestions
                    .filter((q) => q.category === selectedCategory)
                    .map((question) => (
                      <button
                        key={question.id}
                        onClick={() => setConfirmingQuestion(question)}
                        className="bg-gradient-to-br from-gray-700 to-gray-900 p-3 rounded-xl border-2 border-white/10 hover:border-blue-400/50 cursor-pointer hover:scale-105 transition-all shadow-lg aspect-[5/6] w-full"
                      >
                        <div className="h-full flex flex-col items-center justify-between text-white">
                          <HelpCircle className="w-8 h-8 mt-1 text-blue-400" />
                          <div className="flex-1 flex flex-col items-center justify-center px-1">
                            <p className="text-sm font-bold text-center leading-tight">
                              {getShortLabel(question)}
                            </p>
                          </div>
                          {question.drawCards && question.keepCards && (
                            <p className="text-xs text-blue-300 font-bold">
                              {question.drawCards}/{question.keepCards}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmingQuestion && (
          <motion.div
            key="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmingQuestion(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Category badge */}
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
                {confirmingQuestion.category}
              </p>

              {/* Full question text */}
              <p className="text-white text-base leading-relaxed mb-6">
                {confirmingQuestion.question}
              </p>

              {/* Draw/Keep info if applicable */}
              {confirmingQuestion.drawCards && confirmingQuestion.keepCards && (
                <p className="text-sm text-blue-300 font-semibold mb-4">
                  Draw {confirmingQuestion.drawCards}, Keep {confirmingQuestion.keepCards}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingQuestion(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
                {confirmingQuestion.type === 'thermometer' ? (
                  <button
                    onClick={() => {
                      if (confirmingQuestion) {
                        startThermometer(confirmingQuestion)
                        setConfirmingQuestion(null)
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    Start Thermometer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirmingQuestion) sendQuestionRequest(confirmingQuestion)
                      setConfirmingQuestion(null)
                    }}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                  >
                    Ask Question
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Game Overlay */}
      <AnimatePresence>
        {currentGame.status === 'endGame' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-gray-900 border-2 border-red-500/50 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-400"></div>
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-6xl">🚨</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tight text-red-500">Game Over</h2>
              <p className="text-gray-300 text-lg mb-8">
                The Hider went out of bounds!
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
              >
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  )
}
