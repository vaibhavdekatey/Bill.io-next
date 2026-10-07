import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onBoardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!onBoardingComplete) {
        router.replace("/onboarding");
      }
    }
  }, [loading, user, onBoardingComplete, router]);

  if (loading || !user || !onBoardingComplete) {
    return <LoadingScreen message="Verifying session..." />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
