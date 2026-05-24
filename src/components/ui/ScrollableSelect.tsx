import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export interface ScrollableSelectOption {
  value: string;
  label: string;
}

interface MenuRect {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: ScrollableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  icon?: ReactNode;
  id?: string;
  "aria-label"?: string;
  maxMenuHeight?: number;
}

export function ScrollableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  required = false,
  className = "",
  triggerClassName = "",
  icon,
  id,
  "aria-label": ariaLabel,
  maxMenuHeight = 240,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selected = options.find((row) => row.value === value);
  const displayLabel = selected?.label || placeholder;

  const updateMenuRect = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const openUpward = spaceBelow < 160 && spaceAbove > spaceBelow;
    const available = openUpward ? spaceAbove : spaceBelow;

    setMenuRect({
      left: rect.left,
      top: openUpward ? rect.top - gap : rect.bottom + gap,
      width: rect.width,
      maxHeight: Math.min(maxMenuHeight, Math.max(120, available)),
    });
  }, [maxMenuHeight]);

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
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && menuRect
      ? createPortal(
          <ul
            ref={menuRef}
            id={id ? `${id}-listbox` : undefined}
            role="listbox"
            data-gre-picker-menu
            className="gre-scrollable-select-menu fixed z-[10000] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1 shadow-2xl ring-1 ring-slate-900/5"
            style={{
              left: menuRect.left,
              top: menuRect.top,
              width: menuRect.width,
              maxHeight: menuRect.maxHeight,
              transform: menuRect.top < (triggerRef.current?.getBoundingClientRect().top ?? 0)
                ? "translateY(-100%)"
                : undefined,
            }}
          >
            {options.map((row) => {
              const active = row.value === value;
              return (
                <li key={row.value || `placeholder-${row.label}`} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(row.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-brand-50 font-semibold text-brand-800"
                        : "text-ink hover:bg-slate-50"
                    } ${row.value === "__custom__" ? "border-t border-slate-100 mt-1 pt-2.5 text-brand-700" : ""}`}
                  >
                    <span className="min-w-0 flex-1 leading-snug">{row.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required || undefined}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={`flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-left text-sm shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60 ${triggerClassName}`}
      >
        {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-ink" : "text-slate-400"}`}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {menu}
    </div>
  );
}
