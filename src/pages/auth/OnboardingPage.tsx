import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CountryInstitutionPicker } from "../../components/institutions/CountryInstitutionPicker";
import { InterestPicker } from "../../components/interests/InterestPicker";
import api from "../../lib/api";
import {
  clearSignupMethod,
  getSignupMethod,
  useAuth,
} from "../../context/AuthContext";
import { AuthFormCard } from "../../components/auth/AuthFormCard";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { HONORIFIC_OPTIONS } from "../../lib/userDisplay";

export function OnboardingPage() {
  const { refreshUser, setOnboardingRequired } = useAuth();
  const navigate = useNavigate();
  const needsPassword = getSignupMethod() === "otp";
  const totalSteps = needsPassword ? 4 : 3;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    firstname: "",
    middlename: "",
    lastname: "",
    interests: [] as string[],
    phone: "",
    country_code: "",
    affiliation: "",
    password: "",
    confirm_password: "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload: Record<string, string | string[]> = {
        title: form.title,
        firstname: form.firstname,
        middlename: form.middlename,
        lastname: form.lastname,
        interests: form.interests,
        phone: form.phone,
        country_code: form.country_code,
        affiliation: form.affiliation,
      };
      if (needsPassword) {
        payload.password = form.password;
        payload.confirm_password = form.confirm_password;
      }
      await api.post("/auth/onboarding/", payload);
      await refreshUser();
      setOnboardingRequired(false);
      clearSignupMethod();
      navigate("/dashboard");
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response
        ?.data;
      setError(
        data?.phone?.[0] ||
          data?.password?.[0] ||
          data?.confirm_password?.[0] ||
          "Please check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      variant="onboarding"
      title="Complete your profile"
      subtitle={`Step ${step} of ${totalSteps}: tell collaborators who you are.`}
      showBackToMap={false}
    >
      <div className="mb-6 flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors ${
              step >= n ? "bg-gradient-to-r from-brand-600 to-teal-600" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <AuthFormCard className="space-y-5">
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <label htmlFor="honorific" className="block text-sm font-medium text-ink">
                Honorific (optional)
              </label>
              <select
                id="honorific"
                className="auth-input w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-brand-600 gre-field focus:outline-none focus:ring-0"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              >
                {HONORIFIC_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t || "None (Mr / Dr / Prof…)"}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">How you prefer to be addressed, not your job title.</p>
            </div>
            <Input
              label="First name"
              required
              value={form.firstname}
              onChange={(e) => update("firstname", e.target.value)}
              className="auth-input"
            />
            <Input
              label="Middle name"
              value={form.middlename}
              onChange={(e) => update("middlename", e.target.value)}
              className="auth-input"
            />
            <Input
              label="Last name"
              required
              value={form.lastname}
              onChange={(e) => update("lastname", e.target.value)}
              className="auth-input"
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <Button
              className="auth-submit w-full"
              onClick={() => {
                if (!form.firstname || !form.lastname) {
                  setError("First and last name are required");
                  return;
                }
                setError("");
                setStep(2);
              }}
            >
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <CountryInstitutionPicker
              countryCode={form.country_code}
              onCountryChange={(country_code) => setForm((f) => ({ ...f, country_code }))}
              institution={form.affiliation}
              onInstitutionChange={(affiliation) => setForm((f) => ({ ...f, affiliation }))}
              required
            />
            <Input
              label="Phone number"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="auth-input"
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1 !rounded-xl" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                className="auth-submit flex-1"
                onClick={() => {
                  if (!form.country_code) {
                    setError("Select your country of residence");
                    return;
                  }
                  if (!form.affiliation.trim()) {
                    setError("Select or enter your institution");
                    return;
                  }
                  if (!form.phone.trim()) {
                    setError("Phone number is required");
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
              >
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <InterestPicker
              value={form.interests}
              onChange={(interests) => setForm((f) => ({ ...f, interests }))}
              affiliation={form.affiliation}
              showCollaborators
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1 !rounded-xl" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                className="auth-submit flex-1"
                onClick={() => {
                  if (form.interests.length === 0) {
                    setError("Select at least one research interest");
                    return;
                  }
                  setError("");
                  if (needsPassword) setStep(4);
                  else handleSubmit();
                }}
              >
                {needsPassword ? "Continue" : "Finish setup"}
              </Button>
            </div>
          </>
        )}

        {step === 4 && needsPassword && (
          <>
            <p className="auth-inline-hint">
              Choose a password for your account. You can still sign in with email codes anytime.
            </p>
            <Input
              label="Password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="auth-input"
            />
            <Input
              label="Confirm password"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={(e) => update("confirm_password", e.target.value)}
              className="auth-input"
            />
            {error && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-red-100">
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1 !rounded-xl" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                className="auth-submit flex-1"
                loading={loading}
                onClick={() => {
                  if (form.password.length < 6) {
                    setError("Password must be at least 6 characters");
                    return;
                  }
                  if (form.password !== form.confirm_password) {
                    setError("Passwords do not match");
                    return;
                  }
                  setError("");
                  handleSubmit();
                }}
              >
                Finish setup
              </Button>
            </div>
          </>
        )}
      </AuthFormCard>
    </AuthLayout>
  );
}
