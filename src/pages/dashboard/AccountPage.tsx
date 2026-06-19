import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  KeyRound,
  Mail,
  Map,
  PenLine,
  Phone,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AccountProfilePreview, type AccountProfilePreviewData } from "../../components/profile/AccountProfilePreview";
import { ProfilePhotoEditor } from "../../components/profile/ProfilePhotoEditor";
import { InterestPicker } from "../../components/interests/InterestPicker";
import { CountryInstitutionPicker } from "../../components/institutions/CountryInstitutionPicker";
import { formatAffiliationInline } from "../../lib/affiliations";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../../context/AuthContext";
import api, { parseApiError } from "../../lib/api";
import { useCountries } from "../../lib/countries";
import {
  greAccountStatDraft,
  greAccountStatPending,
  greAccountStatPublished,
  greAccountStatRevision,
} from "../../lib/greTheme";
import { HONORIFIC_OPTIONS, userFormalName } from "../../lib/userDisplay";
import type { DashboardStats, User as AppUser } from "../../types";
import { UserAvatar } from "../../components/ui/UserAvatar";

function Alert({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
        type === "success"
          ? "bg-teal-50 text-teal-800 ring-1 ring-teal-100"
          : "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <Shield className="h-4 w-4 shrink-0" />
      )}
      {message}
    </p>
  );
}

