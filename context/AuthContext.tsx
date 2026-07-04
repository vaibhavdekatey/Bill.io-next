"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/axios";
import { useSession, signIn, signOut, getSession } from "next-auth/react";

interface User {
  id: string;
  email: string;
  name: string | null;
  orgId: string | null;
}

interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: any;
  taxId?: string | null;
  createdAt: string;
}

interface organization {
  id: string;
  role: string;
  title: string;
  userId: string;
  organizationId: string;
  Organization: Organization;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null; // Kept for interface compatibility, but unused
  login: (email: string, password: string) => Promise<{ onBoardingComplete: boolean }>;
  register: (name: string, email: string, password: string) => Promise<{ onBoardingComplete: boolean }>;
  googleLogin: (idToken: string) => Promise<{ onBoardingComplete: boolean }>;
  logout: () => Promise<void>;
  loading: boolean;
  onBoardingComplete: boolean;
  setOnboardingComplete: (value: boolean) => void;
  organization: organization | null;
  update: (data?: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status, update } = useSession();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onBoardingComplete, setOnboardingComplete] = useState(false);
  const [organization, setOrganization] = useState<organization | null>(null);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
    } else {
      if (session?.user) {
        setUser(session.user as any);
        setOnboardingComplete((session.user as any).onBoardingComplete || false);
        setOrganization((session.user as any).organization || null);
      } else {
        setUser(null);
        setOnboardingComplete(false);
        setOrganization(null);
      }
      setLoading(false);
    }
  }, [session, status]);

  const login = async (email: string, password: string) => {
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      throw { response: { data: { message: "Invalid credentials" } } };
    }
    const currentSession = await getSession();
    const isOnboarded = (currentSession?.user as any)?.onBoardingComplete || false;
    setOnboardingComplete(isOnboarded);
    return { onBoardingComplete: isOnboarded };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    
    if (res.data.error) {
      throw { response: { data: { message: res.data.error } } };
    }

    const signinRes = await signIn("credentials", { email, password, redirect: false });
    if (signinRes?.error) {
      throw { response: { data: { message: "Login failed after registration" } } };
    }

    const currentSession = await getSession();
    const isOnboarded = (currentSession?.user as any)?.onBoardingComplete || false;
    setOnboardingComplete(isOnboarded);
    return { onBoardingComplete: isOnboarded };
  };

  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    setOnboardingComplete(false);
  };

  const googleLogin = async (idToken: string) => {
    // With NextAuth, we usually redirect entirely to Google.
    // If they call this function, we will just initiate NextAuth's Google provider.
    await signIn("google", { callbackUrl: "/dashboard" });
    return { onBoardingComplete: false }; // This won't be reached because of redirect
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: null,
        login,
        logout,
        register,
        loading,
        googleLogin,
        setOnboardingComplete,
        onBoardingComplete,
        organization,
        update,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
