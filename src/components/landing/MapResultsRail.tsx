import {
  BookOpenText,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  MapPin,
  MessageSquare,
  Reply,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { abstractListingSnippet } from "../../lib/abstractText";
import { buildPublicationChatPath } from "../../lib/publicationChat";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { ResearcherRankInline } from "../rankings/ResearcherRankInline";
import { SubcategoryBadge } from "../taxonomy/SubcategoryBadge";
import { UserAvatar } from "../ui/UserAvatar";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { authorDisplayName } from "../../lib/userDisplay";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import type {
  AuthorResearchResponse,
  InstitutionResearchResponse,
  InstitutionSearchIdentity,
  Publication,
  ResearcherRanking,
  ResearcherSearchIdentity,
} from "../../types";

interface Props {
  publications: Publication[];
  authorResearch?: AuthorResearchResponse | null;
  authorResearchLoading?: boolean;
  authorQuery?: string;
  institutionResearch?: InstitutionResearchResponse | null;
  institutionResearchLoading?: boolean;
  affiliationQuery?: string;
  titleQuery?: string;
  locationQuery?: string;
  open: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

type ResearcherResult = {
  key: string;
  userId?: number | null;
  name: string;
  affiliation: string;
  photo?: string;
  ranking?: ResearcherRanking;
  leadSubfield?: string;
  interests: string[];
  totalPublications: number;
  totalDiscussions: number;
};

type InstitutionResult = {
  key: string;
  label: string;
  totalPublications: number;
  totalResearchers: number;
  totalDiscussions: number;
  leadingSubfields: string[];
  mainInterests: string[];
};

function topValues(items: string[], limit = 3) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = (item || "").trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value]) => value);
}

function normalizeNameQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function researcherNameMatchesQuery(name: string, query: string): boolean {
  const normalizedName = normalizeNameQuery(name);
  const tokens = normalizeNameQuery(query).split(" ").filter((token) => token.length > 1);
  if (!tokens.length) return true;
  return tokens.every((token) => normalizedName.includes(token));
}

function collectResearcherResults(publications: Publication[]): ResearcherResult[] {
  const grouped = new Map<string, Publication[]>();
  for (const pub of publications) {
    const author = pub.author;
    const name =
      authorDisplayName(author) ||
      `${author?.firstname ?? ""} ${author?.lastname ?? ""}`.trim();
    if (!name) continue;
    const key = author?.id ? `user:${author.id}` : `name:${name.toLowerCase()}`;
    grouped.set(key, [...(grouped.get(key) ?? []), pub]);
  }

  return [...grouped.entries()]
    .map(([key, pubs]) => {
      const lead = pubs[0];
      const author = lead.author;
      const interests = [
        ...new Set(
          pubs.flatMap((pub) => (pub.author?.interests ?? []).map((interest) => interest.label))
        ),
      ].slice(0, 4);
      return {
        key,
        userId: author?.id,
        name:
          authorDisplayName(author) ||
          `${author?.firstname ?? ""} ${author?.lastname ?? ""}`.trim() ||
          "Researcher",
        affiliation: author?.affiliation || "",
        photo: author?.photo,
        ranking: author?.ranking,
        leadSubfield: topValues(
          pubs.map((pub) => pub.subfield_name || pub.sub_category_name || "")
        )[0],
        interests,
        totalPublications: pubs.length,
        totalDiscussions: pubs.reduce((sum, pub) => sum + (pub.discussions_count ?? 0), 0),
      };
    })
    .sort(
      (a, b) =>
        b.totalPublications - a.totalPublications ||
        b.totalDiscussions - a.totalDiscussions ||
        a.name.localeCompare(b.name)
    );
}

function collectInstitutionResults(publications: Publication[]): InstitutionResult[] {
  const grouped = new Map<
    string,
    {
      label: string;
      publications: Publication[];
      researcherIds: Set<number>;
      researcherNames: Set<string>;
      subfields: string[];
      interests: string[];
    }
  >();

  for (const pub of publications) {
    const raw = (pub.author?.affiliation || pub.coordinates?.institution || "").trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const entry = grouped.get(key) ?? {
      label: raw,
      publications: [],
      researcherIds: new Set<number>(),
      researcherNames: new Set<string>(),
      subfields: [],
      interests: [],
    };
    entry.publications.push(pub);
    if (pub.author?.id) entry.researcherIds.add(pub.author.id);
    const name = authorDisplayName(pub.author);
    if (name) entry.researcherNames.add(name);
    if (pub.subfield_name || pub.sub_category_name) {
      entry.subfields.push(pub.subfield_name || pub.sub_category_name || "");
    }
    entry.interests.push(...(pub.author?.interests ?? []).map((interest) => interest.label));
    grouped.set(key, entry);
  }

  return [...grouped.entries()]
    .map(([key, entry]) => ({
      key,
      label: entry.label,
      totalPublications: entry.publications.length,
      totalResearchers: entry.researcherIds.size || entry.researcherNames.size,
      totalDiscussions: entry.publications.reduce(
        (sum, pub) => sum + (pub.discussions_count ?? 0),
        0
      ),
      leadingSubfields: topValues(entry.subfields, 3),
      mainInterests: topValues(entry.interests, 4),
    }))
    .sort(
      (a, b) =>
        b.totalPublications - a.totalPublications ||
        b.totalResearchers - a.totalResearchers ||
        a.label.localeCompare(b.label)
    );
}

