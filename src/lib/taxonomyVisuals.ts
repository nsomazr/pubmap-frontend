import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bone,
  Droplets,
  Flame,
  FlaskConical,
  Gem,
  HardHat,
  Layers,
  Leaf,
  Map,
  Mountain,
  Pickaxe,
  Satellite,
  Waves,
} from "lucide-react";
import type { Publication, SubCategory, SubcategoryVisual } from "../types";

export const DEFAULT_ACCENT = "#3b5bdb";
export const DEFAULT_ICON_KEY = "layers";

const SUBCATEGORY_VISUALS: Record<string, Omit<SubcategoryVisual, "name" | "category_name">> = {
  "engineering geology": { icon_key: "hard-hat", accent_color: "#3b5bdb" },
  "environmental geology": { icon_key: "leaf", accent_color: "#0d9488" },
  geochemistry: { icon_key: "flask-conical", accent_color: "#364fc7" },
  "geological mapping": { icon_key: "map", accent_color: "#228be6" },
  "geological remote sensing": { icon_key: "satellite", accent_color: "#12b886" },
  "geomorphology & surface processes": { icon_key: "waves", accent_color: "#1864ab" },
  geophysics: { icon_key: "activity", accent_color: "#3b5bdb" },
  hydrogeology: { icon_key: "droplets", accent_color: "#0d9488" },
  "igneous & metamorphic petrology": { icon_key: "gem", accent_color: "#364fc7" },
  "natural resources & economic geology": { icon_key: "pickaxe", accent_color: "#228be6" },
  "paleontology & palynology": { icon_key: "bone", accent_color: "#12b886" },
  sedimentology: { icon_key: "layers", accent_color: "#1864ab" },
  volcanology: { icon_key: "flame", accent_color: "#3b5bdb" },
};

const CATEGORY_VISUALS: Record<string, Omit<SubcategoryVisual, "name" | "category_name">> = {
  geology: { icon_key: "mountain", accent_color: "#3b5bdb" },
};

export const TAXONOMY_ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  bone: Bone,
  droplets: Droplets,
  flame: Flame,
  "flask-conical": FlaskConical,
  gem: Gem,
  "hard-hat": HardHat,
  layers: Layers,
  leaf: Leaf,
  map: Map,
  mountain: Mountain,
  pickaxe: Pickaxe,
  satellite: Satellite,
  waves: Waves,
};

function normalizeName(name: string | undefined | null) {
  return (name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+and\s+/g, " & ");
}

function isHexColor(value: string | undefined | null) {
  return Boolean(value && /^#[0-9a-fA-F]{3,8}$/.test(value.trim()));
}

export function resolveCategoryVisual(name?: string | null): SubcategoryVisual {
  const key = normalizeName(name);
  const preset = CATEGORY_VISUALS[key] ?? {
    icon_key: DEFAULT_ICON_KEY,
    accent_color: DEFAULT_ACCENT,
  };
  return {
    name: (name || "").trim() || "Research",
    category_name: (name || "").trim() || "Research",
    icon_key: preset.icon_key,
    accent_color: preset.accent_color,
  };
}

export function resolveSubcategoryVisual(
  name?: string | null,
  options?: {
    iconField?: string | null;
    categoryName?: string | null;
    visual?: SubcategoryVisual | null;
  }
): SubcategoryVisual {
  if (options?.visual) return options.visual;

  const category = resolveCategoryVisual(options?.categoryName);
  const key = normalizeName(name);
  const preset = SUBCATEGORY_VISUALS[key];
  const accent =
    (isHexColor(options?.iconField) ? options!.iconField!.trim() : null) ||
    preset?.accent_color ||
    category.accent_color;

  return {
    name: (name || "").trim() || "Research area",
    category_name: options?.categoryName?.trim() || category.name,
    icon_key: preset?.icon_key || category.icon_key,
    accent_color: accent,
  };
}

export function resolveSubcategoryFromModel(sub?: SubCategory | null): SubcategoryVisual | null {
  if (!sub) return null;
  return resolveSubcategoryVisual(sub.name, {
    iconField: sub.icon,
    categoryName: sub.category_name,
    visual: sub.visual ?? null,
  });
}

export function publicationSubcategoryVisual(
  pub: Pick<Publication, "sub_category_name" | "sub_category_visual">
): SubcategoryVisual | null {
  if (!pub.sub_category_name && !pub.sub_category_visual) return null;
  return resolveSubcategoryVisual(pub.sub_category_name, {
    visual: pub.sub_category_visual ?? null,
  });
}

export function taxonomyIcon(iconKey?: string | null): LucideIcon {
  return TAXONOMY_ICON_MAP[iconKey || ""] ?? Layers;
}

export function subcategoryVisualById(
  subCategories: SubCategory[],
  subCategoryId: string | number | undefined | null
): SubcategoryVisual | null {
  if (!subCategoryId) return null;
  const sub = subCategories.find((row) => String(row.id) === String(subCategoryId));
  return resolveSubcategoryFromModel(sub);
}
