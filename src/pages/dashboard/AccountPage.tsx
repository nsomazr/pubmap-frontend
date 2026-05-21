import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  FileText,
  KeyRound,
  Mail,
  Map,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { GreHeroBanner } from "../../components/ui/GreHeroBanner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { HONORIFIC_OPTIONS, userFormalName } from "../../lib/userDisplay";
import type { DashboardStats } from "../../types";

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
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-1 ring-red-100"
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
  children,
}: {
  icon: typeof User;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function AccountPage() {
  const { user, refreshUser } = useAuth();
  const [title, setTitle] = useState("");
  const [firstname, setFirstname] = useState("");
  const [middlename, setMiddlename] = useState("");
  const [lastname, setLastname] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [areaOfStudy, setAreaOfStudy] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    if (!user) return;
    setTitle(user.title || "");
    setFirstname(user.firstname || "");
    setMiddlename(user.middlename || "");
    setLastname(user.lastname || "");
    setAffiliation(user.affiliation || "");
    setAreaOfStudy(user.area_of_study || "");
    setPhone(user.phone || "");
    setPhoto(user.photo || "");
    setPhotoError(false);
  }, [user]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats/");
      return data;
    },
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      api.patch("/auth/me/", {
        title,
        firstname,
        middlename,
        lastname,
        affiliation,
        area_of_study: areaOfStudy,
        phone,
        photo: photo || undefined,
      }),
    onSuccess: async () => {
      await refreshUser();
      setProfileMsg({ type: "success", text: "Profile saved successfully." });
    },
    onError: () => {
      setProfileMsg({ type: "error", text: "Could not save profile. Check your details." });
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
    },
    onError: () => {
      setPasswordMsg({ type: "error", text: "Could not change password. Check your current password." });
    },
  });

  const displayName =
    user?.full_name ||
    [title, firstname, middlename, lastname].filter(Boolean).join(" ").trim() ||
    "Your profile";

  const initials = `${firstname?.[0] || ""}${lastname?.[0] || ""}`.toUpperCase() || "?";

  const statItems = [
    {
      label: "Published",
      value: stats?.published ?? 0,
      color: "text-emerald-700",
      bg: "hover:bg-emerald-50/80",
      status: "3",
    },
    {
      label: "Pending",
      value: stats?.pending ?? 0,
      color: "text-amber-700",
      bg: "hover:bg-amber-50/80",
      status: "1",
    },
    {
      label: "Revision",
      value: stats?.commented ?? 0,
      color: "text-orange-700",
      bg: "hover:bg-orange-50/80",
      status: "2",
    },
    {
      label: "Drafts",
      value: stats?.drafts ?? 0,
      color: "text-slate-700",
      bg: "hover:bg-slate-100/80",
      status: "0",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Account"
        description="Your public researcher identity, contact details, and sign-in security."
      />

      <GreHeroBanner
        className="account-hero mb-8"
        photoUrl={user?.photo}
        initials={initials}
        avatarBadge={
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
            <CheckCircle2 className="h-3 w-3 text-white" />
          </span>
        }
        title={
          <div className="flex flex-wrap items-center gap-2">
            {displayName}
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-100">
              {user?.role_name || "Author"}
            </span>
          </div>
        }
        subtitle={
          <ul className="space-y-1">
            <li className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{user?.email}</span>
            </li>
            {affiliation && (
              <li className="flex items-center gap-2 text-sm text-slate-600">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="line-clamp-1">{affiliation}</span>
              </li>
            )}
          </ul>
        }
        actions={
          <Link
            to="/"
            className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
          >
            <Map className="h-4 w-4 text-brand-600" />
            View map
          </Link>
        }
      >
        <div className="account-hero-stats grid grid-cols-2 gap-2 border-t border-slate-100 pt-5 sm:grid-cols-4">
          {statItems.map(({ label, value, color, bg, status }) => (
            <Link
              key={label}
              to={`/dashboard/publications?status=${status}`}
              className={`flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 transition ${bg}`}
            >
              <span className="text-xs font-medium text-slate-600">{label}</span>
              <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
            </Link>
          ))}
        </div>
      </GreHeroBanner>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="space-y-6">
          <SectionCard
            icon={User}
            title="Profile details"
            description="Shown on publications, forum posts, and your map author card."
          >
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setProfileMsg(null);
                profileMutation.mutate();
              }}
            >
              {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}

              <div className="grid gap-4 sm:grid-cols-2">
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
                <Input
                  label="Profile photo URL"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="https://…"
                />
              </div>

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

              <Input
                label="Affiliation / institution"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="University, lab, or organization"
              />

              <Input
                label="Areas of study / interests"
                value={areaOfStudy}
                onChange={(e) => setAreaOfStudy(e.target.value)}
                placeholder="e.g. Hydrogeology, geochemistry, environmental geology"
              />

              <Input
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
                <Button type="submit" loading={profileMutation.isPending}>
                  Save changes
                </Button>
                <p className="text-xs text-slate-400">Email cannot be changed here.</p>
              </div>
            </form>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            icon={KeyRound}
            title="Password"
            description="Use a strong password you do not use elsewhere."
          >
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
              <Button type="submit" variant="secondary" className="w-full" loading={passwordMutation.isPending}>
                Update password
              </Button>
            </form>
          </SectionCard>

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

          <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-xs leading-relaxed text-slate-600">
              Your profile appears on published studies and forum discussions. Keep affiliation
              and name accurate so collaborators can find you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
