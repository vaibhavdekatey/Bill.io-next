"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PatternWaves from "@/components/Silk";
import CustomButton from "@/components/CustomButton";

const Landing = () => {
  const { user, loading, onBoardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(onBoardingComplete ? "/dashboard" : "/onboarding");
    }
  }, [user, loading, onBoardingComplete, router]);

  return (
    <div className="bg-black min-h-screen max-h-screen w-full flex flex-col lg:flex-row text-white font-lexend p-6 lg:px-6 xl:px-[3em] gap-12 lg:gap-0 relative">
      <div className="flex flex-col justify-end w-full lg:w-3/4 min-h-[94vh] max-h-screen lg:min-h-0 lg:py-0 z-10 bg-linear-90 from-black via-black/80 to-black/0">
        <div className="flex flex-col gap-y-8">
          <div className="w-60 md:w-80 h-fit">
            <img
              className="w-full h-full"
              src="/bill.io_full.svg"
              alt="Bill.io Logo"
            />
          </div>
          <h1 className="text-white font-thin text-4xl md:text-6xl tracking-tight">
            The Simplest Way to Quote <br className="hidden md:block" />
            and Invoice Your Clients.
          </h1>
          <h2 className="text-white/70 font-light leading-tight text-base md:text-lg tracking-wide w-full md:w-2/5">
            Bill.io is the all-in-one platform built for freelancers and
            agencies. Seamlessly manage clients, and automate your invoicing so
            you can focus on the work that actually matters.
          </h2>

          {user ? (
            <div>
              <p className="text-white/70 ml-2 mb-1 tracking-wider font-light text-base">
                Welcome back, {user.name || user.email}!
              </p>
              <CustomButton
                title="Go to Dashboard"
                href={onBoardingComplete ? "/dashboard" : "/onboarding"}
                disabled={false}
              />
            </div>
          ) : (
            <>
              <div>
                <p className="text-white/70 ml-2 mb-1 tracking-wider font-light text-base">
                  Get started Now!
                </p>
                <CustomButton
                  title="Sign Up"
                  href="/register"
                  disabled={false}
                />
              </div>
              <div>
                <p className="text-white/70 ml-2 mb-1 tracking-wider font-light text-base">
                  Already Registered?
                </p>
                <CustomButton title="Log In" href="/login" disabled={false} />
              </div>
            </>
          )}
        </div>
      </div>
      <div className=" absolute max-w-11/12 max-h-[96vh] h-full w-full lg:rounded-4xl overflow-x-hidden">
        <PatternWaves />
      </div>
    </div>
  );
};

export default Landing;
