export function institutionMapUrl(affiliation: string | undefined | null): string {
  const text = (affiliation || "").trim();
  if (!text) return "/";
  return `/?affiliation=${encodeURIComponent(text)}`;
}

export function researcherProfilePath(userId: number | undefined | null): string | null {
  if (!userId) return null;
  return `/researcher/${userId}`;
}
