/** Canonical GRE research taxonomy (category → subcategories). */

export const GEOLOGY_CATEGORY = "Geology";

export const GEOLOGY_SUBCATEGORIES = [
  "Engineering Geology",
  "Environmental Geology",
  "Geochemistry",
  "Geological Mapping",
  "Geological Remote Sensing",
  "Geomorphology & Surface Processes",
  "Geophysics",
  "Hydrogeology",
  "Igneous & Metamorphic Petrology",
  "Natural Resources & Economic Geology",
  "Paleontology & Palynology",
  "Sedimentology",
  "Volcanology",
] as const;

export const RESEARCH_TAXONOMY: Record<string, readonly string[]> = {
  [GEOLOGY_CATEGORY]: GEOLOGY_SUBCATEGORIES,
};
