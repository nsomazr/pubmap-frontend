import { Check } from "lucide-react";

interface Props {
  email: string;
  onChangeEmail: () => void;
}

export function AuthOtpSteps({ email, onChangeEmail }: Props) {
  return (
    <div className="auth-otp-steps">
      <div className="auth-otp-steps__track">
        <div className="auth-otp-step auth-otp-step--done">
          <span className="auth-otp-step__dot">
            <Check className="h-3.5 w-3.5" />
          </span>
          <span className="auth-otp-step__label">Email sent</span>
        </div>
        <div className="auth-otp-step__line auth-otp-step__line--active" />
        <div className="auth-otp-step auth-otp-step--current">
          <span className="auth-otp-step__dot">2</span>
          <span className="auth-otp-step__label">Enter code</span>
        </div>
      </div>
      <p className="auth-otp-steps__email">
        Code sent to{" "}
        <strong className="font-semibold text-ink">{email}</strong>
        <button type="button" className="auth-otp-steps__change" onClick={onChangeEmail}>
          Change
        </button>
      </p>
    </div>
  );
}
