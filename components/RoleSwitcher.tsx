'use client'

import { useEffect, useState, useRef } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { signInAnonymously } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { Game } from '@/types/game'
import HiderInterface from './HiderInterface'
import SeekerInterface from './SeekerInterface'
import GameLobby from './GameLobby'
import { Loader2 } from 'lucide-react'

interface RoleSwitcherProps {
  gameId: string
  playerName?: string
}

export default function RoleSwitcher({ gameId, playerName }: RoleSwitcherProps) {
  const [game, setGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [resolvedName, setResolvedName] = useState('')

  // Resolve player name from prop, URL, or localStorage
  useEffect(() => {
    if (playerName) {
      setResolvedName(playerName)
      return
    }
    if (typeof window !== 'undefined') {
      const urlName = new URLSearchParams(window.location.search).get('name')
      if (urlName) {
        setResolvedName(urlName)
        return
      }
      const saved = localStorage.getItem('playerName')
      if (saved) {
        setResolvedName(saved)
        return
      }
    }
    setResolvedName(`Player ${Math.floor(Math.random() * 1000)}`)
  }, [playerName])

  useEffect(() => {
    const initializeAuth = async () => {
      if (!auth) {
        setAuthError('Firebase Authentication is not configured')
        setLoading(false)
        return
      }

      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth)
        }
        setAuthReady(true)
      } catch (error: any) {
        console.error('Auth error:', error)
        setAuthError(error.message || 'Failed to authenticate')
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  useEffect(() => {
    if (!gameId || !db || !auth || !authReady || authError) return

    const gameRef = doc(db, 'games', gameId)
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLoading(false)
        return
      }

      const gameData = { id: snapshot.id, ...snapshot.data() } as Game
      setGame(gameData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [gameId, authReady, authError])

  if (authError) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-400">Authentication Error</h2>
          <p className="text-gray-300">{authError}</p>
          <p className="text-sm text-gray-400">
            Please check your Firebase configuration in .env.local and ensure Anonymous authentication is enabled.
          </p>
        </div>
      </div>
    )
  }

  if (loading || !game) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    )
  }

  // Show lobby for lobby/waiting status
  if (game.status === 'lobby' || game.status === 'waiting') {
    return <GameLobby game={game} playerName={resolvedName} />
  }

  // Determine role from players map
  const uid = auth?.currentUser?.uid
  const playerEntry = uid && game.players ? game.players[uid] : null
  const role = playerEntry?.role || (game.hider === uid ? 'hider' : 'seeker')

  if (role === 'hider') {
    return <HiderInterface game={game} />
  }

  return <SeekerInterface game={game} />
}
