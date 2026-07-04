import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation"; import { useEffect } from "react";

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onBoardingComplete } = useAuth();

  if (loading)
    return (
      <div className="bg-black w-screen h-screen overflow-hidden flex justify-center items-center font-2xl ">
        Loading...
      </div>
    );

  if (!user) return (()=>{ const r=useRouter(); useEffect(()=>{r.replace("/login")},[]); return null; })();

  if (onBoardingComplete) return (()=>{ const r=useRouter(); useEffect(()=>{r.replace("/dashboard")},[]); return null; })();

  return <>{children}</>;
};

export default OnboardingRoute;
