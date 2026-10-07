import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onBoardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (onBoardingComplete) {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, onBoardingComplete, router]);

  if (loading || !user || onBoardingComplete) {
    return <LoadingScreen message="Loading onboarding..." />;
  }

  return <>{children}</>;
};

export default OnboardingRoute;
