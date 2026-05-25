import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFormCard } from "../../components/auth/AuthFormCard";
import { OtpVerificationPanel } from "../../components/auth/OtpVerificationPanel";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth, type OtpSendResult } from "../../context/AuthContext";

export function RegisterPage() {
  const { sendOtp, verifyOtpRegister } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpMeta, setOtpMeta] = useState<OtpSendResult | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"code" | "resend" | null>(null);

  const resetOtpFlow = () => {
    setOtpStep("email");
    setCode("");
    setOtpMeta(null);
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
      const result = await sendOtp(email, "register");
      setOtpMeta(result);
      setInfo(result.detail);
      setOtpStep("code");
      setCode("");
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: OtpSendResult & { detail?: string } } })
        ?.response?.data;
      if (payload?.expires_at) {
        setOtpMeta(payload);
      }
      setError(payload?.detail || "Could not send code.");
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoadingAction("resend");
    try {
      const result = await sendOtp(email, "register");
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

  return (
    <AuthLayout
      variant="register"
      title="Create account"
      subtitle="Enter your email address and we will send a verification code to continue."
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
              idPrefix="register-otp"
            />
            <Button
              type="submit"
              loading={loading && loadingAction !== "resend"}
              disabled={code.length < 6}
              className="auth-submit w-full"
            >
              Verify and continue
            </Button>
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
            <Button
              type="button"
              loading={loading && loadingAction === "code"}
              disabled={loading}
              className="auth-submit w-full"
              onClick={handleSendCode}
            >
              Send verification code
            </Button>
          </div>
        )}
      </AuthFormCard>
    </AuthLayout>
  );
}
