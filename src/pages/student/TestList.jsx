import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaClock, FaPenNib, FaTimes } from 'react-icons/fa'
import toast, { Toaster } from 'react-hot-toast'

export default function TestList() {
  const { startTest } = useAuth()
  const navigate = useNavigate()
  
  const [showModal, setShowModal] = useState(false)
  const [selectedTestId, setSelectedTestId] = useState(null)
  const [fullName, setFullName] = useState('')

  const { data: tests, isLoading, error } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const handleStartClick = (testId) => {
    setSelectedTestId(testId)
    setShowModal(true)
  }

  const handleSubmitName = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Iltimos, ism-familiyangizni kiriting')
      return
    }
    
    try {
      await startTest(fullName.trim())
      setShowModal(false)
      navigate(`/test/${selectedTestId}`)
    } catch (e) {
      toast.error('Xatolik yuz berdi: ' + e.message)
    }
  }

  const getTestDescription = (description) => {
    try {
      const parsed = JSON.parse(description)
      if (parsed.task1 && parsed.task2) {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">Task 1</span>
               <span className="text-sm truncate">{parsed.task1.description.substring(0, 50)}...</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Task 2</span>
               <span className="text-sm truncate">{parsed.task2.description.substring(0, 50)}...</span>
            </div>
          </div>
        )
      }
    } catch (e) {
      return <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-1">{description}</p>
    }
    return <p className="text-gray-500 text-sm mb-6 line-clamp-3 flex-1">{description}</p>
  }

  if (isLoading) return <div className="text-center p-12">Loading tests...</div>
  if (error) return <div className="text-center p-12 text-red-600">Error loading tests: {error.message}</div>

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Available Writing Tests</h1>
          <p className="mt-2 text-gray-600">Select a test to begin your practice session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tests?.map((test) => (
            <div key={test.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden flex flex-col">
              <div className="h-48 bg-gray-100 relative">
                {test.image_url ? (
                  <img src={test.image_url} alt={test.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FaPenNib size={48} />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700 flex items-center gap-1 shadow-sm">
                  <FaClock className="text-red-500" /> {test.duration} min
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">{test.title}</h3>

                <div className="mb-6 flex-1">
                  {getTestDescription(test.description)}
                </div>

                <button
                  onClick={() => handleStartClick(test.id)}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-auto cursor-pointer"
                >
                  Start Test
                </button>
              </div>
            </div>
          ))}

          {tests?.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No tests available at the moment. Please check back later.
            </div>
          )}
        </div>
      </div>

      {/* Modal - Ism-Familiya kiritish */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white relative">
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <FaTimes size={20} />
              </button>
              <h2 className="text-2xl font-bold">Test Boshlash</h2>
              <p className="text-red-100 mt-1">Iltimos, ma'lumotlaringizni kiriting</p>
            </div>

            <form onSubmit={handleSubmitName} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ism va Familiya <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masalan: Aziz Azizov"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer"
                >
                  Testni boshlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}