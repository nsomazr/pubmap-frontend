import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthActionChoices } from "../../components/auth/AuthActionChoices";
import { AuthFormCard } from "../../components/auth/AuthFormCard";
import { AuthOtpSteps } from "../../components/auth/AuthOtpSteps";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
  const { sendOtp, verifyOtpLogin, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"code" | "password" | null>(null);

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
      setInfo(await sendOtp(email, "login"));
      setOtpStep("code");
      setShowPassword(false);
      setCode("");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Could not send code. Try again."
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
      await verifyOtpLogin(email, code.trim());
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Invalid code. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setLoadingAction("password");
    try {
      await loginWithPassword(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Wrong email or password. Try again."
      );
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <AuthLayout
      variant="login"
      title="Sign in"
      subtitle="Enter your email, then choose how you want to continue."
      footer={
        <p className="text-center text-sm text-slate-600">
          No account?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create one free
          </Link>
        </p>
      }
    >
      <AuthFormCard>
        {otpStep === "code" ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <AuthOtpSteps email={email} onChangeEmail={resetOtpFlow} />
            <Input
              label="6-digit code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
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
              Sign in
            </Button>
            <button
              type="button"
              className="auth-switch-link"
              disabled={loading}
              onClick={async () => {
                setError("");
                setLoading(true);
                try {
                  setInfo(await sendOtp(email, "login"));
                } catch (err: unknown) {
                  setError(
                    (err as { response?: { data?: { detail?: string } } })?.response?.data
                      ?.detail || "Could not resend code."
                  );
                } finally {
                  setLoading(false);
                }
              }}
            >
              Didn&apos;t get it? Resend code
            </button>
          </form>
        ) : showPassword ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Sign in
            </Button>
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setShowPassword(false);
                setError("");
                setPassword("");
              }}
            >
              Send email code instead
            </button>
          </form>
        ) : (
          <div className="space-y-4">
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
              codeLabel="Send sign-in code"
              passwordLabel="Sign in with password"
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
