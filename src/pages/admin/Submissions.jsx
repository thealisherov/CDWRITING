import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { FaTrash, FaEye, FaTimes } from 'react-icons/fa'

export default function Submissions() {
  const queryClient = useQueryClient()
  const [selectedSubmission, setSelectedSubmission] = useState(null)

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          tests (title)
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('submissions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['submissions'])
      if (selectedSubmission) setSelectedSubmission(null)
    }
  })

  if (isLoading) return <div className="text-center p-8">Loading submissions...</div>
  if (error) return <div className="text-center p-8 text-red-500">Error: {error.message}</div>

  return (
    <div className="space-y-6 relative">
      <h1 className="text-2xl font-bold text-gray-800">Student Submissions</h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 uppercase font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Test</th>
                <th className="px-6 py-3">Word Count</th>
                <th className="px-6 py-3">Submitted At</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions?.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{sub.student_name || 'Anonymous'}</div>
                    <div className="text-gray-500 text-xs">{sub.student_email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {sub.tests?.title || 'Deleted Test'}
                  </td>
                  <td className="px-6 py-4 font-mono text-gray-600">
                    {sub.word_count}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(sub.submitted_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${sub.auto_submitted ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {sub.auto_submitted ? 'Auto' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="text-blue-600 hover:text-blue-800 p-2"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => {
                          if(confirm('Are you sure you want to delete this submission?')) {
                              deleteMutation.mutate(sub.id)
                          }
                      }}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {submissions?.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No submissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-bold text-gray-800">
                        Submission Details
                    </h3>
                    <button
                        onClick={() => setSelectedSubmission(null)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded border">
                            <span className="block text-gray-500 text-xs uppercase tracking-wide">Student</span>
                            <span className="font-medium text-gray-900">{selectedSubmission.student_name}</span>
                            <span className="block text-gray-500">{selectedSubmission.student_email}</span>
                        </div>
                         <div className="bg-gray-50 p-3 rounded border">
                            <span className="block text-gray-500 text-xs uppercase tracking-wide">Test Info</span>
                            <span className="font-medium text-gray-900">{selectedSubmission.tests?.title || 'Unknown Test'}</span>
                             <span className="block text-gray-500">
                                Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                             </span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-700 mb-2 border-b pb-1">Submission Content</h4>
                         <div className="prose max-w-none bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap font-serif text-gray-800 leading-relaxed">
                            {selectedSubmission.content || <span className="text-gray-400 italic">No content submitted.</span>}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
                    <button
                        onClick={() => setSelectedSubmission(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
