'use client'

import { useState } from 'react'
import { seedDeck, seedQuestions, seedAll } from '@/scripts/seed-comprehensive-client'
import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react'
import Link from 'next/link'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    deck: boolean | null
    questions: boolean | null
  }>({ deck: null, questions: null })

  const handleSeedDeck = async () => {
    setLoading(true)
    setResults({ ...results, deck: null })
    const success = await seedDeck()
    setResults({ ...results, deck: success })
    setLoading(false)
  }

  const handleSeedQuestions = async () => {
    setLoading(true)
    setResults({ ...results, questions: null })
    const success = await seedQuestions()
    setResults({ ...results, questions: success })
    setLoading(false)
  }

  const handleSeedAll = async () => {
    setLoading(true)
    setResults({ deck: null, questions: null })
    const success = await seedAll()
    setResults({ deck: success, questions: success })
    setLoading(false)
  }

  return (
    <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Firebase Data Seeder</h1>
          <p className="text-gray-400">Seed your Firestore collections</p>
        </div>

        <Link
          href="/admin/questions"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Database className="w-5 h-5" />
          Manage Questions (CRUD)
        </Link>

        <Link
          href="/admin/deck"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Database className="w-5 h-5" />
          Manage Deck (CRUD)
        </Link>

        <div className="space-y-4">
          <button
            onClick={handleSeedDeck}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && results.deck === null ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : results.deck === true ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : results.deck === false ? (
              <XCircle className="w-5 h-5" />
            ) : null}
            Seed Deck Collection
          </button>

          <button
            onClick={handleSeedQuestions}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && results.questions === null ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : results.questions === true ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : results.questions === false ? (
              <XCircle className="w-5 h-5" />
            ) : null}
            Seed Questions Collection
          </button>

          <button
            onClick={handleSeedAll}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            Seed All Collections
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong>Note:</strong> Make sure you have proper Firestore permissions set up.
            This page will only work if your security rules allow writes to the deck and questions collections.
          </p>
        </div>
      </div>
    </div>
  )
}
