/** Clean AI message drafts that came back as multi-speaker scripts. */
export function sanitizeMessageDraft(text: string): string {
  let cleaned = text.trim();
  if (!cleaned) return "";

  const lines = cleaned.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2 && lines.every((ln) => /^[^:\n]{2,80}:\s/.test(ln))) {
    const last = lines[lines.length - 1];
    return last.replace(/^[^:\n]{2,80}:\s*/, "").trim();
  }

  const inlineParts = cleaned.split(/\s+(?=[A-Z][^\s:]{1,30}(?:\s+[A-Z][^\s:]{1,30})*:\s)/);
  if (inlineParts.length > 1) {
    return "";
  }

  return cleaned.replace(/^[^:\n]{2,80}:\s*/, "").trim();
}

export function looksLikeDialogueScript(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const nameLines = (t.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:\s/g) || []).length;
  return nameLines >= 2;
}
