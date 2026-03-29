'use client'

import { useState, useEffect } from 'react'
import { Settings, Map, Layers, CreditCard, ServerCrash, LogOut, FastForward, Trash2, RotateCcw, Check } from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore'
import GoogleMapWrapper from '@/components/GoogleMapWrapper'

interface MapSettings {
  mapTypeId: 'roadmap' | 'satellite' | 'hybrid' | 'terrain'
  showTransitLayer: boolean
  hiderMarkerColor: string
  seekerMarkerColor: string
  hiderMarkerStrokeColor: string
  seekerMarkerStrokeColor: string
  hiderMarkerStrokeWeight: number
  seekerMarkerStrokeWeight: number
  circleColor: string
  circleStrokeColor: string
  circleOpacity: number
  circleStrokeOpacity: number
  circleStrokeWeight: number
  circleRadiusMeters: number
  zoom: number
  minZoom: number
  maxZoom: number
  hiderMarkerSize: number
  seekerMarkerSize: number
  showZoomControl: boolean
  showMapTypeControl: boolean
  showStreetViewControl: boolean
  showFullscreenControl: boolean
  showPOILabels: boolean
  showTransitLabels: boolean
  showRoadLabels: boolean
  showAdministrativeLabels: boolean
  showWaterLabels: boolean
  showLandscapeLabels: boolean
  showTransitLines: boolean
  showTransitStations: boolean
  showBusStops: boolean
  showTramStops: boolean
  showSubwayStations: boolean
  showRailStations: boolean
  showBusLines: boolean
  showTramLines: boolean
  showSubwayLines: boolean
  showRailLines: boolean
  showRoads: boolean
  showBuildings: boolean
  showWater: boolean
  showParks: boolean
  showHighways: boolean
  showLocalRoads: boolean
  showArterialRoads: boolean
  darkMode: boolean
  gestureHandling: 'auto' | 'greedy' | 'none' | 'cooperative'
  disableDoubleClickZoom: boolean
  disableScrollWheel: boolean
  draggable: boolean
  draggableCursor: string
  draggingCursor: string
  keyboardShortcuts: boolean
  clickableIcons: boolean
  mapLanguage: string
  tilt: number
  heading: number
}

const defaultSettings: MapSettings = {
  mapTypeId: 'roadmap',
  showTransitLayer: true,
  hiderMarkerColor: '#10b981',
  seekerMarkerColor: '#ef4444',
  hiderMarkerStrokeColor: '#ffffff',
  seekerMarkerStrokeColor: '#ffffff',
  hiderMarkerStrokeWeight: 2,
  seekerMarkerStrokeWeight: 2,
  circleColor: '#ff0000',
  circleStrokeColor: '#ff0000',
  circleOpacity: 0.1,
  circleStrokeOpacity: 0.5,
  circleStrokeWeight: 2,
  circleRadiusMeters: 500,
  zoom: 15,
  minZoom: 1,
  maxZoom: 20,
  hiderMarkerSize: 6,
  seekerMarkerSize: 6,
  showZoomControl: true,
  showMapTypeControl: false,
  showStreetViewControl: false,
  showFullscreenControl: false,
  showPOILabels: false,
  showTransitLabels: true,
  showRoadLabels: true,
  showAdministrativeLabels: true,
  showWaterLabels: true,
  showLandscapeLabels: true,
  showTransitLines: true,
  showTransitStations: true,
  showBusStops: true,
  showTramStops: true,
  showSubwayStations: true,
  showRailStations: true,
  showBusLines: true,
  showTramLines: true,
  showSubwayLines: true,
  showRailLines: true,
  showRoads: true,
  showBuildings: true,
  showWater: true,
  showParks: true,
  showHighways: true,
  showLocalRoads: true,
  showArterialRoads: true,
  darkMode: false,
  gestureHandling: 'auto',
  disableDoubleClickZoom: false,
  disableScrollWheel: false,
  draggable: true,
  draggableCursor: 'default',
  draggingCursor: 'move',
  keyboardShortcuts: true,
  clickableIcons: false,
  mapLanguage: 'en',
  tilt: 0,
  heading: 0,
}

