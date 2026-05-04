import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
