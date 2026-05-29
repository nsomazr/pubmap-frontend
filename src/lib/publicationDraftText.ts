export type DraftFields = {
  title: string;
  abstract: string;
  introduction?: string;
  methods?: string;
  findings?: string;
  conclusion?: string;
};

const SECTIONS: { label: string; key: keyof DraftFields }[] = [
  { label: "Abstract", key: "abstract" },
  { label: "Introduction", key: "introduction" },
  { label: "Methods", key: "methods" },
  { label: "Findings", key: "findings" },
  { label: "Conclusion", key: "conclusion" },
];

export function buildDraftText(fields: DraftFields): string {
  const parts: string[] = [];
  if (fields.title.trim()) parts.push(`Title: ${fields.title.trim()}`);
  for (const { label, key } of SECTIONS) {
    const val = fields[key];
    if (typeof val === "string" && val.trim()) {
      parts.push(`${label}:\n${val.trim()}`);
    }
  }
  return parts.join("\n\n");
}

/** Minimum substantive text before GRE should summarize (avoids empty/hallucinated summaries). */
export function draftHasMinContent(fields: DraftFields): boolean {
  const body = SECTIONS.map((s) => fields[s.key])
    .filter((v): v is string => typeof v === "string")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return body.length >= 120;
}
