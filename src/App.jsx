import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import CreateTest from './pages/admin/CreateTest'
import EditTest from './pages/admin/EditTest'
import Submissions from './pages/admin/Submissions'
import TestList from './pages/student/TestList'
import WritingTest from './pages/student/WritingTest'
import AdminLayout from './components/layout/AdminLayout'
import StudentLayout from './components/layout/StudentLayout'

const queryClient = new QueryClient()

function ProtectedAdminRoute() {
  const { admin } = useAuth()
  if (!admin) return <Navigate to="/admin/login" replace />
  return <Outlet />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Student Routes */}
            <Route path="/" element={<StudentLayout />}>
              <Route index element={<TestList />} />
              <Route path="test/:testId" element={<WritingTest />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="login" element={<AdminLogin />} />
              <Route element={<ProtectedAdminRoute />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="create-test" element={<CreateTest />} />
                <Route path="edit-test/:testId" element={<EditTest />} />
                <Route path="submissions" element={<Submissions />} />
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
