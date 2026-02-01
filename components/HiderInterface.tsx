'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, collection, getDocs, updateDoc, onSnapshot, getDoc, deleteField } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '@/lib/firebase'
import { Game, Card, Curse, ChatMessage } from '@/types/game'
import Map, { Marker, Source, Layer } from 'react-map-gl'
import { MapPin, Menu, Coins, X, Camera, Upload } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface HiderInterfaceProps {
  game: Game
}

export default function HiderInterface({ game }: HiderInterfaceProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawnCard, setDrawnCard] = useState<Card | null>(null)
  const [hand, setHand] = useState<Card[]>([])
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapboxToken] = useState(process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '')
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

  useEffect(() => {
    if (!db) return
    const gameRef = doc(db, 'games', game.id)
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (!snapshot.exists()) return
      const gameData = { id: snapshot.id, ...snapshot.data() } as Game
      setCurrentGame(gameData)
      console.log('Game data updated:', gameData)
      // Only update pendingQuestion if we're not currently answering
      if (!isAnsweringRef.current) {
        if (gameData.pendingQuestion) {
          // Only update if it's a different question
          const newTimestamp = gameData.pendingQuestion.timestamp?.toMillis?.() || gameData.pendingQuestion.timestamp?.getTime?.() || Date.now()
          const currentTimestamp = pendingQuestion?.timestamp?.toMillis?.() || pendingQuestion?.timestamp?.getTime?.() || 0
          if (!pendingQuestion || newTimestamp !== currentTimestamp) {
            setPendingQuestion(gameData.pendingQuestion)
          }
        } else {
          // Clear if no pending question
          if (pendingQuestion) {
            setPendingQuestion(null)
          }
        }
      }
    })

    return () => unsubscribe()
  }, [game.id])

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

  const drawCard = async () => {
    if (!db) return
    try {
      const deckRef = collection(db, 'deck')
      const snapshot = await getDocs(deckRef)
      const cards = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Card[]

      if (cards.length === 0) {
        alert('No cards in deck')
        return
      }

      const randomCard = cards[Math.floor(Math.random() * cards.length)]
      setDrawnCard(randomCard)
    } catch (error) {
      console.error('Error drawing card:', error)
    }
  }

  const playCard = async () => {
    if (!drawnCard || !db) return

    try {
      const gameRef = doc(db, 'games', game.id)
      const gameSnapshot = await getDoc(gameRef)
      const currentGame = { id: gameSnapshot.id, ...gameSnapshot.data() } as Game

      if (drawnCard.type === 'timeBonus') {
        await updateDoc(gameRef, {
          totalHidingTime: (currentGame.totalHidingTime || 0) + (drawnCard.value || 0),
        })
      } else if (drawnCard.type === 'curse') {
        const newCurse: Curse = {
          id: Date.now().toString(),
          name: drawnCard.name,
          description: drawnCard.description,
          duration: drawnCard.value || 0,
          timestamp: new Date(),
        }
        await updateDoc(gameRef, {
          activeCurses: [...(currentGame.activeCurses || []), newCurse],
        })
      }

      setDrawnCard(null)
    } catch (error) {
      console.error('Error playing card:', error)
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
      
      if (correct) {
        updateData.coins = (currentGameData.coins || 0) + 1
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
      
      // Clear local state
      setPendingQuestion(null)
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

  if (!mapboxToken) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="text-center max-w-md">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Mapbox Token Missing</h2>
          <p className="text-gray-300 mb-4">
            Please add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file
          </p>
          <p className="text-sm text-gray-400">
            Get your token from: https://account.mapbox.com/access-tokens/
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
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: centerLng,
          latitude: centerLat,
          zoom: 15,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        onLoad={() => setMapReady(true)}
        onError={(e) => {
          console.error('Map error:', e)
          setMapError('Failed to load map. Please check your Mapbox token.')
        }}
        reuseMaps
        dragRotate={false}
        dragPan={true}
      >
        <Marker longitude={centerLng} latitude={centerLat}>
          <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
        </Marker>
        {currentGame.seekerLocations && Object.entries(currentGame.seekerLocations).map(([userId, seekerLoc]) => (
          <Marker key={userId} longitude={seekerLoc.lng} latitude={seekerLoc.lat}>
            <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
          </Marker>
        ))}
        <Source
          id="hiding-zone"
          type="geojson"
          data={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [centerLng, centerLat],
            },
          }}
        >
          <Layer
            id="hiding-zone-circle"
            type="circle"
            paint={{
              // Fixed real-world size: 500 meters radius
              // Convert meters to pixels: radius_pixels = radius_meters / meters_per_pixel
              // At equator: meters_per_pixel = 156543.03392 / (2^zoom)
              // For 500m radius: radius_pixels = 500 * (2^zoom) / 156543.03392
              'circle-radius': [
                'interpolate',
                ['exponential', 2],
                ['zoom'],
                8, 0.82,    // 500m / (156543 / 256) = 500 * 256 / 156543 ≈ 0.82px
                10, 3.27,   // 500m / (156543 / 1024) = 500 * 1024 / 156543 ≈ 3.27px
                12, 13.1,   // 500m / (156543 / 4096) = 500 * 4096 / 156543 ≈ 13.1px
                15, 104.7,  // 500m / (156543 / 32768) = 500 * 32768 / 156543 ≈ 104.7px
                18, 837.8,  // 500m / (156543 / 262144) = 500 * 262144 / 156543 ≈ 837.8px
                20, 3351     // 500m / (156543 / 1048576) = 500 * 1048576 / 156543 ≈ 3351px
              ],
              'circle-color': 'rgba(255, 0, 0, 0.1)',
              'circle-stroke-color': 'rgba(255, 0, 0, 0.5)',
              'circle-stroke-width': 2,
            }}
          />
        </Source>
      </Map>

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-gray-900 text-white p-3 rounded-full shadow-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <span className="text-sm text-gray-400">Game Code:</span>
          <span className="text-xl font-bold text-blue-400">{game.code}</span>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 h-full w-80 bg-gray-900 text-white z-20 shadow-2xl overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-3">
                <Coins className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Coins</p>
                  <p className="text-2xl font-bold">{game.coins || 0}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={drawCard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Draw Card
                </button>

                {drawnCard && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gray-800 p-4 rounded-lg border-2 border-blue-500"
                  >
                    <h3 className="font-bold text-lg mb-2">{drawnCard.name}</h3>
                    <p className="text-sm text-gray-300 mb-3">{drawnCard.description}</p>
                    <p className="text-xs text-gray-400 mb-3">
                      Type: {drawnCard.type === 'timeBonus' ? 'Time Bonus' : 'Curse'}
                    </p>
                    <button
                      onClick={playCard}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Play Card
                    </button>
                  </motion.div>
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
        {pendingQuestion && (
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
              onClick={(e) => {
                // Prevent clicks inside modal from bubbling to overlay
                e.stopPropagation()
              }}
            >
              <h2 className="text-2xl font-bold mb-4">Question</h2>
              <p className="text-lg mb-6">{pendingQuestion.question?.question}</p>
              
              {pendingQuestion.question?.type === 'photo' && (
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
                  onClick={() => {
                    console.log('Yes button clicked')
                    answerQuestion(true)
                  }}
                  disabled={uploadingPhoto || isAnsweringRef.current || (pendingQuestion.question?.type === 'photo' && !photoFile)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingPhoto ? 'Uploading...' : pendingQuestion.question?.type === 'photo' ? 'Submit Photo' : 'Yes'}
                </button>
                {pendingQuestion.question?.type !== 'photo' && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log('No button clicked')
                      answerQuestion(false)
                    }}
                    disabled={uploadingPhoto || isAnsweringRef.current}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    No
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
