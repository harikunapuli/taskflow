import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/axios'

// Create context
const AuthContext = createContext(null)

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // ── On app start — check if user is already logged in ──
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      const savedUser  = localStorage.getItem('user')

      if (savedToken && savedUser) {
        try {
          // Verify token is still valid
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        } catch (err) {
          // Token invalid — clear everything
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  // ── Login ───────────────────────────────────────────────
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password })
    const { access_token, user } = response.data

    // Save to localStorage
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(user))

    // Save to state
    setToken(access_token)
    setUser(user)

    return user
  }

  // ── Register ────────────────────────────────────────────
  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password })
    return response.data
  }

  // ── Logout ──────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  // ── Values exposed to all components ───────────────────
  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  }

  if (loading) {
    return (
      <div style={{
        display:         'flex',
        justifyContent:  'center',
        alignItems:      'center',
        height:          '100vh',
        fontSize:        '18px',
        color:           '#6366f1'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext