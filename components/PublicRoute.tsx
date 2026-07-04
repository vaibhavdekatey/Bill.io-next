import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onBoardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(onBoardingComplete ? "/dashboard" : "/onboarding");
    }
  }, [user, loading, onBoardingComplete, router]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen font-semibold text-lg">
        Loading...
      </div>
    );

  if (user) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
