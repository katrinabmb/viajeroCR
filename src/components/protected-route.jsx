import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const user = useAppSelector((state) => state.auth.user)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
