import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaSignOutAlt, FaPlus, FaList, FaHome } from 'react-icons/fa'
import { cn } from '../../lib/utils'

export default function AdminLayout() {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logoutAdmin()
    navigate('/admin/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: FaHome },
    { label: 'Create Test', path: '/admin/create-test', icon: FaPlus },
    { label: 'Submissions', path: '/admin/submissions', icon: FaList },
  ]

  // If on login page, render just the outlet (handled in App.jsx but double check logic)
  // Actually App.jsx routes /admin/login separately, but it is nested under /admin path in my router config?
  // Let's check App.jsx.
  // <Route path="/admin" element={<AdminLayout />}> <Route path="login" ... /> ... </Route>
  // So AdminLayout wraps Login too. I should conditionally render the sidebar/header.

  const isLoginPage = location.pathname === '/admin/login'

  if (isLoginPage) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-red-500">IELTS<span className="text-white">Admin</span></h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === item.path
                  ? "bg-red-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {navItems.find(i => i.path === location.pathname)?.label || 'Admin Panel'}
          </h2>
          <div className="text-sm text-gray-500">
            Administrator
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
