import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

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
    return (
      <div className="bg-black w-screen h-screen overflow-hidden flex justify-center items-center font-2xl text-white">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
