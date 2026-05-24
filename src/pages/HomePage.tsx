import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { parseMapDeepLink } from "../lib/mapDeepLink";
import { DraggableMapPanel } from "../components/landing/DraggableMapPanel";
import { MapResultsRail } from "../components/landing/MapResultsRail";
import { MapSearchHub } from "../components/landing/MapSearchHub";
import { MapSummaryDock } from "../components/landing/MapSummaryDock";
import {
  GRE_SUMMARY_REQUEST,
  type GreSummaryRequestDetail,
} from "../components/map/publicationPopupSummary";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { PublicFooter } from "../components/layout/PublicFooter";
import { PublicNav } from "../components/layout/PublicNav";
import { ResearchMap } from "../components/map/ResearchMap";
import { assets } from "../lib/brand";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import type { Category, Publication, SubCategory } from "../types";

type MapSearchFilters = {
  author: string;
  affiliation: string;
  title: string;
  categoryId: string;
  subCategoryId: string;
};

export function HomePage() {
  const [searchParams] = useSearchParams();
  const mapDeepLink = useMemo(
    () => parseMapDeepLink(searchParams.toString()),
    [searchParams]
  );
  const [author, setAuthor] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Publication[] | null>(null);
  const [resultsRailOpen, setResultsRailOpen] = useState(false);
  const [resultsRailCollapsed, setResultsRailCollapsed] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [summaryPubId, setSummaryPubId] = useState<number | null>(null);
  const [focusPubId, setFocusPubId] = useState<number | null>(null);
  const [deepLinkPub, setDeepLinkPub] = useState<Publication | null>(null);
  const mapChromeBoundsRef = useRef<HTMLElement | null>(null);
  const skipAutoSearchRef = useRef(true);
  const userDismissedResultsRailRef = useRef(false);

  const debouncedAuthor = useDebouncedValue(author, 400);
  const debouncedAffiliation = useDebouncedValue(affiliation, 400);
  const debouncedTitle = useDebouncedValue(title, 400);

  useEffect(() => {
    const id = mapDeepLink.publicationId;
    if (!id) return;
    setFocusPubId(id);
    if (mapDeepLink.panel === "summary") {
      setSummaryPubId(id);
    }
  }, [mapDeepLink.publicationId, mapDeepLink.panel]);

  useEffect(() => {
    if (mapDeepLink.affiliation) {
      setAffiliation(mapDeepLink.affiliation);
      skipAutoSearchRef.current = false;
    }
  }, [mapDeepLink.affiliation]);

  useEffect(() => {
    const onSummary = (e: Event) => {
      const { publicationId } = (e as CustomEvent<GreSummaryRequestDetail>).detail;
      setSummaryPubId(publicationId);
    };
    window.addEventListener(GRE_SUMMARY_REQUEST, onSummary);
    return () => window.removeEventListener(GRE_SUMMARY_REQUEST, onSummary);
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["map"],
    queryFn: async () => {
      const { data } = await api.get<{
        publications: Publication[];
        categories: Category[];
        sub_categories: SubCategory[];
        meta?: { total: number; with_coordinates: number };
      }>("/map/");
      return data;
    },
    retry: 2,
  });

  const runSearch = useCallback(
    async (
      filters?: MapSearchFilters,
      options?: { revealResults?: boolean }
    ) => {
      const active = filters ?? {
        author: debouncedAuthor,
        affiliation: debouncedAffiliation,
        title: debouncedTitle,
        categoryId,
        subCategoryId,
      };
      setSearching(true);
      setSearchError(null);
      try {
        const { data } = await api.get<Publication[]>("/map/search/", {
          params: {
            author: active.author || undefined,
            affiliation: active.affiliation || undefined,
            title: active.title || undefined,
            category: active.categoryId || undefined,
            sub_category: active.subCategoryId || undefined,
          },
        });
        setResults(data);
        if (options?.revealResults) {
          userDismissedResultsRailRef.current = false;
          setResultsRailOpen(true);
          setResultsRailCollapsed(false);
        } else if (!userDismissedResultsRailRef.current) {
          setResultsRailOpen(true);
        }
      } catch {
        setSearchError("Search failed. Check your connection and try again.");
      } finally {
        setSearching(false);
      }
    },
    [debouncedAuthor, debouncedAffiliation, debouncedTitle, categoryId, subCategoryId]
  );

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    skipAutoSearchRef.current = false;
    await runSearch(
      {
        author,
        affiliation,
        title,
        categoryId,
        subCategoryId,
      },
      { revealResults: true }
    );
  };

  const clearFilters = () => {
    setAuthor("");
    setAffiliation("");
    setTitle("");
    setCategoryId("");
    setSubCategoryId("");
    setResults(null);
    setResultsRailOpen(false);
    setResultsRailCollapsed(false);
    userDismissedResultsRailRef.current = false;
    skipAutoSearchRef.current = true;
  };

  useEffect(() => {
    if (skipAutoSearchRef.current) return;
    const hasFilter =
      debouncedAuthor ||
      debouncedAffiliation ||
      debouncedTitle ||
      categoryId ||
      subCategoryId;
    if (!hasFilter) return;
    void runSearch();
  }, [
    debouncedAuthor,
    debouncedAffiliation,
    debouncedTitle,
    categoryId,
    subCategoryId,
    runSearch,
  ]);

  const mapPublications = data?.publications ?? [];

  useEffect(() => {
    const id = mapDeepLink.publicationId;
    if (!id || isLoading) return;
    const found = mapPublications.find((p) => p.id === id);
    if (found) {
      setDeepLinkPub(found);
      return;
    }
    let cancelled = false;
    api
      .get<Publication>(`/publications/${id}/public/`)
      .then(({ data: pub }) => {
        if (!cancelled) setDeepLinkPub(pub);
      })
      .catch(() => {
        if (!cancelled) setDeepLinkPub(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mapDeepLink.publicationId, mapPublications, isLoading]);

  const hasSearched = results !== null;
  const basePublications = hasSearched ? (results ?? []) : mapPublications;
  const publications = useMemo(() => {
    if (deepLinkPub && !basePublications.some((p) => p.id === deepLinkPub.id)) {
      return [deepLinkPub, ...basePublications];
    }
    return basePublications;
  }, [basePublications, deepLinkPub]);
  const categories = data?.categories ?? [];
  const subCategories = data?.sub_categories ?? [];
  const totalOnMap = mapPublications.length;
  const onMapWithCoords = mapPublications.filter(
    (p) => p.coordinates?.latitude && p.coordinates?.longitude
  ).length;

  const summaryPublication = useMemo(() => {
    if (summaryPubId) {
      return publications.find((p) => p.id === summaryPubId) ?? deepLinkPub;
    }
    return null;
  }, [publications, summaryPubId, deepLinkPub]);

  return (
    <div
      className={`landing-page relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-200${
        resultsRailOpen && !resultsRailCollapsed ? " landing-page--results-open" : ""
      }${summaryPublication ? " landing-page--summary-open" : ""}`}
    >
      <PublicNav variant="map" />

      <main ref={mapChromeBoundsRef} className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          {isLoading ? (
            <div className="flex h-full items-center justify-center bg-slate-100">
              <img
                src={assets.logo}
                alt=""
                className="h-16 max-w-[140px] animate-pulse object-contain opacity-40"
              />
            </div>
          ) : (
            <ResearchMap
              publications={publications}
              focusPublicationId={focusPubId}
              height="100%"
              className="rounded-none border-0"
            />
          )}
        </div>

        {isError && !isLoading && (
          <div className="pointer-events-none absolute left-1/2 top-24 z-[1001] -translate-x-1/2 max-w-md px-4 md:top-20">
            <p className="pointer-events-auto rounded-2xl bg-red-600 px-4 py-3 text-center text-sm text-white shadow-lg">
              Cannot load the map. Start the API (
              <code className="text-xs">pubmap-backend ./start.sh</code>). For ngrok, use{" "}
              <code className="text-xs">VITE_API_URL=/api</code> and tunnel port{" "}
              <code className="text-xs">3099</code>.
              <button
                type="button"
                className="mt-2 block w-full rounded-lg bg-white/20 py-1.5 text-xs font-semibold hover:bg-white/30"
                onClick={() => refetch()}
              >
                Retry
              </button>
            </p>
          </div>
        )}

        {!isLoading && !isError && totalOnMap === 0 && !hasSearched && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1001] -translate-x-1/2 -translate-y-1/2 px-4">
            <p className="pointer-events-auto max-w-sm rounded-2xl bg-white px-5 py-4 text-center text-sm text-slate-600 shadow-xl ring-1 ring-slate-200">
              <strong className="text-ink">No studies on the map yet.</strong>
              <br />
              Load demo data:{" "}
              <code className="text-xs">python manage.py seed_sample_data --force</code>
            </p>
          </div>
        )}

        {!isLoading && !isError && hasSearched && publications.length === 0 && (
          <div className="pointer-events-none absolute left-1/2 top-24 z-[1001] -translate-x-1/2 px-4 md:top-20">
            <p className="pointer-events-auto max-w-[min(100%,20rem)] rounded-full bg-slate-800 px-4 py-2 text-center text-xs font-medium text-white shadow-lg">
              No matches for this search.{" "}
              <button
                type="button"
                className="font-bold underline"
                onClick={clearFilters}
              >
                Show all on map
              </button>
            </p>
          </div>
        )}

        {searchError && (
          <div className="pointer-events-none absolute left-1/2 top-24 z-[1001] -translate-x-1/2 px-4 md:top-20">
            <p className="pointer-events-auto max-w-[min(100%,20rem)] rounded-full bg-red-600 px-4 py-2 text-center text-xs font-medium text-white shadow-lg">
              {searchError}
            </p>
          </div>
        )}

        <DraggableMapPanel boundsRef={mapChromeBoundsRef}>
          <MapSearchHub
            author={author}
            affiliation={affiliation}
            title={title}
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            categories={categories}
            subCategories={subCategories}
            suggestionSource={mapPublications}
            resultCount={publications.length}
            searching={searching}
            hasResults={hasSearched}
            onOpenResults={() => {
              userDismissedResultsRailRef.current = false;
              setResultsRailOpen(true);
              setResultsRailCollapsed(false);
            }}
            onAuthorChange={setAuthor}
            onAffiliationChange={setAffiliation}
            onTitleChange={setTitle}
            onCategoryChange={setCategoryId}
            onSubCategoryChange={setSubCategoryId}
            onSearch={handleSearch}
            onClear={clearFilters}
          />
        </DraggableMapPanel>

        {summaryPublication && (
          <DraggableMapPanel
            boundsRef={mapChromeBoundsRef}
            storageKey="gre-map-summary-position-v1"
            layout="floating-card"
          >
            <MapSummaryDock
              publication={summaryPublication}
              onClose={() => setSummaryPubId(null)}
            />
          </DraggableMapPanel>
        )}

        {resultsRailOpen && (
          <MapResultsRail
            publications={publications}
            open={resultsRailOpen}
            collapsed={resultsRailCollapsed}
            onToggleCollapse={() => setResultsRailCollapsed((c) => !c)}
            onClose={() => {
              userDismissedResultsRailRef.current = true;
              setResultsRailOpen(false);
              setResultsRailCollapsed(false);
            }}
          />
        )}

        {!resultsRailOpen && !summaryPublication && (
          <div className="pointer-events-none absolute bottom-24 right-4 z-[1000] hidden w-[min(100%,240px)] md:block lg:bottom-8 lg:right-6">
            <GreAdPlacement
              placement="sidebar"
              limit={6}
              rotate
              className="pointer-events-auto space-y-3"
            />
          </div>
        )}
      </main>

      <PublicFooter variant="compact" publicationCount={onMapWithCoords || totalOnMap} />
    </div>
  );
}
