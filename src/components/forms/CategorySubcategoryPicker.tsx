import { Check, ChevronDown, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import { resolveCategoryVisual, resolveSubcategoryFromModel } from "../../lib/taxonomyVisuals";
import type { Category, SubCategory, SubcategoryVisual as Visual } from "../../types";
import { RequiredMark } from "../ui/RequiredField";

interface MenuRect {
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
  top: number;
}

interface DropdownOption {
  value: string;
  label: string;
  visual?: Visual | null;
}

interface PickerDropdownProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: DropdownOption[];
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  showClear?: boolean;
  clearLabel?: string;
  variant?: "default" | "map";
  onChange: (value: string) => void;
}

function PickerDropdown({
  id,
  label,
  placeholder,
  value,
  options,
  disabled = false,
  required,
  searchable = false,
  showClear = false,
  clearLabel,
  variant = "default",
  onChange,
}: PickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const updateMenuRect = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - r.bottom - gap - 12;
    const spaceAbove = r.top - gap - 12;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(300, Math.max(140, openUp ? spaceAbove : spaceBelow));
    setMenuRect({
      left: r.left,
      width: r.width,
      maxHeight,
      openUp,
      top: openUp ? r.top - gap : r.bottom + gap,
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const listMaxHeight = menuRect ? Math.max(96, menuRect.maxHeight - (searchable ? 52 : 8)) : 220;

  const isMap = variant === "map";
  const labelClass = isMap
    ? "text-[11px] font-semibold uppercase tracking-wider text-slate-400"
    : "text-sm font-semibold text-ink";

  const triggerClass = isMap
    ? `flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm shadow-sm transition focus:outline-none ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-50/80 text-slate-400"
          : open
            ? "border-brand-400 ring-2 ring-brand-100"
            : "border-slate-200/90 text-ink hover:border-slate-300 hover:shadow-md"
      }`
    : `flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-left text-sm shadow-sm transition focus:outline-none ${
        disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : open
            ? "border-brand-400 ring-2 ring-brand-100"
            : "border-slate-200 text-ink hover:border-slate-300"
      }`;

  const menu = open && menuRect && createPortal(
    <div
      ref={menuRef}
      data-gre-picker-menu
      className="fixed z-[10000] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xl ring-1 ring-slate-900/5"
      role="listbox"
      style={{
        left: menuRect.left,
        width: menuRect.width,
        maxHeight: menuRect.maxHeight,
        ...(menuRect.openUp
          ? { bottom: window.innerHeight - menuRect.top }
          : { top: menuRect.top }),
      }}
    >
      {searchable && (
        <div className="border-b border-slate-100 bg-slate-50/50 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              autoFocus
              className="w-full rounded-lg border border-slate-200/80 bg-white py-2 pl-8 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-400 gre-field focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      )}
      <ul className="overflow-y-auto overscroll-contain py-1" style={{ maxHeight: listMaxHeight }}>
        {showClear && clearLabel && (
          <li>
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
              className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                !value ? "bg-brand-50/80 font-medium text-brand-800" : "text-slate-600"
              }`}
            >
              <span>{clearLabel}</span>
              {!value && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
            </button>
          </li>
        )}
        {filtered.length === 0 ? (
          <li className="px-3.5 py-4 text-center text-sm text-slate-500">No matches</li>
        ) : (
          filtered.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value || "__empty"}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition ${
                    active
                      ? "bg-brand-50 font-medium text-brand-800"
                      : "text-ink hover:bg-slate-50"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {opt.visual && (
                      <SubcategoryVisual visual={opt.visual} size="xs" className="!shadow-none" />
                    )}
                    <span className="min-w-0 truncate">{opt.label}</span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>,
    document.body
  );

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={`block ${labelClass}`}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`min-w-0 truncate ${selected ? "text-ink" : "text-slate-400"}`}>
          <span className="inline-flex items-center gap-2">
            {selected?.visual && (
              <SubcategoryVisual visual={selected.visual} size="xs" className="!shadow-none" />
            )}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-brand-600" : ""}`}
        />
      </button>
      {menu}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          value={value}
          required
          onChange={() => {}}
        />
      )}
    </div>
  );
}

interface Props {
  categories: Category[];
  /** Flat subcategory list from /map/ when nested category.sub_categories is empty */
  allSubCategories?: SubCategory[];
  categoryId: string;
  subCategoryId: string;
  onCategoryChange: (id: string) => void;
  onSubCategoryChange: (id: string) => void;
  categoryLabel?: string;
  subCategoryLabel?: string;
  categoryPlaceholder?: string;
  subCategoryPlaceholder?: string;
  required?: boolean;
  filterMode?: boolean;
  variant?: "default" | "map";
  className?: string;
}

export function CategorySubcategoryPicker({
  categories,
  allSubCategories = [],
  categoryId,
  subCategoryId,
  onCategoryChange,
  onSubCategoryChange,
  categoryLabel = "Field",
  subCategoryLabel = "Subfield",
  categoryPlaceholder = "Select field",
  subCategoryPlaceholder = "Select subfield",
  required,
  filterMode = false,
  variant = "default",
  className = "",
}: Props) {
  const baseId = useId();

  const nestedForCategory = useCallback(
    (catId: string) => {
      const fromNested =
        categories.find((c) => String(c.id) === catId)?.sub_categories ?? [];
      if (fromNested.length > 0) return fromNested;
      return allSubCategories.filter((s) => String(s.category_id) === catId);
    },
    [categories, allSubCategories]
  );

  const subCategories: SubCategory[] = useMemo(() => {
    if (categoryId) {
      return nestedForCategory(categoryId);
    }
    const nestedAll = categories.flatMap((c) => c.sub_categories ?? []);
    if (nestedAll.length > 0) return nestedAll;
    return allSubCategories;
  }, [categories, categoryId, allSubCategories, nestedForCategory]);

  // Drop subcategory selection if it no longer matches the chosen category
  useEffect(() => {
    if (!subCategoryId || !categoryId) return;
    const valid = subCategories.some((s) => String(s.id) === subCategoryId);
    if (!valid) onSubCategoryChange("");
  }, [categoryId, subCategoryId, subCategories, onSubCategoryChange]);

  const categoryOptions: DropdownOption[] = useMemo(
    () =>
      categories.map((c) => ({
        value: String(c.id),
        label: c.name,
        visual: c.visual ?? resolveCategoryVisual(c.name),
      })),
    [categories]
  );

  const subOptions: DropdownOption[] = useMemo(
    () =>
      subCategories.map((s) => ({
        value: String(s.id),
        label: s.name,
        visual: resolveSubcategoryFromModel(s),
      })),
    [subCategories]
  );

  const categoryDisabled = categories.length === 0;
  const subDisabled =
    subCategories.length === 0 || (!filterMode && !categoryId);

  const subPlaceholder =
    subCategories.length === 0
      ? filterMode
        ? categoryId
          ? "No subfields in this field"
          : "All subfields"
        : "Choose a field first"
      : subCategoryPlaceholder;

  const gridClass =
    variant === "map"
      ? "grid gap-3 sm:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2";

  return (
    <div className={`${gridClass} ${className}`}>
      <PickerDropdown
        id={`${baseId}-cat`}
        label={categoryLabel}
        placeholder={categoryDisabled ? "No categories" : categoryPlaceholder}
        value={categoryId}
        options={categoryOptions}
        disabled={categoryDisabled}
        required={required}
        searchable={categoryOptions.length > 6}
        showClear={filterMode}
        clearLabel={categoryPlaceholder}
        variant={variant}
        onChange={(id) => {
          onCategoryChange(id);
          onSubCategoryChange("");
          if (id && filterMode) {
            window.setTimeout(() => {
              document.getElementById(`${baseId}-sub`)?.click();
            }, 0);
          }
        }}
      />
      <PickerDropdown
        id={`${baseId}-sub`}
        label={subCategoryLabel}
        placeholder={subPlaceholder}
        value={subCategoryId}
        options={subOptions}
        disabled={subDisabled}
        required={required}
        searchable
        showClear={filterMode}
        clearLabel={subCategoryPlaceholder}
        variant={variant}
        onChange={(id) => {
          onSubCategoryChange(id);
          if (id && !categoryId) {
            const sub = categories
              .flatMap((c) => c.sub_categories ?? [])
              .find((s) => String(s.id) === id);
            if (sub?.category_id) onCategoryChange(String(sub.category_id));
          }
        }}
      />
    </div>
  );
}