function InstitutionIdentityCard({
  institution,
  compact = false,
}: {
  institution: InstitutionSearchIdentity;
  compact?: boolean;
}) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 transition hover:border-brand-200 hover:bg-white hover:shadow-md ${
        compact ? "p-3" : "p-3.5"
      }`}
    >
      <div className="flex gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{institution.name}</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <BookOpenText className="h-3 w-3 text-brand-600" />
              {institution.publication_count} publication
              {institution.publication_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <Users className="h-3 w-3 text-teal-600" />
              {institution.researcher_count} researcher
              {institution.researcher_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <MessageSquare className="h-3 w-3 text-teal-600" />
              {institution.discussions_count} discussion
              {institution.discussions_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <Reply className="h-3 w-3 text-brand-600" />
              {institution.responses_count} response
              {institution.responses_count === 1 ? "" : "s"}
            </span>
          </div>
          {institution.leading_researcher?.name && (
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Leading researcher: </span>
              {institution.leading_researcher.user_id ? (
                <Link
                  to={`/researcher/${institution.leading_researcher.user_id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {institution.leading_researcher.name}
                </Link>
              ) : (
                institution.leading_researcher.name
              )}
              {institution.leading_researcher.publication_count > 0
                ? ` (${institution.leading_researcher.publication_count} publication${
                    institution.leading_researcher.publication_count === 1 ? "" : "s"
                  })`
                : ""}
            </p>
          )}
          {institution.leading_field?.name && (
            <p className="mt-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Leading field: </span>
              {institution.leading_field.name} ({institution.leading_field.publication_count})
            </p>
          )}
          {institution.leading_subfield?.name && (
            <p className="mt-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Leading subfield: </span>
              {institution.leading_subfield.name} ({institution.leading_subfield.publication_count})
            </p>
          )}
          <Link
            to={institution.map_url}
            className="mt-2 inline-flex text-xs font-semibold text-brand-600 hover:underline"
          >
            View all papers on map
          </Link>
        </div>
      </div>
    </article>
  );
}

