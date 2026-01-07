import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaUserCircle } from 'react-icons/fa'

export default function StudentLayout() {
  const { student, endTest } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-red-600">IELTS</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-gray-600 font-medium">
              Test Taker ID: <span className="text-black font-mono">{student ? student.id.substring(0, 8) : 'GUEST'}</span>
            </div>
            <div className="text-gray-400">
                <FaUserCircle size={24} />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} IELTS Training Platform
      </footer>
    </div>
  )
}
