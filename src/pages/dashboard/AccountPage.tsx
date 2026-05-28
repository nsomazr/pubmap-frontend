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

function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: typeof User;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="gre-card overflow-hidden p-0">
      <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
        {action && <div className="w-full sm:ml-auto sm:w-auto">{action}</div>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ProfileDetail({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value.trim()}</dd>
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
    <div className="animate-fade-up">
      <PageHeader title="Account" />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {statsError && (
          <p className="col-span-full rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
            Could not load publication stats. If this persists, sign out and sign in again.
          </p>
        )}
        {statItems.map(({ label, value, color, bg, status }) => (
          <Link
            key={label}
            to={`/dashboard/publications?status=${status}`}
            className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm transition ${bg}`}
          >
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
          </Link>
        ))}
      </div>

      <div className={`grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start${profileEditing ? " pb-24 xl:pb-0" : ""}`}>
        <div className="order-2 space-y-6 xl:order-none">
          <SectionCard
            icon={User}
            title="Profile"
            description={
              profileEditing
                ? "Update your details, then save to publish changes to your public profile."
                : "Your saved profile as it appears on publications and researcher pages."
            }
            action={
              !profileEditing ? (
                <Button type="button" variant="secondary" onClick={startProfileEdit}>
                  <PenLine className="h-4 w-4" />
                  Edit profile
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              )
            }
          >
            {profileEditing ? (
              <form id="account-profile-form" className="space-y-5" onSubmit={handleProfileSubmit}>
                {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

                {user && (
                  <ProfilePhotoEditor user={user} onUpdated={refreshUser} />
                )}

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

                <div className="grid gap-4 sm:grid-cols-3">
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
              <div className="space-y-6">
                {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

                <div className="flex items-start gap-4">
                  {user && (
                    <UserAvatar user={user} name={displayName} size="lg" className="!h-20 !w-20 !rounded-2xl !text-xl" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-ink">{displayName}</p>
                    {savedProfile.roleName && (
                      <p className="mt-1 text-sm text-slate-500">{savedProfile.roleName}</p>
                    )}
                    {savedProfile.email && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                        {savedProfile.email}
                      </p>
                    )}
                  </div>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <ProfileDetail label="Honorific" value={savedProfile.title || undefined} />
                  <ProfileDetail label="First name" value={savedProfile.firstname} />
                  <ProfileDetail label="Middle name" value={savedProfile.middlename} />
                  <ProfileDetail label="Last name" value={savedProfile.lastname} />
                  <ProfileDetail label="Affiliation" value={savedProfile.affiliation} />
                  <ProfileDetail label="Country" value={savedProfile.countryLabel} />
                  <ProfileDetail label="Phone" value={savedProfile.phone} />
                </dl>

                {savedProfile.interests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Research interests
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {savedProfile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  Email cannot be changed here. Use Edit profile to update your name, affiliation, and
                  interests.
                </p>
              </div>
            )}
          </SectionCard>
        </div>

        <aside className="order-1 space-y-4 xl:order-none xl:sticky xl:top-6">
          <AccountProfilePreview
            user={user}
            draft={previewProfile}
            publishedCount={stats?.published ?? 0}
            live={profileEditing}
          />

          <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            {profileEditing ? (
              <>
                <Button
                  type="submit"
                  form="account-profile-form"
                  className="w-full"
                  loading={profileMutation.isPending}
                  disabled={!isDirty && !profileMutation.isPending}
                >
                  Update profile
                </Button>
                {isDirty ? (
                  <p className="text-center text-xs text-amber-700">You have unsaved profile changes.</p>
                ) : (
                  <p className="text-center text-xs text-slate-500">
                    Name, affiliation, and interests save here. Profile photo saves separately above.
                  </p>
                )}
                <Button type="button" variant="secondary" className="w-full" onClick={cancelProfileEdit}>
                  Cancel editing
                </Button>
              </>
            ) : (
              <Button type="button" className="w-full" onClick={startProfileEdit}>
                <PenLine className="h-4 w-4" />
                Edit profile
              </Button>
            )}

            <button
              type="button"
              onClick={() => {
                setPasswordOpen((open) => !open);
                setPasswordMsg(null);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:bg-white hover:text-brand-700"
            >
              <KeyRound className="h-4 w-4 text-brand-600" />
              Change password
              {passwordOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
          </div>

          {passwordOpen && (
            <SectionCard icon={KeyRound} title="New password" description="Minimum 6 characters.">
              <form
                className="space-y-4"
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
                  className="w-full"
                  loading={passwordMutation.isPending}
                >
                  Save new password
                </Button>
              </form>
            </SectionCard>
          )}

          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5">
            <h3 className="text-sm font-semibold text-ink">Quick links</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/dashboard/publications"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-brand-700"
                >
                  <FileText className="h-4 w-4" />
                  My publications
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/messages"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" />
                  Messages
                </Link>
              </li>
              <li>
                <Link
                  to="/"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-600 transition hover:bg-white hover:text-brand-700"
                >
                  <Map className="h-4 w-4" />
                  Research map
                </Link>
              </li>
            </ul>
          </section>

          {profileEditing && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm xl:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="submit"
                form="account-profile-form"
                className="w-full"
                loading={profileMutation.isPending}
                disabled={!isDirty && !profileMutation.isPending}
              >
                Update profile
              </Button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
