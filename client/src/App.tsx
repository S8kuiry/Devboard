import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import AssignedTask from './pages/AssignedTask'
import PlansPage from './pages/PlansPage'

// Checks token presence and JWT expiration
const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token')
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    localStorage.removeItem('token')
    return false
  }
}

// 1. Unauthenticated users get kicked to /login
const ProtectedRoute = () => {
  return isTokenValid() ? <DashboardLayout /> : <Navigate to="/login" replace />
}

// 2. Authenticated users visiting /login or /register get sent straight to /dashboard
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  return isTokenValid() ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #334155' },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes inside Sidebar Layout */}
          <Route element={<ProtectedRoute />}>
            <Route index path="/dashboard" element={<Dashboard />} />
            <Route index path="/assigned" element={<AssignedTask />} />
            <Route index path="/plans" element={<PlansPage />} />


          </Route>

          {/* Default Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}