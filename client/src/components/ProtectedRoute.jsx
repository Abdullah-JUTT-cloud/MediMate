import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom"
import useAuthStore from "../store/authStore"

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.doctor !== null)
  const [isHydrated, setIsHydrated] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })
    return unsubscribe
  }, [])

  if (!isHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}