import { Building2, Loader2, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  normalizeInstitutionLabel,
  searchInstitutions,
  usePopularInstitutions,
  type Institution,
} from "../../lib/institutions";

interface MenuRect {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

interface Props {
  value: string;
  onChange: (label: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  hideLabel?: boolean;
  hideHint?: boolean;
}

export function InstitutionPicker({
  value,
  onChange,
  label = "Institution / affiliation",
  placeholder = "Search or type your university or organization…",
  required,
  className = "",
  inputClassName = "",
  hideLabel = false,
  hideHint = false,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Institution[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const { data: popular = [] } = usePopularInstitutions(8);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const pick = useCallback(
    (institutionLabel: string) => {
      const next = normalizeInstitutionLabel(institutionLabel);
      onChange(next);
      setQuery(next);
      setOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchInstitutions(q, 10)
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const updateMenuRect = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    setMenuRect({
      left: rect.left,
      top: rect.bottom + gap,
      width: rect.width,
      maxHeight: Math.min(280, Math.max(120, spaceBelow)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    updateMenuRect();
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [open, updateMenuRect]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const suggestions = query.trim().length >= 2 ? results : popular;

  const menu =
    open && suggestions.length > 0 && menuRect
      ? createPortal(
          <ul
            ref={menuRef}
            data-gre-picker-menu
            className="gre-scrollable-select-menu fixed z-[10000] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xl ring-1 ring-slate-900/5"
            style={{
              left: menuRect.left,
              top: menuRect.top,
              width: menuRect.width,
              maxHeight: menuRect.maxHeight,
            }}
          >
            {suggestions.map((row) => (
              <li key={`${row.id}-${row.label}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(row.label)}
                  className="gre-interactive flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-brand-50/80"
                >
                  <Building2 className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="min-w-0 flex-1 truncate font-medium text-ink">{row.label}</span>
                  {(row.usage_count ?? 0) > 0 && (
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {row.usage_count} uses
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {!hideLabel && (
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          required={required}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              onChange(normalizeInstitutionLabel(query));
            }, 150);
          }}
          className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${inputClassName}`}
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-600" />
        )}
      </div>
      {!hideHint && (
        <p className="mt-1.5 text-xs text-slate-500">
          Pick a suggested institution for consistent rankings and map search.
        </p>
      )}
      {menu}
    </div>
  );
}
