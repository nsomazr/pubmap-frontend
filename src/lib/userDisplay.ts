import type { User } from "../types";

const HONORIFICS = new Set(["mr", "mrs", "miss", "ms", "dr", "prof"]);

/** First name for greetings  -  never uses honorific (Mr, Dr, etc.). */
export function userFirstName(user?: Pick<User, "firstname"> | null): string {
  return user?.firstname?.trim() || "Researcher";
}

export type UserNameLike = {
  firstname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
  full_name?: string | null;
};

/** Full name without honorific. */
export function userFullName(user?: UserNameLike | null): string {
  const parts = [user?.firstname, user?.middlename, user?.lastname].filter((p) => p?.trim());
  if (parts.length) return parts.join(" ");

  const legacy = user?.full_name?.trim();
  if (!legacy) return "Researcher";

  const tokens = legacy.split(/\s+/);
  const first = tokens[0]?.replace(/,$/, "").toLowerCase();
  if (first && HONORIFICS.has(first)) {
    return tokens.slice(1).join(" ") || legacy;
  }
  return legacy;
}

/** Honorific + name (e.g. Dr Jane Doe) for formal display. */
export function userFormalName(
  user?: Pick<User, "title" | "firstname" | "middlename" | "lastname" | "full_name"> | null
): string {
  const base = userFullName(user);
  const honorific = user?.title?.trim();
  if (honorific) return `${honorific} ${base}`;
  return base;
}

export const HONORIFIC_OPTIONS = ["", "Mr", "Mrs", "Miss", "Ms", "Dr", "Prof"] as const;

/** Author line for cards (formal name when honorific is set). */
export function authorDisplayName(
  author?: Pick<User, "title" | "firstname" | "middlename" | "lastname" | "full_name" | "formal_name"> | null
): string {
  if (!author) return "";
  if (author.formal_name?.trim()) return author.formal_name.trim();
  return userFormalName(author);
}

export function userInitials(
  user?: Pick<User, "firstname" | "lastname" | "full_name"> | null
): string {
  const first = user?.firstname?.trim()?.[0] ?? "";
  const last = user?.lastname?.trim()?.[0] ?? "";
  if (first || last) return `${first}${last}`.toUpperCase();
  const legacy = user?.full_name?.trim();
  if (legacy) {
    const parts = legacy.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0]?.slice(0, 2).toUpperCase() || "?";
  }
  return "?";
}

export function userInitialsFromName(name?: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrator",
  Adminstrator: "Administrator",
  Author: "Author",
};

export function displayRoleName(role?: string | null): string {
  const raw = role?.trim();
  if (!raw) return "Author";
  return ROLE_LABELS[raw] || raw;
}
