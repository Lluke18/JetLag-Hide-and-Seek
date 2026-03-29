'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Layers, Save, ArrowLeft, Loader2, RotateCcw, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { PresetMode, PresetConfig } from '@/types/game'

const DEFAULT_PRESET_CONFIGS: Record<PresetMode, PresetConfig> = {
    small: { label: 'Small', desc: '4 hrs', hours: 4, radius: 402, travelMinutes: 30 },
    medium: { label: 'Medium', desc: '8 hrs', hours: 8, radius: 402, travelMinutes: 60 },
    large: { label: 'Large', desc: '24 hrs', hours: 24, radius: 805, travelMinutes: 120 },
    test: { label: 'Test', desc: '15s / 5km', hours: 0.5, radius: 5000, travelMinutes: 0.25 },
}

export default function ManageGameModesPage() {
    const [configs, setConfigs] = useState<Record<PresetMode, PresetConfig>>(DEFAULT_PRESET_CONFIGS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        const fetchConfigs = async () => {
            if (!db) return
            try {
                const snap = await getDoc(doc(db, 'settings', 'gameModes'))
                if (snap.exists()) {
                    setConfigs({ ...DEFAULT_PRESET_CONFIGS, ...snap.data() as Record<PresetMode, PresetConfig> })
                }
            } catch (err) {
                console.error('Failed to load configs:', err)
                setMessage('Failed to load configurations')
            } finally {
                setLoading(false)
            }
        }
        fetchConfigs()
    }, [])

    const handleSave = async () => {
        if (!db) return
        setSaving(true)
        setMessage('')
        try {
            await setDoc(doc(db, 'settings', 'gameModes'), configs)
            setMessage('Game modes saved successfully!')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            console.error('Error saving configs:', err)
            setMessage('Error saving configurations.')
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        if (confirm('Are you sure you want to reset to default values?')) {
            setConfigs(DEFAULT_PRESET_CONFIGS)
        }
    }

    const handleAddMode = () => {
        const defaultModeId = `mode_${Date.now()}`
        setConfigs(prev => ({
            ...prev,
            [defaultModeId]: {
                label: 'New Mode',
                desc: '1 hr',
                hours: 1,
                radius: 400,
                travelMinutes: 15
            }
        }))
    }

    const handleRemoveMode = (modeToRemove: string) => {
        if (confirm(`Are you sure you want to delete the mode: ${configs[modeToRemove]?.label || modeToRemove}?`)) {
            setConfigs(prev => {
                const newConfigs = { ...prev }
                delete newConfigs[modeToRemove]
                return newConfigs
            })
        }
    }

    const updateConfig = (mode: PresetMode, field: keyof PresetConfig, value: string | number) => {
        setConfigs(prev => {
            const updatedConfig = { ...prev[mode], [field]: value }

            // Auto-update desc if hours change
            if (field === 'hours') {
                updatedConfig.desc = `${value} hrs`
            }

            return {
                ...prev,
                [mode]: updatedConfig
            }
        })
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-gray-900 text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="fixed inset-0 overflow-y-auto bg-gray-900 text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Layers className="w-8 h-8 text-blue-500" />
                            Manage Game Modes
                        </h1>
                        <p className="text-gray-400">Configure distance, duration, and travel times for preset game types.</p>
                    </div>
                    <Link href="/admin/dev" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Developer Menu
                    </Link>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg font-bold ${message.includes('success') ? 'bg-green-600/20 text-green-400 border border-green-600' : 'bg-red-600/20 text-red-400 border border-red-600'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-8">
                    {Object.keys(configs).map((mode, index) => {
                        const gradientOptions = [
                            'from-green-500 to-green-800',
                            'from-blue-500 to-blue-800',
                            'from-purple-500 to-purple-800',
                            'from-red-500 to-red-800',
                            'from-orange-500 to-orange-800',
                            'from-yellow-500 to-yellow-800',
                            'from-teal-500 to-teal-800'
                        ]
                        const modeColor = gradientOptions[index % gradientOptions.length]

                        return (
                            <div key={mode} className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-xl flex flex-col md:flex-row gap-8 items-start relative">

                                {/* Remove Mode Button */}
                                <button
                                    onClick={() => handleRemoveMode(mode)}
                                    className="absolute right-4 top-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors z-10"
                                    title="Remove Mode"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>

                                <div className="flex-shrink-0 w-[140px] h-[186px] rounded-xl relative overflow-hidden flex flex-col items-center p-4 text-center shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform mt-2">
                                    <div className={`absolute inset-0 bg-gradient-to-b ${modeColor} opacity-100`}></div>
                                    <div className="relative z-10 flex flex-col h-full items-center justify-between w-full">
                                        <div className="bg-black/40 text-white/90 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                            MODE
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                                            <Layers className="w-12 h-12 text-white filter drop-shadow-md mb-2" />
                                            <span className="font-black text-white leading-tight drop-shadow-md text-xl capitalize line-clamp-2">
                                                {configs[mode].label}
                                            </span>
                                        </div>
                                        <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-inner w-full">
                                            <span className="text-white text-xs font-bold leading-none">{configs[mode].desc}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 w-full pt-2">
                                    <div className="mb-6 border-b border-gray-700 pb-2">
                                        <input
                                            type="text"
                                            className="text-2xl font-bold capitalize text-white bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 -ml-2 w-full max-w-sm"
                                            value={configs[mode].label}
                                            onChange={e => updateConfig(mode, 'label', e.target.value)}
                                            placeholder="Mode Name"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Duration */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-300">
                                                Duration (Hours)
                                            </label>
                                            <input
                                                type="number"
                                                min="0.5"
                                                step="0.5"
                                                className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-lg transition-colors outline-none"
                                                value={configs[mode].hours}
                                                onChange={e => updateConfig(mode, 'hours', parseFloat(e.target.value))}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Controls the hiding duration limit.</p>
                                        </div>

                                        {/* Map Radius */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-300">
                                                Radius (Kilometers)
                                            </label>
                                            <input
                                                type="number"
                                                min="0.1"
                                                step="0.1"
                                                className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-lg transition-colors outline-none"
                                                value={configs[mode].radius / 1000}
                                                onChange={e => updateConfig(mode, 'radius', Math.round(parseFloat(e.target.value) * 1000) || 0)}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Size of the entire game enclosing boundary.</p>
                                        </div>

                                        {/* Travel Time */}
                                        <div>
                                            <label className="block text-sm font-semibold mb-2 text-gray-300">
                                                Travel Time (Mins)
                                            </label>
                                            <input
                                                type="number"
                                                min="5"
                                                step="5"
                                                className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-lg transition-colors outline-none"
                                                value={configs[mode].travelMinutes}
                                                onChange={e => updateConfig(mode, 'travelMinutes', parseInt(e.target.value))}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Time allowed for the hider to travel.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Reset to Defaults
                    </button>

                    <button
                        onClick={handleAddMode}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Mode
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Saving...' : 'Save Configurations'}
                    </button>
                </div>
            </div>
        </div>
    )
}
