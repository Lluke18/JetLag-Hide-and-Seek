'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, collection, getDocs, updateDoc, onSnapshot, getDoc, deleteField } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '@/lib/firebase'
import { Game, Card, Curse, ChatMessage } from '@/types/game'
import GoogleMapWrapper from './GoogleMapWrapper'
import { MapPin, Menu, X, Camera, Upload, CreditCard, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HiderInterfaceProps {
  game: Game
}

interface QuestionModalProps {
  question: any
  onAnswer: (correct: boolean) => void
  onIgnore: () => void
  uploading: boolean
  isAnswering: boolean
  photoPreview: string | null
  setPhotoFile: (file: File | null) => void
  setPhotoPreview: (url: string | null) => void
}

export default function HiderInterface({ game }: HiderInterfaceProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [googleMapsApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
  const [pendingQuestion, setPendingQuestion] = useState<any>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [hidingPeriodTimeLeft, setHidingPeriodTimeLeft] = useState<number | null>(null)
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [currentGame, setCurrentGame] = useState<Game>(game)
  const isAnsweringRef = useRef(false) // Prevent multiple simultaneous calls
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
      console.log('Game data updated:', gameData)
      // Only update pendingQuestion state from Firestore - don't control modal visibility here
      if (!isAnsweringRef.current) {
        if (gameData.pendingQuestion) {
          setPendingQuestion(gameData.pendingQuestion)
        } else {
          // Clear if no pending question
          setPendingQuestion(null)
        }
      }
    })

    return () => unsubscribe()
  }, [game.id])

  // Control modal visibility based on pendingQuestion changes (like card selection dialog)
  useEffect(() => {
    if (pendingQuestion?.question?.id) {
      const questionId = pendingQuestion.question.id
      // Only show modal if: 1) not dismissed AND 2) not already showing this question
      if (!dismissedQuestionsRef.current.has(questionId)) {
        setShowQuestionModal(true)
      }
    } else {
      // Clear modal if no pending question
      setShowQuestionModal(false)
    }
  }, [pendingQuestion]) // Only watch pendingQuestion, not showQuestionModal

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [currentGame.chatMessages, chatOpen])

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
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
          setLocation(loc)
          updateHiderLocation(loc)
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const updateHiderLocation = async (loc: { lat: number; lng: number }) => {
    if (!db) return
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
            console.log('Randomize effect - will be implemented later')
            break
          case 'veto':
            console.log('Veto effect - will be implemented later')
            break
          case 'move':
            console.log('Move effect - will be implemented later')
            break
          case 'discard1draw2':
            console.log('Discard 1 Draw 2 effect - will be implemented later')
            break
          case 'discard2draw3':
            console.log('Discard 2 Draw 3 effect - will be implemented later')
            break
          case 'draw1expand1':
            console.log('Draw 1 Expand 1 effect - will be implemented later')
            break
          case 'duplicate':
            console.log('Duplicate effect - will be implemented later')
            break
          default:
            console.log('Unknown powerup effect')
        }
      }

      // Remove card from deck
      const currentDeck = currentGameData.hiderDeck || []
      const newDeck = currentDeck.filter((c) => c.id !== card.id)
      updateData.hiderDeck = newDeck

      await updateDoc(gameRef, updateData)
    } catch (error) {
      console.error('Error playing card:', error)
      alert('Error playing card. Please try again.')
    }
  }

  const answerQuestion = async (correct: boolean) => {
    console.log('=== ANSWER QUESTION CALLED ===', { correct, hasPendingQuestion: !!pendingQuestion, isAnswering: isAnsweringRef.current })

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
    if (isAnsweringRef.current) {
      console.log('Already processing answer, ignoring duplicate call')
      return
    }

    // For photo questions, require photo upload
    if (pendingQuestion.question?.type === 'photo' && correct && !photoFile) {
      alert('Please take or upload a photo first')
      return
    }

    // Set flag immediately
    isAnsweringRef.current = true
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
      if (pendingQuestion.question?.type === 'photo' && correct && photoFile && storage) {
        console.log('Uploading photo...')
        const photoRef = ref(storage, `game-photos/${game.id}/${Date.now()}-${photoFile.name}`)
        await uploadBytes(photoRef, photoFile)
        photoUrl = await getDownloadURL(photoRef)
        console.log('Photo uploaded:', photoUrl)
      }

      // Create chat message
      const questionText = pendingQuestion.question?.question || 'Unknown question'
      const category = pendingQuestion.category || 'Unknown'
      const answerText = correct ? 'Yes ✓' : 'No ✗'

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


      // Draw cards for any answer (Yes or No) - but don't add to deck yet, show selection UI
      if (pendingQuestion.question) {
        const question = pendingQuestion.question
        const drawCount = question.drawCards || 0
        const keepCountValue = question.keepCards || 0

        console.log('Card drawing check:', { answerGiven: correct ? 'Yes' : 'No', drawCount, keepCountValue, questionId: question.id })

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
      isAnsweringRef.current = false
    }
  }

  const QuestionModal = ({ question, onAnswer, onIgnore, uploading, isAnswering, photoPreview, setPhotoFile, setPhotoPreview }: QuestionModalProps) => (
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
          <h2 className="text-2xl font-bold">Question</h2>
          <button
            onClick={onIgnore}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-lg mb-6">{question.question?.question}</p>

        {question.question?.type === 'photo' && (
          <div className="mb-6 space-y-4">
            {photoPreview ? (
              <div className="space-y-2">
                <img src={photoPreview} alt="Preview" className="w-full rounded-lg max-h-64 object-cover" />
                <button
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Remove Photo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
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
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Camera className="w-5 h-5" />
                  Take/Upload Photo
                </label>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onAnswer(true)}
            disabled={uploading || isAnswering || (question.question?.type === 'photo' && !photoFile)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : question.question?.type === 'photo' ? 'Submit Photo' : 'Yes'}
          </button>
          {question.question?.type !== 'photo' && (
            <button
              type="button"
              onClick={() => onAnswer(false)}
              disabled={uploading || isAnswering}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              No
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )

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

  const centerLat = location.lat
  const centerLng = location.lng

  return (
    <div className="h-dvh w-screen relative">
      <GoogleMapWrapper
        key={`map-${JSON.stringify(mapSettings)}`} // Force remount when settings change
        center={{ lat: centerLat, lng: centerLng }}
        zoom={mapSettings?.zoom || 15}
        onLoad={(map) => {
          setMapReady(true)
        }}
        onError={(error) => {
          console.error('Map error:', error)
          setMapError('Failed to load map. Please check your Google Maps API key.')
        }}
        hiderLocation={location}
        seekerLocations={currentGame.seekerLocations}
        circleRadiusMeters={mapSettings?.circleRadiusMeters || 500}
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

        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="text-sm text-gray-400">Game Code:</span>
          <span className="text-xl font-bold text-blue-400">{game.code}</span>
        </div>
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
              <h3 className="text-xl font-bold">Chat</h3>
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
            className="absolute bottom-0 left-0 right-0 h-96 bg-gray-900 text-white z-20 shadow-2xl rounded-t-3xl overflow-hidden flex flex-col"
          >
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <button
                  onClick={() => setDeckOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Deck</p>
                  <p className="text-2xl font-bold">{currentGame.hiderDeck?.length || 0}/6</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Your Cards</h3>
                {currentGame.hiderDeck && currentGame.hiderDeck.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                    {currentGame.hiderDeck.map((card, index) => (
                      <motion.div
                        key={card.id || index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-gray-800 p-3 rounded-lg border-2 border-gray-700 min-w-[200px] flex-shrink-0"
                      >
                        <h4 className="font-bold text-sm mb-1">{card.name}</h4>
                        <p className="text-xs text-gray-300 mb-2 line-clamp-2">{card.description}</p>
                        <p className="text-xs text-gray-400 mb-2">
                          Type: {
                            card.type === 'timeBonus' ? 'Time Bonus' :
                              card.type === 'curse' ? 'Curse' :
                                card.type === 'powerup' ? 'Powerup' : 'Unknown'
                          }
                        </p>
                        <button
                          onClick={() => playCard(card)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-xs"
                        >
                          Play Card
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No cards in deck. Answer questions correctly to draw cards!</p>
                )}
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-400">Total Hiding Time</p>
                <p className="text-xl font-bold">{game.totalHidingTime || 0} seconds</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingQuestion && showQuestionModal && (
          <QuestionModal
            question={pendingQuestion}
            onAnswer={answerQuestion}
            onIgnore={() => {
              setShowQuestionModal(false)
              // Mark this question as dismissed
              if (pendingQuestion?.question?.id) {
                dismissedQuestionsRef.current.add(pendingQuestion.question.id)
              }
            }}
            uploading={uploadingPhoto}
            isAnswering={isAnsweringRef.current}
            photoPreview={photoPreview}
            setPhotoFile={setPhotoFile}
            setPhotoPreview={setPhotoPreview}
          />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {drawnCards.map((card, index) => {
                      const isSelected = cardsToKeep.some((c) => c.id === card.id)
                      return (
                        <motion.div
                          key={card.id || index}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => toggleCardSelection(card)}
                          className={`bg-gray-800 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-gray-700 hover:border-gray-600'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{card.name}</h3>
                            {isSelected && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{card.description}</p>
                          <p className="text-xs text-gray-400">
                            Type: {
                              card.type === 'timeBonus' ? 'Time Bonus' :
                                card.type === 'curse' ? 'Curse' :
                                  card.type === 'powerup' ? 'Powerup' : 'Unknown'
                            }
                          </p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentDeckForDiscard.map((card, index) => {
                        const isSelected = cardsToDiscard.some((c) => c.id === card.id)
                        return (
                          <motion.div
                            key={card.id || index}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => toggleCardDiscard(card)}
                            className={`bg-gray-800 p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                              ? 'border-red-500 bg-red-900/20'
                              : 'border-gray-700 hover:border-gray-600'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-lg">{card.name}</h3>
                              {isSelected && (
                                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm">✗</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{card.description}</p>
                            <p className="text-xs text-gray-400">
                              Type: {
                                card.type === 'timeBonus' ? 'Time Bonus' :
                                  card.type === 'curse' ? 'Curse' :
                                    card.type === 'powerup' ? 'Powerup' : 'Unknown'
                              }
                            </p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-3">New Cards (Keeping All)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {cardsToKeep.map((card, index) => (
                        <div
                          key={card.id || index}
                          className="bg-green-900/20 p-4 rounded-lg border-2 border-green-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-lg">{card.name}</h3>
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">+</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{card.description}</p>
                          <p className="text-xs text-gray-400">
                            Type: {
                              card.type === 'timeBonus' ? 'Time Bonus' :
                                card.type === 'curse' ? 'Curse' :
                                  card.type === 'powerup' ? 'Powerup' : 'Unknown'
                            }
                          </p>
                        </div>
                      ))}
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
    </div >
  )
}
