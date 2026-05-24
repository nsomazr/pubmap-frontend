import { X } from "lucide-react";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import { resolveCategoryVisual, resolveSubcategoryFromModel } from "../../lib/taxonomyVisuals";
import type { Category, SubCategory, SubcategoryVisual as Visual } from "../../types";

export interface ActiveMapFilter {
  key: string;
  label: string;
  onRemove: () => void;
  visual?: Visual | null;
}

export function buildMapFilterChips(props: {
  author: string;
  affiliation: string;
  title: string;
  categoryId: string;
  subCategoryId: string;
  categories: Category[];
  allSubCategories: SubCategory[];
  onAuthorChange: (v: string) => void;
  onAffiliationChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSubCategoryChange: (v: string) => void;
}): ActiveMapFilter[] {
  const chips: ActiveMapFilter[] = [];
  if (props.title.trim()) {
    chips.push({
      key: "title",
      label: `Title: ${props.title.trim()}`,
      onRemove: () => props.onTitleChange(""),
    });
  }
  if (props.author.trim()) {
    chips.push({
      key: "author",
      label: `Author: ${props.author.trim()}`,
      onRemove: () => props.onAuthorChange(""),
    });
  }
  if (props.affiliation.trim()) {
    chips.push({
      key: "affiliation",
      label: `Institution: ${props.affiliation.trim()}`,
      onRemove: () => props.onAffiliationChange(""),
    });
  }
  if (props.categoryId) {
    const cat = props.categories.find((c) => String(c.id) === props.categoryId);
    const catName = cat?.name ?? "Category";
    chips.push({
      key: "category",
      label: catName,
      visual: cat?.visual ?? resolveCategoryVisual(catName),
      onRemove: () => {
        props.onCategoryChange("");
        props.onSubCategoryChange("");
      },
    });
  }
  if (props.subCategoryId) {
    const sub = props.allSubCategories.find((s) => String(s.id) === props.subCategoryId);
    chips.push({
      key: "subcategory",
      label: sub?.name ?? "Subcategory",
      visual: resolveSubcategoryFromModel(sub),
      onRemove: () => props.onSubCategoryChange(""),
    });
  }
  return chips;
}

interface ChipsProps {
  chips: ActiveMapFilter[];
  onClearAll?: () => void;
  className?: string;
}

export function MapFilterChips({ chips, onClearAll, className = "" }: ChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className={`inline-flex max-w-[14rem] items-center gap-1 rounded-full py-1 pl-1 pr-1.5 text-[11px] font-semibold ring-1 transition hover:opacity-90 ${
            chip.visual ? "" : "bg-brand-50 text-brand-800 ring-brand-200/80"
          }`}
          style={
            chip.visual
              ? {
                  backgroundColor: `${chip.visual.accent_color}14`,
                  color: chip.visual.accent_color,
                  borderColor: `${chip.visual.accent_color}33`,
                }
              : undefined
          }
          title="Remove filter"
        >
          {chip.visual && (
            <SubcategoryVisual visual={chip.visual} size="xs" className="!h-6 !w-6 !rounded-lg" />
          )}
          <span className="truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 opacity-70" />
        </button>
      ))}
      {onClearAll && chips.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-500 underline-offset-2 hover:text-brand-700 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export function buildSearchSuggestions(publications: { title?: string; author?: { firstname?: string; lastname?: string; full_name?: string; affiliation?: string } }[]) {
  const titles = new Set<string>();
  const authors = new Set<string>();
  const institutions = new Set<string>();

  for (const pub of publications.slice(0, 120)) {
    const t = pub.title?.trim();
    if (t && t.length > 2) titles.add(t);
    const a =
      pub.author?.full_name?.trim() ||
      `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
    if (a) authors.add(a);
    const aff = pub.author?.affiliation?.trim();
    if (aff) institutions.add(aff);
  }

  return {
    titles: [...titles].slice(0, 24),
    authors: [...authors].slice(0, 16),
    institutions: [...institutions].slice(0, 16),
  };
}
