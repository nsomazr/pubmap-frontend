import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { parseMapDeepLink } from "../lib/mapDeepLink";
import { buildPublicationChatPath, publicationPublicApiPath } from "../lib/publicationPaths";
import { DraggableMapPanel } from "../components/landing/DraggableMapPanel";
import { MapResultsRail } from "../components/landing/MapResultsRail";
import { MapSearchHub } from "../components/landing/MapSearchHub";
import { GreAdPlacement } from "../components/ads/GreAdSlot";
import { PublicFooter } from "../components/layout/PublicFooter";
import { EagerRouteComplete } from "../components/navigation/EagerRouteComplete";
import { PublicNav } from "../components/layout/PublicNav";
import { ResearchMap } from "../components/map/ResearchMap";
import { MapPublicationSheet } from "../components/map/MapPublicationSheet";
import { BrandMark } from "../components/brand/BrandMark";
import { formatMapRegionLabel, reverseGeocodeRegion } from "../lib/geocode";
import { MAP_REGION_RADIUS_KM } from "../lib/mapRegion";
import {
  filterPublicationsByAuthorQuery,
  normalizeAuthorSearchQuery,
} from "../lib/mapAuthorSearch";
import {
  publicationIdsForTaxonomyHighlight,
  toggleTaxonomyHighlight,
  type MapTaxonomyHighlight,
} from "../lib/mapTaxonomyHighlight";
import type {
  AuthorResearchResponse,
  Category,
  InstitutionResearchResponse,
  MapRegionSelection,
  Publication,
  SubCategory,
} from "../types";

