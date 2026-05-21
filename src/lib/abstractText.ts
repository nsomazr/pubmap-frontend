/** Plain text from abstract (HTML or plain). */
export function abstractPlainText(value?: string | null): string {
  if (!value?.trim()) return "";
  if (!/<[a-z][\s\S]*>/i.test(value)) return value.trim();
  const doc = new DOMParser().parseFromString(value, "text/html");
  return (doc.body.textContent || "").trim();
}
