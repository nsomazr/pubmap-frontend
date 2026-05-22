import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";
import { DraggableMapPanel } from "../components/landing/DraggableMapPanel";
import { MapResultsRail } from "../components/landing/MapResultsRail";
import { MapSearchHub } from "../components/landing/MapSearchHub";
import { MapSummaryDock } from "../components/landing/MapSummaryDock";
import {
  GRE_SUMMARY_REQUEST,
  type GreSummaryRequestDetail,
} from "../components/map/publicationPopupSummary";
import { PublicFooter } from "../components/layout/PublicFooter";
import { PublicNav } from "../components/layout/PublicNav";
import { ResearchMap } from "../components/map/ResearchMap";
import { assets } from "../lib/brand";
import type { Category, Publication, SubCategory } from "../types";

export function HomePage() {
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
  const mapChromeBoundsRef = useRef<HTMLElement | null>(null);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setSearchError(null);
    try {
      const { data } = await api.get<Publication[]>("/map/search/", {
        params: {
          author: author || undefined,
          affiliation: affiliation || undefined,
          title: title || undefined,
          category: categoryId || undefined,
          sub_category: subCategoryId || undefined,
        },
      });
      setResults(data);
      setResultsRailOpen(true);
      setResultsRailCollapsed(false);
    } catch {
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    setAuthor("");
    setAffiliation("");
    setTitle("");
    setCategoryId("");
    setSubCategoryId("");
    setResults(null);
    setResultsRailOpen(false);
  };

  const mapPublications = data?.publications ?? [];
  const hasSearched = results !== null;
  const publications = hasSearched ? (results ?? []) : mapPublications;
  const categories = data?.categories ?? [];
  const subCategories = data?.sub_categories ?? [];
  const totalOnMap = mapPublications.length;
  const onMapWithCoords = mapPublications.filter(
    (p) => p.coordinates?.latitude && p.coordinates?.longitude
  ).length;

  const summaryPublication = useMemo(
    () => publications.find((p) => p.id === summaryPubId) ?? null,
    [publications, summaryPubId]
  );

  return (
    <div
      className={`landing-page relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-200${
        resultsRailOpen && !resultsRailCollapsed ? " landing-page--results-open" : ""
      }`}
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
            <ResearchMap publications={publications} height="100%" className="rounded-none border-0" />
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
            resultCount={publications.length}
            searching={searching}
            hasResults={hasSearched}
            onOpenResults={() => {
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
          <MapSummaryDock
            publication={summaryPublication}
            onClose={() => setSummaryPubId(null)}
          />
        </DraggableMapPanel>

        {resultsRailOpen && (
          <MapResultsRail
            publications={publications}
            open={resultsRailOpen}
            collapsed={resultsRailCollapsed}
            onToggleCollapse={() => setResultsRailCollapsed((c) => !c)}
            onClose={() => setResultsRailOpen(false)}
          />
        )}
      </main>

      <PublicFooter variant="compact" publicationCount={onMapWithCoords || totalOnMap} />
    </div>
  );
}
