import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthActionChoices } from "../../components/auth/AuthActionChoices";
import { AuthFormCard } from "../../components/auth/AuthFormCard";
import { AuthOtpSteps } from "../../components/auth/AuthOtpSteps";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { HONORIFIC_OPTIONS, SIGNUP_HONORIFIC_KEY } from "../../lib/userDisplay";

export function RegisterPage() {
  const { sendOtp, verifyOtpRegister, registerWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"code" | "password" | null>(null);
  const [honorific, setHonorific] = useState("");

  const persistHonorific = () => {
    if (honorific) sessionStorage.setItem(SIGNUP_HONORIFIC_KEY, honorific);
    else sessionStorage.removeItem(SIGNUP_HONORIFIC_KEY);
  };

  const resetOtpFlow = () => {
    setOtpStep("email");
    setCode("");
    setShowPassword(false);
    setError("");
    setInfo("");
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    setLoadingAction("code");
    try {
      setInfo(await sendOtp(email, "register"));
      setOtpStep("code");
      setShowPassword(false);
      setCode("");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Could not send code."
      );
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      persistHonorific();
      await verifyOtpRegister(email, code.trim());
      navigate("/onboarding");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Invalid code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setLoadingAction("password");
    try {
      persistHonorific();
      await registerWithPassword(email, password, confirm);
      navigate("/onboarding");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: Record<string, string[]> & { detail?: string } } })
          ?.response?.data;
      setError(
        msg?.detail || msg?.email?.[0] || msg?.password?.[0] || "Registration failed."
      );
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <AuthLayout
      variant="register"
      title="Create account"
      subtitle="Enter your email, then choose how you want to sign up."
      footer={
        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <AuthFormCard>
        {otpStep === "code" ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <AuthOtpSteps email={email} onChangeEmail={resetOtpFlow} />
            <div className="space-y-1.5">
              <label htmlFor="reg-honorific-code" className="block text-sm font-medium text-ink">
                Honorific (optional)
              </label>
              <select
                id="reg-honorific-code"
                className="auth-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm"
                value={honorific}
                onChange={(e) => setHonorific(e.target.value)}
              >
                {HONORIFIC_OPTIONS.map((t) => (
                  <option key={t || "none"} value={t}>
                    {t || "None"}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="6-digit code"
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              placeholder="• • • • • •"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="auth-input auth-otp-input"
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={code.length < 6}
              className="auth-submit w-full"
            >
              Verify and continue
            </Button>
          </form>
        ) : showPassword ? (
          <form onSubmit={handlePasswordRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reg-honorific-pw" className="block text-sm font-medium text-ink">
                Honorific (optional)
              </label>
              <select
                id="reg-honorific-pw"
                className="auth-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm"
                value={honorific}
                onChange={(e) => setHonorific(e.target.value)}
              >
                {HONORIFIC_OPTIONS.map((t) => (
                  <option key={t || "none"} value={t}>
                    {t || "None"}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />
            <Input
              label="Confirm password"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <Button
              type="submit"
              loading={loading && loadingAction === "password"}
              className="auth-submit w-full"
            >
              Create account
            </Button>
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setShowPassword(false);
                setError("");
                setPassword("");
                setConfirm("");
              }}
            >
              Send email code instead
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reg-honorific" className="block text-sm font-medium text-ink">
                Honorific (optional)
              </label>
              <select
                id="reg-honorific"
                className="auth-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm"
                value={honorific}
                onChange={(e) => setHonorific(e.target.value)}
              >
                {HONORIFIC_OPTIONS.map((t) => (
                  <option key={t || "none"} value={t}>
                    {t || "None — Mr, Dr, Prof, etc."}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Email address"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />
            {info && (
              <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-100">
                {info}
              </p>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <AuthActionChoices
              codeLabel="Send verification code"
              passwordLabel="Sign up with password"
              onCode={handleSendCode}
              onPassword={() => {
                if (!email.trim()) {
                  setError("Enter your email address.");
                  return;
                }
                setError("");
                setInfo("");
                setShowPassword(true);
              }}
              loadingCode={loading && loadingAction === "code"}
              disabled={loading}
            />
          </div>
        )}
      </AuthFormCard>
    </AuthLayout>
  );
}
