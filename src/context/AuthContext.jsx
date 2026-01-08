import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('ielts_admin_session')
    return stored ? JSON.parse(stored) : null
  })
  
  const [student, setStudent] = useState(() => {
    const stored = localStorage.getItem('ielts_student_session')
    return stored ? JSON.parse(stored) : null
  })

  const loginAdmin = async (username, password) => {
    if (username === 'ieltsAdmin' && password === 'ielts123') {
      const session = {
        role: 'admin',
        token: 'mock-jwt-token-for-admin',
        timestamp: Date.now()
      }
      setAdmin(session)
      localStorage.setItem('ielts_admin_session', JSON.stringify(session))
      return { success: true }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  const logoutAdmin = () => {
    setAdmin(null)
    localStorage.removeItem('ielts_admin_session')
  }

  const startTest = async (fullName) => {
    // Faqat ism-familiya bilan session yaratish
    const studentSession = {
      id: `student_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: fullName,
      startedAt: new Date().toISOString()
    }
    
    setStudent(studentSession)
    localStorage.setItem('ielts_student_session', JSON.stringify(studentSession))
    return studentSession
  }

  const endTest = async () => {
    // Test tugaganda sessionni o'chirish
    setStudent(null)
    localStorage.removeItem('ielts_student_session')
  }

  return (
    <AuthContext.Provider value={{ 
      admin, 
      student, 
      loginAdmin, 
      logoutAdmin, 
      startTest, 
      endTest,
      loading: false
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)