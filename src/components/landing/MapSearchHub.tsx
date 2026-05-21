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
import { useEffect, useRef, useState } from "react";
import { useMapPanelLayout } from "../../context/MapPanelLayoutContext";
import { CategorySubcategoryPicker } from "../forms/CategorySubcategoryPicker";
import type { Category, SubCategory } from "../../types";

interface Props {
  author: string;
  affiliation: string;
  title: string;
  categoryId: string;
  subCategoryId: string;
  categories: Category[];
  subCategories: SubCategory[];
  resultCount: number;
  searching: boolean;
  hasResults: boolean;
  onOpenResults: () => void;
  onAuthorChange: (v: string) => void;
  onAffiliationChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSubCategoryChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onClear: () => void;
}

export function MapSearchHub({
  author,
  affiliation,
  title,
  categoryId,
  subCategoryId,
  categories,
  subCategories,
  resultCount,
  searching,
  hasResults,
  onOpenResults,
  onAuthorChange,
  onAffiliationChange,
  onTitleChange,
  onCategoryChange,
  onSubCategoryChange,
  onSearch,
  onClear,
}: Props) {
  const { expandUpward, dragHandlers, isCompact } = useMapPanelLayout();
  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeFilterCount = [categoryId, subCategoryId].filter(Boolean).length;
  const hasInput = author || affiliation || title || categoryId || subCategoryId;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const summary =
    [author, affiliation, title].filter(Boolean).join(" · ") ||
    "Search publications on the map";

  const dragGrip = !isCompact ? (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drag search panel"
      onPointerDown={dragHandlers.onPointerDown}
      onPointerMove={dragHandlers.onPointerMove}
      onPointerUp={dragHandlers.onPointerUp}
      onPointerCancel={dragHandlers.onPointerUp}
      className="map-drag-handle flex shrink-0 cursor-grab items-center justify-center self-stretch px-3 text-slate-400 transition hover:text-brand-600 active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5" />
    </div>
  ) : null;

  const collapsedBar = (
    <div className="map-search-hub-trigger flex w-full items-stretch overflow-hidden rounded-full bg-white/95 text-left shadow-lg shadow-slate-900/10 ring-1 ring-white/90 backdrop-blur-xl transition hover:shadow-xl">
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
            {activeFilterCount || "•"}
          </span>
        )}
      </button>
      {dragGrip && (
        <>
          <div className="w-px shrink-0 self-center bg-slate-200/80" aria-hidden />
          {dragGrip}
        </>
      )}
    </div>
  );

  const searchForm = (
        <form
          onSubmit={(e) => {
            onSearch(e);
            setOpen(false);
          }}
          className="map-search-hub-form overflow-hidden rounded-2xl bg-white/95 shadow-xl shadow-slate-900/15 ring-1 ring-white/90 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 py-2.5 pl-4 pr-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Search map
            </span>
            <div className="flex items-center">
              {dragGrip}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-0 divide-y divide-slate-100">
            <label className="flex items-center gap-3 px-4 py-3">
              <BookOpen className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Title or keywords"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 px-4 py-3">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Author"
                value={author}
                onChange={(e) => onAuthorChange(e.target.value)}
                className="w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-3 px-4 py-3">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                placeholder="Institution"
                value={affiliation}
                onChange={(e) => onAffiliationChange(e.target.value)}
                className="w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none"
              />
            </label>
          </div>

          {showFilters && (
            <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/90 to-white px-4 py-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Research area
              </p>
              <CategorySubcategoryPicker
                categories={categories}
                categoryId={categoryId}
                subCategoryId={subCategoryId}
                onCategoryChange={onCategoryChange}
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

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 p-2 sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                showFilters || activeFilterCount
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-100"
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
                onClick={onClear}
                className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={searching}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {searching ? "…" : "Search"}
            </button>
          </div>
        </form>
  );

  const resultsBtn = hasResults && !open && (
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
