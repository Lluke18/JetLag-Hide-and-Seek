'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Question } from '@/types/game'
import { Plus, Edit2, Trash2, X, Save, ChevronLeft, ChevronRight, Camera, MessageSquare, ArrowLeft, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function QuestionsAdminPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answerType, setAnswerType] = useState<'yesno' | 'photo'>('yesno')
  const [formData, setFormData] = useState<Partial<Question>>({
    category: 'Matching',
    type: 'matching',
    question: '',
    answer: '',
    drawCards: 3,
    keepCards: 1,
    timeLimit: 300,
  })

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    if (!db) return
    try {
      const questionsRef = collection(db, 'questions')
      const snapshot = await getDocs(questionsRef)
      const questionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[]
      setQuestions(questionsData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading questions:', error)
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!db) return
    try {
      const dataToSave = {
        ...formData,
        type: answerType === 'photo' ? 'photo' : formData.type,
        category: answerType === 'photo' ? 'Photo' : formData.category,
      }
      await addDoc(collection(db, 'questions'), dataToSave)
      setShowAddForm(false)
      setAnswerType('yesno')
      setFormData({
        category: 'Matching',
        type: 'matching',
        question: '',
        answer: '',
        drawCards: 3,
        keepCards: 1,
        timeLimit: 300,
      })
      loadQuestions()
    } catch (error) {
      console.error('Error adding question:', error)
      alert('Failed to add question')
    }
  }

  const handleUpdate = async (id: string) => {
    if (!db) return
    try {
      const dataToSave = {
        ...formData,
        type: answerType === 'photo' ? 'photo' : formData.type,
        category: answerType === 'photo' ? 'Photo' : formData.category,
      }
      const questionRef = doc(db, 'questions', id)
      await updateDoc(questionRef, dataToSave)
      setEditingId(null)
      setAnswerType('yesno')
      loadQuestions()
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Failed to update question')
    }
  }

  const handleDelete = async (id: string) => {
    if (!db) return
    if (!confirm('Are you sure you want to delete this question?')) return
    try {
      await deleteDoc(doc(db, 'questions', id))
      loadQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question')
    }
  }

  const startEdit = (question: Question) => {
    setEditingId(question.id)
    setAnswerType(question.type === 'photo' ? 'photo' : 'yesno')
    setFormData({
      category: question.category,
      type: question.type,
      question: question.question,
      answer: question.answer,
      drawCards: question.drawCards,
      keepCards: question.keepCards,
      timeLimit: question.timeLimit,
    })
  }

  const nextQuestion = () => {
    if (questions.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % questions.length)
    }
  }

  const prevQuestion = () => {
    if (questions.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length)
    }
  }

  const handleAnswerTypeChange = (type: 'yesno' | 'photo') => {
    setAnswerType(type)
    if (type === 'photo') {
      setFormData({ ...formData, type: 'photo', category: 'Photo' })
    } else {
      // Keep current category but ensure type matches
      const categoryTypeMap: Record<string, Question['type']> = {
        'Matching': 'matching',
        'Measuring': 'measuring',
        'Radar': 'radar',
        'Thermometer': 'thermometer',
        'Photo': 'photo',
        'Tentacle': 'tentacle',
      }
      const currentType = categoryTypeMap[formData.category || 'Matching'] || 'matching'
      setFormData({ ...formData, type: currentType })
    }
  }

  const categories = ['Matching', 'Measuring', 'Radar', 'Thermometer', 'Photo', 'Tentacle']
  const types = ['matching', 'measuring', 'radar', 'thermometer', 'photo', 'tentacle']

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 text-white">
        <p>Loading questions...</p>
      </div>
    )
  }

  const getQuestionPreviewStyles = (category: string) => {
    let bg = 'bg-gradient-to-b from-blue-600 to-indigo-900'
    let emoji = '❓'

    switch (category) {
      case 'Matching':
        emoji = '🎭'
        bg = 'bg-gradient-to-b from-pink-500 to-rose-800'
        break
      case 'Measuring':
        emoji = '📏'
        bg = 'bg-gradient-to-b from-yellow-500 to-amber-800'
        break
      case 'Radar':
        emoji = '📡'
        bg = 'bg-gradient-to-b from-emerald-500 to-teal-800'
        break
      case 'Thermometer':
        emoji = '🌡️'
        bg = 'bg-gradient-to-b from-red-500 to-orange-800'
        break
      case 'Photo':
        emoji = '📸'
        bg = 'bg-gradient-to-b from-blue-400 to-blue-800'
        break
      case 'Tentacle':
        emoji = '🦑'
        bg = 'bg-gradient-to-b from-purple-500 to-indigo-800'
        break
    }
    return { bg, emoji }
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gray-900 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-blue-500" />
              Questions Management
            </h1>
            <p className="text-gray-400">
              {questions.length > 0 ? `${currentIndex + 1} of ${questions.length} questions` : 'Manage seeker challenges'}
            </p>
          </div>
          <div className="flex gap-2">
            {questions.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3">
                <button
                  onClick={prevQuestion}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Previous question"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold min-w-[60px] text-center">
                  {currentIndex + 1}/{questions.length}
                </span>
                <button
                  onClick={nextQuestion}
                  className="p-2 hover:bg-gray-700 rounded"
                  title="Next question"
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
              Add Question
            </button>
            <Link href="/admin/dev" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Add New Question</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value as Question['category'] })
                    const typeMap: Record<string, Question['type']> = {
                      'Matching': 'matching',
                      'Measuring': 'measuring',
                      'Radar': 'radar',
                      'Thermometer': 'thermometer',
                      'Photo': 'photo',
                      'Tentacle': 'tentacle',
                    }
                    setFormData({ ...formData, category: e.target.value as Question['category'], type: typeMap[e.target.value] })
                  }}
                  className="w-full bg-gray-700 text-white p-2 rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Question</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full bg-gray-700 text-white p-2 rounded-lg"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Answer Type</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleAnswerTypeChange('yesno')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${answerType === 'yesno'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Yes/No
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerTypeChange('photo')}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${answerType === 'photo'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    <Camera className="w-5 h-5" />
                    Photo
                  </button>
                </div>
                {answerType === 'yesno' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Answer</label>
                    <input
                      type="text"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      className="w-full bg-gray-700 text-white p-2 rounded-lg"
                      placeholder="Expected answer (e.g., 'Yes', 'No', 'Tokyo')"
                    />
                  </div>
                )}
                {answerType === 'photo' && (
                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                    <p className="text-sm text-blue-200">
                      Photo questions require the hider to upload a photo. The answer field is optional and can be used as a description.
                    </p>
                    <input
                      type="text"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      className="w-full bg-gray-700 text-white p-2 rounded-lg mt-2"
                      placeholder="Optional: Photo description or expected content"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Draw Cards</label>
                  <input
                    type="number"
                    value={formData.drawCards}
                    onChange={(e) => setFormData({ ...formData, drawCards: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Keep Cards</label>
                  <input
                    type="number"
                    value={formData.keepCards}
                    onChange={(e) => setFormData({ ...formData, keepCards: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Time Limit (seconds)</label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 300 })}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Question View */}
        {questions.length > 0 && !showAddForm && editingId === null && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                Current Question
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevQuestion}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  title="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold min-w-[80px] text-center">
                  {currentIndex + 1} / {questions.length}
                </span>
                <button
                  onClick={nextQuestion}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  title="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Visual Portrait Card Preview */}
              <div className="flex-shrink-0 w-[140px] h-[170px] rounded-xl relative overflow-hidden flex flex-col p-3 text-center shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform">
                <div className={`absolute inset-0 ${getQuestionPreviewStyles(questions[currentIndex].category).bg} opacity-100`}></div>
                <div className="relative z-10 flex flex-col h-full w-full justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl filter drop-shadow-md">{getQuestionPreviewStyles(questions[currentIndex].category).emoji}</span>
                    <div className="bg-black/40 text-white/90 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                      {questions[currentIndex].type === 'photo' ? 'PHOTO' : 'TEXT'}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center my-1 overflow-hidden">
                    <span className="font-bold text-white text-xs leading-tight drop-shadow-md line-clamp-4">
                      {questions[currentIndex].question}
                    </span>
                  </div>
                  <div className="bg-black/50 rounded-lg p-1.5 backdrop-blur-md w-full flex flex-col gap-0.5">
                    <div className="text-[10px] font-black tracking-wider text-green-400">
                      DRAW {questions[currentIndex].drawCards || 1}
                    </div>
                    <div className="text-[10px] font-black tracking-wider text-blue-300">
                      KEEP {questions[currentIndex].keepCards || 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Textual Details and Actions */}
              <div className="space-y-4 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                    {questions[currentIndex].category}
                  </span>
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                    {questions[currentIndex].type === 'photo' ? (
                      <span className="flex items-center gap-1">
                        <Camera className="w-4 h-4" />
                        Photo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Yes/No
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-lg font-semibold">{questions[currentIndex].question}</p>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 space-y-2">
                  <p className="text-sm text-gray-300"><span className="text-gray-500 font-semibold mr-2">Expected Answer:</span> {questions[currentIndex].answer || 'N/A'}</p>
                  <div className="flex gap-4 text-sm text-gray-300">
                    <div><span className="text-gray-500 font-semibold">Draw:</span> {questions[currentIndex].drawCards || 1}</div>
                    <div><span className="text-gray-500 font-semibold">Keep:</span> {questions[currentIndex].keepCards || 1}</div>
                    <div><span className="text-gray-500 font-semibold">Time limit:</span> {questions[currentIndex].timeLimit || 300}s</div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => startEdit(questions[currentIndex])}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Question
                  </button>
                  <button
                    onClick={() => handleDelete(questions[currentIndex].id)}
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
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`bg-gray-800 rounded-lg p-4 ${index === currentIndex && !showAddForm && editingId === null
                ? 'ring-2 ring-blue-500'
                : ''
                }`}
            >
              {editingId === question.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const typeMap: Record<string, Question['type']> = {
                          'Matching': 'matching',
                          'Measuring': 'measuring',
                          'Radar': 'radar',
                          'Thermometer': 'thermometer',
                          'Photo': 'photo',
                          'Tentacle': 'tentacle',
                        }
                        setFormData({ ...formData, category: e.target.value as Question['category'], type: typeMap[e.target.value] })
                      }}
                      className="w-full bg-gray-700 text-white p-2 rounded-lg"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Question</label>
                    <textarea
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      className="w-full bg-gray-700 text-white p-2 rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Answer Type</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handleAnswerTypeChange('yesno')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${answerType === 'yesno'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                      >
                        <MessageSquare className="w-5 h-5" />
                        Yes/No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAnswerTypeChange('photo')}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${answerType === 'photo'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                      >
                        <Camera className="w-5 h-5" />
                        Photo
                      </button>
                    </div>
                    {answerType === 'yesno' && (
                      <div>
                        <label className="block text-sm font-semibold mb-2">Answer</label>
                        <input
                          type="text"
                          value={formData.answer}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                          className="w-full bg-gray-700 text-white p-2 rounded-lg"
                          placeholder="Expected answer"
                        />
                      </div>
                    )}
                    {answerType === 'photo' && (
                      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                        <p className="text-sm text-blue-200">
                          Photo questions require the hider to upload a photo.
                        </p>
                        <input
                          type="text"
                          value={formData.answer}
                          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                          className="w-full bg-gray-700 text-white p-2 rounded-lg mt-2"
                          placeholder="Optional: Photo description"
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Draw Cards</label>
                      <input
                        type="number"
                        value={formData.drawCards}
                        onChange={(e) => setFormData({ ...formData, drawCards: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Keep Cards</label>
                      <input
                        type="number"
                        value={formData.keepCards}
                        onChange={(e) => setFormData({ ...formData, keepCards: parseInt(e.target.value) || 0 })}
                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Time Limit (seconds)</label>
                      <input
                        type="number"
                        value={formData.timeLimit}
                        onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 300 })}
                        className="w-full bg-gray-700 text-white p-2 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(question.id)}
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
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                        {question.category}
                      </span>
                      <span className="text-sm text-gray-400">
                        Draw: {question.drawCards || 1} | Keep: {question.keepCards || 1} | Time: {question.timeLimit || 300}s
                      </span>
                    </div>
                    <p className="text-lg font-semibold mb-1">{question.question}</p>
                    <p className="text-sm text-gray-400">Answer: {question.answer}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(question)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
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

        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>No questions found. Add your first question above.</p>
          </div>
        )}
      </div>
    </div>
  )
}
