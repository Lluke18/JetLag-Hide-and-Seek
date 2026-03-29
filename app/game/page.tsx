'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import RoleSwitcher from '@/components/RoleSwitcher'

function GamePageContent() {
  const searchParams = useSearchParams()
  const [gameId, setGameId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')

  useEffect(() => {
    const id = searchParams?.get('id')
    const name = searchParams?.get('name')
    if (id) setGameId(id)
    if (name) setPlayerName(name)

    if (!id && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const idFromUrl = url.searchParams.get('id')
      const nameFromUrl = url.searchParams.get('name')
      if (idFromUrl) setGameId(idFromUrl)
      if (nameFromUrl) setPlayerName(nameFromUrl)
    }
  }, [searchParams])

  if (!gameId) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-4">
          <p className="mb-2 text-lg">No game ID found</p>
          <p className="text-sm text-gray-400 mb-4">
            Please create or join a game from the home page.
          </p>
          <button
            onClick={() => window.location.href = '/join'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Go to Join Page
          </button>
        </div>
      </div>
    )
  }

  return <RoleSwitcher gameId={gameId} playerName={playerName} />
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    }>
      <GamePageContent />
    </Suspense>
  )
}
