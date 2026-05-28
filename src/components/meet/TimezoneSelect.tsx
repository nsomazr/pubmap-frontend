import { Check, ChevronDown, Globe, Search } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { greFieldClass } from "../../lib/formStyles";
import {
  filterMeetingTimezones,
  formatTimezoneLabel,
  GRE_MEETING_TIMEZONE,
  listMeetingTimezones,
  POPULAR_MEETING_TIMEZONES,
} from "../../lib/meetTimezones";
import { RequiredMark } from "../ui/RequiredField";

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
  const [menuStyle, setMenuStyle] = useState({ top: 0, left: 0, width: 280 });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const allOptions = useMemo(() => listMeetingTimezones(), []);
  const filtered = useMemo(() => filterMeetingTimezones(query, allOptions), [allOptions, query]);
  const selected = (value || "").trim() || GRE_MEETING_TIMEZONE;
  const showPopular = !query.trim();

  const updateMenuPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuStyle({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 300),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onLayout = () => updateMenuPosition();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const menu = document.getElementById("gre-timezone-menu");
      if (menu?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const menu = open && !disabled ? (
    <div
      id="gre-timezone-menu"
      role="listbox"
      className="fixed z-[200] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
      style={{ top: menuStyle.top, left: menuStyle.left, width: menuStyle.width }}
    >
      <div className="border-b border-slate-100 bg-slate-50/80 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city or region"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            autoFocus
          />
        </div>
        {showPopular && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {POPULAR_MEETING_TIMEZONES.slice(0, 8).map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => {
                  onChange(tz);
                  setOpen(false);
                  setQuery("");
                }}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  tz === selected
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-800"
                }`}
              >
                {formatTimezoneLabel(tz).split(" (")[0]}
              </button>
            ))}
          </div>
        )}
      </div>
      <ul className="max-h-52 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-500">No timezones match your search.</li>
        )}
        {filtered.map((tz) => {
          const active = tz === selected;
          return (
            <li key={tz}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${
                  active ? "bg-brand-50 text-brand-900" : "text-ink hover:bg-slate-50"
                }`}
                onClick={() => {
                  onChange(tz);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{formatTimezoneLabel(tz)}</span>
                  <span className="block truncate text-xs text-slate-500">{tz}</span>
                </span>
                {active ? <Check className="h-4 w-4 shrink-0 text-brand-600" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="space-y-1.5">
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
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={`${greFieldClass} flex w-full items-center gap-2.5 text-left ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        } ${open ? "!border-brand-400 !ring-2 !ring-brand-100" : ""}`}
      >
        <Globe className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="min-w-0 flex-1 truncate font-medium text-ink">{formatTimezoneLabel(selected)}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
