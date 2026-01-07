import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

export default function CreateTest() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (selected) {
      setFile(selected)
      setPreview(URL.createObjectURL(selected))
    }
  }

  const createTestMutation = useMutation({
    mutationFn: async (data) => {
      let imageUrl = null

      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('test-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('test-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      const { error } = await supabase
        .from('tests')
        .insert([{
            title: data.title,
            description: data.description,
            duration: parseInt(data.duration),
            image_url: imageUrl,
            created_at: new Date()
        }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tests'])
      navigate('/admin/dashboard')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createTestMutation.mutate({ title, description, duration })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Test</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="e.g. Academic Writing Task 1: Sports Participation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Prompt</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Enter the task instructions..."
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Image / Chart</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 object-contain mb-2" />
                ) : (
                  <FaCloudUploadAlt size={40} className="text-gray-400 mb-2" />
                )}
                <span className="text-sm text-gray-500">
                    {file ? 'Change image' : 'Click to upload image'}
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={createTestMutation.isPending}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors font-medium flex justify-center items-center gap-2"
            >
              {createTestMutation.isPending && <FaSpinner className="animate-spin" />}
              Publish Test
            </button>
            {createTestMutation.isError && (
              <p className="text-red-600 text-sm mt-2 text-center">
                Error creating test: {createTestMutation.error.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