export default function DevMenuPage() {
  const [activeTab, setActiveTab] = useState<'map' | 'ops'>('ops')
  const [mapSettings, setMapSettings] = useState<MapSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [applied, setApplied] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mapSettings')
    if (saved) {
      try {
        const loaded = JSON.parse(saved)
        setMapSettings({ ...defaultSettings, ...loaded })
      } catch (e) {
        console.error('Error loading map settings:', e)
      }
    }
  }, [])

  // Track changes
  useEffect(() => {
    const saved = localStorage.getItem('mapSettings')
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved)
        const hasDiff = JSON.stringify(mapSettings) !== JSON.stringify(savedSettings)
        setHasChanges(hasDiff)
        setApplied(!hasDiff)
      } catch (e) {
        setHasChanges(true)
        setApplied(false)
      }
    } else {
      setHasChanges(true)
      setApplied(false)
    }
  }, [mapSettings])

  const updateSetting = <K extends keyof MapSettings>(key: K, value: MapSettings[K]) => {
    setMapSettings((prev) => ({ ...prev, [key]: value }))
    setApplied(false)
  }

  const applySettings = () => {
    localStorage.setItem('mapSettings', JSON.stringify(mapSettings))
    setApplied(true)
    setHasChanges(false)

    // Dispatch custom event to notify other components in the same tab
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mapSettingsUpdated'))
    }

    // Show success message
    setTimeout(() => setApplied(false), 2000)
  }

  const resetSettings = () => {
    setMapSettings(defaultSettings)
    setApplied(false)
  }

  const clearStuckLobbies = async () => {
    if (!window.confirm('Delete all games in "lobby" status? (This cannot be undone)')) return
    setLoadingAction('clearLobbies')
    try {
      const q = query(collection(db as any, 'games'), where('status', '==', 'lobby'))
      const snap = await getDocs(q)
      let count = 0
      for (const d of snap.docs) {
        await deleteDoc(d.ref)
        count++
      }
      alert(`Successfully deleted ${count} stuck lobbies.`)
    } catch (e) {
      console.error(e)
      alert('Error clearing lobbies')
    }
    setLoadingAction(null)
  }

  const forceEndActiveGames = async () => {
    if (!window.confirm('Force end all currently active games?')) return
    setLoadingAction('endGames')
    try {
      const snap = await getDocs(collection(db as any, 'games'))
      let count = 0
      for (const d of snap.docs) {
        const data = d.data()
        if (data.status === 'active' || data.status === 'hidingPeriod') {
          await updateDoc(d.ref, { status: 'endGame' })
          count++
        }
      }
      alert(`Forced ${count} active games to end.`)
    } catch (e) {
      console.error(e)
      alert('Error ending games')
    }
    setLoadingAction(null)
  }

  const skipTravelPhase = async () => {
    if (!window.confirm('Fast forward the travel phase for all games currently hiding?')) return
    setLoadingAction('skipTravel')
    try {
      const q = query(collection(db as any, 'games'), where('status', '==', 'hidingPeriod'))
      const snap = await getDocs(q)
      let count = 0
      for (const d of snap.docs) {
        await updateDoc(d.ref, { travelEndsAt: new Date(Date.now() - 1000) })
        count++
      }
      alert(`Skipped travel phase for ${count} games.`)
    } catch (e) {
      console.error(e)
      alert('Error skipping travel phase')
    }
    setLoadingAction(null)
  }

  const nukeAllGames = async () => {
    if (!window.confirm('DANGER: Delete EVERY SINGLE GAME in the database? This is permanent!')) return
    const doubleCheck = window.prompt('Type "NUKE" to confirm complete database wipe:')
    if (doubleCheck !== 'NUKE') return

    setLoadingAction('nuke')
    try {
      const snap = await getDocs(collection(db as any, 'games'))
      let count = 0
      for (const d of snap.docs) {
        await deleteDoc(d.ref)
        count++
      }
      alert(`Nuked ${count} games permanently from orbit.`)
    } catch (e) {
      console.error(e)
      alert('Error nuking database')
    }
    setLoadingAction(null)
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ServerCrash className="w-8 h-8 text-blue-500" />
              Developer Menu
            </h1>
            <p className="text-gray-400">Database Operations & Map Configuration</p>
          </div>
          <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold">
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link
            href="/admin/seed"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center gap-3"
          >
            <Layers className="w-6 h-6" />
            <div>
              <div className="font-bold">Seed Data</div>
              <div className="text-sm opacity-90">Seed Firestore collections</div>
            </div>
          </Link>

          <Link
            href="/admin/questions"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center gap-3"
          >
            <Settings className="w-6 h-6" />
            <div>
              <div className="font-bold">Manage Questions</div>
              <div className="text-sm opacity-90">CRUD operations for questions</div>
            </div>
          </Link>

          <Link
            href="/admin/deck"
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center gap-3"
          >
            <CreditCard className="w-6 h-6" />
            <div>
              <div className="font-bold">Manage Deck</div>
              <div className="text-sm opacity-90">CRUD operations for cards</div>
            </div>
          </Link>

          <Link
            href="/admin/modes"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center gap-3"
          >
            <Layers className="w-6 h-6" />
            <div>
              <div className="font-bold">Game Modes</div>
              <div className="text-sm opacity-90">Configure standard modes</div>
            </div>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-gray-800 p-1 rounded-xl mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('ops')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all ${activeTab === 'ops' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            Game Operations
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-lg transition-all ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'}`}
          >
            Map Customization
          </button>
        </div>

        {activeTab === 'ops' && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <ServerCrash className="text-blue-400" />
              Database Operations
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Clear Stuck Lobbies</h3>
                  <p className="text-gray-400 text-sm mt-1">Deletes all game documents currently stuck in the "lobby" status.</p>
                </div>
                <button
                  onClick={clearStuckLobbies}
                  disabled={!!loadingAction}
                  className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 max-w-fit"
                >
                  <Trash2 className="w-4 h-4" />
                  {loadingAction === 'clearLobbies' ? 'Clearing...' : 'Clear Lobbies'}
                </button>
              </div>

              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Force End Active Games</h3>
                  <p className="text-gray-400 text-sm mt-1">Forces all running games and travel phases straight to the endgame screen.</p>
                </div>
                <button
                  onClick={forceEndActiveGames}
                  disabled={!!loadingAction}
                  className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30 border border-yellow-600/50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 max-w-fit"
                >
                  <LogOut className="w-4 h-4" />
                  {loadingAction === 'endGames' ? 'Ending...' : 'End Active Games'}
                </button>
              </div>

              <div className="bg-gray-900/50 p-5 rounded-xl border border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Skip Travel Phase</h3>
                  <p className="text-gray-400 text-sm mt-1">Fast-forwards the travel countdown so Hiders can be interacted with immediately.</p>
                </div>
                <button
                  onClick={skipTravelPhase}
                  disabled={!!loadingAction}
                  className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-600/50 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 max-w-fit"
                >
                  <FastForward className="w-4 h-4" />
                  {loadingAction === 'skipTravel' ? 'Skipping...' : 'Skip Travel Phase'}
                </button>
              </div>

              <div className="bg-red-900/20 p-5 rounded-xl border border-red-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
                <div>
                  <h3 className="font-bold text-lg text-red-400 flex items-center gap-2">Danger Zone: Nuke Database</h3>
                  <p className="text-red-300 text-sm mt-1 opacity-70">Permanently deletes ALL games from Firestore. There is no undo.</p>
                </div>
                <button
                  onClick={nukeAllGames}
                  disabled={!!loadingAction}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-black tracking-wider transition-colors max-w-fit"
                >
                  {loadingAction === 'nuke' ? 'NUKING...' : 'NUKE GAMES'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Map className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-2xl font-bold">Map Customization</h2>
                  <p className="text-sm text-gray-400">Configure global map aesthetics for all games.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={resetSettings}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={applySettings}
                  disabled={!hasChanges}
                  className={`font-semibold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors ${hasChanges
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : applied
                      ? 'bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Check className="w-4 h-4" />
                  {applied ? 'Applied!' : 'Apply Settings'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Settings Categories */}
              <div className="space-y-8 lg:max-h-[700px] lg:overflow-y-auto pr-4 custom-scrollbar">
                {/* Base Appearance */}
                <details className="group bg-gray-700/50 rounded-lg open:ring-1 open:ring-gray-600 transition-all pb-1" open>
                  <summary className="font-bold text-lg p-4 cursor-pointer hover:bg-gray-600/30 rounded-lg select-none list-none flex justify-between items-center text-blue-400">
                    Base Appearance
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-2 border-t border-gray-600/30 space-y-6">
                    {/* Map Type */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Map Type</label>
                      <select
                        value={mapSettings.mapTypeId}
                        onChange={(e) => updateSetting('mapTypeId', e.target.value as MapSettings['mapTypeId'])}
                        className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-lg outline-none"
                      >
                        <option value="roadmap">Roadmap</option>
                        <option value="satellite">Satellite</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="terrain">Terrain</option>
                      </select>
                    </div>

                    {/* Dark Mode */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mapSettings.darkMode}
                          onChange={(e) => updateSetting('darkMode', e.target.checked)}
                          className="w-5 h-5 rounded accent-blue-500 bg-gray-900 border-gray-700"
                        />
                        <span className="text-sm font-semibold">Dark Mode Map Style</span>
                      </label>
                    </div>

                    {/* Map Language */}
                    <div>
                      <label className="block text-sm font-semibold mb-2">Map Language</label>
                      <select
                        value={mapSettings.mapLanguage}
                        onChange={(e) => updateSetting('mapLanguage', e.target.value)}
                        className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 text-white p-3 rounded-lg outline-none"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="zh">Chinese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="ar">Arabic</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>

                    {/* Transit Layer */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mapSettings.showTransitLayer}
                          onChange={(e) => updateSetting('showTransitLayer', e.target.checked)}
                          className="w-5 h-5 rounded"
                        />
                        <span className="text-sm font-semibold">Show Transit Layer (Subway Lines)</span>
                      </label>
                    </div>

                    {/* Zoom Level */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-blue-300">
                        Default Zoom Level: {mapSettings.zoom}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={mapSettings.zoom}
                        onChange={(e) => updateSetting('zoom', parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>World</span>
                        <span>Buildings</span>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Game Entities (Markers & Circle) */}
                <details className="group bg-gray-700/50 rounded-lg open:ring-1 open:ring-gray-600 transition-all pb-1">
                  <summary className="font-bold text-lg p-4 cursor-pointer hover:bg-gray-600/30 rounded-lg select-none list-none flex justify-between items-center text-green-400">
                    Game Entities (Markers & Circle)
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-2 border-t border-gray-600/30 space-y-6">
                    {/* Marker Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-green-300">Hider Fill</label>
                        <input
                          type="color"
                          value={mapSettings.hiderMarkerColor}
                          onChange={(e) => updateSetting('hiderMarkerColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg cursor-pointer bg-gray-900 border border-gray-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-red-300">Seeker Fill</label>
                        <input
                          type="color"
                          value={mapSettings.seekerMarkerColor}
                          onChange={(e) => updateSetting('seekerMarkerColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg cursor-pointer bg-gray-900 border border-gray-700 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-green-300">Hider Border</label>
                        <input
                          type="color"
                          value={mapSettings.hiderMarkerStrokeColor}
                          onChange={(e) => updateSetting('hiderMarkerStrokeColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg cursor-pointer bg-gray-900 border border-gray-700 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-red-300">Seeker Border</label>
                        <input
                          type="color"
                          value={mapSettings.seekerMarkerStrokeColor}
                          onChange={(e) => updateSetting('seekerMarkerStrokeColor', e.target.value)}
                          className="w-full h-10 p-1 rounded-lg cursor-pointer bg-gray-900 border border-gray-700 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Hider Size: {mapSettings.hiderMarkerSize}
                        </label>
                        <input
                          type="range" min="3" max="15" step="1"
                          value={mapSettings.hiderMarkerSize}
                          onChange={(e) => updateSetting('hiderMarkerSize', parseInt(e.target.value))}
                          className="w-full accent-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Seeker Size: {mapSettings.seekerMarkerSize}
                        </label>
                        <input
                          type="range" min="3" max="15" step="1"
                          value={mapSettings.seekerMarkerSize}
                          onChange={(e) => updateSetting('seekerMarkerSize', parseInt(e.target.value))}
                          className="w-full accent-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 mt-2">
                          Hider Border px: {mapSettings.hiderMarkerStrokeWeight}
                        </label>
                        <input
                          type="range" min="0" max="5" step="1"
                          value={mapSettings.hiderMarkerStrokeWeight}
                          onChange={(e) => updateSetting('hiderMarkerStrokeWeight', parseInt(e.target.value))}
                          className="w-full accent-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1 mt-2">
                          Seeker Border px: {mapSettings.seekerMarkerStrokeWeight}
                        </label>
                        <input
                          type="range" min="0" max="5" step="1"
                          value={mapSettings.seekerMarkerStrokeWeight}
                          onChange={(e) => updateSetting('seekerMarkerStrokeWeight', parseInt(e.target.value))}
                          className="w-full accent-red-500"
                        />
                      </div>
                    </div>

                    {/* Circle */}
                    <div className="pt-4 border-t border-gray-600/30">
                      <h4 className="font-semibold mb-4 text-orange-400">Fixed Hiding Zone Overlay</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">Zone Fill Color</label>
                          <input
                            type="color"
                            value={mapSettings.circleColor}
                            onChange={(e) => updateSetting('circleColor', e.target.value)}
                            className="w-full h-10 p-1 rounded-lg cursor-pointer bg-gray-900 border border-gray-700 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">Zone Border Color</label>
                          <input
                            type="color"
                            value={mapSettings.circleStrokeColor}
                            onChange={(e) => updateSetting('circleStrokeColor', e.target.value)}
                            className="w-full h-10 p-1 rounded-lg cursor-pointer bg-gray-900 border border-gray-700 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Fill Opacity: {(mapSettings.circleOpacity * 100).toFixed(0)}%
                          </label>
                          <input type="range" min="0" max="1" step="0.05"
                            value={mapSettings.circleOpacity}
                            onChange={(e) => updateSetting('circleOpacity', parseFloat(e.target.value))}
                            className="w-full accent-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Border Opacity: {(mapSettings.circleStrokeOpacity * 100).toFixed(0)}%
                          </label>
                          <input type="range" min="0" max="1" step="0.05"
                            value={mapSettings.circleStrokeOpacity}
                            onChange={(e) => updateSetting('circleStrokeOpacity', parseFloat(e.target.value))}
                            className="w-full accent-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">
                            Border Width: {mapSettings.circleStrokeWeight}px
                          </label>
                          <input type="range" min="0" max="10" step="1"
                            value={mapSettings.circleStrokeWeight}
                            onChange={(e) => updateSetting('circleStrokeWeight', parseInt(e.target.value))}
                            className="w-full accent-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </details>

                {/* Interactions & Controls */}
                <details className="group bg-gray-700/50 rounded-lg open:ring-1 open:ring-gray-600 transition-all pb-1">
                  <summary className="font-bold text-lg p-4 cursor-pointer hover:bg-gray-600/30 rounded-lg select-none list-none flex justify-between items-center text-purple-400">
                    Interactions & Controls
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-2 border-t border-gray-600/30 space-y-6">
                    {/* Zoom Limits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Minimum Zoom: {mapSettings.minZoom}
                        </label>
                        <input
                          type="range" min="1" max="10" step="1"
                          value={mapSettings.minZoom}
                          onChange={(e) => updateSetting('minZoom', parseInt(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Maximum Zoom: {mapSettings.maxZoom}
                        </label>
                        <input
                          type="range" min="10" max="22" step="1"
                          value={mapSettings.maxZoom}
                          onChange={(e) => updateSetting('maxZoom', parseInt(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                    </div>

                    {/* Map Rotation & Tilt */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-600/30">
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Tilt: {mapSettings.tilt}°
                        </label>
                        <input
                          type="range" min="0" max="60" step="1"
                          value={mapSettings.tilt}
                          onChange={(e) => updateSetting('tilt', parseInt(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Heading: {mapSettings.heading}°
                        </label>
                        <input
                          type="range" min="0" max="360" step="1"
                          value={mapSettings.heading}
                          onChange={(e) => updateSetting('heading', parseInt(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                      </div>
                    </div>

                    {/* Behaviors */}
                    <div className="pt-4 border-t border-gray-600/30">
                      <label className="block text-sm font-semibold mb-2 text-purple-300">Gesture Handling</label>
                      <select
                        value={mapSettings.gestureHandling}
                        onChange={(e) => updateSetting('gestureHandling', e.target.value as MapSettings['gestureHandling'])}
                        className="w-full bg-gray-900 border border-gray-700 text-white p-2 rounded-lg outline-none mb-4"
                      >
                        <option value="auto">Auto (default)</option>
                        <option value="greedy">Greedy (always zoom)</option>
                        <option value="none">None (disabled)</option>
                        <option value="cooperative">Cooperative (Ctrl+scroll)</option>
                      </select>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.disableDoubleClickZoom} onChange={(e) => updateSetting('disableDoubleClickZoom', e.target.checked)} className="w-5 h-5 rounded accent-purple-500 disabled:opacity-50" />
                          <span className="text-sm font-semibold">Disable Double-Click Zoom</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.disableScrollWheel} onChange={(e) => updateSetting('disableScrollWheel', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Disable Scroll Wheel</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.draggable} onChange={(e) => updateSetting('draggable', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Enable Mouse Dragging</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.keyboardShortcuts} onChange={(e) => updateSetting('keyboardShortcuts', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Allow Key Shortcuts</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.clickableIcons} onChange={(e) => updateSetting('clickableIcons', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Clickable Map POIs</span>
                        </label>
                      </div>
                    </div>

                    {/* UI Toggles */}
                    <div className="pt-4 border-t border-gray-600/30">
                      <h4 className="font-semibold mb-3 text-purple-300">Visible Controls</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.showZoomControl} onChange={(e) => updateSetting('showZoomControl', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Zoom Buttons</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.showFullscreenControl} onChange={(e) => updateSetting('showFullscreenControl', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Fullscreen Button</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.showStreetViewControl} onChange={(e) => updateSetting('showStreetViewControl', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Street View Pegman</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={mapSettings.showMapTypeControl} onChange={(e) => updateSetting('showMapTypeControl', e.target.checked)} className="w-5 h-5 rounded accent-purple-500" />
                          <span className="text-sm font-semibold">Map Type Switcher</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </details>


                {/* Map Labels */}
                <details className="group bg-gray-700/50 rounded-lg open:ring-1 open:ring-gray-600 transition-all pb-1">
                  <summary className="font-bold text-lg p-4 cursor-pointer hover:bg-gray-600/30 rounded-lg select-none list-none flex justify-between items-center text-yellow-400">
                    Map Labels & Geography
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-2 border-t border-gray-600/30 space-y-4">
                    <div className="grid grid-cols-1 gap-3 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showRoadLabels} onChange={(e) => updateSetting('showRoadLabels', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">Road Labels</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showAdministrativeLabels} onChange={(e) => updateSetting('showAdministrativeLabels', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">City & Country Text</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showWaterLabels} onChange={(e) => updateSetting('showWaterLabels', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">Water Labels (Rivers/Lakes)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showLandscapeLabels} onChange={(e) => updateSetting('showLandscapeLabels', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">Landscape Labels (Parks)</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showPOILabels} onChange={(e) => updateSetting('showPOILabels', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">Points of Interest POIs</span>
                      </label>
                    </div>

                    <h4 className="font-semibold text-yellow-300 pt-2 border-t border-gray-600/30">Geographic Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showWater} onChange={(e) => updateSetting('showWater', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">Water Bodies</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={mapSettings.showParks} onChange={(e) => updateSetting('showParks', e.target.checked)} className="w-5 h-5 rounded accent-yellow-500" />
                        <span className="text-sm font-semibold">Parks & Greenery</span>
                      </label>
                    </div>
                  </div>
                </details>

                {/* Transit & Infrastructure */}
                <details className="group bg-gray-700/50 rounded-lg open:ring-1 open:ring-gray-600 transition-all pb-1">
                  <summary className="font-bold text-lg p-4 cursor-pointer hover:bg-gray-600/30 rounded-lg select-none list-none flex justify-between items-center text-cyan-400">
                    Transit & Infrastructure
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="p-4 pt-2 border-t border-gray-600/30 space-y-4">
                    <h4 className="font-semibold text-cyan-300">Transit Links</h4>
                    <div className="grid grid-cols-1 gap-2 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input type="checkbox" checked={mapSettings.showTransitLines} onChange={(e) => updateSetting('showTransitLines', e.target.checked)} className="w-5 h-5 rounded accent-cyan-500" />
                        <span className="text-sm font-semibold text-cyan-100">Show Transit Lines</span>
                      </label>
                      <div className="pl-6 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitLines} checked={mapSettings.showSubwayLines} onChange={(e) => updateSetting('showSubwayLines', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Subway</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitLines} checked={mapSettings.showRailLines} onChange={(e) => updateSetting('showRailLines', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Rail</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitLines} checked={mapSettings.showBusLines} onChange={(e) => updateSetting('showBusLines', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Bus</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitLines} checked={mapSettings.showTramLines} onChange={(e) => updateSetting('showTramLines', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Tram</span>
                        </label>
                      </div>
                    </div>

                    <h4 className="font-semibold text-cyan-300 pt-2 border-t border-gray-600/30">Transit Stations</h4>
                    <div className="grid grid-cols-1 gap-2 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input type="checkbox" checked={mapSettings.showTransitStations} onChange={(e) => updateSetting('showTransitStations', e.target.checked)} className="w-5 h-5 rounded accent-cyan-500" />
                        <span className="text-sm font-semibold text-cyan-100">Show Transit Stops/Stations</span>
                      </label>
                      <div className="pl-6 grid grid-cols-2 gap-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitStations} checked={mapSettings.showSubwayStations} onChange={(e) => updateSetting('showSubwayStations', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Subway</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitStations} checked={mapSettings.showRailStations} onChange={(e) => updateSetting('showRailStations', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Rail</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitStations} checked={mapSettings.showBusStops} onChange={(e) => updateSetting('showBusStops', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Bus</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showTransitStations} checked={mapSettings.showTramStops} onChange={(e) => updateSetting('showTramStops', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Tram</span>
                        </label>
                      </div>
                    </div>

                    <h4 className="font-semibold text-cyan-300 pt-2 border-t border-gray-600/30">Roads & Buildings</h4>
                    <div className="grid grid-cols-1 gap-2 bg-gray-900/40 p-3 rounded-lg border border-gray-700">
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input type="checkbox" checked={mapSettings.showRoads} onChange={(e) => updateSetting('showRoads', e.target.checked)} className="w-5 h-5 rounded accent-cyan-500" />
                        <span className="text-sm font-semibold text-cyan-100">Show Roads</span>
                      </label>
                      <div className="pl-6 grid grid-cols-1 gap-2 mb-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showRoads} checked={mapSettings.showHighways} onChange={(e) => updateSetting('showHighways', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showRoads ? 'text-gray-500' : ''}`}>Highways</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showRoads} checked={mapSettings.showArterialRoads} onChange={(e) => updateSetting('showArterialRoads', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showRoads ? 'text-gray-500' : ''}`}>Arterial Roads (Main Streets)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" disabled={!mapSettings.showRoads} checked={mapSettings.showLocalRoads} onChange={(e) => updateSetting('showLocalRoads', e.target.checked)} className="w-4 h-4 rounded accent-cyan-500 disabled:opacity-50" />
                          <span className={`text-sm ${!mapSettings.showRoads ? 'text-gray-500' : ''}`}>Local Roads (Residential)</span>
                        </label>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer border-t border-gray-600/30 pt-3 mt-1">
                        <input type="checkbox" checked={mapSettings.showBuildings} onChange={(e) => updateSetting('showBuildings', e.target.checked)} className="w-5 h-5 rounded accent-cyan-500" />
                        <span className="text-sm font-semibold">Show Buildings (3D Footprints)</span>
                      </label>
                    </div>

                  </div>
                </details>

              </div> {/* End of the left scrolling column */}

              {/* Right Column: Live Map Preview */}
              <div className="hidden lg:block relative rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl bg-gray-900 sticky top-6 h-[700px] ring-4 ring-gray-800/50">
                <GoogleMapWrapper
                  center={{ lat: 48.8566, lng: 2.3522 }} // Paris center for preview
                  {...mapSettings}
                  showHiderLocation={true}
                  hiderLocation={{ lat: 48.8566, lng: 2.3522 }} // Center marker
                  seekerLocations={{ 'dummy': { lat: 48.8550, lng: 2.3500 } }} // Dummy seeker nearby
                  fixedCircleCenter={{ lat: 48.8566, lng: 2.3522 }}
                  gameArea={{
                    center: { lat: 48.8566, lng: 2.3522 },
                    radiusMeters: mapSettings.circleRadiusMeters || 1000
                  }}
                />

                {/* Overlay indicating it's a preview */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
                  <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg border border-white/10 shadow-lg flex items-center gap-2">
                    <Map className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-bold text-xs tracking-widest uppercase">Live Preview</div>
                      <div className="text-[10px] text-gray-300">Paris, France (Simulated)</div>
                    </div>
                  </div>
                </div>

                {hasChanges && (
                  <div className="absolute bottom-4 left-4 right-4 bg-yellow-900/90 backdrop-blur-md border border-yellow-700 rounded-lg p-3 z-10 shadow-lg flex items-center justify-between transition-all animate-in slide-in-from-bottom-2">
                    <p className="text-sm text-yellow-200 font-semibold flex items-center gap-2">
                      <span>⚠️</span> Unsaved Map Changes
                    </p>
                    <button onClick={applySettings} className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-1.5 px-4 rounded-md text-sm transition-colors shadow-md">
                      Save Now
                    </button>
                  </div>
                )}

                {applied && !hasChanges && (
                  <div className="absolute bottom-4 left-4 right-4 text-center bg-green-900/90 backdrop-blur-md border border-green-700 rounded-lg p-3 z-10 shadow-lg transition-all animate-in slide-in-from-bottom-2">
                    <p className="text-sm text-green-200 font-semibold flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Settings Applied Locally
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
