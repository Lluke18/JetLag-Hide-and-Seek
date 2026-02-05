'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Game, Curse, Question, ChatMessage } from '@/types/game'
import GoogleMapWrapper from './GoogleMapWrapper'
import { MapPin, X, MessageSquare, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SeekerInterfaceProps {
  game: Game
}

export default function SeekerInterface({ game }: SeekerInterfaceProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeCurse, setActiveCurse] = useState<Curse | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [googleMapsApiKey] = useState(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
  const [showHiderLocation, setShowHiderLocation] = useState(false)
  const [currentGame, setCurrentGame] = useState<Game>(game)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [questionsDrawerOpen, setQuestionsDrawerOpen] = useState(false)
  const [lastSeenMessageCount, setLastSeenMessageCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

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
          updateSeekerLocation(loc)
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
          updateSeekerLocation(loc)
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [])

  useEffect(() => {
    // Filter questions based on usedQuestionIds and game size
    if (questions.length === 0) {
      setAvailableQuestions([])
      return
    }

    const usedIds = currentGame.usedQuestionIds || []
    const gameSizeStr = currentGame.gameSize || 'small'

    const filtered = questions.filter(q => {
      // Filter out used questions
      if (usedIds.includes(q.id)) return false

      // Filter by game size
      if (q.gameSize) {
        if (q.gameSize === 'all') return true
        if (q.gameSize.includes(gameSizeStr)) return true
        return false
      }

      return true
    })

    setAvailableQuestions(filtered)
  }, [questions, currentGame.usedQuestionIds, currentGame.gameSize])

  const updateSeekerLocation = async (loc: { lat: number; lng: number }) => {
    if (!db || !auth) return
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      const gameRef = doc(db, 'games', game.id)
      await updateDoc(gameRef, {
        [`seekerLocations.${userId}`]: loc,
      })
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

  return (
    <div className="h-dvh w-screen relative">
      <GoogleMapWrapper
        key={JSON.stringify(mapSettings)} // Force remount when settings change
        center={{ lat: location.lat, lng: location.lng }}
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
        circleRadiusMeters={mapSettings?.circleRadiusMeters || 500}
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

      <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setChatOpen(!chatOpen)
                if (!chatOpen) {
                  setQuestionsDrawerOpen(false) // Close questions when opening chat
                  setLastSeenMessageCount(currentGame.chatMessages?.length || 0) // Mark as seen
                }
              }}
              className="bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors relative"
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
                setQuestionsDrawerOpen(!questionsDrawerOpen)
                if (!questionsDrawerOpen) setChatOpen(false) // Close chat when opening questions
              }}
              className="bg-gray-900 text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
            >
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 justify-center">
            <span className="text-sm text-gray-400">Game Code:</span>
            <span className="text-xl font-bold text-blue-400">{currentGame.code}</span>
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
              <h3 className="text-xl font-bold">Chat</h3>
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
            className="absolute top-0 right-0 h-full w-80 bg-gray-900 text-white z-20 shadow-2xl overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Questions</h2>
                <button
                  onClick={() => setQuestionsDrawerOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {questionsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Loading questions...</p>
                </div>
              ) : getCategories().length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-gray-400">No questions available</p>
                  <p className="text-sm text-gray-500">
                    Questions need to be seeded into Firestore.
                  </p>
                  <a
                    href="/admin/seed"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Go to Seed Page
                  </a>
                </div>
              ) : !selectedCategory ? (
                <div className="space-y-2">
                  {getCategories().map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-left"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => {
                        setSelectedCategory(null)
                        setSelectedQuestion(null)
                      }}
                      className="p-2 hover:bg-gray-800 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold">{selectedCategory}</h3>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableQuestions
                      .filter((q) => {
                        // Filter by category
                        if (q.category !== selectedCategory) return false
                        return true
                      })
                      .map((question) => (
                        <button
                          key={question.id}
                          onClick={() => sendQuestionRequest(question)}
                          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-left border border-gray-700"
                        >
                          <p className="text-sm">{question.question}</p>
                          {question.drawCards && question.keepCards && (
                            <p className="text-xs text-gray-400 mt-1">
                              Draw {question.drawCards}, Keep {question.keepCards}
                            </p>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
