import type { Publication } from "../types";

type PublicationSuggestionContext = Pick<
  Publication,
  | "title"
  | "abstract"
  | "keywords"
  | "sub_category_name"
  | "coordinates"
  | "introduction"
  | "methods"
  | "findings"
  | "conclusion"
  | "funder"
  | "figures"
  | "co_authors"
  | "gre"
>;

const MAX_SUGGESTIONS = 5;

function hasText(value?: string | null): boolean {
  return Boolean(value?.trim());
}

function authorCount(pub: PublicationSuggestionContext): number {
  if (typeof pub.co_authors?.total_authors === "number" && pub.co_authors.total_authors > 0) {
    return pub.co_authors.total_authors;
  }
  const coAuthors = pub.co_authors?.co_authors?.length ?? 0;
  return coAuthors > 0 ? coAuthors + 1 : 0;
}

export function buildPublicationFollowUpSuggestions(
  pub: PublicationSuggestionContext | null | undefined
): string[] {
  if (!pub) {
    return [
      "What are the main takeaways?",
      "What methods were used?",
      "What were the key findings?",
      "Who are the authors?",
      "Where was this conducted?",
    ].slice(0, MAX_SUGGESTIONS);
  }

  const suggestions: string[] = [];
  const push = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || suggestions.includes(trimmed)) return;
    suggestions.push(trimmed);
  };

  if (hasText(pub.methods)) {
    push("What methods were used?");
  }

  if (hasText(pub.findings)) {
    push("What were the key findings?");
  }

  if (
    pub.coordinates?.institution?.trim() ||
    pub.co_authors?.primary_author?.affiliation?.trim()
  ) {
    push("What institution is affiliated?");
  }

  if (pub.coordinates?.location?.trim()) {
    push("Where was the study conducted?");
  }

  if (authorCount(pub) > 1) {
    push("Who are the authors?");
  } else if (pub.co_authors?.primary_author?.fullname) {
    push("Who is the lead author?");
  }

  if (hasText(pub.introduction)) {
    push("What problem does this study address?");
  }

  if (pub.sub_category_name) {
    push(`How does this contribute to ${pub.sub_category_name}?`);
  } else if (pub.keywords?.length) {
    push(`How does this relate to ${pub.keywords[0]}?`);
  }

  if (hasText(pub.conclusion)) {
    push("What are the conclusions?");
  }

  if (hasText(pub.funder)) {
    push("Who funded this research?");
  }

  if (pub.figures && pub.figures.length > 0) {
    push("What do the figures show?");
  }

  if (hasText(pub.gre?.author_summary)) {
    push("What did the authors highlight?");
  }

  push("What are the main takeaways?");

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
