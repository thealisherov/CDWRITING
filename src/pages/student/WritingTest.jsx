import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { FaClock, FaCheck } from 'react-icons/fa'

function Timer({ durationMinutes, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60)

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, onTimeUp])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-gray-800'}`}>
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}

export default function WritingTest() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { student, endTest } = useAuth()

  const [activeTask, setActiveTask] = useState('task1')
  const [task1Content, setTask1Content] = useState('')
  const [task2Content, setTask2Content] = useState('')

  const [wordCount1, setWordCount1] = useState(0)
  const [wordCount2, setWordCount2] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasAutoSubmitted = useRef(false)

  // Agar student yo'q bo'lsa, test listga qaytarish
  useEffect(() => {
    if (!student) {
      alert('Iltimos, avval ism-familiyangizni kiriting')
      navigate('/')
    }
  }, [student, navigate])

  const { data: test, isLoading, error } = useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()
      if (error) throw error

      try {
        const parsed = JSON.parse(data.description)
        if (parsed.task1 && parsed.task2) {
            data.isStructured = true
            data.task1 = parsed.task1
            data.task2 = parsed.task2
        }
      } catch (e) {
        data.isStructured = false
      }
      return data
    }
  })

  useEffect(() => {
    const words1 = task1Content.trim().split(/\s+/).filter(w => w.length > 0).length
    setWordCount1(words1)

    const words2 = task2Content.trim().split(/\s+/).filter(w => w.length > 0).length
    setWordCount2(words2)
  }, [task1Content, task2Content])

  const submitMutation = useMutation({
    mutationFn: async ({ auto = false }) => {
      if (!student) throw new Error("No student session")

      const combinedContent = `=== TASK 1 ===\n\n${task1Content}\n\n=== TASK 2 ===\n\n${task2Content}`
      const totalWords = wordCount1 + wordCount2

      const { error } = await supabase
        .from('submissions')
        .insert([{
          test_id: testId,
          student_id: null, // UUID emas, NULL yuboramiz
          student_name: student.name,
          student_email: null,
          content: combinedContent,
          word_count: totalWords,
          auto_submitted: auto,
          submitted_at: new Date()
        }])

      if (error) throw error
    },
    onSuccess: () => {
      endTest()
      navigate('/')
      alert('Test muvaffaqiyatli yuborildi!')
    },
    onError: (err) => {
      alert('Yuborishda xatolik: ' + err.message)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = (auto = false) => {
    if (isSubmitting || hasAutoSubmitted.current) return
    if (auto) hasAutoSubmitted.current = true
    setIsSubmitting(true)
    submitMutation.mutate({ auto })
  }

  if (!student) return null
  if (isLoading) return <div className="text-center p-12">Loading test environment...</div>
  if (error) return <div className="text-center p-12 text-red-600">Error: {error.message}</div>

  const currentTaskData = test.isStructured
    ? (activeTask === 'task1' ? test.task1 : test.task2)
    : { description: test.description, image_url: test.image_url }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <div className="bg-gray-100 border-b border-gray-200 px-6 py-2 flex justify-between items-center text-sm shadow-sm z-10">
            <div className="font-bold text-gray-700 truncate max-w-md">{test.title}</div>

            <div className="flex bg-gray-200 rounded-lg p-1 gap-1">
                <button
                    onClick={() => setActiveTask('task1')}
                    className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${activeTask === 'task1' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Task 1
                </button>
                <button
                    onClick={() => setActiveTask('task2')}
                    className={`px-4 py-1 rounded-md text-sm font-medium transition-all ${activeTask === 'task2' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Task 2
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                    <strong>{student.name}</strong>
                </div>
                <div className="flex items-center gap-2 font-mono">
                    <FaClock className="text-gray-500" />
                    <Timer durationMinutes={test.duration} onTimeUp={() => handleSubmit(true)} />
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-1/2 overflow-y-auto p-8 border-r border-gray-200 bg-white">
                <div className="prose max-w-none">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        {activeTask === 'task1' ? (
                            <><span className="text-red-600">Task 1</span> Instructions</>
                        ) : (
                            <><span className="text-blue-600">Task 2</span> Instructions</>
                        )}
                    </h2>

                    <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg mb-6 text-gray-700 leading-relaxed shadow-sm">
                        {currentTaskData.description}
                    </div>

                    {currentTaskData.image_url && (
                        <div className="mb-6">
                            <img src={currentTaskData.image_url} alt="Task" className="w-full h-auto rounded-lg border border-gray-200 shadow-sm" />
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col bg-gray-50 relative">
                <div className="flex-1 p-6">
                   <textarea
                        style={{ display: activeTask === 'task1' ? 'block' : 'none' }}
                        value={task1Content}
                        onChange={(e) => setTask1Content(e.target.value)}
                        className="w-full h-full p-6 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-lg leading-relaxed font-serif"
                        placeholder="Type your response for Task 1 here..."
                        spellCheck="false"
                    />

                    <textarea
                        style={{ display: activeTask === 'task2' ? 'block' : 'none' }}
                        value={task2Content}
                        onChange={(e) => setTask2Content(e.target.value)}
                        className="w-full h-full p-6 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg leading-relaxed font-serif"
                        placeholder="Type your response for Task 2 here..."
                        spellCheck="false"
                    />
                </div>

                <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center px-8">
                    <div className="text-gray-600 font-medium text-sm flex gap-4">
                        <span className={activeTask === 'task1' ? 'text-red-600 font-bold' : ''}>
                            Task 1: {wordCount1} words
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className={activeTask === 'task2' ? 'text-blue-600 font-bold' : ''}>
                            Task 2: {wordCount2} words
                        </span>
                    </div>

                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors font-medium flex items-center gap-2 shadow-sm"
                        title="Submit Test"
                    >
                        <FaCheck size={16} />
                        Submit All
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}