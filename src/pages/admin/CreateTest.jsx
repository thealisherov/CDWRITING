import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { FaCloudUploadAlt, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

export default function CreateTest() {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(60)

  // Task 1 State
  const [task1Desc, setTask1Desc] = useState('')
  const [task1File, setTask1File] = useState(null)
  const [task1Preview, setTask1Preview] = useState(null)

  // Task 2 State
  const [task2Desc, setTask2Desc] = useState('')
  const [task2File, setTask2File] = useState(null) // Task 2 might have an image occasionally
  const [task2Preview, setTask2Preview] = useState(null)

  const [uploadError, setUploadError] = useState(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const createTestMutation = useMutation({
    mutationFn: async () => {
      setUploadError(null)

      // Upload images
      const task1ImageUrl = await uploadImage(task1File)
      const task2ImageUrl = await uploadImage(task2File)

      // Construct data object
      // We store the structured data in the 'description' column as a JSON string
      // to avoid needing schema changes immediately.
      // 'image_url' will store Task 1 image for the list view thumbnail.
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
        }),
        created_at: new Date()
      }

      const { error } = await supabase
        .from('tests')
        .insert([payload])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tests'])
      navigate('/admin/dashboard')
    },
    onError: (err) => {
        setUploadError(err.message)
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createTestMutation.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Test (Task 1 & 2)</h1>

        {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
                <FaExclamationTriangle className="mt-1 shrink-0" />
                <div>
                    <h3 className="font-bold">Error Creating Test</h3>
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
                        ) : (
                        <FaCloudUploadAlt size={40} className="text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-500">
                            {task1File ? 'Change image' : 'Upload Task 1 Image'}
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
                        ) : (
                        <FaCloudUploadAlt size={30} className="text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-500">
                            {task2File ? 'Change image' : 'Upload Task 2 Image (Optional)'}
                        </span>
                    </label>
                </div>
            </div>
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={createTestMutation.isPending}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium flex justify-center items-center gap-2 cursor-pointer"
            >
              {createTestMutation.isPending && <FaSpinner className="animate-spin" />}
              Publish Complete Test
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
