import { Link } from 'react-router-dom'
import { FaPlus, FaList, FaUsers } from 'react-icons/fa'

export default function AdminDashboard() {
  const stats = [
    { label: 'Active Tests', value: 'Loading...', icon: FaList, color: 'bg-blue-500' },
    { label: 'Total Submissions', value: 'Loading...', icon: FaUsers, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

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

        {/* We can add real stats later with queries */}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
        <p className="text-gray-500">No recent activity.</p>
      </div>
    </div>
  )
}
