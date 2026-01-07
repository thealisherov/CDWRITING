import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { FaClock, FaExpandArrowsAlt, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa'

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
  const [content, setContent] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasAutoSubmitted = useRef(false)

  // Fetch test details
  const { data: test, isLoading, error } = useQuery({
    queryKey: ['test', testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .eq('id', testId)
        .single()
      if (error) throw error
      return data
    }
  })

  useEffect(() => {
    // Calculate word count
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length
    setWordCount(words)
  }, [content])

  const submitMutation = useMutation({
    mutationFn: async ({ auto = false }) => {
      if (!student) throw new Error("No student session")

      const { error } = await supabase
        .from('submissions')
        .insert([{
          test_id: testId,
          student_id: student.id,
          student_email: student.email, // Or store some identifier
          student_name: 'Student ' + student.id.substring(0,6),
          content: content,
          word_count: wordCount,
          auto_submitted: auto,
          submitted_at: new Date()
        }])

      if (error) throw error
    },
    onSuccess: () => {
      endTest() // Sign out / delete user
      navigate('/')
      alert('Test submitted successfully!')
    },
    onError: (err) => {
      alert('Submission failed: ' + err.message)
      setIsSubmitting(false)
    }
  })

  const handleSubmit = (auto = false) => {
    if (isSubmitting || hasAutoSubmitted.current) return
    if (auto) hasAutoSubmitted.current = true
    setIsSubmitting(true)
    submitMutation.mutate({ auto })
  }

  if (isLoading) return <div className="text-center p-12">Loading test environment...</div>
  if (error) return <div className="text-center p-12 text-red-600">Error: {error.message}</div>

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Info Bar */}
        <div className="bg-gray-100 border-b border-gray-200 px-6 py-2 flex justify-between items-center text-sm">
            <div className="font-bold text-gray-700">{test.title}</div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <FaClock className="text-gray-500" />
                    <Timer durationMinutes={test.duration} onTimeUp={() => handleSubmit(true)} />
                </div>
            </div>
        </div>

        {/* Split Screen */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Panel: Task */}
            <div className="w-full md:w-1/2 overflow-y-auto p-8 border-r border-gray-200 bg-white">
                <div className="prose max-w-none">
                    <h2 className="text-xl font-bold mb-4">Task Instructions</h2>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6 text-gray-700">
                        {test.description}
                    </div>

                    {test.image_url && (
                        <div className="mb-6">
                            <img src={test.image_url} alt="Task" className="w-full h-auto rounded-lg border border-gray-200" />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Writing Area */}
            <div className="w-full md:w-1/2 flex flex-col bg-gray-50">
                <div className="flex-1 p-8">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full p-6 border border-gray-300 rounded-lg shadow-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg leading-relaxed font-serif"
                        placeholder="Type your response here..."
                        spellCheck="false"
                    />
                </div>

                {/* Footer Controls */}
                <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center px-8">
                    <div className="text-gray-600 font-medium">
                        Words: <span className="text-black font-bold">{wordCount}</span>
                    </div>

                    <div className="flex gap-4">
                        {/* Simulation of pagination buttons from screenshot */}
                         <div className="flex gap-1">
                             <button className="p-2 bg-gray-200 rounded text-gray-400 cursor-not-allowed"><FaArrowLeft /></button>
                             <button className="p-2 bg-black text-white rounded"><FaArrowRight /></button>
                         </div>

                         <button
                            onClick={() => handleSubmit(false)}
                            disabled={isSubmitting}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-3 rounded-md transition-colors"
                            title="Submit Test"
                         >
                            <FaCheck size={20} />
                         </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
