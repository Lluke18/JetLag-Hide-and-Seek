'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/types/game'
import { Plus, Edit2, Trash2, X, Save, ChevronLeft, ChevronRight, CreditCard, ArrowLeft, Clock, Skull, Dice5, Ban, Navigation, RefreshCw, Zap, Copy, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function DeckAdminPage() {
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [cardType, setCardType] = useState<'timeBonus' | 'curse' | 'powerup'>('timeBonus')
    const [formData, setFormData] = useState<Partial<Card>>({
        type: 'timeBonus',
        name: '',
        description: '',
        color: 'red',
        smallValue: 120,
        mediumValue: 180,
        largeValue: 300,
    })

    const colors = ['red', 'orange', 'yellow', 'green', 'blue']
    const powerupEffects = ['randomize', 'veto', 'move', 'discard1draw2', 'discard2draw3', 'draw1expand1', 'duplicate']

    const getCardPreviewStyles = (card: Card) => {
        if (card.type === 'curse') {
            return { bg: 'bg-gradient-to-b from-red-900 to-black', Icon: Skull, label: 'CURSE' }
        }
        if (card.type === 'powerup') {
            let Icon = Zap
            if (card.effect === 'randomize') Icon = Dice5
            if (card.effect === 'veto') Icon = Ban
            if (card.effect === 'move') Icon = Navigation
            if (card.effect === 'discard1draw2' || card.effect === 'discard2draw3') Icon = RefreshCw
            if (card.effect === 'duplicate') Icon = Copy
            return { bg: 'bg-gradient-to-b from-purple-600 to-indigo-900', Icon, label: 'POWER' }
        }
        // timeBonus
        const colorMap: Record<string, string> = {
            red: 'from-red-500 to-red-700',
            orange: 'from-orange-500 to-orange-700',
            yellow: 'from-yellow-500 to-yellow-700',
            green: 'from-green-500 to-green-700',
            blue: 'from-blue-500 to-blue-700',
        }
        const grad = colorMap[card.color || 'red'] || colorMap['red']
        return { bg: `bg-gradient-to-b ${grad}`, Icon: Clock, label: 'TIME' }
    }

    useEffect(() => {
        loadCards()
    }, [])

    const loadCards = async () => {
        if (!db) return
        try {
            const cardsRef = collection(db, 'deck')
            const snapshot = await getDocs(cardsRef)
            const cardsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Card[]
            setCards(cardsData)
            setLoading(false)
        } catch (error) {
            console.error('Error loading cards:', error)
            setLoading(false)
        }
    }

    const handleAdd = async () => {
        if (!db) return
        try {
            const dataToSave: any = {
                ...formData,
                type: cardType,
            }

            // Remove undefined values
            Object.keys(dataToSave).forEach(key => {
                if (dataToSave[key] === undefined || dataToSave[key] === '') {
                    delete dataToSave[key]
                }
            })

            await addDoc(collection(db, 'deck'), dataToSave)
            setShowAddForm(false)
            resetForm()
            loadCards()
        } catch (error) {
            console.error('Error adding card:', error)
            alert('Failed to add card')
        }
    }

    const handleUpdate = async (id: string) => {
        if (!db) return
        try {
            const dataToSave: any = {
                ...formData,
                type: cardType,
            }

            // Remove undefined values
            Object.keys(dataToSave).forEach(key => {
                if (dataToSave[key] === undefined || dataToSave[key] === '') {
                    delete dataToSave[key]
                }
            })

            const cardRef = doc(db, 'deck', id)
            await updateDoc(cardRef, dataToSave)
            setEditingId(null)
            loadCards()
        } catch (error) {
            console.error('Error updating card:', error)
            alert('Failed to update card')
        }
    }

    const handleDelete = async (id: string) => {
        if (!db) return
        if (!confirm('Are you sure you want to delete this card?')) return
        try {
            await deleteDoc(doc(db, 'deck', id))
            loadCards()
        } catch (error) {
            console.error('Error deleting card:', error)
            alert('Failed to delete card')
        }
    }

    const startEdit = (card: Card) => {
        setEditingId(card.id)
        setCardType(card.type)
        setFormData({
            name: card.name,
            description: card.description,
            value: card.value,
            effect: card.effect,
            color: card.color,
            smallValue: card.smallValue,
            mediumValue: card.mediumValue,
            largeValue: card.largeValue,
            curseEffect: card.curseEffect,
        })
    }

    const resetForm = () => {
        setCardType('timeBonus')
        setFormData({
            type: 'timeBonus',
            name: '',
            description: '',
            color: 'red',
            smallValue: 120,
            mediumValue: 180,
            largeValue: 300,
        })
    }

    const nextCard = () => {
        if (cards.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % cards.length)
        }
    }

    const prevCard = () => {
        if (cards.length > 0) {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
        }
    }

    const handleCardTypeChange = (type: 'timeBonus' | 'curse' | 'powerup') => {
        setCardType(type)
        if (type === 'timeBonus') {
            setFormData({
                type: 'timeBonus',
                name: '',
                description: '',
                color: 'red',
                smallValue: 120,
                mediumValue: 180,
                largeValue: 300,
            })
        } else if (type === 'curse') {
            setFormData({
                type: 'curse',
                name: '',
                description: 'Apply curse to seekers',
                value: 300,
                curseEffect: '',
            })
        } else if (type === 'powerup') {
            setFormData({
                type: 'powerup',
                name: '',
                description: '',
                effect: '',
            })
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
                <p>Loading deck...</p>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 overflow-y-auto bg-gray-900 text-white p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <CreditCard className="w-8 h-8 text-blue-500" />
                            Deck Management
                        </h1>
                        <p className="text-gray-400">
                            {cards.length > 0 ? `${currentIndex + 1} of ${cards.length} cards` : 'Manage game powers and curses'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {cards.length > 0 && (
                            <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3">
                                <button
                                    onClick={prevCard}
                                    className="p-2 hover:bg-gray-700 rounded"
                                    title="Previous card"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-semibold min-w-[60px] text-center">
                                    {currentIndex + 1}/{cards.length}
                                </span>
                                <button
                                    onClick={nextCard}
                                    className="p-2 hover:bg-gray-700 rounded"
                                    title="Next card"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Add Card
                        </button>
                        <Link href="/admin/dev" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    </div>
                </div>

                {showAddForm && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-bold mb-4">Add New Card</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Card Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleCardTypeChange('timeBonus')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-semibold ${cardType === 'timeBonus' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        Time Bonus
                                    </button>
                                    <button
                                        onClick={() => handleCardTypeChange('powerup')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-semibold ${cardType === 'powerup' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        Powerup
                                    </button>
                                    <button
                                        onClick={() => handleCardTypeChange('curse')}
                                        className={`flex-1 py-2 px-4 rounded-lg font-semibold ${cardType === 'curse' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        Curse
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold mb-2 text-gray-300">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-lg transition-colors outline-none"
                                        placeholder="Card name"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold mb-2 text-gray-300">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white p-3 rounded-lg transition-colors outline-none"
                                        rows={2}
                                        placeholder="Card description"
                                    />
                                </div>
                            </div>

                            {cardType === 'timeBonus' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Color</label>
                                        <select
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                        >
                                            {colors.map((color) => (
                                                <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Small (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.smallValue}
                                                onChange={(e) => setFormData({ ...formData, smallValue: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Medium (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.mediumValue}
                                                onChange={(e) => setFormData({ ...formData, mediumValue: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Large (seconds)</label>
                                            <input
                                                type="number"
                                                value={formData.largeValue}
                                                onChange={(e) => setFormData({ ...formData, largeValue: parseInt(e.target.value) || 0 })}
                                                className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {cardType === 'powerup' && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Effect</label>
                                    <select
                                        value={formData.effect}
                                        onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                    >
                                        <option value="">Select effect...</option>
                                        {powerupEffects.map((effect) => (
                                            <option key={effect} value={effect}>{effect}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {cardType === 'curse' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Curse Effect</label>
                                        <input
                                            type="text"
                                            value={formData.curseEffect}
                                            onChange={(e) => setFormData({ ...formData, curseEffect: e.target.value })}
                                            className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                            placeholder="curse1, curse2, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Duration (seconds)</label>
                                        <input
                                            type="number"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 300 })}
                                            className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={handleAdd}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddForm(false)
                                        resetForm()
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current Card View */}
                {cards.length > 0 && !showAddForm && editingId === null && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl border border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-blue-400" />
                                Current Card
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={prevCard}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                    title="Previous"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-semibold min-w-[80px] text-center">
                                    {currentIndex + 1} / {cards.length}
                                </span>
                                <button
                                    onClick={nextCard}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                                    title="Next"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Visual Portrait Card Preview */}
                            <div className="flex-shrink-0 w-[140px] h-[186px] rounded-xl relative overflow-hidden flex flex-col items-center p-3 text-center shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform">
                                {/* Inject styles */}
                                <div className={`absolute inset-0 ${getCardPreviewStyles(cards[currentIndex]).bg} opacity-100`}></div>
                                {/* Content */}
                                <div className="relative z-10 flex flex-col h-full items-center justify-between w-full">
                                    <div className="bg-black/40 text-white/90 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                        {getCardPreviewStyles(cards[currentIndex]).label}
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-full backdrop-blur-md shadow-inner my-2">
                                        {(() => {
                                            const { Icon } = getCardPreviewStyles(cards[currentIndex])
                                            return <Icon className="w-10 h-10 text-white filter drop-shadow-md" />
                                        })()}
                                    </div>
                                    <div className="flex flex-col items-center justify-end flex-1 w-full">
                                        <div className="w-full text-center">
                                            <span
                                                className="font-black text-white leading-tight drop-shadow-md break-words block"
                                                style={{ fontSize: 'clamp(14px, 1.25rem, 20px)' }}
                                            >
                                                {cards[currentIndex].name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details and Actions */}
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${cards[currentIndex].type === 'timeBonus' ? 'bg-green-600' :
                                        cards[currentIndex].type === 'powerup' ? 'bg-purple-600' : 'bg-red-600'
                                        }`}>
                                        {cards[currentIndex].type}
                                    </span>
                                    {cards[currentIndex].color && cards[currentIndex].type === 'timeBonus' && (
                                        <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            {cards[currentIndex].color}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-300 text-sm">{cards[currentIndex].description}</p>

                                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                    {cards[currentIndex].type === 'timeBonus' && (
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="bg-gray-800 p-2 rounded"><div className="text-xs text-gray-500 mb-1">Small</div><div className="font-bold">{cards[currentIndex].smallValue}s</div></div>
                                            <div className="bg-gray-800 p-2 rounded"><div className="text-xs text-gray-500 mb-1">Medium</div><div className="font-bold">{cards[currentIndex].mediumValue}s</div></div>
                                            <div className="bg-gray-800 p-2 rounded"><div className="text-xs text-gray-500 mb-1">Large</div><div className="font-bold">{cards[currentIndex].largeValue}s</div></div>
                                        </div>
                                    )}
                                    {cards[currentIndex].type === 'powerup' && cards[currentIndex].effect && (
                                        <div className="text-sm"><span className="text-gray-500">System Effect:</span> <code className="bg-gray-800 px-2 py-1 rounded ml-2">{cards[currentIndex].effect}</code></div>
                                    )}
                                    {cards[currentIndex].type === 'curse' && (
                                        <div className="flex gap-6 text-sm">
                                            <div><span className="text-gray-500">Duration:</span> <span className="font-bold ml-1">{cards[currentIndex].value}s</span></div>
                                            <div><span className="text-gray-500">Curse Effect IDs:</span> <code className="bg-gray-800 px-2 py-1 rounded ml-2">{cards[currentIndex].curseEffect}</code></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => startEdit(cards[currentIndex])}
                                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Card
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cards[currentIndex].id)}
                                        className="bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {cards.map((card, index) => (
                        <div
                            key={card.id}
                            className={`bg-gray-800 rounded-lg p-4 ${index === currentIndex && !showAddForm && editingId === null
                                ? 'ring-2 ring-blue-500'
                                : ''
                                }`}
                        >
                            {editingId === card.id ? (
                                <div className="space-y-4">
                                    {/* Edit form - same as add form */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Card Type</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCardTypeChange('timeBonus')}
                                                className={`flex-1 py-2 px-4 rounded-lg font-semibold ${cardType === 'timeBonus' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
                                                    }`}
                                            >
                                                Time Bonus
                                            </button>
                                            <button
                                                onClick={() => handleCardTypeChange('powerup')}
                                                className={`flex-1 py-2 px-4 rounded-lg font-semibold ${cardType === 'powerup' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                                                    }`}
                                            >
                                                Powerup
                                            </button>
                                            <button
                                                onClick={() => handleCardTypeChange('curse')}
                                                className={`flex-1 py-2 px-4 rounded-lg font-semibold ${cardType === 'curse' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300'
                                                    }`}
                                            >
                                                Curse
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                            rows={2}
                                        />
                                    </div>

                                    {cardType === 'timeBonus' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Color</label>
                                                <select
                                                    value={formData.color}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                                >
                                                    {colors.map((color) => (
                                                        <option key={color} value={color}>{color.charAt(0).toUpperCase() + color.slice(1)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Small (s)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.smallValue}
                                                        onChange={(e) => setFormData({ ...formData, smallValue: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Medium (s)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.mediumValue}
                                                        onChange={(e) => setFormData({ ...formData, mediumValue: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-2">Large (s)</label>
                                                    <input
                                                        type="number"
                                                        value={formData.largeValue}
                                                        onChange={(e) => setFormData({ ...formData, largeValue: parseInt(e.target.value) || 0 })}
                                                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {cardType === 'powerup' && (
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Effect</label>
                                            <select
                                                value={formData.effect}
                                                onChange={(e) => setFormData({ ...formData, effect: e.target.value })}
                                                className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                            >
                                                <option value="">Select effect...</option>
                                                {powerupEffects.map((effect) => (
                                                    <option key={effect} value={effect}>{effect}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {cardType === 'curse' && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Curse Effect</label>
                                                <input
                                                    type="text"
                                                    value={formData.curseEffect}
                                                    onChange={(e) => setFormData({ ...formData, curseEffect: e.target.value })}
                                                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Duration (s)</label>
                                                <input
                                                    type="number"
                                                    value={formData.value}
                                                    onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 300 })}
                                                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleUpdate(card.id)}
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                        >
                                            <Save className="w-5 h-5" />
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                        >
                                            <X className="w-5 h-5" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-white px-2 py-1 rounded text-sm font-semibold ${card.type === 'timeBonus' ? 'bg-green-600' :
                                                card.type === 'powerup' ? 'bg-purple-600' : 'bg-red-600'
                                                }`}>
                                                {card.type}
                                            </span>
                                            {card.color && (
                                                <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs">
                                                    {card.color}
                                                </span>
                                            )}
                                            {card.effect && (
                                                <span className="text-xs text-gray-400">
                                                    {card.effect}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-lg font-semibold mb-1">{card.name}</p>
                                        <p className="text-sm text-gray-400">{card.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(card)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(card.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {cards.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        <p>No cards found. Add your first card above.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
