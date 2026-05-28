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
  | "results"
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
      "What are the main takeaways from this study?",
      "What methods were used?",
      "What were the key findings?",
      "Who are the authors?",
      "Where was this study conducted?",
    ].slice(0, MAX_SUGGESTIONS);
  }

  const suggestions: string[] = [];
  const push = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || suggestions.includes(trimmed)) return;
    suggestions.push(trimmed);
  };

  if (hasText(pub.methods)) {
    push("What methods were used in this study?");
  }

  if (hasText(pub.results) || hasText(pub.findings)) {
    push("What were the key findings?");
  }

  const institution =
    pub.coordinates?.institution?.trim() ||
    pub.co_authors?.primary_author?.affiliation?.trim();
  if (institution) {
    push(`What institution or affiliation is associated with this research (${institution})?`);
  }

  if (pub.coordinates?.location?.trim()) {
    const place = pub.coordinates.location.trim();
    push(place ? `Where was this study conducted (${place})?` : "Where was this study conducted?");
  }

  if (authorCount(pub) > 1) {
    push("Who are the authors and their affiliations?");
  } else if (pub.co_authors?.primary_author?.fullname) {
    push("Who is the lead author and what is their affiliation?");
  }

  if (hasText(pub.introduction)) {
    push("What research problem does this study address?");
  }

  if (pub.sub_category_name) {
    push(`How does this study contribute to ${pub.sub_category_name}?`);
  } else if (pub.keywords?.length) {
    push(`How does this study relate to ${pub.keywords[0]}?`);
  }

  if (hasText(pub.conclusion)) {
    push("What conclusions or recommendations does the study offer?");
  }

  if (hasText(pub.funder)) {
    push("Who funded this research?");
  }

  if (pub.figures && pub.figures.length > 0) {
    push("What do the figures or maps illustrate?");
  }

  if (hasText(pub.gre?.author_summary)) {
    push("What did the authors highlight in their own summary?");
  }

  push("What are the main takeaways from this study?");
  push("What are the practical implications of this research?");

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
