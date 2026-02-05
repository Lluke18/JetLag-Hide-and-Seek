'use client'

import { useState, useEffect } from 'react'
import { Settings, Map, Palette, Layers, Check, RotateCcw, CreditCard } from 'lucide-react'
import Link from 'next/link'

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
  const [mapSettings, setMapSettings] = useState<MapSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [applied, setApplied] = useState(false)

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

  return (
    <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Developer Menu</h1>
          <p className="text-gray-400">Customize map settings and manage app configuration</p>
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
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Map className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">Map Customization</h2>
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

          <div className="space-y-6">
            {/* Map Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Map Type</label>
              <select
                value={mapSettings.mapTypeId}
                onChange={(e) => updateSetting('mapTypeId', e.target.value as MapSettings['mapTypeId'])}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
              >
                <option value="roadmap">Roadmap</option>
                <option value="satellite">Satellite</option>
                <option value="hybrid">Hybrid</option>
                <option value="terrain">Terrain</option>
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
              <label className="block text-sm font-semibold mb-2">
                Default Zoom Level: {mapSettings.zoom}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={mapSettings.zoom}
                onChange={(e) => updateSetting('zoom', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>World</span>
                <span>Buildings</span>
              </div>
            </div>

            {/* Marker Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Hider Marker Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={mapSettings.hiderMarkerColor}
                    onChange={(e) => updateSetting('hiderMarkerColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={mapSettings.hiderMarkerColor}
                    onChange={(e) => updateSetting('hiderMarkerColor', e.target.value)}
                    className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
                    placeholder="#10b981"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Seeker Marker Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={mapSettings.seekerMarkerColor}
                    onChange={(e) => updateSetting('seekerMarkerColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={mapSettings.seekerMarkerColor}
                    onChange={(e) => updateSetting('seekerMarkerColor', e.target.value)}
                    className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
                    placeholder="#ef4444"
                  />
                </div>
              </div>
            </div>

            {/* Circle (Hiding Zone) */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Hiding Zone Circle</h3>

              <div>
                <label className="block text-sm font-semibold mb-2">Fill Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={mapSettings.circleColor}
                    onChange={(e) => updateSetting('circleColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={mapSettings.circleColor}
                    onChange={(e) => updateSetting('circleColor', e.target.value)}
                    className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
                    placeholder="#ff0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Border Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={mapSettings.circleStrokeColor}
                    onChange={(e) => updateSetting('circleStrokeColor', e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={mapSettings.circleStrokeColor}
                    onChange={(e) => updateSetting('circleStrokeColor', e.target.value)}
                    className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
                    placeholder="#ff0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Fill Opacity: {(mapSettings.circleOpacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mapSettings.circleOpacity}
                  onChange={(e) => updateSetting('circleOpacity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Border Opacity: {(mapSettings.circleStrokeOpacity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={mapSettings.circleStrokeOpacity}
                  onChange={(e) => updateSetting('circleStrokeOpacity', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Border Width: {mapSettings.circleStrokeWeight}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={mapSettings.circleStrokeWeight}
                  onChange={(e) => updateSetting('circleStrokeWeight', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Circle Radius: {mapSettings.circleRadiusMeters}m
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={mapSettings.circleRadiusMeters}
                  onChange={(e) => updateSetting('circleRadiusMeters', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>100m</span>
                  <span>2000m</span>
                </div>
              </div>
            </div>

            {/* Marker Settings */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Marker Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Hider Marker Size: {mapSettings.hiderMarkerSize}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="1"
                    value={mapSettings.hiderMarkerSize}
                    onChange={(e) => updateSetting('hiderMarkerSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Seeker Marker Size: {mapSettings.seekerMarkerSize}
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="1"
                    value={mapSettings.seekerMarkerSize}
                    onChange={(e) => updateSetting('seekerMarkerSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Hider Marker Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={mapSettings.hiderMarkerStrokeColor}
                      onChange={(e) => updateSetting('hiderMarkerStrokeColor', e.target.value)}
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={mapSettings.hiderMarkerStrokeColor}
                      onChange={(e) => updateSetting('hiderMarkerStrokeColor', e.target.value)}
                      className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Seeker Marker Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={mapSettings.seekerMarkerStrokeColor}
                      onChange={(e) => updateSetting('seekerMarkerStrokeColor', e.target.value)}
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={mapSettings.seekerMarkerStrokeColor}
                      onChange={(e) => updateSetting('seekerMarkerStrokeColor', e.target.value)}
                      className="flex-1 bg-gray-700 text-white p-2 rounded-lg"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Hider Border Width: {mapSettings.hiderMarkerStrokeWeight}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={mapSettings.hiderMarkerStrokeWeight}
                    onChange={(e) => updateSetting('hiderMarkerStrokeWeight', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Seeker Border Width: {mapSettings.seekerMarkerStrokeWeight}px
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={mapSettings.seekerMarkerStrokeWeight}
                    onChange={(e) => updateSetting('seekerMarkerStrokeWeight', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Zoom Limits */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Zoom Limits</h3>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Minimum Zoom: {mapSettings.minZoom}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={mapSettings.minZoom}
                  onChange={(e) => updateSetting('minZoom', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Maximum Zoom: {mapSettings.maxZoom}
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  step="1"
                  value={mapSettings.maxZoom}
                  onChange={(e) => updateSetting('maxZoom', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Gesture & Interaction */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold">Gesture & Interaction</h3>

              <div>
                <label className="block text-sm font-semibold mb-2">Gesture Handling</label>
                <select
                  value={mapSettings.gestureHandling}
                  onChange={(e) => updateSetting('gestureHandling', e.target.value as MapSettings['gestureHandling'])}
                  className="w-full bg-gray-700 text-white p-2 rounded-lg"
                >
                  <option value="auto">Auto (default)</option>
                  <option value="greedy">Greedy (always zoom)</option>
                  <option value="none">None (disabled)</option>
                  <option value="cooperative">Cooperative (Ctrl+scroll)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Controls how map responds to scroll gestures
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.disableDoubleClickZoom}
                    onChange={(e) => updateSetting('disableDoubleClickZoom', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Disable Double-Click Zoom</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.disableScrollWheel}
                    onChange={(e) => updateSetting('disableScrollWheel', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Disable Scroll Wheel Zoom</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.draggable}
                    onChange={(e) => updateSetting('draggable', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Enable Map Dragging</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.keyboardShortcuts}
                    onChange={(e) => updateSetting('keyboardShortcuts', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Enable Keyboard Shortcuts</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.clickableIcons}
                    onChange={(e) => updateSetting('clickableIcons', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Clickable Map Icons</span>
                </label>
              </div>
            </div>

            {/* Map Rotation & Tilt */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Map Rotation & Tilt</h3>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Tilt: {mapSettings.tilt}° (0-45)
                </label>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="1"
                  value={mapSettings.tilt}
                  onChange={(e) => updateSetting('tilt', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Map tilt angle (3D view)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Heading: {mapSettings.heading}° (0-360)
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="1"
                  value={mapSettings.heading}
                  onChange={(e) => updateSetting('heading', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Map rotation (compass direction)
                </p>
              </div>
            </div>

            {/* Map Language */}
            <div>
              <label className="block text-sm font-semibold mb-2">Map Language</label>
              <select
                value={mapSettings.mapLanguage}
                onChange={(e) => updateSetting('mapLanguage', e.target.value)}
                className="w-full bg-gray-700 text-white p-3 rounded-lg"
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

            {/* Map Controls */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold">Map Controls</h3>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showZoomControl}
                    onChange={(e) => updateSetting('showZoomControl', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Zoom Control</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showMapTypeControl}
                    onChange={(e) => updateSetting('showMapTypeControl', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Map Type Control</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showStreetViewControl}
                    onChange={(e) => updateSetting('showStreetViewControl', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Street View Control</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showFullscreenControl}
                    onChange={(e) => updateSetting('showFullscreenControl', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Fullscreen Control</span>
                </label>
              </div>
            </div>

            {/* Map Labels */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold">Map Labels</h3>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showPOILabels}
                    onChange={(e) => updateSetting('showPOILabels', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Points of Interest (POI) Labels</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showTransitLabels}
                    onChange={(e) => updateSetting('showTransitLabels', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Transit Labels</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showRoadLabels}
                    onChange={(e) => updateSetting('showRoadLabels', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Road Labels</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showAdministrativeLabels}
                    onChange={(e) => updateSetting('showAdministrativeLabels', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Administrative Labels (City/Country Names)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showWaterLabels}
                    onChange={(e) => updateSetting('showWaterLabels', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Water Labels (Rivers, Lakes, Oceans)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showLandscapeLabels}
                    onChange={(e) => updateSetting('showLandscapeLabels', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Landscape Labels (Mountains, Parks)</span>
                </label>
              </div>
            </div>

            {/* Transit System */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold">Transit System</h3>

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Transit Lines</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.showTransitLines}
                      onChange={(e) => updateSetting('showTransitLines', e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm font-semibold">Show All Transit Lines</span>
                  </label>

                  <div className="ml-8 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showSubwayLines}
                        onChange={(e) => updateSetting('showSubwayLines', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitLines}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Subway/Metro Lines</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showRailLines}
                        onChange={(e) => updateSetting('showRailLines', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitLines}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Rail Lines</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showBusLines}
                        onChange={(e) => updateSetting('showBusLines', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitLines}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Bus Lines</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showTramLines}
                        onChange={(e) => updateSetting('showTramLines', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitLines}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitLines ? 'text-gray-500' : ''}`}>Tram Lines</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Transit Stops & Stations</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.showTransitStations}
                      onChange={(e) => updateSetting('showTransitStations', e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-sm font-semibold">Show All Transit Stops & Stations</span>
                  </label>

                  <div className="ml-8 space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showSubwayStations}
                        onChange={(e) => updateSetting('showSubwayStations', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitStations}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Subway/Metro Stations</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showRailStations}
                        onChange={(e) => updateSetting('showRailStations', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitStations}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Rail Stations</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showBusStops}
                        onChange={(e) => updateSetting('showBusStops', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitStations}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Bus Stops</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mapSettings.showTramStops}
                        onChange={(e) => updateSetting('showTramStops', e.target.checked)}
                        className="w-5 h-5 rounded"
                        disabled={!mapSettings.showTransitStations}
                      />
                      <span className={`text-sm font-semibold ${!mapSettings.showTransitStations ? 'text-gray-500' : ''}`}>Tram Stops</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mt-4">
                <p className="text-xs text-blue-200">
                  <strong>Note:</strong> To show only specific transit lines (e.g., only Line 1 and Line 2), you would need to manually add custom polylines in the code. The Google Maps API doesn't support filtering specific line numbers through styles.
                </p>
              </div>
            </div>

            {/* Map Features */}
            <div className="bg-gray-700/50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold">Map Features</h3>

              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showRoads}
                    onChange={(e) => updateSetting('showRoads', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Show All Roads</span>
                </label>

                <div className="ml-8 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.showHighways}
                      onChange={(e) => updateSetting('showHighways', e.target.checked)}
                      className="w-5 h-5 rounded"
                      disabled={!mapSettings.showRoads}
                    />
                    <span className={`text-sm font-semibold ${!mapSettings.showRoads ? 'text-gray-500' : ''}`}>Highways</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.showArterialRoads}
                      onChange={(e) => updateSetting('showArterialRoads', e.target.checked)}
                      className="w-5 h-5 rounded"
                      disabled={!mapSettings.showRoads}
                    />
                    <span className={`text-sm font-semibold ${!mapSettings.showRoads ? 'text-gray-500' : ''}`}>Arterial Roads</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapSettings.showLocalRoads}
                      onChange={(e) => updateSetting('showLocalRoads', e.target.checked)}
                      className="w-5 h-5 rounded"
                      disabled={!mapSettings.showRoads}
                    />
                    <span className={`text-sm font-semibold ${!mapSettings.showRoads ? 'text-gray-500' : ''}`}>Local Roads</span>
                  </label>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showBuildings}
                    onChange={(e) => updateSetting('showBuildings', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Show Buildings</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showWater}
                    onChange={(e) => updateSetting('showWater', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Show Water Bodies</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mapSettings.showParks}
                    onChange={(e) => updateSetting('showParks', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm font-semibold">Show Parks & Green Spaces</span>
                </label>
              </div>
            </div>

            {/* Dark Mode */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapSettings.darkMode}
                  onChange={(e) => updateSetting('darkMode', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-sm font-semibold">Dark Mode Map Style</span>
              </label>
            </div>

            {/* Preview */}
            <div className="bg-gray-700 rounded-lg p-4 mt-6">
              <h3 className="text-lg font-semibold mb-3">Settings Preview</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: mapSettings.hiderMarkerColor }}
                  />
                  <span>Hider Marker</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: mapSettings.seekerMarkerColor }}
                  />
                  <span>Seeker Marker</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border-2"
                    style={{
                      backgroundColor: mapSettings.circleColor,
                      opacity: mapSettings.circleOpacity,
                    }}
                  />
                  <span>Hiding Zone Circle</span>
                </div>
              </div>
            </div>

            {hasChanges && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mt-6">
                <p className="text-sm text-yellow-200">
                  <strong>⚠️ Unsaved Changes:</strong> Click "Apply Settings" to save your changes. Settings will be applied to all new game sessions.
                </p>
              </div>
            )}

            {applied && (
              <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-200">
                  <strong>✓ Settings Applied!</strong> Your map customizations have been saved and will be used in games.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
