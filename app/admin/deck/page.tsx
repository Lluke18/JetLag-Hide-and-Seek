'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card } from '@/types/game'
import { Plus, Edit2, Trash2, X, Save, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'

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

    const colors = ['red', 'orange', 'yellow', 'green', 'blue']
    const powerupEffects = ['randomize', 'veto', 'move', 'discard1draw2', 'discard2draw3', 'draw1expand1', 'duplicate']

    if (loading) {
        return (
            <div className="h-dvh w-screen flex items-center justify-center bg-gray-900 text-white">
                <p>Loading deck...</p>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-gray-900 text-white overflow-y-auto">
            <div className="max-w-6xl mx-auto p-4">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Deck Management</h1>
                        {cards.length > 0 && (
                            <p className="text-gray-400 mt-1">
                                {currentIndex + 1} of {cards.length} cards
                            </p>
                        )}
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
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add Card
                        </button>
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

                            <div>
                                <label className="block text-sm font-semibold mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                    placeholder="Card name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                                    rows={2}
                                    placeholder="Card description"
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
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Current Card</h2>
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
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className={`text-white px-3 py-1 rounded text-sm font-semibold ${cards[currentIndex].type === 'timeBonus' ? 'bg-green-600' :
                                        cards[currentIndex].type === 'powerup' ? 'bg-purple-600' : 'bg-red-600'
                                    }`}>
                                    {cards[currentIndex].type}
                                </span>
                                {cards[currentIndex].color && (
                                    <span className="bg-gray-700 text-white px-3 py-1 rounded text-sm">
                                        {cards[currentIndex].color}
                                    </span>
                                )}
                            </div>
                            <p className="text-lg font-semibold">{cards[currentIndex].name}</p>
                            <p className="text-sm text-gray-400">{cards[currentIndex].description}</p>
                            {cards[currentIndex].type === 'timeBonus' && (
                                <div className="text-xs text-gray-500">
                                    Small: {cards[currentIndex].smallValue}s | Medium: {cards[currentIndex].mediumValue}s | Large: {cards[currentIndex].largeValue}s
                                </div>
                            )}
                            {cards[currentIndex].type === 'powerup' && cards[currentIndex].effect && (
                                <div className="text-xs text-gray-500">Effect: {cards[currentIndex].effect}</div>
                            )}
                            {cards[currentIndex].type === 'curse' && (
                                <div className="text-xs text-gray-500">
                                    Duration: {cards[currentIndex].value}s | Effect: {cards[currentIndex].curseEffect}
                                </div>
                            )}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => startEdit(cards[currentIndex])}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <Edit2 className="w-5 h-5" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(cards[currentIndex].id)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete
                                </button>
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
