import { ChevronDown, Globe, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { RequiredMark } from "../ui/RequiredField";
import {
  filterMeetingTimezones,
  formatTimezoneLabel,
  GRE_MEETING_TIMEZONE,
  listMeetingTimezones,
} from "../../lib/meetTimezones";

type Props = {
  label?: string;
  value: string;
  onChange: (timeZone: string) => void;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
};

export function TimezoneSelect({ label, value, onChange, required, disabled, hint }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const allOptions = useMemo(() => listMeetingTimezones(), []);
  const filtered = useMemo(() => filterMeetingTimezones(query, allOptions), [allOptions, query]);
  const selected = (value || "").trim() || GRE_MEETING_TIMEZONE;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      {label && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <label className="block text-sm font-medium text-ink">
            {label}
            {required ? <RequiredMark /> : null}
          </label>
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-2.5 text-left text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-brand-100 ${
          disabled
            ? "cursor-not-allowed border-slate-200 text-slate-400"
            : "border-slate-200 text-ink hover:border-brand-300 focus:border-brand-400"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Globe className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{formatTimezoneLabel(selected)}</span>
          <span className="block truncate text-xs text-slate-500">{selected}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or region…"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">No timezones match your search.</li>
            )}
            {filtered.map((tz) => {
              const active = tz === selected;
              return (
                <li key={tz}>
                  <button
                    type="button"
                    className={`flex w-full flex-col items-start px-4 py-2.5 text-left text-sm transition ${
                      active ? "bg-brand-50 text-brand-900" : "text-ink hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      onChange(tz);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="font-medium">{formatTimezoneLabel(tz)}</span>
                    <span className="text-xs text-slate-500">{tz}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
