'use client'

import { useState, useEffect, useRef } from 'react'
import { doc, updateDoc, onSnapshot, collection, getDocs, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Game, Player, CustomGameSettings, Question } from '@/types/game'
import { Users, Crown, Check, X, Copy, CheckCircle2, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const ALL_CATEGORIES = ['Matching', 'Measuring', 'Radar', 'Thermometer', 'Photo', 'Tentacle'] as const

import { PresetMode, PresetConfig } from '@/types/game'

const DEFAULT_PRESET_CONFIGS: Record<PresetMode, PresetConfig> = {
    small: { label: 'Small', desc: '4 hrs', hours: 4, radius: 402, travelMinutes: 30 },
    medium: { label: 'Medium', desc: '8 hrs', hours: 8, radius: 402, travelMinutes: 60 },
    large: { label: 'Large', desc: '24 hrs', hours: 24, radius: 805, travelMinutes: 120 },
    test: { label: 'Test', desc: '15s / 5km', hours: 0.5, radius: 5000, travelMinutes: 0.25 },
}

interface GameLobbyProps {
    game: Game
    playerName: string
}

export default function GameLobby({ game, playerName }: GameLobbyProps) {
    const [currentGame, setCurrentGame] = useState<Game>(game)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [copied, setCopied] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [allQuestions, setAllQuestions] = useState<Question[]>([])
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
    const [presetConfigs, setPresetConfigs] = useState(DEFAULT_PRESET_CONFIGS)
    const countdownRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch dynamic preset configs from Firestore
    useEffect(() => {
        if (!db) return
        const fetchModes = async () => {
            try {
                const snap = await getDoc(doc(db!, 'settings', 'gameModes'))
                if (snap.exists()) {
                    setPresetConfigs({ ...DEFAULT_PRESET_CONFIGS, ...snap.data() })
                }
            } catch (err) {
                console.error("Error fetching game modes:", err)
            }
        }
        fetchModes()
    }, [])

    const uid = auth?.currentUser?.uid
    const players = currentGame.players || {}
    const currentPlayer = uid ? players[uid] : null
    const isCreator = currentPlayer?.isCreator || false
    const playerList = Object.values(players)
    const allReady = playerList.length >= 2 && playerList.every(p => p.ready)
    const hiderCount = playerList.filter(p => p.role === 'hider').length
    const isCustom = currentGame.gameSize === 'custom'

    const customSettings: CustomGameSettings = currentGame.customSettings || {
        durationHours: 1,
        mapRadiusMeters: 402,
        enabledCategories: [...ALL_CATEGORIES],
    }

    // Load all questions from Firestore
    useEffect(() => {
        if (!db) return
        const loadQuestions = async () => {
            const snapshot = await getDocs(collection(db!, 'questions'))
            const qs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Question[]
            setAllQuestions(qs)
        }
        loadQuestions()
    }, [])

    // Listen for game updates
    useEffect(() => {
        if (!db) return
        const gameRef = doc(db, 'games', game.id)
        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return
            setCurrentGame({ id: snapshot.id, ...snapshot.data() } as Game)
        })
        return () => unsubscribe()
    }, [game.id])

    // Register this player in the lobby
    useEffect(() => {
        if (!db || !uid) return
        const gameRef = doc(db, 'games', game.id)
        if (players[uid]) return

        const isFirst = Object.keys(players).length === 0
        const newPlayer: Player = {
            uid,
            name: playerName || `Player ${Object.keys(players).length + 1}`,
            role: isFirst ? 'hider' : 'seeker',
            ready: false,
            isCreator: isFirst,
        }
        updateDoc(gameRef, { [`players.${uid}`]: newPlayer })
    }, [uid, game.id, playerName])

    // Game sound effects using Web Audio API
    const playSound = (type: 'join' | 'ready' | 'tick' | 'go') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)

            if (type === 'join') {
                // Pop sound
                osc.type = 'sine'
                osc.frequency.setValueAtTime(800, ctx.currentTime)
                osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15)
                gain.gain.setValueAtTime(0.4, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + 0.15)
                setTimeout(() => ctx.close(), 250)
            } else if (type === 'ready') {
                // Quick click/blip
                osc.type = 'triangle'
                osc.frequency.setValueAtTime(600, ctx.currentTime)
                gain.gain.setValueAtTime(0.15, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + 0.05)
                setTimeout(() => ctx.close(), 150)
            } else if (type === 'tick') {
                // Short timer beep
                osc.type = 'sine'
                osc.frequency.setValueAtTime(440, ctx.currentTime)
                gain.gain.setValueAtTime(0.2, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + 0.1)
                setTimeout(() => ctx.close(), 200)
            } else if (type === 'go') {
                // Go! High pitched ring
                osc.type = 'sine'
                osc.frequency.setValueAtTime(880, ctx.currentTime)
                gain.gain.setValueAtTime(0.3, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + 0.4)
                setTimeout(() => ctx.close(), 500)
            }
        } catch (e) {
            // Audio not available
        }
    }

    const prevPlayerCountRef = useRef(playerList.length)
    useEffect(() => {
        if (playerList.length > prevPlayerCountRef.current) {
            // Only play join sound if we ourselves are already in the list
            if (playerList.some(p => p.uid === uid)) {
                playSound('join')
            }
        }
        prevPlayerCountRef.current = playerList.length
    }, [playerList.length, uid, playerList])

    // Countdown logic
    useEffect(() => {
        if (allReady && countdown === null) {
            setCountdown(5)
        } else if (!allReady && countdown !== null) {
            setCountdown(null)
            if (countdownRef.current) clearInterval(countdownRef.current)
        }
    }, [allReady])

    useEffect(() => {
        if (countdown === null) return
        if (countdown <= 0) {
            playSound('go')
            startGame()
            return
        }
        // Play tick sound logic
        playSound(countdown <= 2 ? 'tick' : 'tick') // Use same tick for all
        countdownRef.current = setTimeout(() => {
            setCountdown(c => (c !== null ? c - 1 : null))
        }, 1000)
        return () => { if (countdownRef.current) clearTimeout(countdownRef.current) }
    }, [countdown])

    const startGame = async () => {
        if (!db || !isCreator) return

        try {
            const gameRef = doc(db, 'games', game.id)
            const hiderPlayer = playerList.find(p => p.role === 'hider')
            const seekerPlayers = playerList.filter(p => p.role === 'seeker')

            let travelMinutes: number
            let durationHours: number
            let areaRadius: number

            if (isCustom) {
                travelMinutes = customSettings.travelDurationMinutes ?? 30
                durationHours = customSettings.durationHours
                areaRadius = customSettings.mapRadiusMeters
            } else {
                const size = (currentGame.gameSize || 'medium') as PresetMode
                travelMinutes = presetConfigs[size].travelMinutes
                durationHours = presetConfigs[size].hours
                areaRadius = presetConfigs[size].radius
            }

            const travelEndsAt = new Date(Date.now() + travelMinutes * 60 * 1000)
            // hidingPeriodEndsAt and gameStartedAt are set later when travel ends
            const hidingDurationMs = durationHours * 60 * 60 * 1000

            await updateDoc(gameRef, {
                status: 'hidingPeriod',
                hider: hiderPlayer?.uid || null,
                seekers: seekerPlayers.map(p => p.uid),
                travelEndsAt,
                hidingDurationMs, // store so hider client can compute hidingPeriodEndsAt
                gameAreaRadius: areaRadius,     // The configurable bounding radius
                hidingZoneRadius: 400,          // Fixed 400m hiding zone
            })
        } catch (error) {
            console.error('Error starting game:', error)
        }
    }

    const toggleReady = async () => {
        if (!db || !uid) return
        playSound('ready')
        const gameRef = doc(db, 'games', game.id)
        await updateDoc(gameRef, { [`players.${uid}.ready`]: !currentPlayer?.ready })
    }

    const toggleRole = async (targetUid: string) => {
        if (!db || !isCreator || targetUid === uid) return
        const targetPlayer = players[targetUid]
        if (!targetPlayer) return
        const gameRef = doc(db, 'games', game.id)

        if (targetPlayer.role === 'seeker') {
            const updates: Record<string, any> = { [`players.${targetUid}.role`]: 'hider' }
            const currentHider = playerList.find(p => p.role === 'hider')
            if (currentHider) updates[`players.${currentHider.uid}.role`] = 'seeker'
            await updateDoc(gameRef, updates)
        } else {
            await updateDoc(gameRef, {
                [`players.${targetUid}.role`]: 'seeker',
                [`players.${uid}.role`]: 'hider',
            })
        }
    }

    const selectPreset = async (size: PresetMode) => {
        if (!db || !isCreator) return
        const gameRef = doc(db, 'games', game.id)
        await updateDoc(gameRef, {
            gameSize: size,
            gameAreaRadius: presetConfigs[size].radius,
            hidingZoneRadius: 400
        })
        setSettingsOpen(false)
    }

    const selectCustom = async () => {
        if (!db || !isCreator) return
        const gameRef = doc(db, 'games', game.id)
        // Initialize enabledQuestionIds with all question IDs if not already set
        const enabledQuestionIds = customSettings.enabledQuestionIds || allQuestions.map(q => q.id)
        const newSettings = { ...customSettings, enabledQuestionIds }
        await updateDoc(gameRef, {
            gameSize: 'custom',
            gameAreaRadius: newSettings.mapRadiusMeters,
            hidingZoneRadius: 400,
            customSettings: newSettings,
        })
        setSettingsOpen(true)
    }

    const updateCustomSetting = async (key: keyof CustomGameSettings, value: any) => {
        if (!db || !isCreator) return
        const gameRef = doc(db, 'games', game.id)
        const newSettings = { ...customSettings, [key]: value }
        const updates: Record<string, any> = { customSettings: newSettings }
        if (key === 'mapRadiusMeters') updates.gameAreaRadius = value
        await updateDoc(gameRef, updates)
    }

    const toggleCategory = async (cat: string) => {
        const currentCats = customSettings.enabledCategories
        const enabling = !currentCats.includes(cat)
        const updatedCats = enabling ? [...currentCats, cat] : currentCats.filter(c => c !== cat)
        if (updatedCats.length === 0) return

        // Also toggle all questions in this category
        const catQuestionIds = allQuestions.filter(q => q.category === cat).map(q => q.id)
        const currentQIds = customSettings.enabledQuestionIds || allQuestions.map(q => q.id)
        let updatedQIds: string[]
        if (enabling) {
            updatedQIds = Array.from(new Set(currentQIds.concat(catQuestionIds)))
        } else {
            updatedQIds = currentQIds.filter(id => !catQuestionIds.includes(id))
        }

        if (!db || !isCreator) return
        const gameRef = doc(db, 'games', game.id)
        await updateDoc(gameRef, {
            customSettings: { ...customSettings, enabledCategories: updatedCats, enabledQuestionIds: updatedQIds },
        })
    }

    const toggleQuestion = async (questionId: string, category: string) => {
        if (!db || !isCreator) return
        const currentQIds = customSettings.enabledQuestionIds || allQuestions.map(q => q.id)
        const enabling = !currentQIds.includes(questionId)
        const updatedQIds = enabling
            ? [...currentQIds, questionId]
            : currentQIds.filter(id => id !== questionId)

        // Update category enabled status based on whether any questions in it are enabled
        const catQuestionIds = allQuestions.filter(q => q.category === category).map(q => q.id)
        const anyCatEnabled = catQuestionIds.some(id => updatedQIds.includes(id))
        let updatedCats = [...customSettings.enabledCategories]
        if (anyCatEnabled && !updatedCats.includes(category)) {
            updatedCats.push(category)
        } else if (!anyCatEnabled) {
            updatedCats = updatedCats.filter(c => c !== category)
        }
        if (updatedCats.length === 0 && updatedQIds.length === 0) return

        const gameRef = doc(db, 'games', game.id)
        await updateDoc(gameRef, {
            customSettings: { ...customSettings, enabledCategories: updatedCats, enabledQuestionIds: updatedQIds },
        })
    }

    const toggleExpandCategory = (cat: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            next.has(cat) ? next.delete(cat) : next.add(cat)
            return next
        })
    }

    const copyCode = () => {
        navigator.clipboard.writeText(currentGame.code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Group questions by category
    const questionsByCategory: Record<string, Question[]> = {}
    ALL_CATEGORIES.forEach(cat => {
        questionsByCategory[cat] = allQuestions.filter(q => q.category === cat)
    })

    const enabledQIds = new Set(customSettings.enabledQuestionIds || allQuestions.map(q => q.id))

    const settingsSummary = () => {
        if (isCustom) {
            const h = customSettings.durationHours
            const r = customSettings.mapRadiusMeters
            const enabledCount = customSettings.enabledQuestionIds?.length ?? allQuestions.length
            return `${h}h • ${r}m • ${enabledCount} questions`
        }
        const size = currentGame.gameSize || 'medium'
        return `${presetConfigs[size as keyof typeof presetConfigs]?.label || 'Medium'} game`
    }

    return (
        <div className="h-dvh w-screen flex flex-col items-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 overflow-y-auto">
            <div className="w-full max-w-md space-y-4 py-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <Users className="w-12 h-12 mx-auto text-blue-400" />
                    <h1 className="text-3xl font-bold">Game Lobby</h1>
                    <p className="text-gray-400 text-sm">Waiting for all players to ready up</p>
                </div>

                {/* Game Code */}
                <button
                    onClick={copyCode}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-blue-500/50 transition-colors"
                >
                    <div>
                        <p className="text-xs text-gray-400 text-left">Game Code</p>
                        <p className="text-3xl font-bold text-blue-400 tracking-widest">{currentGame.code}</p>
                    </div>
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>

                {/* Game Settings */}
                <div className="bg-gray-800 rounded-xl overflow-hidden">
                    {isCreator ? (
                        <>
                            <button
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-gray-400" />
                                    <span className="font-semibold text-sm">Game Settings</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">{settingsSummary()}</span>
                                    {settingsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {settingsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 space-y-4 border-t border-gray-700 pt-4">
                                            {/* Preset / Custom tabs */}
                                            <div className="grid grid-cols-4 gap-1.5 overflow-x-auto pb-2">
                                                {(Object.keys(presetConfigs) as PresetMode[]).map(size => (
                                                    <button
                                                        key={size}
                                                        onClick={() => selectPreset(size)}
                                                        className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${currentGame.gameSize === size ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        {presetConfigs[size].label}
                                                        <div className="text-[10px] mt-0.5 opacity-80 whitespace-nowrap">
                                                            {presetConfigs[size].desc} • {presetConfigs[size].radius >= 1000 ? `${(presetConfigs[size].radius / 1000).toFixed(1).replace(/\.0$/, '')}km` : `${presetConfigs[size].radius}m`}
                                                        </div>
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={selectCustom}
                                                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${isCustom ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        }`}
                                                >
                                                    Custom
                                                    <div className="text-[10px] mt-0.5 opacity-75">Your rules</div>
                                                </button>
                                            </div>

                                            {/* Custom settings panel */}
                                            {isCustom && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                                    {/* Duration */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                                                            <span>Game Duration</span>
                                                            <span className="text-blue-400">{customSettings.durationHours}h</span>
                                                        </label>
                                                        <input type="range" min={0.5} max={72} step={0.5}
                                                            value={customSettings.durationHours}
                                                            onChange={(e) => updateCustomSetting('durationHours', parseFloat(e.target.value))}
                                                            className="w-full accent-blue-500"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-gray-500"><span>30min</span><span>72h</span></div>
                                                    </div>

                                                    {/* Game Radius */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                                                            <span>Game Radius</span>
                                                            <span className="text-blue-400">{customSettings.mapRadiusMeters}m</span>
                                                        </label>
                                                        <input type="range" min={100} max={5000} step={50}
                                                            value={customSettings.mapRadiusMeters}
                                                            onChange={(e) => updateCustomSetting('mapRadiusMeters', parseInt(e.target.value))}
                                                            className="w-full accent-blue-500"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-gray-500"><span>100m</span><span>5km</span></div>
                                                    </div>

                                                    {/* Travel Time (Time to Hide) */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                                                            <span>Time to Hide</span>
                                                            <span className="text-yellow-400">
                                                                {(() => {
                                                                    const mins = customSettings.travelDurationMinutes ?? 30
                                                                    return mins >= 60
                                                                        ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ''}`
                                                                        : `${mins}m`
                                                                })()}
                                                            </span>
                                                        </label>
                                                        <input type="range" min={5} max={180} step={5}
                                                            value={customSettings.travelDurationMinutes ?? 30}
                                                            onChange={(e) => updateCustomSetting('travelDurationMinutes', parseInt(e.target.value))}
                                                            className="w-full accent-yellow-500"
                                                        />
                                                        <div className="flex justify-between text-[10px] text-gray-500"><span>5m</span><span>3h</span></div>
                                                    </div>

                                                    {/* Question Categories with individual questions */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-300">Questions</label>
                                                        <div className="space-y-1">
                                                            {ALL_CATEGORIES.map(cat => {
                                                                const catEnabled = customSettings.enabledCategories.includes(cat)
                                                                const catQuestions = questionsByCategory[cat] || []
                                                                const enabledInCat = catQuestions.filter(q => enabledQIds.has(q.id)).length
                                                                const isExpanded = expandedCategories.has(cat)

                                                                return (
                                                                    <div key={cat} className="rounded-lg overflow-hidden">
                                                                        {/* Category header */}
                                                                        <div className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${catEnabled ? 'bg-blue-600/20' : 'bg-gray-700/30'
                                                                            }`}>
                                                                            <button
                                                                                onClick={() => toggleCategory(cat)}
                                                                                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${catEnabled ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'
                                                                                    }`}
                                                                            >
                                                                                {catEnabled && <Check className="w-3 h-3 text-white" />}
                                                                            </button>
                                                                            <button
                                                                                onClick={() => toggleExpandCategory(cat)}
                                                                                className="flex-1 flex items-center justify-between min-w-0"
                                                                            >
                                                                                <span className={`text-xs font-medium ${catEnabled ? 'text-white' : 'text-gray-500'}`}>
                                                                                    {cat}
                                                                                </span>
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-[10px] text-gray-500">{enabledInCat}/{catQuestions.length}</span>
                                                                                    {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                                                                                </div>
                                                                            </button>
                                                                        </div>

                                                                        {/* Individual questions */}
                                                                        <AnimatePresence>
                                                                            {isExpanded && (
                                                                                <motion.div
                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                    transition={{ duration: 0.15 }}
                                                                                    className="overflow-hidden"
                                                                                >
                                                                                    <div className="pl-7 pr-2 py-1 space-y-0.5 max-h-40 overflow-y-auto">
                                                                                        {catQuestions.map(q => {
                                                                                            const qEnabled = enabledQIds.has(q.id)
                                                                                            return (
                                                                                                <button
                                                                                                    key={q.id}
                                                                                                    onClick={() => toggleQuestion(q.id, cat)}
                                                                                                    className={`w-full text-left flex items-start gap-2 p-1.5 rounded transition-colors ${qEnabled ? 'hover:bg-gray-700/50' : 'hover:bg-gray-700/30 opacity-50'
                                                                                                        }`}
                                                                                                >
                                                                                                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${qEnabled ? 'bg-blue-600 border-blue-500' : 'bg-gray-700 border-gray-600'
                                                                                                        }`}>
                                                                                                        {qEnabled && <Check className="w-2.5 h-2.5 text-white" />}
                                                                                                    </div>
                                                                                                    <span className="text-[11px] text-gray-300 leading-tight line-clamp-2">{q.question}</span>
                                                                                                </button>
                                                                                            )
                                                                                        })}
                                                                                        {catQuestions.length === 0 && (
                                                                                            <p className="text-[10px] text-gray-600 py-1">No questions in this category</p>
                                                                                        )}
                                                                                    </div>
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <div className="p-4 flex items-center gap-2 text-sm text-gray-400">
                            <Settings className="w-4 h-4" />
                            <span>{settingsSummary()}</span>
                        </div>
                    )}
                </div>

                {/* Player List */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {playerList.map((player) => (
                            <motion.div
                                key={player.uid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`bg-gray-800 rounded-xl p-4 flex items-center gap-3 border-2 transition-colors ${player.ready ? 'border-green-500/50' : 'border-gray-700'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${player.ready ? 'bg-green-600' : 'bg-gray-700'
                                    }`}>
                                    {player.ready ? <Check className="w-5 h-5 text-white" /> : <X className="w-5 h-5 text-gray-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">{player.name}</p>
                                        {player.isCreator && <Crown className="w-4 h-4 text-yellow-400 shrink-0" />}
                                    </div>
                                    <p className={`text-xs font-bold ${player.role === 'hider' ? 'text-orange-400' : 'text-blue-400'}`}>
                                        {player.role === 'hider' ? '🙈 Hider' : '🔍 Seeker'}
                                    </p>
                                </div>
                                {isCreator && player.uid !== uid && (
                                    <button onClick={() => toggleRole(player.uid)}
                                        className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                                        Swap Role
                                    </button>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Countdown or Ready Button */}
                {countdown !== null ? (
                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center space-y-2">
                        <p className="text-gray-400 text-sm">Game starting in</p>
                        <p className="text-6xl font-bold text-blue-400">{countdown}</p>
                    </motion.div>
                ) : (
                    <button
                        onClick={toggleReady}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${currentPlayer?.ready
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                            }`}
                    >
                        {currentPlayer?.ready ? 'Cancel Ready' : "I'm Ready"}
                    </button>
                )}

                {!allReady && playerList.length < 2 && (
                    <p className="text-center text-xs text-gray-500">Need at least 2 players to start</p>
                )}
                {hiderCount === 0 && playerList.length > 0 && (
                    <p className="text-center text-xs text-yellow-400">⚠️ No hider assigned</p>
                )}
            </div>
        </div>
    )
}
