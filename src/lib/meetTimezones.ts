export const GRE_MEETING_TIMEZONE = "Africa/Dar_es_Salaam";

/** Shown first in the timezone picker. */
export const POPULAR_MEETING_TIMEZONES = [
  "Africa/Dar_es_Salaam",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Africa/Lagos",
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
] as const;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  const hourRaw = pick("hour");
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    hour: Number(hourRaw === "24" ? "0" : hourRaw),
    minute: Number(pick("minute")),
  };
}

export function formatTimezoneLabel(timeZone: string, at: Date = new Date()): string {
  const tz = (timeZone || "").trim() || GRE_MEETING_TIMEZONE;
  try {
    const parts = new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return offset ? `${city} (${offset})` : city;
  } catch {
    return tz;
  }
}

export function listMeetingTimezones(): string[] {
  const supported =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl as typeof Intl & { supportedValuesOf: (key: string) => string[] }).supportedValuesOf(
          "timeZone"
        )
      : [];
  const merged = new Set<string>([...POPULAR_MEETING_TIMEZONES, GRE_MEETING_TIMEZONE, ...supported]);
  const popular = POPULAR_MEETING_TIMEZONES.filter((tz) => merged.has(tz));
  const rest = [...merged]
    .filter((tz) => !popular.includes(tz as (typeof POPULAR_MEETING_TIMEZONES)[number]))
    .sort((a, b) => formatTimezoneLabel(a).localeCompare(formatTimezoneLabel(b)));
  return [...popular, ...rest];
}

export function filterMeetingTimezones(query: string, options: string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((tz) => {
    const label = formatTimezoneLabel(tz).toLowerCase();
    return tz.toLowerCase().includes(q) || label.includes(q);
  });
}

/** Interpret datetime-local value as wall time in the given IANA timezone → UTC ISO string. */
export function wallTimeToUtcIso(localValue: string, timeZone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localValue.trim());
  if (!match) return new Date(localValue).toISOString();

  const target = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const tz = (timeZone || "").trim() || GRE_MEETING_TIMEZONE;
  let guess = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);

  for (let i = 0; i < 8; i += 1) {
    const actual = getZonedParts(new Date(guess), tz);
    if (
      actual.year === target.year &&
      actual.month === target.month &&
      actual.day === target.day &&
      actual.hour === target.hour &&
      actual.minute === target.minute
    ) {
      return new Date(guess).toISOString();
    }
    const targetMs = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    const actualMs = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    guess += targetMs - actualMs;
  }
  return new Date(guess).toISOString();
}

/** Format a UTC instant for datetime-local input in the given timezone. */
export function utcToWallInputValue(iso?: string | null, timeZone?: string | null): string {
  if (!iso) return "";
  const tz = (timeZone || "").trim() || GRE_MEETING_TIMEZONE;
  try {
    const parts = getZonedParts(new Date(iso), tz);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
  } catch {
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}

export function previewScheduledAt(localValue: string, timeZone: string): string {
  if (!localValue) return "";
  try {
    const iso = wallTimeToUtcIso(localValue, timeZone);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: (timeZone || "").trim() || GRE_MEETING_TIMEZONE,
      timeZoneName: "long",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
