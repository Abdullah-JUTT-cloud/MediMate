import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import usePatientAuthStore from "../store/patientAuthStore";
import { RouteSkeleton } from "./RouteSkeleton";

export default function PatientProtectedRoute({ children }) {
  const isAuthenticated = usePatientAuthStore((state) => state.patient !== null);
  const [isHydrated, setIsHydrated] = useState(usePatientAuthStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = usePatientAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });
    return unsubscribe;
  }, []);

  if (!isHydrated) {
    return <RouteSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/patient-login" replace />;
  }

  return children;
}