type MapSearchFilters = {
  author: string;
  affiliation: string;
  title: string;
  location: string;
  mapRegion: MapRegionSelection | null;
  categoryId: string;
  subCategoryId: string;
};

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mapDeepLink = useMemo(
    () => parseMapDeepLink(searchParams.toString()),
    [searchParams]
  );
  const [author, setAuthor] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Publication[] | null>(null);
  const [resultsRailOpen, setResultsRailOpen] = useState(false);
  const [resultsRailCollapsed, setResultsRailCollapsed] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [authorResearch, setAuthorResearch] = useState<AuthorResearchResponse | null>(null);
  const [authorResearchLoading, setAuthorResearchLoading] = useState(false);
  const [institutionResearch, setInstitutionResearch] =
    useState<InstitutionResearchResponse | null>(null);
  const [institutionResearchLoading, setInstitutionResearchLoading] = useState(false);
  const [mapPickMode, setMapPickMode] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegionSelection | null>(null);
  const [selectedPublicationId, setSelectedPublicationId] = useState<number | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [focusPubId, setFocusPubId] = useState<number | null>(null);
  const [deepLinkPub, setDeepLinkPub] = useState<Publication | null>(null);
  const mapChromeBoundsRef = useRef<HTMLElement | null>(null);
  const skipAutoSearchRef = useRef(true);
  const userDismissedResultsRailRef = useRef(false);
  const [mapViewResetToken, setMapViewResetToken] = useState(0);
  const [taxonomyHighlight, setTaxonomyHighlight] = useState<MapTaxonomyHighlight | null>(null);

  const currentMapFilters = useCallback(
    (): MapSearchFilters => ({
      author,
      affiliation,
      title,
      location,
      mapRegion,
      categoryId,
      subCategoryId,
    }),
    [author, affiliation, title, location, mapRegion, categoryId, subCategoryId]
  );

  const mapFiltersActive = useCallback((filters: MapSearchFilters) => {
    return Boolean(
      filters.author.trim() ||
        filters.affiliation.trim() ||
        filters.title.trim() ||
        filters.location.trim() ||
        filters.mapRegion ||
        filters.categoryId ||
        filters.subCategoryId
    );
  }, []);

  const clearMapSearchUrl = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        const pub = prev.get("pub") || prev.get("publication");
        if (pub) next.set("pub", pub);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    const ref = mapDeepLink.publicationRef;
    if (!ref) return;
    const numericId = /^\d+$/.test(ref) ? Number(ref) : null;
    if (numericId != null) setFocusPubId(numericId);
    if (mapDeepLink.panel === "summary") {
      navigate(buildPublicationChatPath(ref), { replace: true });
    }
  }, [mapDeepLink.publicationRef, mapDeepLink.panel, navigate]);

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

  const syncMapUrlFromFilters = useCallback(
    (filters: MapSearchFilters) => {
      const params = new URLSearchParams();
      const authorQ = filters.author.trim();
      const affiliationQ = filters.affiliation.trim();
      const locationQ = filters.location.trim();
      if (authorQ) params.set("author", authorQ);
      if (affiliationQ) params.set("affiliation", affiliationQ);
      if (locationQ && !filters.mapRegion) params.set("location", locationQ);
      if (filters.categoryId) params.set("category", filters.categoryId);
      if (filters.subCategoryId) params.set("sub_category", filters.subCategoryId);
      if (mapDeepLink.publicationRef) params.set("pub", mapDeepLink.publicationRef);
      setSearchParams(params, { replace: true });
    },
    [mapDeepLink.publicationRef, setSearchParams]
  );

  const runSearch = useCallback(
    async (
      filters?: MapSearchFilters,
      options?: { revealResults?: boolean }
    ) => {
      const active = filters ?? currentMapFilters();
      setTaxonomyHighlight(null);
      setSearching(true);
      setSearchError(null);
      const authorQuery = normalizeAuthorSearchQuery(active.author);
      const affiliationQuery = active.affiliation.trim();
      const authorSearch = authorQuery.length >= 2;
      const mapBaseline = data?.publications ?? [];
      const institutionSearch = affiliationQuery.length >= 2 && !authorSearch;
      try {
        const pubsRequest = api.get<Publication[]>("/map/search/", {
          params: {
            author: authorSearch ? authorQuery : undefined,
            affiliation: institutionSearch ? affiliationQuery : undefined,
            title: active.title || undefined,
            location: active.mapRegion ? undefined : active.location || undefined,
            lat: active.mapRegion?.lat,
            lng: active.mapRegion?.lng,
            radius_km: active.mapRegion?.radiusKm,
            category: active.categoryId || undefined,
            sub_category: active.subCategoryId || undefined,
          },
        });
        const researcherRequest = authorSearch
            ? api.get<AuthorResearchResponse>("/map/researchers/search/", {
                params: { q: authorQuery },
              })
            : Promise.resolve(null);
        const institutionRequest = institutionSearch
            ? api.get<InstitutionResearchResponse>("/map/institutions/search/", {
                params: { q: affiliationQuery },
              })
            : Promise.resolve(null);

        setAuthorResearchLoading(authorSearch);
        setInstitutionResearchLoading(institutionSearch);
        const [pubsResponse, researcherResponse, institutionResponse] = await Promise.all([
          pubsRequest,
          researcherRequest,
          institutionRequest,
        ]);
        let pubs = pubsResponse.data;
        if (authorSearch && pubs.length === 0 && mapBaseline.length > 0) {
          pubs = filterPublicationsByAuthorQuery(mapBaseline, authorQuery);
        }
        setResults(pubs);
        setAuthorResearch(researcherResponse ? researcherResponse.data : null);
        setInstitutionResearch(
          institutionResponse ? institutionResponse.data : null
        );
        syncMapUrlFromFilters(active);
        if (options?.revealResults) {
          userDismissedResultsRailRef.current = false;
          setResultsRailOpen(true);
          setResultsRailCollapsed(false);
        } else if (!userDismissedResultsRailRef.current) {
          setResultsRailOpen(true);
        }
      } catch {
        setSearchError("Search failed. Check your connection and try again.");
        setAuthorResearch(null);
        setInstitutionResearch(null);
      } finally {
        setSearching(false);
        setAuthorResearchLoading(false);
        setInstitutionResearchLoading(false);
      }
    },
    [currentMapFilters, data?.publications, syncMapUrlFromFilters]
  );

  const applyDeepLinkSearch = useCallback(
    (patch: { author?: string; affiliation?: string; location?: string }) => {
      skipAutoSearchRef.current = false;
      userDismissedResultsRailRef.current = false;
      const nextAuthor = patch.author !== undefined ? patch.author : author;
      const nextAffiliation =
        patch.affiliation !== undefined ? patch.affiliation : affiliation;
      const nextLocation = patch.location !== undefined ? patch.location : location;
      const nextRegion = patch.location !== undefined ? null : mapRegion;

      if (patch.author !== undefined) {
        setAuthor(patch.author);
        setAffiliation("");
      }
      if (patch.affiliation !== undefined) {
        setAffiliation(patch.affiliation);
        setAuthor("");
      }
      if (patch.location !== undefined) {
        setLocation(patch.location);
        setMapRegion(null);
      }

      void runSearch(
        {
          author: patch.author !== undefined ? patch.author : nextAuthor,
          affiliation:
            patch.affiliation !== undefined ? patch.affiliation : nextAffiliation,
          title,
          location: nextLocation,
          mapRegion: nextRegion,
          categoryId,
          subCategoryId,
        },
        { revealResults: true }
      );
    },
    [author, affiliation, title, location, mapRegion, categoryId, subCategoryId, runSearch]
  );

  const applyDeepLinkSearchRef = useRef(applyDeepLinkSearch);
  applyDeepLinkSearchRef.current = applyDeepLinkSearch;

  useEffect(() => {
    if (!mapDeepLink.author) return;
    applyDeepLinkSearchRef.current({ author: mapDeepLink.author });
  }, [mapDeepLink.author]);

  useEffect(() => {
    if (!mapDeepLink.affiliation) return;
    applyDeepLinkSearchRef.current({ affiliation: mapDeepLink.affiliation });
  }, [mapDeepLink.affiliation]);

  useEffect(() => {
    if (mapDeepLink.location) {
      setLocation(mapDeepLink.location);
      skipAutoSearchRef.current = false;
      return;
    }
    if (!searchPanelOpen) setLocation("");
  }, [mapDeepLink.location, searchPanelOpen]);

  useEffect(() => {
    if (mapDeepLink.categoryId || mapDeepLink.subCategoryId) {
      if (mapDeepLink.categoryId) setCategoryId(mapDeepLink.categoryId);
      if (mapDeepLink.subCategoryId) setSubCategoryId(mapDeepLink.subCategoryId);
      skipAutoSearchRef.current = false;
      return;
    }
    if (!searchPanelOpen) {
      setCategoryId("");
      setSubCategoryId("");
    }
  }, [mapDeepLink.categoryId, mapDeepLink.subCategoryId, searchPanelOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    skipAutoSearchRef.current = false;
    await runSearch(
      {
        author,
        affiliation,
        title,
        location,
        mapRegion,
        categoryId,
        subCategoryId,
      },
      { revealResults: true }
    );
  };

  const handleMapRegionPick = useCallback(
    (lat: number, lng: number) => {
      setLocation("");
      setMapPickMode(false);
      skipAutoSearchRef.current = false;

      void (async () => {
        let resolved: string | null = null;
        try {
          resolved = await reverseGeocodeRegion(lat, lng);
        } catch {
          resolved = null;
        }
        const selection: MapRegionSelection = {
          lat,
          lng,
          radiusKm: MAP_REGION_RADIUS_KM,
          label: formatMapRegionLabel(lat, lng, resolved),
        };
        setMapRegion(selection);
        await runSearch(
          {
            author,
            affiliation,
            title,
            location: "",
            mapRegion: selection,
            categoryId,
            subCategoryId,
          },
          { revealResults: true }
        );
      })();
    },
    [author, affiliation, title, categoryId, subCategoryId, runSearch]
  );

  const returnToMapOverview = useCallback(() => {
    setResults(null);
    setSearchError(null);
    setAuthorResearch(null);
    setAuthorResearchLoading(false);
    setInstitutionResearch(null);
    setInstitutionResearchLoading(false);
    setResultsRailOpen(false);
    setResultsRailCollapsed(false);
    setSelectedPublicationId(null);
    setFocusPubId(null);
    userDismissedResultsRailRef.current = false;
    setTaxonomyHighlight(null);
    setMapViewResetToken((token) => token + 1);
  }, []);

  const applyMapFilterChange = useCallback(
    (patch: Partial<MapSearchFilters>) => {
      if (patch.author !== undefined) setAuthor(patch.author);
      if (patch.affiliation !== undefined) setAffiliation(patch.affiliation);
      if (patch.title !== undefined) setTitle(patch.title);
      if (patch.location !== undefined) setLocation(patch.location);
      if (patch.mapRegion !== undefined) setMapRegion(patch.mapRegion);
      if (patch.categoryId !== undefined) setCategoryId(patch.categoryId);
      if (patch.subCategoryId !== undefined) setSubCategoryId(patch.subCategoryId);

      if (searchPanelOpen) return;
      skipAutoSearchRef.current = false;
    },
    [searchPanelOpen]
  );

  const clearFilters = useCallback(() => {
    setAuthor("");
    setAffiliation("");
    setTitle("");
    setLocation("");
    setMapRegion(null);
    setMapPickMode(false);
    setCategoryId("");
    setSubCategoryId("");
    setDeepLinkPub(null);
    returnToMapOverview();
    skipAutoSearchRef.current = true;
    clearMapSearchUrl();
  }, [clearMapSearchUrl, returnToMapOverview]);

  const hasImmediateMapFilters = mapFiltersActive(currentMapFilters());

  useEffect(() => {
    if (hasImmediateMapFilters) return;
    if (
      results !== null ||
      resultsRailOpen ||
      authorResearch ||
      institutionResearch ||
      searchError
    ) {
      returnToMapOverview();
      clearMapSearchUrl();
      skipAutoSearchRef.current = true;
    }
  }, [
    hasImmediateMapFilters,
    results,
    resultsRailOpen,
    authorResearch,
    institutionResearch,
    searchError,
    returnToMapOverview,
    clearMapSearchUrl,
  ]);

  useEffect(() => {
    if (skipAutoSearchRef.current) return;
    if (searchPanelOpen) return;
    if (!hasImmediateMapFilters) return;
    void runSearch({
      author,
      affiliation,
      title,
      location,
      mapRegion,
      categoryId,
      subCategoryId,
    });
  }, [
    hasImmediateMapFilters,
    author,
    affiliation,
    title,
    location,
    mapRegion,
    categoryId,
    subCategoryId,
    searchPanelOpen,
    runSearch,
  ]);

  const mapPublications = data?.publications ?? [];

  useEffect(() => {
    const ref = mapDeepLink.publicationRef;
    if (!ref || isLoading) return;
    const found = mapPublications.find(
      (p) => p.encoded_id === ref || String(p.id) === ref
    );
    if (found) {
      setDeepLinkPub(found);
      setFocusPubId(found.id);
      return;
    }
    let cancelled = false;
    api
      .get<Publication>(publicationPublicApiPath(ref))
      .then(({ data: pub }) => {
        if (!cancelled) {
          setDeepLinkPub(pub);
          setFocusPubId(pub.id);
        }
      })
      .catch(() => {
        if (!cancelled) setDeepLinkPub(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mapDeepLink.publicationRef, mapPublications, isLoading]);

  const hasSearched = results !== null;
  const basePublications = hasSearched ? (results ?? []) : mapPublications;
  const handleTaxonomyHighlight = useCallback((next: MapTaxonomyHighlight) => {
    setTaxonomyHighlight((current) => toggleTaxonomyHighlight(current, next));
  }, []);

  const publications = useMemo(() => {
    if (deepLinkPub && !basePublications.some((p) => p.id === deepLinkPub.id)) {
      return [deepLinkPub, ...basePublications];
    }
    return basePublications;
  }, [basePublications, deepLinkPub]);
  const mapDisplayPublications = useMemo(() => {
    if (deepLinkPub && !mapPublications.some((p) => p.id === deepLinkPub.id)) {
      return [deepLinkPub, ...mapPublications];
    }
    return mapPublications;
  }, [mapPublications, deepLinkPub]);
  const highlightedPublicationIds = useMemo(() => {
    const searchPool = results ?? [];
    if (taxonomyHighlight?.name) {
      return publicationIdsForTaxonomyHighlight(searchPool, taxonomyHighlight);
    }
    if (hasSearched && searchPool.length > 0) {
      return searchPool.map((pub) => pub.id);
    }
    return [];
  }, [hasSearched, results, taxonomyHighlight]);
  const categories = data?.categories ?? [];
  const subCategories = data?.sub_categories ?? [];
  const totalOnMap = mapPublications.length;
  const onMapWithCoords = mapPublications.filter(
    (p) => p.coordinates?.latitude && p.coordinates?.longitude
  ).length;

  const selectedPublication = useMemo(() => {
    if (!selectedPublicationId) return null;
    return publications.find((p) => p.id === selectedPublicationId) ?? null;
  }, [publications, selectedPublicationId]);

  useEffect(() => {
    if (!mapExpanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMapExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mapExpanded]);

  return (
    <>
      <EagerRouteComplete />
      <div
      className={`landing-page relative flex min-h-[100dvh] flex-col overflow-hidden bg-slate-200${
        resultsRailOpen && !resultsRailCollapsed ? " landing-page--results-open" : ""
      }${selectedPublication ? " landing-page--marker-sheet-open" : ""}${
        mapExpanded ? " landing-page--map-expanded" : ""
      }`}
    >
      {!mapExpanded && <PublicNav variant="map" />}

      <main ref={mapChromeBoundsRef} className="relative min-h-0 flex-1">
        <div className="absolute inset-0">
          {isLoading ? (
            <div className="flex h-full items-center justify-center bg-slate-100">
              <div className="animate-pulse opacity-40">
                <BrandMark symbol="full" variant="light" size="md" />
              </div>
            </div>
          ) : (
            <ResearchMap
              publications={mapDisplayPublications}
              focusPublicationId={focusPubId}
              highlightedPublicationIds={highlightedPublicationIds}
              mapViewResetToken={mapViewResetToken}
              height="100%"
              className="rounded-none border-0"
              mappedTotal={data?.meta?.with_coordinates}
              mapExpanded={mapExpanded}
              onMapExpandedChange={setMapExpanded}
              mapPickMode={mapPickMode}
              mapRegion={mapRegion}
              onMapRegionPick={handleMapRegionPick}
              onPublicationSelect={(publication) =>
                setSelectedPublicationId(publication?.id ?? null)
              }
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

        <DraggableMapPanel boundsRef={mapChromeBoundsRef} persistPosition={false}>
          <MapSearchHub
            author={author}
            affiliation={affiliation}
            title={title}
            location={location}
            mapPickMode={mapPickMode}
            mapRegionLabel={mapRegion?.label}
            categoryId={categoryId}
            subCategoryId={subCategoryId}
            categories={categories}
            subCategories={subCategories}
            suggestionSource={mapPublications}
            resultCount={publications.length}
            searching={searching}
            searchError={searchError}
            hasResults={hasSearched}
            resultsPanelVisible={resultsRailOpen && !resultsRailCollapsed}
            onOpenChange={setSearchPanelOpen}
            onOpenResults={() => {
              userDismissedResultsRailRef.current = false;
              setResultsRailOpen(true);
              setResultsRailCollapsed(false);
            }}
            onAuthorChange={(value) => applyMapFilterChange({ author: value })}
            onAffiliationChange={(value) => applyMapFilterChange({ affiliation: value })}
            onTitleChange={(value) => applyMapFilterChange({ title: value })}
            onLocationChange={(value) => {
              applyMapFilterChange({
                location: value,
                ...(value.trim() ? { mapRegion: null } : {}),
              });
            }}
            onMapPickModeChange={setMapPickMode}
            onMapRegionClear={() => {
              setMapPickMode(false);
              applyMapFilterChange({ mapRegion: null });
            }}
            onCategoryChange={(value) =>
              applyMapFilterChange({
                categoryId: value,
                subCategoryId: value ? subCategoryId : "",
              })
            }
            onSubCategoryChange={(value) => applyMapFilterChange({ subCategoryId: value })}
            onSearch={handleSearch}
            onClear={clearFilters}
          />
        </DraggableMapPanel>

        {selectedPublication && (
          <MapPublicationSheet
            publication={selectedPublication}
            onClose={() => setSelectedPublicationId(null)}
          />
        )}

        {mapExpanded && (
          <button
            type="button"
            onClick={() => setMapExpanded(false)}
            className="pointer-events-auto absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[1300] rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm hover:bg-slate-900"
          >
            Exit expanded map
          </button>
        )}

        {resultsRailOpen && (
          <MapResultsRail
            publications={publications}
            authorResearch={authorResearch}
            authorResearchLoading={authorResearchLoading}
            authorQuery={author.trim()}
            institutionResearch={institutionResearch}
            institutionResearchLoading={institutionResearchLoading}
            affiliationQuery={affiliation.trim()}
            titleQuery={title.trim()}
            locationQuery={location.trim() || mapRegion?.label || ""}
            open={resultsRailOpen}
            collapsed={resultsRailCollapsed}
            onToggleCollapse={() => setResultsRailCollapsed((c) => !c)}
            onClose={clearFilters}
            onApplyMapFilter={applyDeepLinkSearch}
            taxonomyHighlight={taxonomyHighlight}
            onTaxonomyHighlight={handleTaxonomyHighlight}
          />
        )}

        {!resultsRailOpen && (
          <div className="pointer-events-none absolute bottom-32 z-[1000] hidden w-[min(100%,240px)] md:right-16 md:block lg:bottom-28 lg:right-20">
            <GreAdPlacement
              placement="sidebar"
              limit={4}
              rotate
              className="pointer-events-auto space-y-3"
            />
            <GreAdPlacement
              placement="research_tool"
              limit={2}
              rotate
              className="pointer-events-auto mt-3 space-y-3"
            />
          </div>
        )}
      </main>

      {!mapExpanded && (
        <PublicFooter variant="compact" publicationCount={onMapWithCoords || totalOnMap} />
      )}
    </div>
    </>
  );
}
