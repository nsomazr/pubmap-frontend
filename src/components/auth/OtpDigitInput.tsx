import { useCallback, useEffect, useRef } from "react";

const DIGIT_COUNT = 6;

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  idPrefix?: string;
}

function digitsFromValue(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, DIGIT_COUNT);
  return Array.from({ length: DIGIT_COUNT }, (_, index) => clean[index] ?? "");
}

export function OtpDigitInput({
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  idPrefix = "otp",
}: Props) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = digitsFromValue(value);

  const emit = useCallback(
    (nextDigits: string[]) => {
      onChange(nextDigits.join("").replace(/\D/g, "").slice(0, DIGIT_COUNT));
    },
    [onChange]
  );

  const focusIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, DIGIT_COUNT - 1));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  };

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, nextValue: string) => {
    const char = nextValue.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    emit(next);
    if (char && index < DIGIT_COUNT - 1) {
      focusIndex(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        emit(next);
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        emit(next);
        focusIndex(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }
    if (event.key === "ArrowRight" && index < DIGIT_COUNT - 1) {
      event.preventDefault();
      focusIndex(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGIT_COUNT);
    if (!pasted) return;
    const next = Array.from({ length: DIGIT_COUNT }, (_, index) => pasted[index] ?? "");
    emit(next);
    focusIndex(Math.min(pasted.length, DIGIT_COUNT - 1));
  };

  return (
    <div className="auth-otp-digit-grid" role="group" aria-label="6-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          className="auth-otp-digit"
          aria-label={`Digit ${index + 1} of ${DIGIT_COUNT}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
        />
      ))}
    </div>
  );
}