function ProfileDetail({ label, value }: { label: string; value?: string | null }) {
  const text = value?.trim();
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm ${text ? "text-ink" : "text-slate-400"}`}>{text || "—"}</dd>
    </div>
  );
}

function profileDataFromUser(user: AppUser, countryLabel: string): AccountProfilePreviewData {
  return {
    title: user.title || "",
    firstname: user.firstname || "",
    middlename: user.middlename || "",
    lastname: user.lastname || "",
    affiliation: user.affiliation || "",
    countryLabel,
    interests:
      user.interests?.map((item) => item.label) ||
      (user.area_of_study
        ? user.area_of_study.split(/[,;|/\n]+/).map((part) => part.trim()).filter(Boolean)
        : []),
    phone: user.phone || "",
    email: user.email,
    roleName: user.role_name || "Author",
  };
}

export function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [title, setTitle] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!user) return;
    setTitle(user.title || "");
    setFirstname(user.firstname || "");
    setMiddlename(user.middlename || "");
    setLastname(user.lastname || "");
    setAffiliation(user.affiliation || "");
    setCountryCode(user.country_code || "");
    setInterests(
      user.interests?.map((item) => item.label) ||
        (user.area_of_study
          ? user.area_of_study.split(/[,;|/\n]+/).map((part) => part.trim()).filter(Boolean)
          : [])
    );
    setPhone(user.phone || "");
  }, [user]);

  const resetProfileFromUser = () => {
    if (!user) return;
    setTitle(user.title || "");
    setFirstname(user.firstname || "");
    setMiddlename(user.middlename || "");
    setLastname(user.lastname || "");
    setAffiliation(user.affiliation || "");
    setCountryCode(user.country_code || "");
    setInterests(
      user.interests?.map((item) => item.label) ||
        (user.area_of_study
          ? user.area_of_study.split(/[,;|/\n]+/).map((part) => part.trim()).filter(Boolean)
          : [])
    );
    setPhone(user.phone || "");
    setProfileMsg(null);
  };

  const startProfileEdit = () => {
    resetProfileFromUser();
    setProfileEditing(true);
  };

  const cancelProfileEdit = () => {
    resetProfileFromUser();
    setProfileEditing(false);
  };

  const { data: countries = [] } = useCountries();
  const countryLabel = countries.find((row) => row.code === countryCode)?.name ?? "";
  const savedCountryLabel =
    countries.find((row) => row.code === user?.country_code)?.name ?? "";

  const draftProfile: AccountProfilePreviewData = {
    title,
    firstname,
    middlename,
    lastname,
    affiliation,
    countryLabel,
    interests,
    phone,
    email: user?.email,
    roleName: user?.role_name || "Author",
  };

  const savedProfile = user ? profileDataFromUser(user, savedCountryLabel) : draftProfile;
  const previewProfile = profileEditing ? draftProfile : savedProfile;
  const displayName = userFormalName(savedProfile) || "Your name";

  const { data: stats, isError: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats/");
      return data;
    },
    retry: 1,
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      api.patch("/auth/me/", {
        title,
        firstname,
        middlename,
        lastname,
        country_code: countryCode,
        affiliation,
        interests,
        phone,
      }),
    onSuccess: async () => {
      await refreshUser();
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
      setProfileEditing(false);
    },
    onError: (err) => {
      setProfileMsg({
        type: "error",
        text: parseApiError(err, "Could not update profile. Check your details."),
      });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      api.post("/auth/change-password/", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    onSuccess: () => {
      setPasswordMsg({ type: "success", text: "Password updated." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(false);
    },
    onError: () => {
      setPasswordMsg({ type: "error", text: "Could not change password. Check your current password." });
    },
  });

  const isDirty = useMemo(() => {
    if (!user) return false;
    const savedInterests =
      user.interests?.map((item) => item.label) ||
      (user.area_of_study
        ? user.area_of_study.split(/[,;|/\n]+/).map((part) => part.trim()).filter(Boolean)
        : []);
    return (
      title !== (user.title || "") ||
      firstname !== (user.firstname || "") ||
      middlename !== (user.middlename || "") ||
      lastname !== (user.lastname || "") ||
      affiliation !== (user.affiliation || "") ||
      countryCode !== (user.country_code || "") ||
      phone !== (user.phone || "") ||
      JSON.stringify(interests) !== JSON.stringify(savedInterests)
    );
  }, [user, title, firstname, middlename, lastname, affiliation, countryCode, phone, interests]);

  const statItems = [
    {
      label: "Published",
      value: stats?.published ?? 0,
      ...greAccountStatPublished,
      status: "3",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      ...greAccountStatPending,
      status: "1",
    },
    {
      label: "Revision",
      value: stats?.commented ?? 0,
      ...greAccountStatRevision,
      status: "2",
    },
    {
      label: "Drafts",
      value: stats?.drafts ?? 0,
      ...greAccountStatDraft,
      status: "0",
    },
  ];

  const handleProfileSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setProfileMsg(null);
    profileMutation.mutate();
  };

  return (
    <div className={`animate-fade-up space-y-5${profileEditing ? " pb-24 xl:pb-0" : ""}`}>
      <PageHeader
        title="Account"
        description="Manage your GRE profile, security, and publication workflow."
      />

      {statsError && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
          Could not load publication stats. If this persists, sign out and sign in again.
        </p>
      )}

      {/* Identity + publication stats in one compact band */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {user && (
              <UserAvatar
                user={user}
                name={displayName}
                size="lg"
                className="!h-14 !w-14 shrink-0 !rounded-xl !text-base sm:!h-16 sm:!w-16"
              />
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-ink sm:text-xl">{displayName}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                {savedProfile.roleName && (
                  <span className="font-medium text-slate-500">{savedProfile.roleName}</span>
                )}
                {savedProfile.email && (
                  <span className="flex min-w-0 items-center gap-1 truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {savedProfile.email}
                  </span>
                )}
                {savedProfile.phone?.trim() && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {savedProfile.phone.trim()}
                  </span>
                )}
              </div>
              {(savedProfile.affiliation || savedProfile.countryLabel) && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {[formatAffiliationInline(savedProfile.affiliation), savedProfile.countryLabel]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-50/50">
            {statItems.map(({ label, value, color, status }) => (
              <Link
                key={label}
                to={`/dashboard/publications?status=${status}`}
                className="gre-interactive flex min-w-[4.5rem] flex-col items-center px-3 py-2 transition hover:bg-white sm:min-w-[5rem] sm:px-4"
              >
                <span className={`text-lg font-bold tabular-nums leading-none ${color}`}>{value}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {user && (
        <section className="gre-form-panel">
          <ProfilePhotoEditor user={user} onUpdated={refreshUser} />
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <section className="gre-form-panel border-b border-slate-200/90 pb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <User className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-ink">
                  {profileEditing ? "Edit profile" : "Profile details"}
                </h2>
                <p className="text-xs text-slate-500">
                  {profileEditing
                    ? "Changes appear in the public preview before you save."
                    : "Shown on publications and researcher pages."}
                </p>
              </div>
            </div>
            {!profileEditing ? (
              <Button
                type="button"
                variant="secondary"
                className="!px-3 !py-2 text-xs"
                onClick={startProfileEdit}
              >
                <PenLine className="h-3.5 w-3.5" />
                Edit
              </Button>
            ) : (
              <button
                type="button"
                onClick={cancelProfileEdit}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            )}
          </div>

          <div>
            {profileEditing ? (
              <form id="account-profile-form" className="space-y-4" onSubmit={handleProfileSubmit}>
                {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

                <Select
                  label="Honorific (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                >
                  <option value="">None</option>
                  {HONORIFIC_OPTIONS.filter(Boolean).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="First name"
                    required
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                  />
                  <Input
                    label="Middle name"
                    value={middlename}
                    onChange={(e) => setMiddlename(e.target.value)}
                  />
                  <Input
                    label="Last name"
                    required
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                  />
                </div>

                <CountryInstitutionPicker
                  countryCode={countryCode}
                  onCountryChange={setCountryCode}
                  institution={affiliation}
                  onInstitutionChange={setAffiliation}
                />

                <InterestPicker
                  value={interests}
                  onChange={setInterests}
                  affiliation={affiliation}
                  showCollaborators
                />

                <Input
                  label="Phone number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <p className="text-xs text-slate-400">
                  Email ({user?.email}) cannot be changed here.
                </p>
              </form>
            ) : (
              <div className="space-y-4">
                {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <ProfileDetail label="Honorific" value={savedProfile.title} />
                  <ProfileDetail label="First name" value={savedProfile.firstname} />
                  <ProfileDetail label="Middle name" value={savedProfile.middlename} />
                  <ProfileDetail label="Last name" value={savedProfile.lastname} />
                  <ProfileDetail label="Affiliation" value={savedProfile.affiliation} />
                  <ProfileDetail label="Country" value={savedProfile.countryLabel} />
                  <ProfileDetail label="Phone" value={savedProfile.phone} />
                  <ProfileDetail label="Email" value={savedProfile.email} />
                </dl>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Research interests
                  </p>
                  {savedProfile.interests.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {savedProfile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400">—</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-3 xl:sticky xl:top-6">
          <AccountProfilePreview
            user={user}
            draft={previewProfile}
            publishedCount={stats?.published ?? 0}
            live={profileEditing}
          />

          {profileEditing && (
            <div className="space-y-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
              <Button
                type="submit"
                form="account-profile-form"
                className="w-full"
                loading={profileMutation.isPending}
                disabled={!isDirty && !profileMutation.isPending}
              >
                Save profile
              </Button>
              {isDirty && (
                <p className="text-center text-[11px] text-amber-700">Unsaved changes</p>
              )}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setPasswordOpen((open) => !open);
                setPasswordMsg(null);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-brand-600" />
                Change password
              </span>
              {passwordOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {passwordOpen && (
              <form
                className="mt-3 space-y-3 border-t border-slate-100 pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPasswordMsg(null);
                  passwordMutation.mutate();
                }}
              >
                {passwordMsg && <Alert type={passwordMsg.type} message={passwordMsg.text} />}
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full !py-2 text-xs"
                  loading={passwordMutation.isPending}
                >
                  Save password
                </Button>
              </form>
            )}
          </div>

          <nav className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Quick links
            </p>
            <ul className="mt-1 divide-y divide-slate-100">
              <li>
                <Link
                  to="/dashboard/publications"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-700"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  My publications
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/messages"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-700"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-brand-700"
                >
                  <Map className="h-4 w-4 shrink-0" />
                  Research map
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>

      {profileEditing && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm xl:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="submit"
            form="account-profile-form"
            className="w-full"
            loading={profileMutation.isPending}
            disabled={!isDirty && !profileMutation.isPending}
          >
            Save profile
          </Button>
        </div>
      )}
    </div>
  );
}
