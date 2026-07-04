"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import CustomGoogleButton from "@/components/CustomGoogleButton";

const Register = () => {
  const { register, onBoardingComplete } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordError =
    confPassword && password !== confPassword ? "Passwords do not match" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confPassword) {
      // setPasswordError("Password does not Match");
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password);
      router.push(onBoardingComplete ? "/dashboard" : "/onboarding");
    } catch (error: any) {
      setError(error.response?.data?.message || "Registration Failed");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-black min-h-screen w-full flex flex-col items-center justify-center text-white font-lexend p-4 sm:p-6 lg:px-[12em] relative overflow-y-auto">
        <div className="absolute inset-4 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl opacity-40 group-hover:opacity-100 transition duration-1000 my-36 mx-[30vw]" />

        <div className="border border-neutral-800 bg-neutral-900/20 rounded-3xl sm:rounded-4xl p-6 sm:p-12 sm:px-14 flex flex-col items-start w-full max-w-[48em] z-10 my-8">
          <div className="w-32 sm:w-40 h-fit mb-10 sm:mb-14">
            <img
              className="w-full h-full"
              src="/bill.io_full.svg"
              alt="Bill.io Logo"
            />
          </div>
          <a
            href="/"
            className="text-white/70 mb-4 font-light flex hover:text-white duration-500 ease-in transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M11.03 8.53a.75.75 0 1 0-1.06-1.06l-4 4a.75.75 0 0 0 0 1.06l4 4a.75.75 0 1 0 1.06-1.06l-2.72-2.72H18a.75.75 0 0 0 0-1.5H8.31z"
              />
            </svg>
            Back
          </a>
          <h2 className="font-thin text-white/80 text-5xl sm:text-7xl mb-6">
            Sign up
          </h2>
          <span className="text-white/60 mb-6 font-light tracking-wide ">
            Already have an account?{" "}
            <a href="/login" className="text-white underline">
              Log in here!
            </a>
          </span>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-y-4 w-full"
          >
            <input
              className="bg-neutral-800 p-4 rounded-lg"
              placeholder="Your Fullname"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="bg-neutral-800 p-4 rounded-lg"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative w-full">
              <input
                className="bg-neutral-800 p-4 rounded-lg w-full"
                placeholder="Set a strong password"
                value={password}
                type={showPassword ? "text" : "password"}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="absolute top-0 p-4 right-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    >
                      <path d="M21.257 10.962c.474.62.474 1.457 0 2.076C19.764 14.987 16.182 19 12 19s-7.764-4.013-9.257-5.962a1.69 1.69 0 0 1 0-2.076C4.236 9.013 7.818 5 12 5s7.764 4.013 9.257 5.962"></path>
                      <circle cx={12} cy={12} r={3}></circle>
                    </g>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    >
                      <path d="M6.873 17.129c-1.845-1.31-3.305-3.014-4.13-4.09a1.69 1.69 0 0 1 0-2.077C4.236 9.013 7.818 5 12 5c1.876 0 3.63.807 5.13 1.874"></path>
                      <path d="M14.13 9.887a3 3 0 1 0-4.243 4.242M4 20L20 4M10 18.704A7.1 7.1 0 0 0 12 19c4.182 0 7.764-4.013 9.257-5.962a1.694 1.694 0 0 0-.001-2.078A23 23 0 0 0 19.57 9"></path>
                    </g>
                  </svg>
                )}
              </div>
            </div>
            <div className="relative w-full">
              <input
                className="bg-neutral-800 p-4 rounded-lg w-full"
                placeholder="Confirm password"
                value={confPassword}
                type={showPassword ? "text" : "password"}
                onChange={(e) => setConfPassword(e.target.value)}
              />
              <div
                className="absolute top-0 p-4 right-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    >
                      <path d="M21.257 10.962c.474.62.474 1.457 0 2.076C19.764 14.987 16.182 19 12 19s-7.764-4.013-9.257-5.962a1.69 1.69 0 0 1 0-2.076C4.236 9.013 7.818 5 12 5s7.764 4.013 9.257 5.962"></path>
                      <circle cx={12} cy={12} r={3}></circle>
                    </g>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={24}
                    height={24}
                    viewBox="0 0 24 24"
                  >
                    <g
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    >
                      <path d="M6.873 17.129c-1.845-1.31-3.305-3.014-4.13-4.09a1.69 1.69 0 0 1 0-2.077C4.236 9.013 7.818 5 12 5c1.876 0 3.63.807 5.13 1.874"></path>
                      <path d="M14.13 9.887a3 3 0 1 0-4.243 4.242M4 20L20 4M10 18.704A7.1 7.1 0 0 0 12 19c4.182 0 7.764-4.013 9.257-5.962a1.694 1.694 0 0 0-.001-2.078A23 23 0 0 0 19.57 9"></path>
                    </g>
                  </svg>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-white/90 border border-white/30 hover:bg-neutral-800 text-black hover:text-white tracking-wider duration-700 transition-all rounded-lg px-8 py-3 inline-block w-full text-lg text-center cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing up...
                </span>
              ) : (
                "Sign up"
              )}
            </button>
          </form>
          {passwordError && (
            <p className="text-red-900 mt-1">{passwordError}</p>
          )}

          {error && <p className="text-red-900 mt-1">{error}</p>}
          <div className="w-full flex flex-row justify-center items-center my-4">
            <div className="border h-0.5 w-full border-white/15" />
            <span className="mx-4">Or</span>
            <div className="border h-0.5 w-full border-white/15" />
          </div>

          <div className=" w-full">
            <CustomGoogleButton />
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
