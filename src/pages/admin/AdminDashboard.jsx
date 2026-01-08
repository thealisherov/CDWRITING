import { Link } from 'react-router-dom'
import { FaPlus, FaList, FaUsers, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
  const queryClient = useQueryClient()

  const { data: tests, isLoading: testsLoading } = useQuery({
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

  const { data: submissionStats, isLoading: statsLoading } = useQuery({
    queryKey: ['submissionStats'],
    queryFn: async () => {
       const { count, error } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
       if (error) throw error
       return count
    }
  })

  const deleteTestMutation = useMutation({
    mutationFn: async (testId) => {
      const { error } = await supabase.from('tests').delete().eq('id', testId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tests'])
    }
  })

  const stats = [
    { label: 'Active Tests', value: testsLoading ? 'Loading...' : tests?.length || 0, icon: FaList, color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Total Submissions', value: statsLoading ? 'Loading...' : submissionStats || 0, icon: FaUsers, color: 'text-green-500', bg: 'bg-green-100' },
  ]

  const handleDelete = (testId) => {
      if(confirm('Are you sure you want to delete this test? All associated submissions will be deleted.')) {
          deleteTestMutation.mutate(testId)
      }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-full bg-red-100 text-red-600`}>
                <FaPlus size={24} />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800">Quick Action</h3>
                <Link to="/admin/create-test" className="text-sm text-red-600 hover:underline">Create New Test</Link>
            </div>
        </div>

        {stats.map((stat, index) => (
             <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">{stat.label}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
            </div>
        ))}
      </div>

      {/* Available Tests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Available Tests</h2>
            <Link to="/admin/create-test" className="text-sm bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition">
                + Create New
            </Link>
        </div>

        {testsLoading ? (
            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                <FaSpinner className="animate-spin" /> Loading tests...
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Duration</th>
                            <th className="px-6 py-3">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {tests?.map((test) => (
                            <tr key={test.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{test.title}</td>
                                <td className="px-6 py-4 text-gray-600">{test.duration} min</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(test.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-3">
                                    <Link
                                        to={`/admin/edit-test/${test.id}`}
                                        className="text-blue-600 hover:text-blue-800 p-1"
                                        title="Edit"
                                    >
                                        <FaEdit size={16} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(test.id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                        title="Delete"
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {tests?.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    No tests found. Create one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  )
}
