import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, type ReactElement } from 'react'
import { getUser, subscribe } from '../services/auth'

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation()
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    const unsub = subscribe(setUser)
    return unsub
  }, [])

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />
  }
  return children
}
