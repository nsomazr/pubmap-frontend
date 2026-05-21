import type { User } from "../types";

const HONORIFICS = new Set(["mr", "mrs", "miss", "ms", "dr", "prof"]);

/** First name for greetings — never uses honorific (Mr, Dr, etc.). */
export function userFirstName(user?: Pick<User, "firstname"> | null): string {
  return user?.firstname?.trim() || "Researcher";
}

/** Full name without honorific. */
export function userFullName(
  user?: Pick<User, "firstname" | "middlename" | "lastname" | "full_name"> | null
): string {
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

export const SIGNUP_HONORIFIC_KEY = "gre-signup-honorific";

/** Author line for cards (formal name when honorific is set). */
export function authorDisplayName(
  author?: Pick<User, "title" | "firstname" | "middlename" | "lastname" | "full_name" | "formal_name"> | null
): string {
  if (!author) return "";
  if (author.formal_name?.trim()) return author.formal_name.trim();
  return userFormalName(author);
}
