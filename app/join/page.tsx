'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Gamepad2, Plus, AlertCircle } from 'lucide-react'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [firebaseError, setFirebaseError] = useState<string | null>(null)
  const router = useRouter()

  // Load saved name from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('playerName')
      if (saved) setPlayerName(saved)
    }
    if (!db) {
      setFirebaseError('Firebase is not configured. Please check your .env.local file.')
    }
  }, [])

  const generateCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const saveName = () => {
    if (typeof window !== 'undefined' && playerName.trim()) {
      localStorage.setItem('playerName', playerName.trim())
    }
  }

  const createGame = async () => {
    if (!playerName.trim()) return
    if (!db) {
      setFirebaseError('Firebase is not configured. Please check your .env.local file.')
      return
    }

    setLoading(true)
    setFirebaseError(null)
    saveName()
    try {
      const gameCode = generateCode()

      const gameRef = await addDoc(collection(db, 'games'), {
        code: gameCode,
        createdAt: new Date(),
        hider: null,
        seekers: [],
        status: 'lobby',
        totalHidingTime: 0,
        activeCurses: [],
        hiderLocation: null,
        seekerLocations: {},
        gameSize: 'medium',
        hidingZoneRadius: 402.336,
        hiderDeck: [],
        players: {},
      })
      router.push(`/game?id=${gameRef.id}&name=${encodeURIComponent(playerName.trim())}`)
    } catch (error: any) {
      console.error('Error creating game:', error)
      setFirebaseError(error.message || 'Failed to create game. Please check your Firebase configuration.')
      setLoading(false)
    }
  }

  const joinGame = async () => {
    if (code.length !== 4 || !playerName.trim()) return
    if (!db) {
      setFirebaseError('Firebase is not configured. Please check your .env.local file.')
      return
    }

    setLoading(true)
    setFirebaseError(null)
    saveName()
    try {
      const gamesRef = collection(db, 'games')
      const q = query(gamesRef, where('code', '==', code))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setFirebaseError('Game not found')
        setLoading(false)
        return
      }

      const gameDoc = querySnapshot.docs[0]
      const gameData = gameDoc.data()

      if (gameData.status !== 'lobby' && gameData.status !== 'waiting' && gameData.status !== 'active') {
        setFirebaseError('Game is not available')
        setLoading(false)
        return
      }

      router.push(`/game?id=${gameDoc.id}&name=${encodeURIComponent(playerName.trim())}`)
    } catch (error: any) {
      console.error('Error joining game:', error)
      setFirebaseError(error.message || 'Failed to join game. Please check your Firebase configuration.')
      setLoading(false)
    }
  }

  return (
    <div className="h-dvh w-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <Gamepad2 className="w-20 h-20 mx-auto text-white" />
          <h1 className="text-4xl font-bold text-white">JetLag Hide & Seek</h1>
          <p className="text-gray-300">Create or join a game</p>
        </div>

        {firebaseError && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-200 font-semibold mb-1">Configuration Error</p>
              <p className="text-red-300 text-sm">{firebaseError}</p>
              <p className="text-red-400 text-xs mt-2">
                See FIREBASE_SETUP.md for setup instructions.
              </p>
            </div>
          </div>
        )}

        {/* Player Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            className="w-full bg-gray-800 text-white text-lg font-semibold py-3 px-4 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="space-y-4">
          <button
            onClick={createGame}
            disabled={loading || !playerName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Game
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-br from-purple-900 to-indigo-900 text-gray-400">OR</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 4-digit code"
              className="w-full bg-gray-800 text-white text-center text-3xl font-bold py-4 px-6 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={joinGame}
              disabled={loading || code.length !== 4 || !playerName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
