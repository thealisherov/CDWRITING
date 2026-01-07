import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { FaTrash, FaEye } from 'react-icons/fa'

export default function Submissions() {
  const queryClient = useQueryClient()

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
    }
  })

  if (isLoading) return <div className="text-center p-8">Loading submissions...</div>
  if (error) return <div className="text-center p-8 text-red-500">Error: {error.message}</div>

  return (
    <div className="space-y-6">
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
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                          if(confirm('Are you sure you want to delete this submission?')) {
                              deleteMutation.mutate(sub.id)
                          }
                      }}
                      className="text-red-600 hover:text-red-800 p-2"
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
    </div>
  )
}
