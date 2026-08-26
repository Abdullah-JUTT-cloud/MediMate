import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom"
import useAuthStore from "../store/authStore"
import { RouteSkeleton } from "./RouteSkeleton"

const isTrialExpired = (doctor) => {
  if (doctor?.subscriptionStatus !== "TRIAL" || !doctor?.subscriptionExpiresAt) return false;
  return new Date(doctor.subscriptionExpiresAt).getTime() <= Date.now();
}

const hasRestrictedAccess = (doctor) =>
  ["BLOCKED", "INACTIVE", "PENDING_VERIFICATION"].includes(doctor?.subscriptionStatus) ||
  isTrialExpired(doctor);

export default function ProtectedRoute({ children }) {
  const doctor = useAuthStore((state) => state.doctor)
  const isAuthenticated = doctor !== null
  const location = useLocation()
  const [isHydrated, setIsHydrated] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })
    return unsubscribe
  }, [])

  if (!isHydrated) {
    return <RouteSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (hasRestrictedAccess(doctor) && location.pathname !== "/dashboard") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
