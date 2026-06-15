import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthActionChoices } from "../../components/auth/AuthActionChoices";
import { AuthFormCard } from "../../components/auth/AuthFormCard";
import { OtpVerificationPanel } from "../../components/auth/OtpVerificationPanel";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth, type OtpSendResult } from "../../context/AuthContext";
import {
  buildRegisterPath,
  resolvePostAuthPath,
  storeLoginReturnPath,
} from "../../lib/authRedirect";

export function LoginPage() {
  const { sendOtp, verifyOtpLogin, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpMeta, setOtpMeta] = useState<OtpSendResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"code" | "password" | "resend" | null>(
    null
  );

  const finishAuth = (onboardingRequired: boolean) => {
    const returnPath = resolvePostAuthPath({ search: location.search });
    if (onboardingRequired) {
      storeLoginReturnPath(returnPath);
      navigate("/onboarding", { replace: true });
      return;
    }
    navigate(returnPath, { replace: true });
  };

  const resetOtpFlow = () => {
    setOtpStep("email");
    setCode("");
    setOtpMeta(null);
    setShowPassword(false);
    setError("");
    setInfo("");
  };

  const requestOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    setLoadingAction("code");
    try {
      const result = await sendOtp(email, "login");
      setOtpMeta(result);
      setInfo(result.detail);
      setOtpStep("code");
      setShowPassword(false);
      setCode("");
      return result;
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: OtpSendResult & { detail?: string } } })
        ?.response?.data;
      if (payload?.expires_at) {
        setOtpMeta(payload);
      }
      setError(payload?.detail || "Could not send code. Try again.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    await requestOtp();
  };

  const handleResendCode = async () => {
    setError("");
    setLoadingAction("resend");
    try {
      const result = await sendOtp(email, "login");
      setOtpMeta(result);
      setCode("");
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: OtpSendResult & { detail?: string } } })
        ?.response?.data;
      if (payload?.expires_at) {
        setOtpMeta(payload);
      }
      setError(payload?.detail || "Could not resend code.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyOtpLogin(email, code.trim());
      finishAuth(result.onboardingRequired);
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
      const result = await loginWithPassword(email, password);
      finishAuth(result.onboardingRequired);
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
          <Link to={buildRegisterPath(location.search)} className="font-semibold text-brand-600 hover:underline">
            Create one free
          </Link>
        </p>
      }
    >
      <AuthFormCard>
        {otpStep === "code" && otpMeta ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <OtpVerificationPanel
              email={email}
              code={code}
              onCodeChange={setCode}
              onChangeEmail={resetOtpFlow}
              expiresAt={otpMeta.expires_at}
              resendIn={otpMeta.resend_in}
              onResend={handleResendCode}
              error={error}
              disabled={loading}
              resendLoading={loadingAction === "resend"}
              idPrefix="login-otp"
            />
            <Button
              type="submit"
              loading={loading && loadingAction !== "resend"}
              disabled={code.length < 6}
              className="auth-submit w-full"
            >
              Sign in
            </Button>
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
