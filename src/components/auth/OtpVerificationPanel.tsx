import { useEffect, useState } from "react";
import { AuthOtpSteps } from "./AuthOtpSteps";
import { OtpDigitInput } from "./OtpDigitInput";

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface Props {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onChangeEmail: () => void;
  expiresAt: string;
  resendIn: number;
  onResend: () => Promise<void>;
  error?: string;
  disabled?: boolean;
  resendLoading?: boolean;
  idPrefix?: string;
}

export function OtpVerificationPanel({
  email,
  code,
  onCodeChange,
  onChangeEmail,
  expiresAt,
  resendIn,
  onResend,
  error,
  disabled = false,
  resendLoading = false,
  idPrefix = "otp",
}: Props) {
  const [expiresSeconds, setExpiresSeconds] = useState(0);
  const [resendSeconds, setResendSeconds] = useState(resendIn);

  useEffect(() => {
    const updateExpiry = () => {
      const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setExpiresSeconds(remaining);
    };
    updateExpiry();
    const timer = window.setInterval(updateExpiry, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  useEffect(() => {
    setResendSeconds(resendIn);
  }, [resendIn]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const expired = expiresSeconds <= 0;

  return (
    <div className="space-y-4">
      <AuthOtpSteps email={email} onChangeEmail={onChangeEmail} />

      <div>
        <p className="mb-3 text-sm font-medium text-ink">Enter your 6-digit code</p>
        <OtpDigitInput
          value={code}
          onChange={onCodeChange}
          disabled={disabled || expired}
          idPrefix={idPrefix}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p
          className={
            expired ? "font-medium text-amber-700" : "font-medium text-slate-600 tabular-nums"
          }
        >
          {expired
            ? "Code expired. Request a new one."
            : `Code expires in ${formatCountdown(expiresSeconds)}`}
        </p>
        <button
          type="button"
          className="auth-switch-link !w-auto shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={resendSeconds > 0 || resendLoading || disabled}
          onClick={() => void onResend()}
        >
          {resendLoading
            ? "Sending…"
            : resendSeconds > 0
              ? `Resend in ${formatCountdown(resendSeconds)}`
              : "Resend code"}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
