import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import api from "../lib/api";
import type { User } from "../types";

export type SignupMethod = "otp" | "password";

const SIGNUP_METHOD_KEY = "gre_signup_method";

export function getSignupMethod(): SignupMethod | null {
  const v = sessionStorage.getItem(SIGNUP_METHOD_KEY);
  return v === "otp" || v === "password" ? v : null;
}

export function setSignupMethod(method: SignupMethod) {
  sessionStorage.setItem(SIGNUP_METHOD_KEY, method);
}

export function clearSignupMethod() {
  sessionStorage.removeItem(SIGNUP_METHOD_KEY);
}

interface AuthState {
  user: User | null;
  loading: boolean;
  onboardingRequired: boolean;
  sendOtp: (email: string, purpose: "login" | "register") => Promise<string>;
  verifyOtpLogin: (email: string, code: string) => Promise<void>;
  verifyOtpRegister: (email: string, code: string) => Promise<void>;
  registerWithPassword: (email: string, password: string, confirm: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setOnboardingRequired: (v: boolean) => void;
}

const AuthContext = createContext<AuthState | null>(null);

function storeTokens(data: {
  access: string;
  refresh: string;
  user: User;
  onboarding_required?: boolean;
  needs_password_setup?: boolean;
}) {
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  if (data.needs_password_setup) {
    setSignupMethod("otp");
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingRequired, setOnboardingRequired] = useState(false);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<User>("/auth/me/");
      setUser(data);
      setOnboardingRequired(!data.onboarding_complete);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const sendOtp = async (email: string, purpose: "login" | "register") => {
    const { data } = await api.post<{ detail: string }>("/auth/otp/send/", {
      email,
      purpose,
    });
    return data.detail;
  };

  const verifyOtpLogin = async (email: string, code: string) => {
    const { data } = await api.post("/auth/otp/verify-login/", { email, code });
    storeTokens(data);
    setUser(data.user);
    setOnboardingRequired(data.onboarding_required);
  };

  const verifyOtpRegister = async (email: string, code: string) => {
    const { data } = await api.post("/auth/otp/verify-register/", { email, code });
    storeTokens(data);
    setSignupMethod("otp");
    setUser(data.user);
    setOnboardingRequired(true);
  };

  const registerWithPassword = async (
    email: string,
    password: string,
    confirm_password: string
  ) => {
    const { data } = await api.post("/auth/register/", {
      email,
      password,
      confirm_password,
    });
    storeTokens(data);
    setSignupMethod("password");
    setUser(data.user);
    setOnboardingRequired(true);
  };

  const loginWithPassword = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login/", { email, password });
    storeTokens(data);
    setUser(data.user);
    setOnboardingRequired(data.onboarding_required);
  };

  const logout = () => {
    localStorage.clear();
    clearSignupMethod();
    setUser(null);
    setOnboardingRequired(false);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      onboardingRequired,
      sendOtp,
      verifyOtpLogin,
      verifyOtpRegister,
      registerWithPassword,
      loginWithPassword,
      logout,
      refreshUser,
      setOnboardingRequired,
    }),
    [user, loading, onboardingRequired, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
