'use client'

import { useState } from 'react'
import { seedDeck, seedQuestions, seedAll } from '@/scripts/seed-comprehensive-client'
import { CheckCircle2, XCircle, Loader2, Database, ArrowLeft } from 'lucide-react'
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
    <div className="fixed inset-0 overflow-y-auto bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              Firebase Data Seeder
            </h1>
            <p className="text-gray-400">Initialize and reset your Firestore collections with default data.</p>
          </div>
          <Link href="/admin/dev" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Developer Menu
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-xl max-w-2xl mx-auto">
          <div className="space-y-4">
            <button
              onClick={handleSeedDeck}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                Seed Deck Collection
              </div>
              <div className="flex items-center">
                {loading && results.deck === null ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : results.deck === true ? (
                  <CheckCircle2 className="w-6 h-6 text-green-300" />
                ) : results.deck === false ? (
                  <XCircle className="w-6 h-6 text-red-300" />
                ) : null}
              </div>
            </button>

            <button
              onClick={handleSeedQuestions}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                Seed Questions Collection
              </div>
              <div className="flex items-center">
                {loading && results.questions === null ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : results.questions === true ? (
                  <CheckCircle2 className="w-6 h-6 text-green-300" />
                ) : results.questions === false ? (
                  <XCircle className="w-6 h-6 text-red-300" />
                ) : null}
              </div>
            </button>

            <button
              onClick={handleSeedAll}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-between shadow-lg mt-8"
            >
              <div className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                Seed All Collections
              </div>
              <div className="flex items-center">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 opacity-50" />
                )}
              </div>
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <p className="text-sm text-gray-400 leading-relaxed">
              <strong>Note:</strong> Make sure you have proper Firestore permissions set up.
              This page will only work if your security rules allow writes to the deck and questions collections.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
