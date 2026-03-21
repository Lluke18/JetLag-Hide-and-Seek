'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, collection, getDocs, updateDoc, onSnapshot, getDoc, deleteField, serverTimestamp, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '@/lib/firebase'
import { Game, Card, Curse, ChatMessage, Question, POIMarker } from '@/types/game'
import GoogleMapWrapper from './GoogleMapWrapper'
import { MapPin, Menu, X, Camera, Upload, CreditCard, MessageSquare, Clock, Skull, Dice5, Ban, Navigation, RefreshCw, Copy, Zap, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { playQuestionSound } from '@/lib/audio'

interface HiderInterfaceProps {
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

interface QuestionModalProps {
  question: any
  onAnswer: (answer: boolean | string) => void
  onIgnore: () => void
  uploading: boolean
  isAnswering: boolean
  photoPreview: string | null
  photoFile: File | null
  setPhotoFile: (file: File | null) => void
  setPhotoPreview: (url: string | null) => void
  powerups: Card[]
  onPlayPowerup: (card: Card) => void
  errorDiscardAvailable?: boolean
  onErrorDiscard?: () => void
}

const QuestionModal = ({ question, onAnswer, onIgnore, uploading, isAnswering, photoPreview, photoFile, setPhotoFile, setPhotoPreview, powerups, onPlayPowerup, errorDiscardAvailable, onErrorDiscard }: QuestionModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="absolute inset-0 bg-black bg-opacity-90 z-30 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="bg-gray-900 text-white p-6 rounded-2xl max-w-md w-full relative z-40"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-blue-400">Incoming Question</h2>
        <button
          onClick={onIgnore}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <p className="text-lg mb-6 leading-relaxed">{question.question?.question}</p>

      {question.question?.type === 'photo' && (
        <div className="mb-6 space-y-4">
          {photoPreview ? (
            <div className="space-y-2">
              <img src={photoPreview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover border border-white/10 shadow-lg" />
              <button
                onClick={() => {
                  setPhotoFile(null)
                  setPhotoPreview(null)
                }}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Remove Photo
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setPhotoFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setPhotoPreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-4 rounded-xl transition-colors cursor-pointer shadow-lg active:scale-95"
                onClick={(e) => e.stopPropagation()}
              >
                <Camera className="w-6 h-6" />
                Take or Upload Photo
              </label>
            </div>
          )}
        </div>
      )}

      {errorDiscardAvailable ? (
        <button
          type="button"
          onClick={onErrorDiscard}
          disabled={uploading || isAnswering}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-4 rounded-xl transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
        >
          <Ban className="w-5 h-5" /> Area Error - Discard Card
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onAnswer(true)}
            disabled={uploading || isAnswering || (question.question?.type === 'photo' && !photoFile)}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : question.question?.type === 'photo' ? 'Submit Photo' : 'Yes'}
          </button>
          {question.question?.type !== 'photo' && (
            <button
              type="button"
              onClick={() => onAnswer(false)}
              disabled={uploading || isAnswering}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              No
            </button>
          )}
        </div>
      )}

      {/* Reaction Powerups Quick-Play */}
      {(powerups.some(c => c.effect === 'veto' || c.effect === 'randomize')) && (
        <div className="mt-6 pt-5 border-t border-gray-700/50">
          <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Reaction Powerups</h3>
          <div className="flex gap-2">
            {powerups.find(c => c.effect === 'veto') && (
              <button
                type="button"
                onClick={() => onPlayPowerup(powerups.find(c => c.effect === 'veto')!)}
                disabled={uploading || isAnswering}
                className="flex-1 bg-gradient-to-br from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-2 border border-purple-500/30 shadow-lg active:scale-95"
              >
                <Ban className="w-4 h-4 text-purple-200" /> Veto
              </button>
            )}
            {powerups.find(c => c.effect === 'randomize') && (
              <button
                type="button"
                onClick={() => onPlayPowerup(powerups.find(c => c.effect === 'randomize')!)}
                disabled={uploading || isAnswering}
                className="flex-1 bg-gradient-to-br from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-2 border border-purple-500/30 shadow-lg active:scale-95"
              >
                <Dice5 className="w-4 h-4 text-purple-200" /> Randomize
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  </motion.div>
)

// Helper function to get card icon, background color, and display info
const getCardDisplay = (card: Card, gameSize: string = 'medium') => {
  const display = {
    icon: null as any,
    bgColor: '',
    mainText: '',
    subText: ''
  }

  if (card.type === 'timeBonus') {
    display.icon = Clock
    // Get the appropriate time value based on game size
    let timeValue = card.mediumValue || 180
    if (gameSize === 'small') timeValue = card.smallValue || 120
    if (gameSize === 'large') timeValue = card.largeValue || 300

    const minutes = Math.floor(timeValue / 60)
    display.mainText = `+${minutes}m`

    // Color based on tier
    const colors: { [key: string]: string } = {
      'red': 'bg-gradient-to-br from-red-600 to-red-800',
      'orange': 'bg-gradient-to-br from-orange-600 to-orange-800',
      'yellow': 'bg-gradient-to-br from-yellow-500 to-yellow-700',
      'green': 'bg-gradient-to-br from-green-600 to-green-800',
      'blue': 'bg-gradient-to-br from-blue-600 to-blue-800'
    }
    display.bgColor = colors[card.color || 'red'] || colors['red']
    display.subText = 'TIME'
  } else if (card.type === 'curse') {
    display.icon = Skull
    display.bgColor = 'bg-gradient-to-br from-red-900 to-black'
    display.mainText = card.name
    display.subText = `${Math.floor((card.value || 300) / 60)}m`
  } else if (card.type === 'powerup') {
    // Map powerup effects to icons
    const powerupIcons: { [key: string]: any } = {
      'randomize': Dice5,
      'veto': Ban,
      'move': Navigation,
      'discard1draw2': RefreshCw,
      'discard2draw3': RefreshCw,
      'draw1expand1': Zap,
      'duplicate': Copy
    }
    display.icon = powerupIcons[card.effect || ''] || Zap
    display.bgColor = 'bg-gradient-to-br from-purple-600 to-indigo-800'
    display.mainText = card.name
    display.subText = 'POWER'
  }

  return display
}

const haversineDistanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000 // metres
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const aa = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa))
}

const getPoiType = (query: string): string | undefined => {
  const q = query.toLowerCase()
  if (q.includes('airport')) return 'airport'
  if (q.includes('amusement park')) return 'amusement_park'
  if (q.includes('park')) return 'park'
  if (q.includes('aquarium')) return 'aquarium'
  if (q.includes('museum')) return 'museum'
  if (q.includes('zoo')) return 'zoo'
  if (q.includes('movie')) return 'movie_theater'
  if (q.includes('hospital')) return 'hospital'
  if (q.includes('library')) return 'library'
  if (q.includes('consulate') || q.includes('embassy')) return 'embassy'
  if (q.includes('transit') || q.includes('station')) return 'transit_station'
  return undefined
}


export default function HiderInterface({ game }: HiderInterfaceProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [googleMapsApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
  const [pendingQuestion, setPendingQuestion] = useState<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [hidingElapsed, setHidingElapsed] = useState<number>(0)
  const [travelTimeLeft, setTravelTimeLeft] = useState<number | null>(null)
  const travelTransitionFiredRef = useRef(false)
  const [moveTimeLeft, setMoveTimeLeft] = useState<number | null>(null)
  const moveTransitionFiredRef = useRef(false)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const [isAnswering, setIsAnswering] = useState(false) // Component state for UI feedback
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [currentGame, setCurrentGame] = useState<Game>(game)
  // const isAnsweringRef = useRef(false) // Prevent multiple simultaneous calls
  const [drawnCards, setDrawnCards] = useState<Card[]>([])
  const [showCardSelection, setShowCardSelection] = useState(false)
  const [cardsToKeep, setCardsToKeep] = useState<Card[]>([])
  const [keepCount, setKeepCount] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [discardMode, setDiscardMode] = useState(false)
  const [cardsToDiscard, setCardsToDiscard] = useState<Card[]>([])
  const [currentDeckForDiscard, setCurrentDeckForDiscard] = useState<Card[]>([])
  const [deckOpen, setDeckOpen] = useState(false)
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const dismissedQuestionsRef = useRef<Set<string>>(new Set()) // Track dismissed question IDs
  const lastPendingQuestionIdRef = useRef<string | null>(null) // Track current pending question ID to avoid redundant state updates
  const shownQuestionIdRef = useRef<string | null>(null) // Track which question ID the modal is currently showing
  const initialLocationRef = useRef<{ lat: number; lng: number } | null>(null)

  const [targetingPowerup, setTargetingPowerup] = useState<{ powerup: Card, targetCount: number, type: 'discard1draw2' | 'discard2draw3' | 'duplicate' } | null>(null)
  const [targetedCards, setTargetedCards] = useState<Card[]>([])

  // Radar auto-answer state
  const isRadarQuestion = pendingQuestion?.question?.type === 'radar'
  const isMeasuringQuestion = pendingQuestion?.question?.type === 'measuring'
  const isThermometerQuestion = pendingQuestion?.question?.type === 'thermometer'
  const [radarAutoAnswer, setRadarAutoAnswer] = useState<boolean | null>(null)
  const [measuringResult, setMeasuringResult] = useState<'CLOSER' | 'FURTHER' | 'NULL' | null>(null)
  const [measuringError, setMeasuringError] = useState<string | null>(null)
  const [isMeasuringFetching, setIsMeasuringFetching] = useState(false)
  const [thermometerResult, setThermometerResult] = useState<'HOTTER' | 'COLDER' | null>(null)

  // Matching logic state
  const isMatchingQuestion = pendingQuestion?.question?.type === 'matching'
  const [matchingResult, setMatchingResult] = useState<'YES' | 'NO' | 'NULL' | null>(null)
  const [matchingError, setMatchingError] = useState<string | null>(null)
  const [isMatchingFetching, setIsMatchingFetching] = useState(false)

  // Map POI state
  const [seekerPoiResult, setSeekerPoiResult] = useState<google.maps.places.PlaceResult | null>(null)
  const [allMatchedPois, setAllMatchedPois] = useState<google.maps.places.PlaceResult[] | null>(null)
  const [seekerPoiDist, setSeekerPoiDist] = useState<number | null>(null)

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
      // Only update pendingQuestion when the actual question changes
      if (isAnswering) return

      const incomingId = gameData.pendingQuestion?.question?.id || null
      const currentId = lastPendingQuestionIdRef.current

      if (incomingId !== currentId) {
        lastPendingQuestionIdRef.current = incomingId
        if (gameData.pendingQuestion) {
          setPendingQuestion(gameData.pendingQuestion)
        } else {
          setPendingQuestion(null)
          shownQuestionIdRef.current = null
          setShowQuestionModal(false)
          setSeekerPoiResult(null)
          setAllMatchedPois(null)
          setSeekerPoiDist(null)
        }
      }
    })

    return () => unsubscribe()
  }, [game.id, isAnswering])

  // Control modal visibility — only fires when pendingQuestion reference actually changes
  useEffect(() => {
    const questionId = pendingQuestion?.question?.id
    if (questionId) {
      // Only show if not already shown and not dismissed
      if (shownQuestionIdRef.current !== questionId && !dismissedQuestionsRef.current.has(questionId)) {
        shownQuestionIdRef.current = questionId
        setShowQuestionModal(true)
        playQuestionSound()
      }
    } else {
      shownQuestionIdRef.current = null
      setShowQuestionModal(false)
    }
  }, [pendingQuestion])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentGame.chatMessages, chatOpen])

  const extractMeasuringPoi = (questionText: string): string | null => {
    const m = questionText.match(/closer to or further from (?:a |an |the )?\s*(.*?)\?/i)
    if (!m) return null
    return m[1].trim()
  }

  const extractMatchingPoi = (questionText: string): string | null => {
    const m = questionText.match(/nearest\s+(.+?)\s+the same/i)
    if (!m) return null
    return m[1].trim()
  }

  // Measuring logic hook
  useEffect(() => {
    if (!isMeasuringQuestion || !pendingQuestion || !location) {
      setMeasuringResult(null)
      setMeasuringError(null)
      return
    }

    const poi = extractMeasuringPoi(pendingQuestion.question?.question || '')
    const askerLoc = pendingQuestion.askerLocation

    if (!poi || !askerLoc) {
      setMeasuringError('Failed to parse POI or missing Seeker location')
      return
    }

    if (measuringResult || isMeasuringFetching) return // Already done or in progress

    const fetchMeasuring = async () => {
      setIsMeasuringFetching(true)
      setMeasuringError(null)

      if (!mapInstance || !window.google) {
        setMeasuringError('Google Maps API not initialized yet')
        setIsMeasuringFetching(false)
        return
      }

      try {
        const placesService = new window.google.maps.places.PlacesService(mapInstance)
        const radius = currentGame.gameAreaRadius || currentGame.hidingZoneRadius || 20000
        const center = currentGame.gameAreaCenter || currentGame.hidingZoneCenter || location

        const isValidPoi = (loc: { lat: number, lng: number }) => haversineDistanceMeters(center, loc) <= radius;

        const poiType = getPoiType(poi);
        const searchRequest: google.maps.places.PlaceSearchRequest = {
          location: center,
          radius: radius,
        };
        if (poiType) {
          searchRequest.type = poiType;
        } else {
          searchRequest.keyword = poi;
        }

        placesService.nearbySearch(
          searchRequest,
          (res, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && res) {
              const validPois = res.filter(p => {
                if (!p.geometry?.location) return false;
                return isValidPoi({ lat: p.geometry.location.lat(), lng: p.geometry.location.lng() });
              });

              if (validPois.length === 0) {
                setMeasuringResult('NULL')
                setAllMatchedPois([])
                setIsMeasuringFetching(false)
                return
              }

              let minHiderDist = Infinity;
              let minSeekerDist = Infinity;
              let closestHiderPoi: google.maps.places.PlaceResult | null = null;
              let closestSeekerPoi: google.maps.places.PlaceResult | null = null;

              validPois.forEach(p => {
                const loc = { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() };
                const dHider = haversineDistanceMeters(location, loc);
                const dSeeker = haversineDistanceMeters(askerLoc, loc);

                if (dHider < minHiderDist) {
                  minHiderDist = dHider;
                  closestHiderPoi = p;
                }
                if (dSeeker < minSeekerDist) {
                  minSeekerDist = dSeeker;
                  closestSeekerPoi = p;
                }
              });

              if (minHiderDist <= minSeekerDist) {
                setMeasuringResult('CLOSER')
              } else {
                setMeasuringResult('FURTHER')
              }

              setSeekerPoiResult(closestSeekerPoi)
              setSeekerPoiDist(minSeekerDist)

              validPois.sort((a, b) => {
                const locA = { lat: a.geometry!.location!.lat(), lng: a.geometry!.location!.lng() };
                const locB = { lat: b.geometry!.location!.lat(), lng: b.geometry!.location!.lng() };
                return haversineDistanceMeters(askerLoc, locA) - haversineDistanceMeters(askerLoc, locB);
              })

              setAllMatchedPois(validPois.slice(0, 3))
            } else {
              setMeasuringResult('NULL')
              setAllMatchedPois([])
            }
            setIsMeasuringFetching(false)
          }
        )
      } catch (err: any) {
        setMeasuringError('Error computing nearest POIs')
        console.error(err)
        setIsMeasuringFetching(false)
      }
    }

    fetchMeasuring()
  }, [isMeasuringQuestion, pendingQuestion, location, mapInstance, measuringResult, isMeasuringFetching, currentGame])

  // Thermometer logic hook
  useEffect(() => {
    if (!isThermometerQuestion || !pendingQuestion || !location) {
      setThermometerResult(null)
      return
    }

    const startLoc = pendingQuestion.thermometerStartLocation
    const endLoc = pendingQuestion.askerLocation

    if (!startLoc || !endLoc) return

    const dStart = haversineDistanceMeters(location, startLoc)
    const dEnd = haversineDistanceMeters(location, endLoc)

    if (dEnd < dStart) {
      setThermometerResult('HOTTER')
    } else {
      setThermometerResult('COLDER')
    }
  }, [isThermometerQuestion, pendingQuestion, location])

  // Matching logic hook
  useEffect(() => {
    if (!isMatchingQuestion || !pendingQuestion || !location) {
      setMatchingResult(null)
      setMatchingError(null)
      return
    }

    const poi = extractMatchingPoi(pendingQuestion.question?.question || '')
    const askerLoc = pendingQuestion.askerLocation

    if (!poi || !askerLoc) {
      setMatchingError('Failed to parse POI or missing Seeker location')
      return
    }

    if (matchingResult || isMatchingFetching) return // Already done or in progress

    const fetchMatching = async () => {
      setIsMatchingFetching(true)
      setMatchingError(null)

      if (!mapInstance || !window.google) {
        setMatchingError('Google Maps API not initialized yet')
        setIsMatchingFetching(false)
        return
      }

      try {
        const placesService = new window.google.maps.places.PlacesService(mapInstance)

        const searchNearest = (loc: { lat: number, lng: number }, query: string): Promise<google.maps.places.PlaceResult | null> => {
          return new Promise((resolve) => {
            const poiType = getPoiType(query);
            const searchRequest: google.maps.places.PlaceSearchRequest = {
              location: loc,
              rankBy: window.google.maps.places.RankBy.DISTANCE,
            };
            if (poiType) {
              searchRequest.type = poiType;
            } else {
              searchRequest.keyword = query;
            }

            placesService.nearbySearch(
              searchRequest,
              (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                  resolve(results[0])
                } else {
                  resolve(null)
                }
              }
            )
          })
        }

        const hiderResult = await searchNearest(location, poi)
        const seekerResult = await searchNearest(askerLoc, poi)

        if (hiderResult === null || seekerResult === null) {
          setMatchingError('No results found for that POI')
          return
        }

        const hiderPlaceId = hiderResult.place_id || hiderResult.name || null
        const seekerPlaceId = seekerResult.place_id || seekerResult.name || null

        if (hiderPlaceId === seekerPlaceId) {
          setMatchingResult('YES')
        } else {
          setMatchingResult('NO')
        }
        setSeekerPoiResult(seekerResult)

        const radius = currentGame.gameAreaRadius || currentGame.hidingZoneRadius || 20000
        const center = currentGame.gameAreaCenter || currentGame.hidingZoneCenter || location
        const poiType = getPoiType(poi);
        const searchRequest: google.maps.places.PlaceSearchRequest = {
          location: center,
          radius: radius,
        };
        if (poiType) {
          searchRequest.type = poiType;
        } else {
          searchRequest.keyword = poi;
        }

        placesService.nearbySearch(
          searchRequest,
          (res, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && res) {
              setAllMatchedPois(res)
            } else {
              setAllMatchedPois([])
            }
          }
        )
      } catch (err: any) {
        setMatchingError('Error computing nearest POIs for matching')
        console.error(err)
      } finally {
        setIsMatchingFetching(false)
      }
    }

    fetchMatching()
  }, [isMatchingQuestion, pendingQuestion, location, mapInstance, matchingResult, isMatchingFetching])

  // --- Radar helpers ---
  const parseRadarRadiusMeters = (questionText: string): number | null => {
    // Matches patterns like "400m", "1.5km", "2 km", "800 m"
    const m = questionText.match(/within\s+([\d.]+)\s*(km|m)\s+of/i)
    if (!m) return null
    const value = parseFloat(m[1])
    return m[2].toLowerCase() === 'km' ? value * 1000 : value
  }

  const radarAskerLoc = isRadarQuestion && pendingQuestion?.askerLocation
    ? pendingQuestion.askerLocation as { lat: number; lng: number }
    : null
  const radarRadiusMeters = isRadarQuestion
    ? parseRadarRadiusMeters(pendingQuestion?.question?.question || '')
    : null

  // Set radar auto answer for top-bar renderer
  useEffect(() => {
    if (isRadarQuestion && radarAskerLoc && radarRadiusMeters !== null && location) {
      setRadarAutoAnswer(haversineDistanceMeters(location, radarAskerLoc) <= radarRadiusMeters)
    } else {
      setRadarAutoAnswer(null)
    }
  }, [isRadarQuestion, radarAskerLoc, radarRadiusMeters, location])

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          if (!initialLocationRef.current) {
            initialLocationRef.current = loc
          }
          setLocation(loc)
          updateHiderLocation(loc)
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      )

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          if (!initialLocationRef.current) {
            initialLocationRef.current = loc
          }
          setLocation(loc)
          updateHiderLocation(loc)
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Hiding period count-up timer
  useEffect(() => {
    if (!currentGame.gameStartedAt) {
      setHidingElapsed(0)
      return
    }

    const computeElapsed = () => {
      const startedAt = currentGame.gameStartedAt?.toDate
        ? currentGame.gameStartedAt.toDate()
        : new Date(currentGame.gameStartedAt)
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000))
      setHidingElapsed(elapsed)
    }

    computeElapsed()
    const interval = setInterval(computeElapsed, 1000)
    return () => clearInterval(interval)
  }, [currentGame.gameStartedAt])

  // Travel phase countdown + auto-transition to active
  useEffect(() => {
    if (currentGame.status !== 'hidingPeriod' || !currentGame.travelEndsAt) {
      setTravelTimeLeft(null)
      return
    }

    const tick = async () => {
      const endsAt = currentGame.travelEndsAt?.toDate
        ? currentGame.travelEndsAt.toDate()
        : new Date(currentGame.travelEndsAt)
      const remaining = Math.floor((endsAt.getTime() - Date.now()) / 1000)
      setTravelTimeLeft(Math.max(0, remaining))

      // Auto-transition: only the hider's device fires this
      const uid = auth?.currentUser?.uid
      if (remaining <= 0 && !travelTransitionFiredRef.current && uid === currentGame.hider && db) {
        travelTransitionFiredRef.current = true
        try {
          // Read current hider location from Firestore for the fixed zone center
          const gameRef = doc(db, 'games', game.id)
          const snap = await getDoc(gameRef)
          const freshGame = { id: snap.id, ...snap.data() } as Game
          const zoneCenter = freshGame.hiderLocation || location
          const now = new Date()
          const hidingDurationMs = freshGame.hidingDurationMs || (4 * 60 * 60 * 1000)
          const hidingPeriodEndsAt = new Date(now.getTime() + hidingDurationMs)
          await updateDoc(gameRef, {
            status: 'active',
            gameStartedAt: now,
            hidingPeriodEndsAt,
            hidingZoneCenter: zoneCenter,
          })
        } catch (e) {
          console.error('Error transitioning from travel phase:', e)
          travelTransitionFiredRef.current = false
        }
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [currentGame.status, currentGame.travelEndsAt, currentGame.hider, location, game.id])

  // Moving phase countdown + auto-transition to active
  useEffect(() => {
    if (currentGame.status !== 'moving' || !currentGame.movePhaseEndsAt) {
      setMoveTimeLeft(null)
      moveTransitionFiredRef.current = false
      return
    }

    const tick = async () => {
      const endsAt = currentGame.movePhaseEndsAt?.toDate
        ? currentGame.movePhaseEndsAt.toDate()
        : new Date(currentGame.movePhaseEndsAt)
      const remaining = Math.floor((endsAt.getTime() - Date.now()) / 1000)
      setMoveTimeLeft(Math.max(0, remaining))

      // Auto-transition: only the hider's device fires this
      const uid = auth?.currentUser?.uid
      if (remaining <= 0 && !moveTransitionFiredRef.current && uid === currentGame.hider && db) {
        moveTransitionFiredRef.current = true
        try {
          const gameRef = doc(db, 'games', game.id)
          const snap = await getDoc(gameRef)
          const freshGame = { id: snap.id, ...snap.data() } as Game
          const zoneCenter = freshGame.hiderLocation || location

          const now = new Date()
          // Re-calculate the gameStart point so the hidingElapsed timer resumes natively
          const activeStartedAt = freshGame.originalHidingTime
            ? new Date(now.getTime() - freshGame.originalHidingTime)
            : new Date(now.getTime() - (freshGame.hidingDurationMs || 0)) // fallback just in case

          const chatMessageResume: ChatMessage = {
            id: Date.now().toString(),
            type: 'system',
            content: `Move phase ended! The Hider has established a new zone.`,
            timestamp: now,
            sender: 'system' as any
          }

          await updateDoc(gameRef, {
            status: 'active',
            movePhaseEndsAt: deleteField(),
            gameStartedAt: activeStartedAt,
            hidingZoneCenter: zoneCenter,
            chatMessages: [...(freshGame.chatMessages || []), chatMessageResume]
          })
        } catch (e) {
          console.error('Error transitioning from move phase:', e)
          moveTransitionFiredRef.current = false
        }
      }
    }

    tick()
    const intervalId = setInterval(tick, 1000)
    return () => clearInterval(intervalId)
  }, [currentGame.status, currentGame.movePhaseEndsAt, currentGame.hider, location, game.id])

  // Out-of-bounds detection during active phase
  useEffect(() => {
    if (currentGame.status !== 'active' || !currentGame.hidingZoneCenter || !location) return
    const uid = auth?.currentUser?.uid
    if (uid !== currentGame.hider) return // only hider checks

    const R = 6371000
    const toRad = (d: number) => (d * Math.PI) / 180
    const calcDist = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const dLat = toRad(b.lat - a.lat)
      const dLng = toRad(b.lng - a.lng)
      const sin2 = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2))
    }

    const distFromHiding = calcDist(currentGame.hidingZoneCenter, location)
    const hidingRadius = currentGame.hidingZoneRadius || 400
    let outOfBounds = distFromHiding > hidingRadius

    // Check overall game area boundaries
    if (currentGame.gameAreaCenter && currentGame.gameAreaRadius) {
      const distFromGameArea = calcDist(currentGame.gameAreaCenter, location)
      if (distFromGameArea > currentGame.gameAreaRadius) {
        outOfBounds = true
      }
    }

    if (!db) return
    const gameRef = doc(db, 'games', game.id)

    if (outOfBounds) {
      if (!currentGame.outOfBoundsSince) {
        updateDoc(gameRef, { outOfBoundsSince: new Date() }).catch(console.error)
      } else {
        // Check if 5 minutes have passed
        const startTime = currentGame.outOfBoundsSince?.toDate?.() || new Date(currentGame.outOfBoundsSince.seconds ? currentGame.outOfBoundsSince.seconds * 1000 : currentGame.outOfBoundsSince)
        if (startTime && !isNaN(startTime.getTime())) {
          const elapsed = Date.now() - startTime.getTime()
          if (elapsed > 5 * 60 * 1000) {
            updateDoc(gameRef, { status: 'endGame', outOfBoundsSince: null }).catch(console.error)
          }
        }
      }
    } else {
      if (currentGame.outOfBoundsSince) {
        updateDoc(gameRef, { outOfBoundsSince: null }).catch(console.error)
      }
    }
  }, [location, currentGame.status, currentGame.hidingZoneCenter, currentGame.gameAreaCenter, currentGame.gameAreaRadius, currentGame.outOfBoundsSince, game.id])

  const lastDbUpdateRef = useRef<number>(0)

  const updateHiderLocation = async (loc: { lat: number; lng: number }) => {
    if (!db) return
    const now = Date.now()
    if (now - lastDbUpdateRef.current < 3000) return // Throttle strictly to 1 write / 3 seconds
    lastDbUpdateRef.current = now

    try {
      const gameRef = doc(db, 'games', game.id)
      await updateDoc(gameRef, { hiderLocation: loc })
    } catch (error) {
      console.error('Error updating location:', error)
    }
  }

  const handleCardSelection = async () => {
    if (!db || cardsToKeep.length !== keepCount) {
      alert(`Please select exactly ${keepCount} card${keepCount > 1 ? 's' : ''} to keep.`)
      return
    }

    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      const currentGameData = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      // Get current deck
      const currentDeck = currentGameData.hiderDeck || []
      const maxDeckSize = 6

      // Check if we need to discard cards (deck would overflow)
      const totalAfterAdding = currentDeck.length + cardsToKeep.length

      if (totalAfterAdding > maxDeckSize) {
        // Need to discard cards - enter discard mode
        setCurrentDeckForDiscard(currentDeck)
        setDiscardMode(true)
        setCardsToDiscard([])
        // Don't close the modal, just update the UI to show discard mode
        return
      } else {
        // Add selected cards to deck (no overflow)
        let newDeck = [...currentDeck, ...cardsToKeep]

        await updateDoc(gameRef, {
          hiderDeck: newDeck,
        })

        // Clear selection state
        setShowCardSelection(false)
        setDrawnCards([])
        setCardsToKeep([])
        setKeepCount(0)
        setPendingQuestion(null)
        setDiscardMode(false)
        setCardsToDiscard([])
        setCurrentDeckForDiscard([])
      }
    } catch (error) {
      console.error('Error saving card selection:', error)
      alert('Error saving card selection. Please try again.')
    }
  }

  const toggleCardSelection = (card: Card) => {
    const isSelected = cardsToKeep.some((c) => c.id === card.id)
    if (isSelected) {
      setCardsToKeep(cardsToKeep.filter((c) => c.id !== card.id))
    } else {
      if (cardsToKeep.length < keepCount) {
        setCardsToKeep([...cardsToKeep, card])
      } else {
        // Already selected max, replace the first one
        const newCards = [...cardsToKeep]
        newCards.shift()
        newCards.push(card)
        setCardsToKeep(newCards)
      }
    }
  }

  const toggleCardDiscard = (card: Card) => {
    if (cardsToDiscard.some((c) => c.id === card.id)) {
      setCardsToDiscard(cardsToDiscard.filter((c) => c.id !== card.id))
    } else {
      setCardsToDiscard([...cardsToDiscard, card])
    }
  }

  const handleDiscardConfirm = async () => {
    if (!db) return

    const needToDiscard = (currentDeckForDiscard.length + cardsToKeep.length) - 6

    if (cardsToDiscard.length !== needToDiscard) {
      alert(`Please select exactly ${needToDiscard} card${needToDiscard > 1 ? 's' : ''} to discard.`)
      return
    }

    try {
      const gameRef = doc(db, 'games', game.id)

      // Remove discarded cards from current deck
      const newDeck = currentDeckForDiscard.filter(card =>
        !cardsToDiscard.some(d => d.id === card.id)
      )

      // Add the new cards
      const finalDeck = [...newDeck, ...cardsToKeep]

      await updateDoc(gameRef, {
        hiderDeck: finalDeck,
      })

      // Clear all state
      setShowCardSelection(false)
      setDrawnCards([])
      setCardsToKeep([])
      setKeepCount(0)
      setPendingQuestion(null)
      setDiscardMode(false)
      setCardsToDiscard([])
      setCurrentDeckForDiscard([])
    } catch (error) {
      console.error('Error discarding cards:', error)
      alert('Error discarding cards. Please try again.')
    }
  }

  const playCard = async (card: Card) => {
    if (!db) return

    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      const currentGameData = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      const updateData: any = {}

      if (card.type === 'timeBonus') {
        // Determine the time value based on game size
        let timeToAdd = 0
        const gameSize = currentGameData.gameSize || 'medium' // Default to medium if not set

        if (gameSize === 'small' && card.smallValue) {
          timeToAdd = card.smallValue
        } else if (gameSize === 'medium' && card.mediumValue) {
          timeToAdd = card.mediumValue
        } else if (gameSize === 'large' && card.largeValue) {
          timeToAdd = card.largeValue
        } else {
          // Fallback to legacy value field
          timeToAdd = card.value || 0
        }

        updateData.totalHidingTime = (currentGameData.totalHidingTime || 0) + timeToAdd
        console.log(`Added ${timeToAdd}s to hiding time (${card.color} bonus for ${gameSize} game)`)
      } else if (card.type === 'curse') {
        // Apply curse to seekers
        const newCurse: Curse = {
          id: Date.now().toString(),
          name: card.name,
          description: card.description,
          duration: card.value || 300, // Default 5 minutes
          timestamp: new Date(),
        }
        updateData.activeCurses = [...(currentGameData.activeCurses || []), newCurse]
        console.log(`Applied curse: ${card.name}`)
      } else if (card.type === 'powerup') {
        // Handle powerups - placeholder logic for now
        console.log(`Played powerup: ${card.name} (${card.effect})`)

        // TODO: Implement specific powerup effects
        switch (card.effect) {
          case 'randomize':
            if (!currentGameData.pendingQuestion) {
              alert('Randomize can only be played when a question is pending!')
              return
            }
            const questionsRef = collection(db, 'questions')
            const qQuery = query(questionsRef, where('category', '==', currentGameData.pendingQuestion.category))
            const qDocs = await getDocs(qQuery)
            const availableQs = qDocs.docs.map(d => ({ id: d.id, ...d.data() } as Question))
            const unaskedQs = availableQs.filter(q => !currentGameData.usedQuestionIds?.includes(q.id) && q.id !== currentGameData.pendingQuestion?.question?.id)

            let newQ: Question
            if (unaskedQs.length > 0) {
              newQ = unaskedQs[Math.floor(Math.random() * unaskedQs.length)]
            } else if (availableQs.length > 0) {
              const others = availableQs.filter(q => q.id !== currentGameData.pendingQuestion?.question?.id)
              newQ = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : availableQs[0]
            } else {
              alert('Could not find another question to randomize to!')
              return
            }

            updateData.pendingQuestion = {
              ...currentGameData.pendingQuestion,
              question: newQ,
              timestamp: new Date()
            }
            updateData.usedQuestionIds = [...(currentGameData.usedQuestionIds || []), newQ.id]

            const chatMessageR: ChatMessage = {
              id: Date.now().toString(),
              type: 'answer',
              question: currentGameData.pendingQuestion.question.question,
              content: `🎲 Randomized`,
              timestamp: new Date(),
              sender: 'hider' as any
            }
            updateData.chatMessages = [...(currentGameData.chatMessages || []), chatMessageR]

            // Auto close the deck and modal so Hider sees the new question
            setDeckOpen(false)
            setShowQuestionModal(false)
            break
          case 'veto':
            if (!currentGameData.pendingQuestion) {
              alert('Veto can only be played when a question is pending!')
              return
            }
            updateData.pendingQuestion = deleteField()
            setPendingQuestion(null)

            const chatMessageV: ChatMessage = {
              id: Date.now().toString(),
              type: 'answer',
              question: currentGameData.pendingQuestion.question.question,
              content: `🚫 Vetoed`,
              timestamp: new Date(),
              sender: 'hider' as any
            }
            updateData.chatMessages = [...(currentGameData.chatMessages || []), chatMessageV]

            setDeckOpen(false)
            setShowQuestionModal(false)
            break
          case 'move':
            if (currentGameData.status === 'endGame') {
              alert('Cannot play Move during the Endgame phase!')
              return
            }
            const station = window.prompt("To play 'Move', enter your original transit station to tell the Seekers:")
            if (!station || station.trim() === '') return // Cancelled or empty

            // Calculate move duration
            let moveDurationMin = 30
            if (currentGameData.gameSize === 'small') moveDurationMin = 15
            else if (currentGameData.gameSize === 'large') moveDurationMin = 45
            else if (currentGameData.gameSize === 'custom' && currentGameData.customSettings?.durationHours) {
              moveDurationMin = Math.round(currentGameData.customSettings.durationHours * 6) // Roughly 6 mins per hour
            }

            const startedAt = currentGameData.gameStartedAt?.toDate
              ? currentGameData.gameStartedAt.toDate()
              : new Date(currentGameData.gameStartedAt)

            updateData.status = 'moving'
            updateData.movePhaseEndsAt = new Date(Date.now() + (moveDurationMin * 60 * 1000))
            updateData.originalHidingTime = Date.now() - startedAt.getTime()

            // Wipe hand entirely
            // Create chat message for not drawing
            const chatMessageM: ChatMessage = {
              id: Date.now().toString(),
              type: 'system',
              content: `Hider has moved! The game is paused. Original station: ${station.trim()}`,
              timestamp: new Date(),
              sender: 'system' as any
            }
            updateData.chatMessages = [...(currentGameData.chatMessages || []), chatMessageM]
            setDeckOpen(false)

            await updateDoc(gameRef, updateData)
            return // Stop execution, hand is deliberately wiped
          case 'discard1draw2':
            if ((currentGameData.hiderDeck?.length || 0) < 2) {
              alert('Not enough cards to discard!')
              return
            }
            // Temporarily remove this played card from the hand *immediately* before showing target UI
            {
              const d1d2Deck = (currentGameData.hiderDeck || []).filter(c => c.id !== card.id)
              await updateDoc(gameRef, { hiderDeck: d1d2Deck })
            }
            setTargetingPowerup({ powerup: card, targetCount: 1, type: 'discard1draw2' })
            setTargetedCards([])
            setDeckOpen(false)
            return
          case 'discard2draw3':
            if ((currentGameData.hiderDeck?.length || 0) < 3) {
              alert('Not enough cards to discard!')
              return
            }
            // Temporarily remove this played card from the hand *immediately* before showing target UI
            {
              const d2d3Deck = (currentGameData.hiderDeck || []).filter(c => c.id !== card.id)
              await updateDoc(gameRef, { hiderDeck: d2d3Deck })
            }
            setTargetingPowerup({ powerup: card, targetCount: 2, type: 'discard2draw3' })
            setTargetedCards([])
            setDeckOpen(false)
            return
          case 'draw1expand1':
            updateData.maxHandSize = (currentGameData.maxHandSize || 6) + 1

            const expandDeckRef = collection(db, 'deck')
            const expandSnap = await getDocs(expandDeckRef)
            const expandCards = expandSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Card))

            if (expandCards.length > 0) {
              const randomIndex = Math.floor(Math.random() * expandCards.length)
              const newCard = expandCards[randomIndex]
              const currentDeck = currentGameData.hiderDeck || []
              const deckWOPowerup = currentDeck.filter(c => c.id !== card.id)
              updateData.hiderDeck = deckWOPowerup

              setDrawnCards([newCard])
              setKeepCount(1)
              setCardsToKeep([])
              setShowCardSelection(true)
            } else {
              alert('No cards left in the global deck to draw!')
            }

            await updateDoc(gameRef, updateData)

            setDeckOpen(false)
            return
          case 'duplicate':
            if ((currentGameData.hiderDeck?.length || 0) < 2) {
              alert('No other cards to duplicate!')
              return
            }
            // Temporarily remove this played card from the hand *immediately* before showing target UI
            {
              const dupDeck = (currentGameData.hiderDeck || []).filter(c => c.id !== card.id)
              await updateDoc(gameRef, { hiderDeck: dupDeck })
            }
            setTargetingPowerup({ powerup: card, targetCount: 1, type: 'duplicate' })
            setTargetedCards([])
            setDeckOpen(false)
            return
          default:
            console.log('Unknown powerup effect')
        }
      }

      // Remove card from deck
      const currentDeck = currentGameData.hiderDeck || []
      const newDeck = currentDeck.filter((c) => c.id !== card.id)
      updateData.hiderDeck = updateData.hiderDeck || newDeck

      await updateDoc(gameRef, updateData)
    } catch (error) {
      console.error('Error playing card:', error)
      alert('Error playing card. Please try again.')
    }
  }

  const executeTargetedPowerup = async () => {
    if (!targetingPowerup || targetedCards.length !== targetingPowerup.targetCount || !db) return

    if (targetingPowerup.type === 'duplicate') {
      const clonedCard = { ...targetedCards[0], id: targetingPowerup.powerup.id }
      try {
        const gameRef = doc(db, 'games', game.id)
        const snap = await getDoc(gameRef)
        if (snap.exists()) {
          const freshGame = { id: snap.id, ...snap.data() } as Game
          await updateDoc(gameRef, {
            hiderDeck: [...(freshGame.hiderDeck || []), clonedCard]
          })
        }
      } catch (err) {
        console.error('Duplicate effect error:', err)
      }
      setTargetingPowerup(null)
      setTargetedCards([])
      return
    }

    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      if (!gameSnapshot.exists()) throw new Error('Game not found')
      const currentGameData = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game
      const updateData: any = {}

      const deckRef = collection(db, 'deck')
      const deckSnapshot = await getDocs(deckRef)
      const allCards = deckSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Card[]

      const currentHiderDeck = currentGameData.hiderDeck || []
      const targetedIds = targetedCards.map(c => c.id)

      const drawCount = targetingPowerup.type === 'discard1draw2' ? 2 : 3
      if (allCards.length < drawCount) {
        alert(`Warning: Not enough cards in main deck! Only drawing ${allCards.length}.`)
      }

      const actualDrawCount = Math.min(drawCount, allCards.length)
      const newCards = []
      const availableCards = [...allCards]

      for (let i = 0; i < actualDrawCount; i++) {
        const randomIndex = Math.floor(Math.random() * availableCards.length)
        newCards.push(availableCards[randomIndex])
        availableCards.splice(randomIndex, 1)
      }

      const newHiderDeck = currentHiderDeck.filter(c => c.id !== targetingPowerup.powerup.id && !targetedIds.includes(c.id))
      updateData.hiderDeck = newHiderDeck

      await updateDoc(gameRef, updateData)

      if (newCards.length > 0) {
        setDrawnCards(newCards)
        setKeepCount(actualDrawCount)
        setCardsToKeep([])
        setShowCardSelection(true)
      }

      setTargetingPowerup(null)
      setTargetedCards([])
    } catch (err) {
      console.error('Targeting effect error:', err)
      alert('Error executing card. Try again.')
    }
  }

  const answerQuestion = async (answer: boolean | string) => {
    console.log('=== ANSWER QUESTION CALLED ===', { answer, hasPendingQuestion: !!pendingQuestion, isAnswering: isAnswering })

    // Basic validation
    if (!db) {
      console.error('Firebase db not available')
      alert('Database connection error. Please refresh the page.')
      return
    }

    if (!pendingQuestion) {
      console.error('No pending question to answer')
      return
    }

    // Prevent multiple calls
    if (isAnswering) {
      console.log('Already processing answer, ignoring duplicate call')
      return
    }

    // For photo questions, require photo upload
    if (pendingQuestion.question?.type === 'photo' && answer === true && !photoFile) {
      alert('Please take or upload a photo first')
      return
    }

    // Set flag immediately
    setIsAnswering(true)
    setUploadingPhoto(true)

    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      if (!gameSnapshot.exists()) {
        throw new Error('Game not found')
      }

      const currentGameData = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      // Upload photo if needed
      let photoUrl: string | null = null
      if (pendingQuestion.question?.type === 'photo' && answer === true && photoFile && storage) {
        console.log('Uploading photo...')
        try {
          // Compress the image before uploading
          let fileToUpload = photoFile;

          if (typeof window !== 'undefined' && photoFile.type.startsWith('image/')) {
            const bmp = await window.createImageBitmap(photoFile);
            const canvas = document.createElement('canvas');
            const MAX_DIM = 1024;
            let width = bmp.width;
            let height = bmp.height;
            if (width > height && width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(bmp, 0, 0, width, height);
              const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
              if (blob) {
                fileToUpload = new File([blob], photoFile.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
              }
            }
          }

          const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const photoRef = ref(storage, `game-photos/${game.id}/${Date.now()}-${safeFileName}`)
          await uploadBytes(photoRef, fileToUpload)
          photoUrl = await getDownloadURL(photoRef)
          console.log('Photo uploaded:', photoUrl)
        } catch (uploadError: any) {
          console.error('Photo upload failed:', uploadError)
          alert(`Failed to upload photo: ${uploadError?.message || 'Unknown error'}. Please try again.`)
          setIsAnswering(false)
          setUploadingPhoto(false)
          return
        }
      }

      // Create chat message
      const questionText = pendingQuestion.question?.question || 'Unknown question'
      const category = pendingQuestion.category || 'Unknown'
      const answerText = typeof answer === 'boolean'
        ? (answer ? 'Yes ✓' : 'No ✗')
        : (answer === 'CLOSER' ? 'CLOSER ✓' : (answer === 'FURTHER' ? 'FURTHER ✗' : (answer === 'HOTTER' ? 'HOTTER ✓' : 'COLDER ✗')))

      // Build chat message object, only include photoUrl if it exists
      const chatMessage: any = {
        id: Date.now().toString(),
        type: pendingQuestion.question?.type === 'photo' ? 'photo' : 'answer',
        content: answerText,
        question: questionText,
        category: category,
        timestamp: new Date(),
        sender: 'hider',
      }

      // Only add photoUrl if it's not null/undefined
      if (photoUrl) {
        chatMessage.photoUrl = photoUrl
      }

      // Prepare update
      const currentMessages = currentGameData.chatMessages || []
      const updatedMessages = [...currentMessages, chatMessage]

      // Build update data, ensuring no undefined values
      const updateData: any = {
        chatMessages: updatedMessages,
        pendingQuestion: deleteField(),
      }

      // If answering a thermometer question, push to thermometerZones
      if (isThermometerQuestion && pendingQuestion.thermometerStartLocation && pendingQuestion.askerLocation) {
        const isHotter = typeof answer === 'string' ? answer.includes('HOTTER') : false
        const currentZones = currentGameData.thermometerZones || []
        updateData.thermometerZones = [
          ...currentZones,
          {
            point1: pendingQuestion.thermometerStartLocation,
            point2: pendingQuestion.askerLocation,
            isHotter
          }
        ]
      }

      // Radar question boundary updates
      if (pendingQuestion.question?.type === 'radar') {
        const parseRadarRadius = (qText: string): number | null => {
          const m = qText.match(/within\s+([\d.]+)\s*(km|m)\s+of/i)
          if (!m) return null
          const value = parseFloat(m[1])
          return m[2].toLowerCase() === 'km' ? value * 1000 : value
        }

        const radarAskerLoc = pendingQuestion.askerLocation as { lat: number; lng: number } | null
        const radarRadius = parseRadarRadius(pendingQuestion.question.question || '')

        if (radarAskerLoc && radarRadius !== null) {
          if (answer === true) {
            // Yes: shrink game area
            updateData.gameAreaCenter = radarAskerLoc
            updateData.gameAreaRadius = radarRadius
          } else {
            // No: add to restricted areas
            const newRestrictedArea = { center: radarAskerLoc, radius: radarRadius }
            updateData.restrictedAreas = [...(currentGameData.restrictedAreas || []), newRestrictedArea]
          }
        }
      }

      // POI markers for matching & measuring
      if ((isMatchingQuestion || isMeasuringQuestion) && seekerPoiResult && seekerPoiResult.geometry && seekerPoiResult.geometry.location) {
        let newMarker: POIMarker | null = null

        if (isMatchingQuestion && (seekerPoiResult.place_id || seekerPoiResult.name)) {
          newMarker = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substring(7),
            type: 'matching_points',
            name: seekerPoiResult.name || 'Target Points',
            points: [{
              center: { lat: seekerPoiResult.geometry.location.lat(), lng: seekerPoiResult.geometry.location.lng() },
              isMatch: true,
              name: seekerPoiResult.name || 'Target'
            }]
          }
        } else if (isMeasuringQuestion && seekerPoiDist !== null) {
          const allPlaces = [seekerPoiResult, ...(allMatchedPois || [])]
          const uniquePlaces = Array.from(new Map(allPlaces.filter(p => p.geometry?.location).map(p => [(p.geometry!.location!.lat() + ',' + p.geometry!.location!.lng()), p])).values())

          newMarker = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substring(7),
            type: 'measuring_circles',
            name: seekerPoiResult.name || 'Measuring Target',
            circles: uniquePlaces.map(p => ({
              center: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
              radius: seekerPoiDist
            }))
          }
        } else if (seekerPoiResult.geometry.location) {
          newMarker = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substring(7),
            type: 'point',
            name: seekerPoiResult.name || 'Target Location',
            center: {
              lat: seekerPoiResult.geometry.location.lat(),
              lng: seekerPoiResult.geometry.location.lng(),
            }
          }
        }

        if (newMarker) {
          // Resolve answerStatus based on question type and the supplied answer
          let status: 'CLOSER' | 'FURTHER' | 'YES' | 'NO' | 'NULL' | undefined = undefined;

          if (answer === 'NULL') {
            status = 'NULL';
          } else if (isMeasuringQuestion) {
            status = answer === 'CLOSER' ? 'CLOSER' : 'FURTHER';
          } else if (isMatchingQuestion) {
            status = answer === true ? 'YES' : 'NO';
          }

          if (status) {
            newMarker.answerStatus = status;
          }

          updateData.poiMarkers = [...(currentGameData.poiMarkers || []), newMarker]
        }
      }

      // Draw cards for any answer (Yes or No) - but don't add to deck yet, show selection UI
      if (pendingQuestion.question) {
        const question = pendingQuestion.question
        const drawCount = question.drawCards || 0
        const keepCountValue = question.keepCards || 0

        console.log('Card drawing check:', { answerGiven: answerText, drawCount, keepCountValue, questionId: question.id })

        if (drawCount > 0) {
          // Draw cards from deck
          const deckRef = collection(db, 'deck')
          const deckSnapshot = await getDocs(deckRef)
          const allCards = deckSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Card[]

          console.log(`Found ${allCards.length} cards in deck, drawing ${drawCount}`)

          if (allCards.length > 0) {
            // Draw random cards
            const newDrawnCards: Card[] = []
            const availableCards = [...allCards]

            for (let i = 0; i < Math.min(drawCount, availableCards.length); i++) {
              const randomIndex = Math.floor(Math.random() * availableCards.length)
              newDrawnCards.push(availableCards[randomIndex])
              availableCards.splice(randomIndex, 1)
            }

            console.log('Cards drawn:', newDrawnCards.map(c => c.name))

            // Store drawn cards and add a small delay before showing selection UI
            setDrawnCards(newDrawnCards)
            setKeepCount(keepCountValue)
            setCardsToKeep([])

            // 1 second delay before showing card selection dialog
            setTimeout(() => {
              setShowCardSelection(true)
            }, 1000)

            // Don't update deck yet - wait for user selection
          } else {
            console.warn('No cards available in deck to draw from')
            const skipMessage: any = {
              id: Date.now().toString() + '-skip',
              type: 'system',
              content: `Hider answered: ${typeof answer === 'boolean' ? (answer ? 'Yes' : 'No') : answer}, but the deck is empty! No cards drawn.`,
              timestamp: new Date(),
              sender: 'system' as any
            }
            updateData.chatMessages = [...(updateData.chatMessages || []), skipMessage]
          }
        } else {
          console.log('No cards to draw (drawCount is 0)')
        }
      }

      // Remove any undefined values (Firestore doesn't allow them)
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      // Also clean chatMessages array
      updateData.chatMessages = updateData.chatMessages.map((msg: any) => {
        const cleaned: any = {}
        Object.keys(msg).forEach(key => {
          if (msg[key] !== undefined) {
            cleaned[key] = msg[key]
          }
        })
        return cleaned
      })

      console.log('Updating Firestore:', updateData)
      await updateDoc(gameRef, updateData)
      console.log('Firestore updated successfully')

      // Clear local state (but keep pendingQuestion if we need to show card selection)
      if (!pendingQuestion.question || !(pendingQuestion.question.drawCards || 0)) {
        setPendingQuestion(null)
      }
      setPhotoFile(null)
      setPhotoPreview(null)

    } catch (error) {
      console.error('Error in answerQuestion:', error)
      alert(`Error answering question: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingPhoto(false)
      setIsAnswering(false)
    }
  }

  const handleErrorDiscard = async () => {
    if (!db || !pendingQuestion) return
    setIsAnswering(true)

    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      if (!gameSnapshot.exists()) return

      const currentGameData = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error computing location data for "${pendingQuestion.question?.category}". Seeker MUST ask a different question.`,
        timestamp: new Date(),
        sender: 'system' as any
      }

      const updateData: any = {
        pendingQuestion: deleteField(),
        chatMessages: [...(currentGameData.chatMessages || []), chatMessage]
      }

      await updateDoc(gameRef, updateData)

      setPendingQuestion(null)
      setShowQuestionModal(false)
      if (pendingQuestion?.question?.id) {
        dismissedQuestionsRef.current.add(pendingQuestion.question.id)
      }

    } catch (error) {
      console.error('Error discarding question:', error)
      alert(`Error discarding question: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsAnswering(false)
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
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Getting your location...</p>
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

  const centerLat = initialLocationRef.current ? initialLocationRef.current.lat : location.lat
  const centerLng = initialLocationRef.current ? initialLocationRef.current.lng : location.lng

  return (
    <div className="h-dvh w-screen relative">
      <OutOfBoundsWarning since={currentGame.outOfBoundsSince} />
      <GoogleMapWrapper
        key={`map-${JSON.stringify(mapSettings)}`} // Force remount when settings change
        center={{ lat: centerLat, lng: centerLng }}
        zoom={mapSettings?.zoom || 15}
        onLoad={(map) => {
          setMapReady(true)
          setMapInstance(map)
        }}
        onError={(error) => {
          console.error('Map error:', error)
          setMapError('Failed to load map. Please check your Google Maps API key.')
        }}
        hiderLocation={location}
        seekerLocations={currentGame.seekerLocations}
        circleRadiusMeters={currentGame.hidingZoneRadius || 400}
        showTransitLayer={mapSettings?.showTransitLayer !== false}
        mapTypeId={mapSettings?.mapTypeId || 'roadmap'}
        hiderMarkerColor={mapSettings?.hiderMarkerColor}
        seekerMarkerColor={mapSettings?.seekerMarkerColor}
        hiderMarkerStrokeColor={mapSettings?.hiderMarkerStrokeColor}
        seekerMarkerStrokeColor={mapSettings?.seekerMarkerStrokeColor}
        hiderMarkerStrokeWeight={mapSettings?.hiderMarkerStrokeWeight}
        seekerMarkerStrokeWeight={mapSettings?.seekerMarkerStrokeWeight}
        circleColor={mapSettings?.circleColor}
        circleStrokeColor={mapSettings?.circleStrokeColor}
        circleOpacity={mapSettings?.circleOpacity}
        circleStrokeOpacity={mapSettings?.circleStrokeOpacity}
        circleStrokeWeight={mapSettings?.circleStrokeWeight}
        hiderMarkerSize={mapSettings?.hiderMarkerSize}
        seekerMarkerSize={mapSettings?.seekerMarkerSize}
        showZoomControl={mapSettings?.showZoomControl !== false}
        thermometerZones={currentGame.thermometerZones || []}
        isHider={true}
        showMapTypeControl={mapSettings?.showMapTypeControl}
        showStreetViewControl={mapSettings?.showStreetViewControl}
        showFullscreenControl={mapSettings?.showFullscreenControl}
        showPOILabels={mapSettings?.showPOILabels}
        showTransitLabels={mapSettings?.showTransitLabels !== false}
        showRoadLabels={mapSettings?.showRoadLabels !== false}
        showAdministrativeLabels={mapSettings?.showAdministrativeLabels !== false}
        showWaterLabels={mapSettings?.showWaterLabels !== false}
        showLandscapeLabels={mapSettings?.showLandscapeLabels !== false}
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
        radarCircle={radarAskerLoc && radarRadiusMeters !== null ? { center: radarAskerLoc, radiusMeters: radarRadiusMeters } : undefined}
        restrictedAreas={currentGame.restrictedAreas || []}
        fixedCircleCenter={currentGame.hidingZoneCenter || undefined}
        gameArea={currentGame.gameAreaCenter && currentGame.gameAreaRadius ? { center: currentGame.gameAreaCenter, radiusMeters: currentGame.gameAreaRadius } : undefined}
        poiMarkers={[
          ...(currentGame.poiMarkers || []),
          ...(seekerPoiResult && seekerPoiResult.geometry ? [
            (() => {
              let previewStatus: 'CLOSER' | 'FURTHER' | 'YES' | 'NO' | 'NULL' | undefined = undefined;
              if (isMeasuringQuestion && measuringResult) previewStatus = measuringResult;
              if (isMatchingQuestion && matchingResult) previewStatus = matchingResult;

              if (isMatchingQuestion && (seekerPoiResult.place_id || seekerPoiResult.name)) {
                const seekerId = seekerPoiResult.place_id || seekerPoiResult.name
                const allPlaces = [seekerPoiResult, ...(allMatchedPois || [])]
                const uniquePlaces = Array.from(new Map(allPlaces.filter(p => p.geometry?.location).map(p => [(p.geometry!.location!.lat() + ',' + p.geometry!.location!.lng()), p])).values()).slice(0, 3)

                return {
                  id: 'temp-preview',
                  type: 'matching_points' as const,
                  name: seekerPoiResult.name || 'Target Points',
                  answerStatus: previewStatus,
                  points: uniquePlaces.map(p => ({
                    center: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
                    isMatch: (p.place_id || p.name) === seekerId,
                    name: p.name || 'Target'
                  }))
                }
              } else if (isMeasuringQuestion && seekerPoiDist !== null) {
                const allPlaces = [seekerPoiResult, ...(allMatchedPois || [])]
                const uniquePlaces = Array.from(new Map(allPlaces.filter(p => p.geometry?.location).map(p => [(p.geometry!.location!.lat() + ',' + p.geometry!.location!.lng()), p])).values()).slice(0, 3)

                return {
                  id: 'temp-preview',
                  type: 'measuring_circles' as const,
                  name: seekerPoiResult.name || 'Measuring Target',
                  answerStatus: previewStatus,
                  circles: uniquePlaces.map(p => ({
                    center: { lat: p.geometry!.location!.lat(), lng: p.geometry!.location!.lng() },
                    radius: seekerPoiDist
                  }))
                }
              }

              const isArea = seekerPoiResult.types?.some(t =>
                ['neighborhood', 'sublocality', 'locality', 'political', 'park', 'administrative_area_level_1', 'administrative_area_level_2'].includes(t)
              )
              if (isArea && seekerPoiResult.geometry.viewport) {
                const vp = seekerPoiResult.geometry.viewport
                return {
                  id: 'temp-preview',
                  type: 'area' as const,
                  name: seekerPoiResult.name || 'Target POI',
                  answerStatus: previewStatus,
                  bounds: {
                    north: vp.getNorthEast().lat(),
                    south: vp.getSouthWest().lat(),
                    east: vp.getNorthEast().lng(),
                    west: vp.getSouthWest().lng(),
                  }
                }
              } else if (seekerPoiResult.geometry.location) {
                return {
                  id: 'temp-preview',
                  type: 'point' as const,
                  name: seekerPoiResult.name || 'Target POI',
                  answerStatus: previewStatus,
                  center: {
                    lat: seekerPoiResult.geometry.location.lat(),
                    lng: seekerPoiResult.geometry.location.lng(),
                  }
                }
              }
              return null
            })()
          ].filter(Boolean) as POIMarker[] : [])
        ]}
      />

      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setChatOpen(!chatOpen)
              if (!chatOpen) {
                setDeckOpen(false) // Close deck when opening chat
                setLastSeenMessageCount(currentGame.chatMessages?.length || 0) // Mark as seen
              }
            }}
            className="bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors relative"
          >
            {(pendingQuestion && !showQuestionModal) || (currentGame.chatMessages && currentGame.chatMessages.length > lastSeenMessageCount) ? (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            ) : null}
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>

        {/* Timer widget: travel countdown OR move countdown OR hiding count-up */}
        {travelTimeLeft !== null ? (
          // Travel phase: countdown to zone lock
          <div className={`bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto border ${travelTimeLeft <= 60 ? 'border-orange-500' : 'border-gray-700'
            }`}>
            <Clock className={`w-4 h-4 ${travelTimeLeft <= 60 ? 'text-orange-400' : 'text-yellow-400'}`} />
            <span className="text-sm text-gray-400">Time to hide:</span>
            <span className={`text-lg font-bold ${travelTimeLeft <= 60 ? 'text-orange-400' : 'text-yellow-400'}`}>
              {travelTimeLeft <= 0 ? 'Locking zone…' : `${Math.floor(travelTimeLeft / 60)}m ${travelTimeLeft % 60}s`}
            </span>
          </div>
        ) : moveTimeLeft !== null ? (
          // Move phase: countdown to new zone lock
          <div className={`bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto border ${moveTimeLeft <= 60 ? 'border-orange-500' : 'border-indigo-500'
            }`}>
            <Navigation className={`w-4 h-4 ${moveTimeLeft <= 60 ? 'text-orange-400' : 'text-indigo-400'} animate-pulse`} />
            <span className="text-sm text-indigo-200">Moving:</span>
            <span className={`text-lg font-bold ${moveTimeLeft <= 60 ? 'text-orange-400' : 'text-indigo-400'}`}>
              {moveTimeLeft <= 0 ? 'Establishing zone…' : `${Math.floor(moveTimeLeft / 60)}m ${moveTimeLeft % 60}s`}
            </span>
          </div>
        ) : currentGame.gameStartedAt ? (() => {
          const formatTime = (secs: number) => {
            const h = Math.floor(secs / 3600)
            const m = Math.floor((secs % 3600) / 60)
            const s = secs % 60
            return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
          }
          let limitSecs = 0
          if (currentGame.hidingPeriodEndsAt && currentGame.gameStartedAt) {
            const startedAt = currentGame.gameStartedAt?.toDate ? currentGame.gameStartedAt.toDate() : new Date(currentGame.gameStartedAt)
            const endsAt = currentGame.hidingPeriodEndsAt?.toDate ? currentGame.hidingPeriodEndsAt.toDate() : new Date(currentGame.hidingPeriodEndsAt)
            limitSecs = Math.max(0, Math.floor((endsAt.getTime() - startedAt.getTime()) / 1000))
          }
          const overLimit = limitSecs > 0 && hidingElapsed >= limitSecs
          return (
            <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto">
              <Clock className={`w-4 h-4 ${overLimit ? 'text-red-400' : 'text-green-400'}`} />
              <span className="text-sm text-gray-400">Hiding:</span>
              <span className={`text-lg font-bold ${overLimit ? 'text-red-400' : 'text-green-400'}`}>
                {formatTime(hidingElapsed)}
              </span>
              {limitSecs > 0 && (
                <span className="text-xs text-gray-500">/ {formatTime(limitSecs)}</span>
              )}
            </div>
          )
        })() : null}
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <button
          onClick={() => {
            setDeckOpen(true)
            setChatOpen(false) // Close chat when opening deck
          }}
          className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg pointer-events-auto flex items-center gap-2 transform translate-y-1/2"
        >
          <Menu className="w-5 h-5" />
          <span className="font-semibold">Open Deck</span>
        </button>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-20 left-4 bottom-24 w-80 bg-gray-900 text-white z-20 shadow-2xl rounded-lg overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Chat</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs text-gray-400">Game Code:</span>
                  <span className="text-sm font-bold text-blue-400">{game.code}</span>
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
              {pendingQuestion && !showQuestionModal && (
                <button
                  onClick={() => {
                    setShowQuestionModal(true)
                    setChatOpen(false)
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg text-left mb-4 shadow-lg border-l-4 border-yellow-400"
                >
                  <p className="text-xs text-blue-200 font-bold mb-1">PENDING QUESTION</p>
                  <p className="font-medium truncate">{pendingQuestion.question?.question}</p>
                  <p className="text-xs text-blue-200 mt-1">Click to answer</p>
                </button>
              )}

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
                            : 'bg-gray-800'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-400">
                          {message.sender === 'hider' ? 'Hider' : 'Seeker'}
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
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No messages yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deckOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-gray-900 text-white z-20 shadow-2xl rounded-t-3xl overflow-hidden flex flex-col pb-4"
          >
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-bold uppercase tracking-wider text-sm px-2">
                  {currentGame.hiderDeck?.length || 0} / {currentGame.maxHandSize || 6} Cards
                </span>
                <button
                  onClick={() => setDeckOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {currentGame.hiderDeck && currentGame.hiderDeck.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 max-w-full">
                    {currentGame.hiderDeck.map((card, index) => {
                      const cardDisplay = getCardDisplay(card, currentGame.gameSize || 'medium')
                      const IconComp = cardDisplay.icon
                      return (
                        <motion.div
                          key={card.id || index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          onClick={() => playCard(card)}
                          className={`${cardDisplay.bgColor} p-4 rounded-xl border-2 border-white/20 cursor-pointer hover:scale-105 transition-transform shadow-lg flex-shrink-0`}
                          style={{ width: '120px', height: '160px' }}
                        >
                          <div className="h-full flex flex-col items-center justify-between text-white">
                            {IconComp && <IconComp className="w-10 h-10 mb-1" />}
                            <div className="flex-1 flex flex-col items-center justify-center px-1">
                              <p className="text-xl font-black text-center leading-tight break-words" style={{ fontSize: 'clamp(14px, 1.25rem, 20px)' }}>{cardDisplay.mainText}</p>
                            </div>
                            <p className="text-xs font-bold opacity-80 tracking-widest">{cardDisplay.subText}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">No cards in deck. Answer questions correctly to draw cards!</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-response top-bar confirmation (Radar, Measuring, Thermometer, Matching) — shown instead of full-screen modal */}
      <AnimatePresence>
        {(isRadarQuestion || isMeasuringQuestion || isThermometerQuestion || isMatchingQuestion) && pendingQuestion && showQuestionModal && (
          <motion.div
            key="auto-response-bar"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`absolute top-0 left-0 right-0 z-50 bg-gray-950 border-b-2 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xl ${isRadarQuestion ? 'border-cyan-500' : isThermometerQuestion ? 'border-red-500' : isMatchingQuestion ? 'border-pink-500' : 'border-emerald-500'}`}
          >
            <div className="flex items-center gap-3 w-full md:w-auto overflow-hidden">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isRadarQuestion ? 'bg-cyan-900 text-cyan-400' : isThermometerQuestion ? 'bg-red-900 text-red-500' : isMatchingQuestion ? 'bg-pink-900 text-pink-500' : 'bg-emerald-900 text-emerald-400'}`}>
                <span className="text-lg">{isRadarQuestion ? '📡' : isThermometerQuestion ? '🌡️' : isMatchingQuestion ? '🔗' : '📏'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isRadarQuestion ? 'text-cyan-400' : isThermometerQuestion ? 'text-red-400' : isMatchingQuestion ? 'text-pink-400' : 'text-emerald-400'}`}>
                    {isRadarQuestion ? 'Radar Question' : isThermometerQuestion ? 'Thermometer Question' : isMatchingQuestion ? 'Matching Question' : 'Measuring Question'}
                  </p>
                  {(isMeasuringFetching || isMatchingFetching) && (
                    <span className={`text-[10px] italic flex items-center gap-1 ${isMatchingQuestion ? 'text-pink-400/70' : 'text-emerald-400/70'}`}>
                      <Loader2 className="w-3 h-3 animate-spin inline" /> computing matches...
                    </span>
                  )}
                  {(measuringError || matchingError) && (
                    <span className="text-[10px] text-red-400 italic">error: {measuringError || matchingError}</span>
                  )}
                </div>
                <p className="text-sm text-white font-medium truncate" title={pendingQuestion.question?.question}>{pendingQuestion.question?.question}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
              {/* Quick powerups */}
              {currentGame.hiderDeck?.find(c => c.type === 'powerup' && c.effect === 'veto') && (
                <button
                  onClick={() => playCard(currentGame.hiderDeck!.find(c => c.type === 'powerup' && c.effect === 'veto')!)}
                  disabled={isAnswering}
                  className="flex items-center gap-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-bold px-2 py-2 rounded border border-purple-500/30 transition-colors"
                  title="Play Veto"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
              {currentGame.hiderDeck?.find(c => c.type === 'powerup' && c.effect === 'randomize') && (
                <button
                  onClick={() => playCard(currentGame.hiderDeck!.find(c => c.type === 'powerup' && c.effect === 'randomize')!)}
                  disabled={isAnswering}
                  className="flex items-center gap-1 bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-bold px-2 py-2 rounded border border-purple-500/30 transition-colors"
                  title="Play Randomize"
                >
                  <Dice5 className="w-4 h-4" />
                </button>
              )}

              {/* Status Indicator */}
              {isRadarQuestion ? (
                radarAutoAnswer !== null ? (
                  <span className={`text-base font-bold px-3 py-1 rounded-full whitespace-nowrap ${radarAutoAnswer ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {radarAutoAnswer ? 'YES ✓' : 'NO ✗'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Location unavailable</span>
                )
              ) : isThermometerQuestion ? (
                thermometerResult !== null ? (
                  <span className={`text-base font-bold px-3 py-1 rounded-full whitespace-nowrap ${thermometerResult === 'HOTTER' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {thermometerResult === 'HOTTER' ? 'HOTTER ✓' : 'COLDER ✗'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Location unavailable</span>
                )
              ) : isMatchingQuestion ? (
                matchingResult !== null ? (
                  <span className={`text-base font-bold px-3 py-1 rounded-full whitespace-nowrap ${matchingResult === 'YES' ? 'bg-green-900 text-green-300' : matchingResult === 'NULL' ? 'bg-gray-700 text-gray-300' : 'bg-red-900 text-red-300'}`}>
                    {matchingResult === 'YES' ? 'YES ✓' : matchingResult === 'NULL' ? 'N/A (NULL) ∅' : 'NO ✗'}
                  </span>
                ) : (
                  !isMatchingFetching && <span className="text-xs text-gray-400">Location unavailable</span>
                )
              ) : (
                measuringResult !== null ? (
                  <span className={`text-base font-bold px-3 py-1 rounded-full whitespace-nowrap ${measuringResult === 'CLOSER' ? 'bg-green-900 text-green-300' : measuringResult === 'NULL' ? 'bg-gray-700 text-gray-300' : 'bg-red-900 text-red-300'}`}>
                    {measuringResult === 'CLOSER' ? 'CLOSER ✓' : measuringResult === 'NULL' ? 'N/A (NULL) ∅' : 'FURTHER ✗'}
                  </span>
                ) : (
                  !isMeasuringFetching && <span className="text-xs text-gray-400">Location unavailable</span>
                )
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  setShowQuestionModal(false)
                  if (pendingQuestion?.question?.id) {
                    dismissedQuestionsRef.current.add(pendingQuestion.question.id)
                  }
                  if (isRadarQuestion) {
                    answerQuestion(radarAutoAnswer ?? false)
                  } else if (isThermometerQuestion) {
                    answerQuestion(thermometerResult ?? 'COLDER')
                  } else if (isMatchingQuestion) {
                    answerQuestion(matchingResult === 'NULL' ? 'NULL' : (matchingResult === 'YES'))
                  } else {
                    answerQuestion(measuringResult ?? 'FURTHER')
                  }
                }}
                disabled={isAnswering || (isMeasuringQuestion && !measuringResult) || (isThermometerQuestion && !thermometerResult) || (isMatchingQuestion && !matchingResult)}
                className={`text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap ${isRadarQuestion ? 'bg-cyan-600 hover:bg-cyan-500' : isThermometerQuestion ? 'bg-red-600 hover:bg-red-500' : isMatchingQuestion ? 'bg-pink-600 hover:bg-pink-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowQuestionModal(false)
                  if (pendingQuestion?.question?.id) {
                    dismissedQuestionsRef.current.add(pendingQuestion.question.id)
                  }
                }}
                className="text-gray-500 hover:text-gray-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen modal for standard manually-answered questions only */}
      <AnimatePresence>
        {!(isRadarQuestion || isMeasuringQuestion || isThermometerQuestion || isMatchingQuestion) && pendingQuestion && showQuestionModal && (
          <QuestionModal
            question={pendingQuestion}
            onAnswer={(answer: boolean | string) => answerQuestion(answer)}
            onIgnore={() => {
              setShowQuestionModal(false)
              if (pendingQuestion?.question?.id) {
                dismissedQuestionsRef.current.add(pendingQuestion.question.id)
              }
            }}
            uploading={uploadingPhoto}
            isAnswering={isAnswering}
            photoPreview={photoPreview}
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            setPhotoPreview={setPhotoPreview}
            powerups={currentGame.hiderDeck?.filter(c => c.type === 'powerup') || []}
            onPlayPowerup={playCard}
            errorDiscardAvailable={
              (isMeasuringQuestion && !!measuringError) ||
              (isMatchingQuestion && !!matchingError) ||
              (isMeasuringQuestion && !isMeasuringFetching && measuringResult === 'NULL') ||
              (isMatchingQuestion && !isMatchingFetching && matchingResult === 'NULL')
            }
            onErrorDiscard={handleErrorDiscard}
          />
        )}
      </AnimatePresence>

      {/* Targeting Mode UI for Hand Management Powerups */}
      <AnimatePresence>
        {targetingPowerup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-gray-900 text-white p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-2">Targeting Mode</h2>
              <p className="text-gray-400 mb-6 flex items-center gap-2">
                {targetingPowerup.type === 'duplicate' ? (
                  <>Select 1 card to <span className="text-indigo-400 font-bold">Duplicate</span> its effect:</>
                ) : (
                  <>Select {targetingPowerup.targetCount} card(s) to <span className="text-red-400 font-bold">Discard</span>:</>
                )}
              </p>

              <div className="flex flex-wrap justify-center gap-4 mb-6">
                {(currentGame.hiderDeck || []).filter(c => c.id !== targetingPowerup.powerup.id).map((card, index) => {
                  const isSelected = targetedCards.some((c) => c.id === card.id)
                  const cardDisplay = getCardDisplay(card, currentGame.gameSize || 'medium')
                  const IconComp = cardDisplay.icon

                  return (
                    <motion.div
                      key={card.id || index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (isSelected) {
                          setTargetedCards(targetedCards.filter(c => c.id !== card.id))
                        } else if (targetedCards.length < targetingPowerup.targetCount) {
                          setTargetedCards([...targetedCards, card])
                        }
                      }}
                      className={`${cardDisplay.bgColor} p-4 rounded-xl border-4 ${isSelected ? 'border-blue-500 scale-105' : 'border-transparent'} cursor-pointer transition-all shadow-lg relative flex-shrink-0`}
                      style={{ width: '130px', height: '170px' }}
                    >
                      {isSelected && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                      )}
                      <div className="h-full flex flex-col items-center justify-between text-white relative z-0">
                        {IconComp && <IconComp className="w-10 h-10 mb-1" />}
                        <div className="flex-1 flex flex-col items-center justify-center px-1">
                          <p className="text-lg font-black text-center leading-tight break-words">{cardDisplay.mainText}</p>
                        </div>
                        <p className="text-xs font-bold opacity-80 tracking-widest">{cardDisplay.subText}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between mt-8 border-t border-gray-700 pt-4">
                <button
                  onClick={async () => {
                    if (db && targetingPowerup) {
                      // Refund the temporarily removed card
                      try {
                        const gameRef = doc(db, 'games', game.id)
                        const snap = await getDoc(gameRef)
                        if (snap.exists()) {
                          const freshGame = { id: snap.id, ...snap.data() } as Game
                          await updateDoc(gameRef, {
                            hiderDeck: [...(freshGame.hiderDeck || []), targetingPowerup.powerup]
                          })
                        }
                      } catch (err) {
                        console.error("Failed to refund card:", err)
                      }
                    }
                    setTargetingPowerup(null)
                    setTargetedCards([])
                  }}
                  className="text-gray-400 hover:text-white transition-colors px-4 py-2 font-medium"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-400">
                    Selected: {targetedCards.length} / {targetingPowerup.targetCount}
                  </p>
                  <button
                    onClick={executeTargetedPowerup}
                    disabled={targetedCards.length !== targetingPowerup.targetCount}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors shadow-lg"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCardSelection && drawnCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-90 z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-gray-900 text-white p-6 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {!discardMode ? (
                <>
                  <h2 className="text-2xl font-bold mb-2">Select Cards to Keep</h2>
                  <p className="text-gray-400 mb-4">
                    You drew {drawnCards.length} card{drawnCards.length > 1 ? 's' : ''}. Select {keepCount} to keep.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {drawnCards.map((card, index) => {
                      const isSelected = cardsToKeep.some((c) => c.id === card.id)
                      const cardDisplay = getCardDisplay(card, currentGame.gameSize || 'medium')
                      const IconComp = cardDisplay.icon
                      return (
                        <motion.div
                          key={card.id || index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => toggleCardSelection(card)}
                          className={`${cardDisplay.bgColor} p-4 rounded-xl border-4 cursor-pointer transition-all shadow-lg relative`}
                          style={{ width: '140px', height: '186px' }}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <span className="text-white text-lg font-bold">✓</span>
                            </div>
                          )}
                          <div className="h-full flex flex-col items-center justify-between text-white">
                            {IconComp && <IconComp className="w-12 h-12 mb-1" />}
                            <div className="flex-1 flex flex-col items-center justify-center px-2">
                              <p className="text-2xl font-black text-center leading-tight break-words" style={{ fontSize: 'clamp(16px, 1.5rem, 24px)' }}>{cardDisplay.mainText}</p>
                            </div>
                            <p className="text-sm font-bold opacity-80 tracking-widest">{cardDisplay.subText}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-end">
                    <p className="text-sm text-gray-400 mr-4">
                      Selected: {cardsToKeep.length} / {keepCount}
                    </p>
                    <button
                      onClick={handleCardSelection}
                      disabled={cardsToKeep.length !== keepCount}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Confirm Selection
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2">Deck Full - Discard Cards</h2>
                  <p className="text-gray-400 mb-4">
                    Your deck is full ({currentDeckForDiscard.length}/6). Select {(currentDeckForDiscard.length + cardsToKeep.length) - 6} card{((currentDeckForDiscard.length + cardsToKeep.length) - 6) > 1 ? 's' : ''} to discard to make room for your new cards.
                  </p>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">Your Current Deck</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {currentDeckForDiscard.map((card, index) => {
                        const isSelected = cardsToDiscard.some((c) => c.id === card.id)
                        const cardDisplay = getCardDisplay(card, currentGame.gameSize || 'medium')
                        const IconComp = cardDisplay.icon
                        return (
                          <motion.div
                            key={card.id || index}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => toggleCardDiscard(card)}
                            className={`${cardDisplay.bgColor} p-4 rounded-xl border-4 cursor-pointer transition-all shadow-lg relative`}
                            style={{ width: '140px', height: '186px' }}
                          >
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                <span className="text-white text-lg font-bold">✗</span>
                              </div>
                            )}
                            <div className="h-full flex flex-col items-center justify-between text-white">
                              {IconComp && <IconComp className="w-12 h-12 mb-1" />}
                              <div className="flex-1 flex flex-col items-center justify-center px-2">
                                <p className="text-2xl font-black text-center leading-tight break-words" style={{ fontSize: 'clamp(16px, 1.5rem, 24px)' }}>{cardDisplay.mainText}</p>
                              </div>
                              <p className="text-sm font-bold opacity-80 tracking-widest">{cardDisplay.subText}</p>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">New Cards (Keeping All)</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {cardsToKeep.map((card, index) => {
                        const cardDisplay = getCardDisplay(card, currentGame.gameSize || 'medium')
                        const IconComp = cardDisplay.icon
                        return (
                          <div
                            key={card.id || index}
                            className={`${cardDisplay.bgColor} p-4 rounded-xl border-4 border-green-500 shadow-lg relative`}
                            style={{ width: '140px', height: '186px' }}
                          >
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                              <span className="text-white text-lg font-bold">+</span>
                            </div>
                            <div className="h-full flex flex-col items-center justify-between text-white">
                              {IconComp && <IconComp className="w-12 h-12 mb-1" />}
                              <div className="flex-1 flex flex-col items-center justify-center px-2">
                                <p className="text-2xl font-black text-center leading-tight break-words" style={{ fontSize: 'clamp(16px, 1.5rem, 24px)' }}>{cardDisplay.mainText}</p>
                              </div>
                              <p className="text-sm font-bold opacity-80 tracking-widest">{cardDisplay.subText}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <p className="text-sm text-gray-400 mr-4">
                      Cards to Discard: {cardsToDiscard.length} / {(currentDeckForDiscard.length + cardsToKeep.length) - 6}
                    </p>
                    <button
                      onClick={handleDiscardConfirm}
                      disabled={cardsToDiscard.length !== ((currentDeckForDiscard.length + cardsToKeep.length) - 6)}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Confirm Discard
                    </button>
                  </div>
                </>
              )}
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
    </div>
  )
}
