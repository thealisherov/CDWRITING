import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { FaCloudUploadAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'

export default function EditTest() {
  const { testId } = useParams()
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60)

  // Task 1 State
  const [task1Desc, setTask1Desc] = useState('')
  const [task1File, setTask1File] = useState(null)
  const [task1Preview, setTask1Preview] = useState(null)
  const [task1ExistingUrl, setTask1ExistingUrl] = useState(null)

  // Task 2 State
  const [task2Desc, setTask2Desc] = useState('')
  const [task2File, setTask2File] = useState(null)
  const [task2Preview, setTask2Preview] = useState(null)
  const [task2ExistingUrl, setTask2ExistingUrl] = useState(null)

  const [uploadError, setUploadError] = useState(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch existing test data
  const { data: testData, isLoading } = useQuery({
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

  // Populate state when data is loaded
  useEffect(() => {
    if (testData) {
      setTitle(testData.title)
      setDuration(testData.duration)

      try {
        const desc = JSON.parse(testData.description)
        if (desc.task1) {
          setTask1Desc(desc.task1.description || '')
          setTask1ExistingUrl(desc.task1.image_url || null)
        }
        if (desc.task2) {
          setTask2Desc(desc.task2.description || '')
          setTask2ExistingUrl(desc.task2.image_url || null)
        }
      } catch (e) {
        console.error("Error parsing description JSON", e)
      }
    }
  }, [testData])

  const handleFileChange = (e, setFile, setPreview) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const uploadImage = async (file) => {
    if (!file) return null
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('test-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('test-images')
          .getPublicUrl(fileName)

        return publicUrl
    } catch (err) {
        console.error("Upload error:", err)
        if (err.statusCode === '400' || err.message.includes('Bucket not found') || err.error === 'Bucket not found') {
            throw new Error("Bucket 'test-images' not found. Please create a public bucket named 'test-images' in your Supabase project.")
        }
        throw err
    }
  }

  const updateTestMutation = useMutation({
    mutationFn: async () => {
      setUploadError(null)

      // Upload images if new ones selected, otherwise keep existing
      const task1ImageUrl = task1File ? await uploadImage(task1File) : task1ExistingUrl
      const task2ImageUrl = task2File ? await uploadImage(task2File) : task2ExistingUrl

      // Construct data object
      const payload = {
        title,
        duration: parseInt(duration),
        image_url: task1ImageUrl || task2ImageUrl,
        description: JSON.stringify({
            task1: {
                description: task1Desc,
                image_url: task1ImageUrl
            },
            task2: {
                description: task2Desc,
                image_url: task2ImageUrl
            }
        })
      }

      const { error } = await supabase
        .from('tests')
        .update(payload)
        .eq('id', testId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tests'])
      queryClient.invalidateQueries(['test', testId])
      navigate('/admin/dashboard')
    },
    onError: (err) => {
        setUploadError(err.message)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateTestMutation.mutate()
  }

  if (isLoading) return <div className="p-8 text-center">Loading test data...</div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Test</h1>

        {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                <FaExclamationTriangle className="mt-1 shrink-0" />
                <div>
                    <h3 className="font-bold">Error Updating Test</h3>
                    <p>{uploadError}</p>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Details */}
          <section className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-700">Test Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
                    <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g. Academic Writing Practice 5"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input
                    type="number"
                    required
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                    />
                </div>
              </div>
          </section>

          {/* Task 1 */}
          <section className="space-y-4 border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Task 1</span>
                Report / Chart Description
            </h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                    required
                    rows={3}
                    value={task1Desc}
                    onChange={(e) => setTask1Desc(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g. The chart below shows..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chart/Graph Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setTask1File, setTask1Preview)}
                        className="hidden"
                        id="task1-upload"
                    />
                    <label htmlFor="task1-upload" className="cursor-pointer flex flex-col items-center">
                        {task1Preview ? (
                        <img src={task1Preview} alt="Preview" className="max-h-48 object-contain mb-2" />
                        ) : task1ExistingUrl ? (
                         <div className="flex flex-col items-center">
                             <img src={task1ExistingUrl} alt="Existing" className="max-h-48 object-contain mb-2" />
                             <span className="text-xs text-gray-500 mb-2">(Current Image)</span>
                         </div>
                        ) : (
                        <FaCloudUploadAlt size={40} className="text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-500">
                            {task1File ? 'Change image' : 'Upload New Task 1 Image'}
                        </span>
                    </label>
                </div>
            </div>
          </section>

          {/* Task 2 */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Task 2</span>
                Essay Writing
            </h2>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Essay Prompt</label>
                <textarea
                    required
                    rows={3}
                    value={task2Desc}
                    onChange={(e) => setTask2Desc(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="e.g. Some people believe that..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Optional Image (rarely used)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, setTask2File, setTask2Preview)}
                        className="hidden"
                        id="task2-upload"
                    />
                    <label htmlFor="task2-upload" className="cursor-pointer flex flex-col items-center">
                         {task2Preview ? (
                        <img src={task2Preview} alt="Preview" className="max-h-32 object-contain mb-2" />
                        ) : task2ExistingUrl ? (
                         <div className="flex flex-col items-center">
                             <img src={task2ExistingUrl} alt="Existing" className="max-h-32 object-contain mb-2" />
                             <span className="text-xs text-gray-500 mb-2">(Current Image)</span>
                         </div>
                        ) : (
                        <FaCloudUploadAlt size={30} className="text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-500">
                            {task2File ? 'Change image' : 'Upload New Task 2 Image (Optional)'}
                        </span>
                    </label>
                </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={updateTestMutation.isPending}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium flex justify-center items-center gap-2 cursor-pointer"
            >
              {updateTestMutation.isPending && <FaSpinner className="animate-spin" />}
              Update Test
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