function ResearcherIdentityCard({
  person,
  compact = false,
}: {
  person: ResearcherSearchIdentity;
  compact?: boolean;
}) {
  const profilePath =
    person.profile_url || (person.user_id ? `/researcher/${person.user_id}` : null);
  const papersPath = person.papers_map_url || (person.name ? `/?author=${encodeURIComponent(person.name)}` : null);

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 transition hover:border-brand-200 hover:bg-white hover:shadow-md ${
        compact ? "p-3" : "p-3.5"
      }`}
    >
      <div className="flex gap-3">
        <UserAvatar
          name={person.name}
          photoUrl={person.photo}
          size="sm"
          className="h-11 w-11 rounded-xl border-2 text-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{person.name}</p>
              {person.affiliation && (
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{person.affiliation}</p>
              )}
              {!person.has_profile && (
                <p className="mt-1 text-[11px] font-medium text-amber-800">
                  Co-author on GRE papers (no platform profile yet)
                </p>
              )}
            </div>
            {person.ranking ? (
              <div className="shrink-0">
                <ResearcherRankInline ranking={person.ranking} compact />
              </div>
            ) : null}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <BookOpenText className="h-3 w-3 text-brand-600" />
              {person.publication_count} publication
              {person.publication_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <MessageSquare className="h-3 w-3 text-teal-600" />
              {person.discussions_count} discussion
              {person.discussions_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
              <Reply className="h-3 w-3 text-brand-600" />
              {person.responses_count} response
              {person.responses_count === 1 ? "" : "s"}
            </span>
            {person.leading_interest ? (
              <span className="col-span-2 rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-800">
                Leading interest: {person.leading_interest}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {profilePath && person.has_profile ? (
              <Link
                to={profilePath}
                className="inline-flex text-xs font-semibold text-brand-600 hover:underline"
              >
                View all papers on profile
              </Link>
            ) : papersPath ? (
              <Link
                to={papersPath}
                className="inline-flex text-xs font-semibold text-brand-600 hover:underline"
              >
                View all papers on map
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function formatLocation(pub: Publication): string | null {
  const location = pub.coordinates?.location?.trim();
  return location || null;
}

export function MapResultsRail({
  publications,
  authorResearch = null,
  authorResearchLoading = false,
  authorQuery = "",
  institutionResearch = null,
  institutionResearchLoading = false,
  affiliationQuery = "",
  titleQuery = "",
  locationQuery = "",
  open,
  collapsed,
  onToggleCollapse,
  onClose,
}: Props) {
  const isMobile = useIsMobile();
  const swipeRef = useRef<{ startY: number } | null>(null);

  if (!open) return null;

  const handleSheetPointerDown = (clientY: number) => {
    swipeRef.current = { startY: clientY };
  };

  const handleSheetPointerUp = (clientY: number) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    if (clientY - start.startY > 48) {
      onToggleCollapse();
    }
  };

  const desktopToggle = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="absolute top-1/2 z-[1210] hidden -translate-y-1/2 rounded-r-2xl bg-white py-8 pl-1.5 pr-2.5 shadow-xl ring-1 ring-slate-200/80 transition hover:bg-slate-50 md:flex"
      style={{ left: collapsed ? 0 : "min(400px, 92vw)" }}
      aria-label={collapsed ? "Expand results" : "Collapse results"}
    >
      {collapsed ? (
        <ChevronRight className="h-5 w-5 text-brand-600" />
      ) : (
        <ChevronLeft className="h-5 w-5 text-brand-600" />
      )}
    </button>
  );

  const authorSearchActive = authorQuery.length >= 2;
  const institutionSearchActive = affiliationQuery.length >= 2 && !authorSearchActive;
  const hasTitleSearch = titleQuery.trim().length >= 2;
  const hasLocationSearch = locationQuery.trim().length >= 2;

  const exactResearcher =
    authorResearch?.match_type === "exact" ? authorResearch.exact : null;
  const fuzzyResearchers =
    authorResearch?.match_type === "fuzzy" ? authorResearch.candidates : [];
  const legacyResearcherResults =
    !authorSearchActive && !institutionSearchActive && !hasTitleSearch && !hasLocationSearch
      ? collectResearcherResults(publications).slice(0, 6)
      : [];

  const paperMatchedResearchers =
    authorSearchActive && !exactResearcher && fuzzyResearchers.length === 0
      ? collectResearcherResults(publications)
          .filter((person) => researcherNameMatchesQuery(person.name, authorQuery))
          .slice(0, 6)
      : [];

  const exactInstitution =
    institutionResearch?.match_type === "exact" ? institutionResearch.exact : null;
  const fuzzyInstitutions =
    institutionResearch?.match_type === "fuzzy" ? institutionResearch.candidates : [];

  const paperList = institutionSearchActive
    ? []
    : exactResearcher?.publications && exactResearcher.publications.length > 0
      ? exactResearcher.publications
      : authorSearchActive
        ? publications.slice(0, 8)
        : publications;

  const institutionResultCount = exactInstitution
    ? 1
    : fuzzyInstitutions.length;

  const institutionResultsEmpty =
    institutionSearchActive &&
    !institutionResearchLoading &&
    !exactInstitution &&
    fuzzyInstitutions.length === 0;

  const authorResultsEmpty =
    authorSearchActive &&
    !authorResearchLoading &&
    !exactResearcher &&
    fuzzyResearchers.length === 0 &&
    paperMatchedResearchers.length === 0 &&
    (authorResearch?.match_type === "none" || authorResearch == null);

  const railEmpty = institutionSearchActive
    ? institutionResultsEmpty
    : authorSearchActive
      ? authorResultsEmpty && paperList.length === 0
      : publications.length === 0;

  const researcherCount = exactResearcher
    ? 1
    : fuzzyResearchers.length > 0
      ? fuzzyResearchers.length
      : paperMatchedResearchers.length > 0
        ? paperMatchedResearchers.length
        : 0;

  const countKind = institutionSearchActive
    ? "institution"
    : authorSearchActive
      ? "researcher"
      : hasTitleSearch || hasLocationSearch
        ? "paper"
        : "paper";

  const countValue =
    countKind === "institution"
      ? institutionResultCount
      : countKind === "researcher"
        ? researcherCount
        : publications.length;

  const countLabel = `${countValue} matching ${countKind}${countValue === 1 ? "" : "s"}`;

  const sheet = (
    <>
      {!isMobile && desktopToggle}

      {!collapsed && isMobile && (
        <button
          type="button"
          className="fixed inset-0 z-[1290] bg-slate-900/30"
          onClick={onToggleCollapse}
          aria-label="Hide search results"
        />
      )}

      <aside
        className={`map-results-rail z-[1295] flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out ${
          isMobile
            ? `map-results-rail--mobile fixed inset-x-0 max-h-[min(68dvh,calc(100dvh-8rem))] rounded-t-2xl ${
                collapsed ? "pointer-events-none translate-y-full opacity-0" : "translate-y-0 opacity-100"
              }`
            : `absolute bottom-0 left-0 top-0 ${
                collapsed
                  ? "w-0 -translate-x-full opacity-0 pointer-events-none"
                  : "w-[min(400px,92vw)] translate-x-0 opacity-100"
              }`
        }`}
      >
        <div
          className="map-results-rail-header flex shrink-0 cursor-grab flex-col border-b border-slate-100 bg-white px-4 pb-3 pt-2 active:cursor-grabbing"
          onPointerDown={(e) => isMobile && handleSheetPointerDown(e.clientY)}
          onPointerUp={(e) => isMobile && handleSheetPointerUp(e.clientY)}
          onPointerCancel={(e) => isMobile && handleSheetPointerUp(e.clientY)}
        >
          {isMobile && (
            <span className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-300" aria-hidden />
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
                Search results
              </p>
              <p className="mt-0.5 text-lg font-bold leading-tight text-ink">{countLabel}</p>
              {authorSearchActive && exactResearcher && (
                <p className="mt-1 text-xs text-slate-500">Exact researcher match</p>
              )}
              {institutionSearchActive && exactInstitution && (
                <p className="mt-1 text-xs text-slate-500">Exact institution match</p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink"
              aria-label="Close search results"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 pb-4">
          {railEmpty ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 px-4 py-12 text-center">
              {institutionSearchActive ? (
                <Building2 className="mx-auto h-10 w-10 text-slate-300" />
              ) : (
                <MapPin className="mx-auto h-10 w-10 text-slate-300" />
              )}
              <p className="mt-3 text-sm font-medium text-slate-600">
                {institutionSearchActive ? "No institutions found" : "No matches found"}
              </p>
              <p className="mt-1 text-xs text-slate-400">Try different search terms.</p>
            </div>
          ) : (
            <div className="space-y-6 gre-stagger">
              {authorSearchActive && authorResearchLoading && (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  Looking up researchers…
                </div>
              )}

              {authorSearchActive && exactResearcher && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Researcher
                    </h3>
                  </div>
                  <ResearcherIdentityCard person={exactResearcher} />
                </section>
              )}

              {authorSearchActive &&
                !exactResearcher &&
                fuzzyResearchers.length === 0 &&
                paperMatchedResearchers.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      {paperMatchedResearchers.length === 1 ? "Researcher" : "Researchers"}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {paperMatchedResearchers.map((person) => (
                      <li key={person.key}>
                        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-brand-200 hover:bg-white hover:shadow-md">
                          <div className="flex gap-3">
                            <UserAvatar
                              name={person.name}
                              photoUrl={person.photo}
                              size="sm"
                              className="h-11 w-11 rounded-xl border-2 text-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-ink">
                                    {person.name}
                                  </p>
                                  {person.affiliation && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                      {person.affiliation}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0">
                                  <ResearcherRankInline ranking={person.ranking} compact />
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
                                  <BookOpenText className="h-3 w-3 text-brand-600" />
                                  {person.totalPublications} publication
                                  {person.totalPublications === 1 ? "" : "s"}
                                </span>
                              </div>
                              {person.userId && (
                                <Link
                                  to={`/researcher/${person.userId}`}
                                  className="mt-2 inline-flex text-xs font-semibold text-brand-600 hover:underline"
                                >
                                  Open researcher profile
                                </Link>
                              )}
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {authorSearchActive && !exactResearcher && fuzzyResearchers.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Similar researchers
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    No exact name match for &ldquo;{authorQuery}&rdquo;. Showing close matches from
                    published papers and co-authors.
                  </p>
                  <ul className="space-y-2.5">
                    {fuzzyResearchers.map((person) => (
                      <li key={person.key}>
                        <ResearcherIdentityCard person={person} compact />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!authorSearchActive &&
                !institutionSearchActive &&
                legacyResearcherResults.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Researchers
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {legacyResearcherResults.map((person) => (
                      <li key={person.key}>
                        <article className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:border-brand-200 hover:bg-white hover:shadow-md">
                          <div className="flex gap-3">
                            <UserAvatar
                              name={person.name}
                              photoUrl={person.photo}
                              size="sm"
                              className="h-11 w-11 rounded-xl border-2 text-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-ink">
                                    {person.name}
                                  </p>
                                  {person.affiliation && (
                                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                                      {person.affiliation}
                                    </p>
                                  )}
                                </div>
                                <div className="shrink-0">
                                  <ResearcherRankInline ranking={person.ranking} compact />
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
                                  <BookOpenText className="h-3 w-3 text-brand-600" />
                                  {person.totalPublications} publication
                                  {person.totalPublications === 1 ? "" : "s"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold">
                                  <MessageSquare className="h-3 w-3 text-teal-600" />
                                  {person.totalDiscussions} discussion
                                  {person.totalDiscussions === 1 ? "" : "s"}
                                </span>
                              </div>
                              {person.leadSubfield && (
                                <p className="mt-2 text-xs text-slate-600">
                                  <span className="font-semibold text-slate-700">Lead subfield: </span>
                                  {person.leadSubfield}
                                </p>
                              )}
                              {person.userId && (
                                <Link
                                  to={`/researcher/${person.userId}`}
                                  className="mt-2 inline-flex text-xs font-semibold text-brand-600 hover:underline"
                                >
                                  Open researcher profile
                                </Link>
                              )}
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {institutionSearchActive && institutionResearchLoading && (
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  Looking up institutions…
                </div>
              )}

              {institutionSearchActive && exactInstitution && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Institution
                    </h3>
                  </div>
                  <InstitutionIdentityCard institution={exactInstitution} />
                </section>
              )}

              {institutionSearchActive && !exactInstitution && fuzzyInstitutions.length > 0 && (
                <section className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      Similar institutions
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    No exact match for &ldquo;{affiliationQuery}&rdquo;. Showing close university and
                    organization matches on GRE.
                  </p>
                  <ul className="space-y-2.5">
                    {fuzzyInstitutions.map((institution) => (
                      <li key={institution.key}>
                        <InstitutionIdentityCard institution={institution} compact />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {paperList.length > 0 && (
              <section className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BookOpenText className="h-4 w-4 text-brand-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                      {authorSearchActive ? "Top papers" : "Papers"}
                    </h3>
                  </div>
                  {authorSearchActive && exactResearcher && exactResearcher.publication_count > (paperList.length || 0) && (
                    <p className="text-[11px] text-slate-500">
                      Showing {paperList.length} of {exactResearcher.publication_count}
                    </p>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {paperList.map((pub, i) => {
                    const location = formatLocation(pub);
                    const subVisual = publicationSubcategoryVisual(pub);
                    return (
                      <li key={pub.id}>
                        <article
                          className="group overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md"
                          style={{ animationDelay: `${i * 30}ms` }}
                        >
                          <Link
                            to={buildPublicationPath(pub.id, pub.encoded_id)}
                            className="flex gap-3 p-3.5 pb-2.5"
                          >
                            <UserAvatar
                              user={pub.author}
                              size="sm"
                              className="h-11 w-11 rounded-xl border-2 text-sm"
                            />
                            <div className="min-w-0 flex-1 text-left">
                              <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-700">
                                {formatGrePaperTitle(pub.title, pub.short_number)}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {authorDisplayName(pub.author) ||
                                  `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim()}
                              </p>
                              <div className="mt-1.5">
                                <ResearcherRankInline ranking={pub.author?.ranking} compact />
                              </div>
                              {location && (
                                <p className="mt-1 flex items-start gap-1 text-xs text-slate-600">
                                  <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-teal-600" />
                                  <span className="line-clamp-2">{location}</span>
                                </p>
                              )}
                              {pub.abstract?.trim() && (
                                <p className="mt-2 line-clamp-2 text-xs leading-snug text-slate-600">
                                  {abstractListingSnippet(pub.abstract)}
                                </p>
                              )}
                              {subVisual ? (
                                <div className="mt-2">
                                  <SubcategoryBadge visual={subVisual} size="xs" />
                                </div>
                              ) : null}
                            </div>
                          </Link>
                          <div className="flex flex-col gap-2 px-3.5 pb-3.5 sm:flex-row">
                            <Link
                              to={buildPublicationChatPath(pub.id, pub.encoded_id)}
                              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Get summary
                            </Link>
                            <Link
                              to={buildPublicationPath(pub.id, pub.encoded_id)}
                              className="flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                            >
                              View paper
                            </Link>
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );

  if (isMobile) return createPortal(sheet, document.body);
  return sheet;
}
