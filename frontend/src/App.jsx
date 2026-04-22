import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login       from './pages/Login'
import Register    from './pages/Register'
import Dashboard   from './pages/Dashboard'
import KanbanBoard from './pages/KanbanBoard'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      }/>
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      }/>
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      }/>
      <Route path="/board/:projectId" element={
        <ProtectedRoute><KanbanBoard /></ProtectedRoute>
      }/>
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background:   '#1e1e2e',
              color:        '#cdd6f4',
              border:       '1px solid #313244',
              borderRadius: '8px',
              fontSize:     '14px'
            },
            success: { iconTheme: { primary: '#a6e3a1', secondary: '#1e1e2e' } },
            error:   { iconTheme: { primary: '#f38ba8', secondary: '#1e1e2e' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App