import { KeyRound, Mail } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  codeLabel: string;
  passwordLabel: string;
  onCode: () => void;
  onPassword: () => void;
  loadingCode?: boolean;
  loadingPassword?: boolean;
  disabled?: boolean;
}

/** Primary + secondary actions — method choice lives at the send buttons. */
export function AuthActionChoices({
  codeLabel,
  passwordLabel,
  onCode,
  onPassword,
  loadingCode = false,
  loadingPassword = false,
  disabled = false,
}: Props) {
  return (
    <div className="auth-action-choices">
      <Button
        type="button"
        loading={loadingCode}
        disabled={disabled || loadingPassword}
        className="auth-submit w-full"
        onClick={onCode}
      >
        <Mail className="h-4 w-4" />
        {codeLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        loading={loadingPassword}
        disabled={disabled || loadingCode}
        className="auth-action-choices__alt w-full !rounded-xl !py-3 !text-[15px] !font-semibold"
        onClick={onPassword}
      >
        <KeyRound className="h-4 w-4" />
        {passwordLabel}
      </Button>
    </div>
  );
}
