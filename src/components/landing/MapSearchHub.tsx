import {
  Building2,
  BookOpen,
  ChevronRight,
  GripVertical,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMapPanelLayout } from "../../context/MapPanelLayoutContext";
import { usePopularInstitutions } from "../../lib/institutions";
import { CategorySubcategoryPicker } from "../forms/CategorySubcategoryPicker";
import type { Category, Publication, SubCategory } from "../../types";
import {
  MapFilterChips,
  buildMapFilterChips,
  buildSearchSuggestions,
} from "./mapSearchFilters";

interface Props {
  author: string;
  affiliation: string;
  title: string;
  categoryId: string;
  subCategoryId: string;
  categories: Category[];
  subCategories: SubCategory[];
  suggestionSource: Publication[];
  resultCount: number;
  searching: boolean;
  hasResults: boolean;
  /** When true, the mobile results sheet is expanded (hide duplicate results chip). */
  resultsPanelVisible?: boolean;
  onOpenResults: () => void;
  onAuthorChange: (v: string) => void;
  onAffiliationChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSubCategoryChange: (v: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  onClear: () => void;
}

function SuggestionList({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5">
      {items.map((item) => (
        <li key={item}>
          <button
            type="button"
            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-800"
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(item);
            }}
          >
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

function DragHandle({ className = "" }: { className?: string }) {
  const { dragHandlers, isCompact, dragEnabled } = useMapPanelLayout();
  if (isCompact || !dragEnabled) return null;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drag search panel"
      onPointerDown={dragHandlers.onPointerDown}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
      onPointerCancel={dragHandlers.onPointerUp}
      className={`map-drag-handle flex shrink-0 cursor-grab items-center justify-center text-slate-400 transition hover:text-brand-600 active:cursor-grabbing ${className}`}
    >
      <GripVertical className="h-5 w-5" />
    </div>
  );
}

function MapSearchField({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  showSuggestions,
  suggestions,
  onPickSuggestion,
  listId,
  autoFocus,
}: {
  icon: typeof BookOpen;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showSuggestions?: boolean;
  suggestions?: string[];
  onPickSuggestion?: (value: string) => void;
  listId?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <label className="map-search-field flex items-start gap-3 rounded-xl border border-slate-100/90 bg-slate-50/60 px-3 py-2.5 transition focus-within:border-brand-200 focus-within:bg-white focus-within:shadow-sm focus-within:ring-2 focus-within:ring-brand-100/90">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm ring-1 ring-slate-100/90">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </span>
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            list={listId}
            autoFocus={autoFocus}
            className="map-search-field-input w-full border-0 bg-transparent p-0 text-sm leading-snug text-ink placeholder:text-slate-400"
            autoComplete="off"
          />
        </span>
      </label>
      {showSuggestions && suggestions && suggestions.length > 0 && onPickSuggestion && (
        <SuggestionList items={suggestions} onPick={onPickSuggestion} />
      )}
    </div>
  );
}

export function MapSearchHub({
  author,
  affiliation,
  title,
  categoryId,
  subCategoryId,
  categories,
  subCategories,
  suggestionSource,
  resultCount,
  searching,
  hasResults,
  resultsPanelVisible = false,
  onOpenResults,
  onAuthorChange,
  onAffiliationChange,
  onTitleChange,
  onCategoryChange,
  onSubCategoryChange,
  onSearch,
  onClear,
}: Props) {
  const { expandUpward, isCompact } = useMapPanelLayout();
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [authorFocused, setAuthorFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [categoryId, subCategoryId].filter(Boolean).length;
  const hasInput = author || affiliation || title || categoryId || subCategoryId;

  const filterChips = useMemo(
    () =>
      buildMapFilterChips({
        author,
        affiliation,
        title,
        categoryId,
        subCategoryId,
        categories,
        allSubCategories: subCategories,
        onAuthorChange,
        onAffiliationChange,
        onTitleChange,
        onCategoryChange,
        onSubCategoryChange,
      }),
    [
      author,
      affiliation,
      title,
      categoryId,
      subCategoryId,
      categories,
      subCategories,
      onAuthorChange,
      onAffiliationChange,
      onTitleChange,
      onCategoryChange,
      onSubCategoryChange,
    ]
  );

  const { data: popularInstitutions = [] } = usePopularInstitutions(16);

  const suggestions = useMemo(() => {
    const base = buildSearchSuggestions(suggestionSource);
    const registry = popularInstitutions.map((row) => row.label);
    const institutions = [...new Set([...base.institutions, ...registry])].slice(0, 24);
    return { ...base, institutions };
  }, [suggestionSource, popularInstitutions]);

  const titleSuggestions = useMemo(() => {
    const q = title.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return suggestions.titles
      .filter((t) => t.toLowerCase().includes(q) && t.toLowerCase() !== q)
      .slice(0, 6);
  }, [title, suggestions.titles]);

  const authorSuggestions = useMemo(() => {
    const q = author.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return suggestions.authors
      .filter((a) => a.toLowerCase().includes(q) && a.toLowerCase() !== q)
      .slice(0, 6);
  }, [author, suggestions.authors]);

  useEffect(() => {
    if (categoryId || subCategoryId) setShowFilters(true);
  }, [categoryId, subCategoryId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-gre-picker-menu]")) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const summary =
    filterChips.map((c) => c.label).join(" · ") ||
    [author, affiliation, title].filter(Boolean).join(" · ") ||
    "Search publications on the map";

  const filterChipsRow =
    filterChips.length > 0 ? (
      <MapFilterChips
        chips={filterChips}
        onClearAll={onClear}
        className="px-1 pt-1"
      />
    ) : null;

  const collapsedBar = (
    <div className="map-search-hub-trigger flex w-full flex-col gap-1.5">
      <div className="flex w-full items-stretch overflow-hidden rounded-full bg-white/95 text-left shadow-lg shadow-slate-900/10 ring-1 ring-white/90 backdrop-blur-xl transition hover:shadow-xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-1"
        >
          <Search className="h-5 w-5 shrink-0 text-brand-600" />
          <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
            {hasInput ? summary : "Search publications, authors, institutions…"}
          </span>
          {(activeFilterCount > 0 || hasInput) && (
            <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {filterChips.length || activeFilterCount || "•"}
            </span>
          )}
        </button>
        {!isCompact && (
          <>
            <div className="w-px shrink-0 self-center bg-slate-200/80" aria-hidden />
            <DragHandle className="self-stretch px-3" />
          </>
        )}
      </div>
      {filterChipsRow}
    </div>
  );

  const searchForm = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(e);
        setOpen(false);
      }}
      className="map-search-hub-form overflow-hidden rounded-2xl bg-white/95 shadow-xl shadow-slate-900/15 ring-1 ring-white/90 backdrop-blur-xl"
    >
      <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-4">
        <DragHandle className="mt-0.5 rounded-lg p-1 hover:bg-slate-100" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-ink">Search map</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Find publications by title, author, or institution
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {filterChipsRow && (
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">{filterChipsRow}</div>
      )}

      <div className="space-y-2.5 px-4 py-4">
        <MapSearchField
          icon={BookOpen}
          label="Title or keywords"
          placeholder="e.g. coastal erosion or gre-2026-000123"
          value={title}
          onChange={onTitleChange}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => window.setTimeout(() => setTitleFocused(false), 120)}
          showSuggestions={titleFocused}
          suggestions={titleSuggestions}
          onPickSuggestion={onTitleChange}
          autoFocus
        />
        <MapSearchField
          icon={User}
          label="Author"
          placeholder="Researcher name"
          value={author}
          onChange={onAuthorChange}
          onFocus={() => setAuthorFocused(true)}
          onBlur={() => window.setTimeout(() => setAuthorFocused(false), 120)}
          showSuggestions={authorFocused}
          suggestions={authorSuggestions}
          onPickSuggestion={onAuthorChange}
        />
        <MapSearchField
          icon={Building2}
          label="Institution"
          placeholder="University or organization"
          value={affiliation}
          onChange={onAffiliationChange}
          listId="map-affiliation-suggestions"
        />
        <datalist id="map-affiliation-suggestions">
          {suggestions.institutions.map((inst) => (
            <option key={inst} value={inst} />
          ))}
        </datalist>
      </div>

      {(showFilters || categoryId || subCategoryId) && (
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/90 to-white px-4 py-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Research area
          </p>
          <CategorySubcategoryPicker
            categories={categories}
            allSubCategories={subCategories}
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            onCategoryChange={(id) => {
              onCategoryChange(id);
              if (!id) onSubCategoryChange("");
            }}
            onSubCategoryChange={onSubCategoryChange}
            filterMode
            variant="map"
            categoryLabel="Category"
            subCategoryLabel="Subcategory"
            categoryPlaceholder="All categories"
            subCategoryPlaceholder="All subcategories"
          />
        </div>
      )}

      <div className="space-y-2.5 border-t border-slate-100 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              showFilters || activeFilterCount
                ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200/80"
                : "text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-brand-600 px-1.5 text-[10px] text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {hasInput && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setShowFilters(false);
              }}
              className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            >
              Clear all
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={searching}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {searching ? "Searching…" : "Search map"}
        </button>
      </div>
    </form>
  );

  const resultsBtn = hasResults && !open && !resultsPanelVisible && (
    <button
      type="button"
      onClick={onOpenResults}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-600/95 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-brand-700"
    >
      {resultCount} result{resultCount !== 1 ? "s" : ""}
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div
      ref={panelRef}
      className={`map-search-hub flex w-full max-w-lg flex-col gap-2 ${
        expandUpward ? "map-search-hub--up" : ""
      }`}
    >
      {expandUpward ? (
        <>
          {resultsBtn}
          {open ? searchForm : collapsedBar}
        </>
      ) : (
        <>
          {open ? searchForm : collapsedBar}
          {resultsBtn}
        </>
      )}
    </div>
  );
}
