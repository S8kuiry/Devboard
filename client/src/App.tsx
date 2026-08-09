import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

// Checks if token exists and hasn't expired on client-side
const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token')
  if (!token) return false

  try {
    // Decode JWT payload (base64) to check expiration time
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    localStorage.removeItem('token')
    return false
  }
}

// Single Guard Component for all routes
const AuthGuard = ({ children, requireAuth = true }: { children: React.ReactNode; requireAuth?: boolean }) => {
  const authenticated = isTokenValid()

  // 1. Protected route accessed without valid token -> Redirect to Login
  if (requireAuth && !authenticated) {
    return <Navigate to="/login" replace />
  }

  // 2. Public route (Login/Register) accessed with valid token -> Redirect to Tasks
  if (!requireAuth && authenticated) {
    return <Navigate to="/tasks" replace />
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthGuard requireAuth={false}>
        <Login />
      </AuthGuard>
    ),
  },
  {
    path: '/register',
    element: (
      <AuthGuard requireAuth={false}>
        <Register />
      </AuthGuard>
    ),
  },
  {
    path: '/tasks',
    element: (
      <AuthGuard requireAuth={true}>
        <Dashboard />
      </AuthGuard>
    ),
  },
  { path: '*', element: <Navigate to="/tasks" replace /> },
])

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />
      <RouterProvider router={router} />
    </>
  )
}