import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  AlertCircle,
  Eye,
  Loader2,
  PenLine,
  Plus,
  Save,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LocationPicker } from "../../components/map/LocationPicker";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { buildAuthorByline } from "../../lib/publicationAuthors";
import {
  buildDashboardPublicationPath,
  publicationApiSegment,
} from "../../lib/publicationPaths";
import { hasValidCoords } from "../../lib/geocode";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { Button } from "../../components/ui/Button";
import { InstitutionPicker } from "../../components/institutions/InstitutionPicker";
import { Input } from "../../components/ui/Input";
import { CategorySubcategoryPicker } from "../../components/forms/CategorySubcategoryPicker";
import { PublicationLifecyclePanel } from "../../components/publication/PublicationLifecyclePanel";
import { AdminPublicationReviewCard } from "../../components/publication/AdminPublicationReviewCard";
import { ManuscriptUploadField } from "../../components/publication/ManuscriptUploadField";
import {
  ManuscriptSectionsEditor,
  type ManuscriptFields,
} from "../../components/publication/ManuscriptSectionsEditor";
import { ExtractionLoadingPanel } from "../../components/publication/ExtractionLoadingPanel";
import {
  PublicationDocumentUpload,
  type ExtractedDocumentPayload,
} from "../../components/publication/PublicationDocumentUpload";
import {
  PublicationAccessTypeGate,
} from "../../components/publication/PublicationAccessTypeGate";
import { PublicationAccessFields } from "../../components/publication/PublicationAccessFields";
import { AuthorsCommentSection } from "../../components/publication/AuthorsCommentSection";
import { PublicationPaperPreview } from "../../components/publication/PublicationPaperPreview";
import { SubmissionReviewDialog } from "../../components/publication/SubmissionReviewDialog";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import api, { parseApiError } from "../../lib/api";
import { sanitizeExtractionWarnings } from "../../lib/extractionWarnings";
import { PublicationFiguresEditor } from "../../components/publication/PublicationFiguresEditor";
import { RevisionFeedbackBanner } from "../../components/publication/RevisionFeedbackBanner";
import { primaryManuscriptPath } from "../../lib/publicationDocuments";
import { PublicationSupplementaryUpload } from "../../components/publication/PublicationSupplementaryUpload";
import { renderManuscriptHtml } from "../../lib/renderManuscriptHtml";
import {
  MANUSCRIPT_FIELD_WORD_LIMITS,
  type ManuscriptLimitedField,
  NARRATIVE_MANUSCRIPT_FIELDS,
  externalWordLimit,
  normalizeFunderField,
  limitReferences,
  truncateHtmlToWordLimit,
  truncateHtmlToWordLimitAtSentence,
  truncateToWordLimit,
} from "../../lib/manuscriptFieldLimits";
import { useToast } from "../../components/ui/ToastProvider";
import {
  AUTHORS_PERSONAL_FEELING_LABEL,
  reviewManuscriptPdfUrl,
  updatePublicationGre,
  type GreDocument,
  type PublicationAccessType,
  type PublicationGre,
} from "../../lib/publicationGre";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { resolveSubcategoryFromModel } from "../../lib/taxonomyVisuals";
import { canReviewPublication, isPlatformAdmin } from "../../lib/userAccess";
import { greFormActionsClass, greFormGridClass, greFormPrimaryButtonClass } from "../../lib/formStyles";
import { RequiredFieldsLegend } from "../../components/ui/RequiredField";
import type { Category, Collaborator, Coordinate, Publication, PublicationFigure } from "../../types";

const emptyCoord = (): Coordinate => ({
  location: "",
  latitude: "",
  longitude: "",
  institution: "",
});

function hasTextContent(value: string): boolean {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    const doc = new DOMParser().parseFromString(trimmed, "text/html");
    return Boolean((doc.body.textContent || "").trim());
  }
  return true;
}

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((k) => k.trim())
    .filter(Boolean);
}

function formatKeywords(keywords?: string[] | null): string {
  return Array.isArray(keywords) ? keywords.join(", ") : "";
}

type ExtractionStatus = "idle" | "extracting" | "ready" | "error";

type ExtractionUiState = {
  status: ExtractionStatus;
  warnings: string[];
  engine?: string;
  sectionNotes?: Record<string, string>;
};

function ComposerStage({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="gre-card overflow-visible p-4 sm:p-8">
      <div className="border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white shadow-sm">
            {number}
          </span>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

type ComposerTab = "editor" | "preview";
const NEW_DRAFT_SESSION_KEY = "gre-publication-new-draft-v1";

export function PublicationManagePage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = isPlatformAdmin(user);
  const draftsNavPath = "/dashboard/publications?status=0";

  const [composerTab, setComposerTab] = useState<ComposerTab>("editor");
  const [accessTypeChosen, setAccessTypeChosen] = useState(!isNew);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [methods, setMethods] = useState("");
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [funder, setFunder] = useState("");
  const [references, setReferences] = useState("");
  const [keywords, setKeywords] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinate>(emptyCoord());
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [submitterRole, setSubmitterRole] = useState<"lead" | "coauthor">("lead");
  const [leadAuthorName, setLeadAuthorName] = useState("");
  const [leadAuthorAffiliation, setLeadAuthorAffiliation] = useState("");
  const [leadAuthorEmail, setLeadAuthorEmail] = useState("");
  const [gre, setGre] = useState<PublicationGre>({ access_type: "open" });
  const [figures, setFigures] = useState<PublicationFigure[]>([]);
  const [error, setError] = useState("");
  const [pendingDocument, setPendingDocument] = useState<File | null>(null);
  const [extractionUi, setExtractionUi] = useState<ExtractionUiState>({
    status: "idle",
    warnings: [],
    sectionNotes: {},
  });
  const [submitReviewOpen, setSubmitReviewOpen] = useState(false);
  const [createdDraftId, setCreatedDraftId] = useState<number | null>(null);
  const [createdDraftEncodedId, setCreatedDraftEncodedId] = useState<string | null>(null);
  const [figuresUploadBusy, setFiguresUploadBusy] = useState(false);
  const [figuresPendingCount, setFiguresPendingCount] = useState(0);
  const flushFigureCaptionsRef = useRef<(() => Promise<void>) | null>(null);
  const extractionAbortRef = useRef<AbortController | null>(null);
  const extractionCancelledRef = useRef(false);
  const [documentUploadExtracting, setDocumentUploadExtracting] = useState(false);
  const createdDraftIdRef = useRef<number | null>(createdDraftId);
  createdDraftIdRef.current = createdDraftId;
  const createdDraftEncodedIdRef = useRef<string | null>(createdDraftEncodedId);
  createdDraftEncodedIdRef.current = createdDraftEncodedId;
  const saveDraftPromiseRef = useRef<Promise<Publication | null> | null>(null);
  const isClosedAccess = gre.access_type === "closed";

  type SaveOptions = { thenSubmit?: boolean; quiet?: boolean };

  const manuscript: ManuscriptFields = {
    abstract,
    introduction,
    methods,
    findings,
    conclusion,
    funder,
    references,
    keywords,
  };

  const setManuscript = useCallback((key: keyof ManuscriptFields, value: string) => {
    const setters: Record<keyof ManuscriptFields, (v: string) => void> = {
      abstract: setAbstract,
      introduction: setIntroduction,
      methods: setMethods,
      findings: setFindings,
      conclusion: setConclusion,
      funder: setFunder,
      references: setReferences,
      keywords: setKeywords,
    };
    setters[key](value);
  }, []);

  const applyExtractedSection = useCallback(
    (raw: string | undefined, field: ManuscriptLimitedField) => {
      if (!raw?.trim()) return "";
      const limit = externalWordLimit(field);
      const html = renderManuscriptHtml(raw);
      if (NARRATIVE_MANUSCRIPT_FIELDS.includes(field as (typeof NARRATIVE_MANUSCRIPT_FIELDS)[number])) {
        return truncateHtmlToWordLimitAtSentence(html, limit);
      }
      return truncateHtmlToWordLimit(html, limit);
    },
    []
  );

  const applyExtractedDocument = useCallback(
    (payload: ExtractedDocumentPayload) => {
      const limits = MANUSCRIPT_FIELD_WORD_LIMITS;
      const nextTitle = (payload.title || "").trim();
      if (nextTitle) setTitle(truncateToWordLimit(nextTitle, limits.title));
      const nextAbstract = applyExtractedSection(payload.abstract, "abstract");
      if (nextAbstract) setAbstract(nextAbstract);
      const nextIntroduction = applyExtractedSection(payload.introduction, "introduction");
      if (nextIntroduction) setIntroduction(nextIntroduction);
      const nextMethods = applyExtractedSection(payload.methods, "methods");
      if (nextMethods) setMethods(nextMethods);
      const nextFindings = applyExtractedSection(payload.findings, "findings");
      if (nextFindings) setFindings(nextFindings);
      const nextConclusion = applyExtractedSection(payload.conclusion, "conclusion");
      if (nextConclusion) setConclusion(nextConclusion);
      const nextFunder = normalizeFunderField((payload.funder || "").trim());
      if (nextFunder) setFunder(nextFunder);
      const nextKeywords = truncateToWordLimit((payload.keywords || "").trim(), limits.keywords);
      if (nextKeywords) setKeywords(nextKeywords);
      setExtractionUi({
        status: "ready",
        warnings: sanitizeExtractionWarnings(payload.warnings),
        engine: payload.extraction_engine,
        sectionNotes: payload.section_notes ?? {},
      });
    },
    [applyExtractedSection, title]
  );

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const editQueryKey = useMemo(() => ["publication-edit", id] as const, [id]);

  const {
    data: pub,
    isLoading,
    isError: pubLoadError,
    refetch: refetchPublication,
  } = useQuery({
    queryKey: editQueryKey,
    enabled: !isNew && !!id,
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/${publicationApiSegment(id!)}/`);
      return data;
    },
    staleTime: 30_000,
  });

  const persistedPublicationId =
    pub?.id ?? createdDraftId ?? (id && !isNew ? Number(id) : null);
  const persistedEncodedId = pub?.encoded_id ?? createdDraftEncodedId ?? null;
  const existingDocPath = primaryManuscriptPath(pub);
  const hasDocument = Boolean(pendingDocument || existingDocPath);

  const hydratedPublicationId = useRef<number | null>(null);

  useEffect(() => {
    if (!isNew || typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(NEW_DRAFT_SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        accessTypeChosen?: boolean;
        title?: string;
        abstract?: string;
        introduction?: string;
        methods?: string;
        findings?: string;
        conclusion?: string;
        funder?: string;
        references?: string;
        keywords?: string;
        subCategoryId?: string;
        categoryId?: string;
        coordinates?: Coordinate;
        submitterRole?: "lead" | "coauthor";
        leadAuthorName?: string;
        leadAuthorAffiliation?: string;
        leadAuthorEmail?: string;
        collaborators?: Collaborator[];
        gre?: PublicationGre;
      };
      if (typeof saved.accessTypeChosen === "boolean") setAccessTypeChosen(saved.accessTypeChosen);
      if (typeof saved.title === "string") setTitle(saved.title);
      if (typeof saved.abstract === "string") setAbstract(saved.abstract);
      if (typeof saved.introduction === "string") setIntroduction(saved.introduction);
      if (typeof saved.methods === "string") setMethods(saved.methods);
      if (typeof saved.findings === "string") setFindings(saved.findings);
      if (typeof saved.conclusion === "string") setConclusion(saved.conclusion);
      if (typeof saved.funder === "string") setFunder(saved.funder);
      if (typeof saved.references === "string") setReferences(saved.references);
      if (typeof saved.keywords === "string") setKeywords(saved.keywords);
      if (typeof saved.subCategoryId === "string") setSubCategoryId(saved.subCategoryId);
      if (typeof saved.categoryId === "string") setCategoryId(saved.categoryId);
      if (saved.coordinates) setCoordinates(saved.coordinates);
      if (saved.submitterRole) setSubmitterRole(saved.submitterRole);
      if (typeof saved.leadAuthorName === "string") setLeadAuthorName(saved.leadAuthorName);
      if (typeof saved.leadAuthorAffiliation === "string") {
        setLeadAuthorAffiliation(saved.leadAuthorAffiliation);
      }
      if (typeof saved.leadAuthorEmail === "string") setLeadAuthorEmail(saved.leadAuthorEmail);
      if (Array.isArray(saved.collaborators)) setCollaborators(saved.collaborators);
      if (saved.gre) setGre(saved.gre);
    } catch {
      /* ignore malformed session data */
    }
  }, [isNew]);

  useEffect(() => {
    if (!isNew || typeof window === "undefined") return;
    const payload = {
      accessTypeChosen,
      title,
      abstract,
      introduction,
      methods,
      findings,
      conclusion,
      funder,
      references,
      keywords,
      subCategoryId,
      categoryId,
      coordinates,
      submitterRole,
      leadAuthorName,
      leadAuthorAffiliation,
      leadAuthorEmail,
      collaborators,
      gre,
    };
    window.sessionStorage.setItem(NEW_DRAFT_SESSION_KEY, JSON.stringify(payload));
  }, [
    isNew,
    accessTypeChosen,
    title,
    abstract,
    introduction,
    methods,
    findings,
    conclusion,
    funder,
    references,
    keywords,
    subCategoryId,
    categoryId,
    coordinates,
    submitterRole,
    leadAuthorName,
    leadAuthorAffiliation,
    leadAuthorEmail,
    collaborators,
    gre,
  ]);

  const canReviewThis =
    Boolean(pub) &&
    canReviewPublication(user, { status: pub!.status, sub_category_id: pub!.sub_category_id });

  useEffect(() => {
    if (!pub) {
      hydratedPublicationId.current = null;
      return;
    }
    if (hydratedPublicationId.current === pub.id) return;
    hydratedPublicationId.current = pub.id;

    setTitle(pub.title);
    setAbstract(pub.abstract ?? "");
    setIntroduction(pub.introduction ?? "");
    setMethods(pub.methods ?? "");
    setFindings(pub.findings ?? "");
    setConclusion(pub.conclusion ?? "");
    setFunder(normalizeFunderField(pub.funder ?? ""));
    setReferences(limitReferences(pub.references ?? "", pub.title ?? ""));
    setKeywords(formatKeywords(pub.keywords));
    setSubCategoryId(pub.sub_category_id ? String(pub.sub_category_id) : "");
    if (pub.coordinates) {
      setCoordinates({
        ...pub.coordinates,
        institution:
          pub.coordinates.institution?.trim() || user?.affiliation?.trim() || "",
      });
    } else {
      setCoordinates(emptyCoord());
    }
    if (pub.collaborators?.length) {
      const lead = pub.collaborators.find((c) => /^lead author$/i.test((c.role || "").trim()));
      const submitterEmail = (pub.author?.email || user?.email || "").trim().toLowerCase();
      const leadEmail = (lead?.email || "").trim().toLowerCase();
      if (lead && leadEmail && submitterEmail && leadEmail !== submitterEmail) {
        setSubmitterRole("coauthor");
        setLeadAuthorName(lead.fullname || "");
        setLeadAuthorAffiliation(lead.affiliation || "");
        setLeadAuthorEmail(lead.email || "");
        setCollaborators(
          pub.collaborators.filter(
            (c) =>
              c.id !== lead.id &&
              (c.email || "").trim().toLowerCase() !== submitterEmail &&
              !/^lead author$/i.test((c.role || "").trim())
          )
        );
      } else {
        setSubmitterRole("lead");
        setCollaborators(pub.collaborators);
      }
    } else {
      setSubmitterRole("lead");
      setCollaborators([]);
    }
    setGre(pub.gre ?? { access_type: "open" });
    setFigures(pub.figures ?? pub.photos ?? []);
    setAccessTypeChosen(true);
    setPendingDocument(null);
    setExtractionUi({ status: "idle", warnings: [], sectionNotes: {} });
    if (pub.status === 2) setComposerTab("editor");
  }, [pub, user?.affiliation, user?.email]);

  useEffect(() => {
    if (!pub?.sub_category_id || !categories.length) return;
    const cat = categories.find((c) =>
      c.sub_categories?.some((s) => s.id === pub.sub_category_id)
    );
    if (cat) setCategoryId(String(cat.id));
  }, [pub?.sub_category_id, categories]);

  useEffect(() => {
    if (!isNew) return;
    const affiliation = user?.affiliation?.trim();
    if (!affiliation) return;
    setCoordinates((prev) =>
      prev.institution?.trim() ? prev : { ...prev, institution: affiliation }
    );
  }, [isNew, user?.affiliation]);

  useEffect(() => {
    if (location.hash !== "#review" || !pub || pub.status !== 1) return;
    const el = document.getElementById("review");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, pub?.id, pub?.status]);

  useEffect(() => {
    if (!pub || !location.search.includes("focus=claims")) return;
    const el = document.getElementById("claims");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.search, pub?.id]);

  useEffect(() => {
    if (!pub || !location.search.includes("focus=feedback")) return;
    const el = document.getElementById("feedback");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.search, pub?.id]);

  const extractDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      extractionAbortRef.current?.abort();
      const controller = new AbortController();
      extractionAbortRef.current = controller;
      const signal = controller.signal;

      const buildForm = () => {
        const form = new FormData();
        form.append("document", file);
        return form;
      };

      try {
        const { data } = await api.post<ExtractedDocumentPayload>(
          "/publications/extract_document/",
          buildForm(),
          {
            params: { use_ai: 1 },
            signal,
          }
        );
        return data;
      } catch (error) {
        if (axios.isCancel(error)) {
          throw error;
        }
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status && status < 500 && status !== 401 && status !== 429) {
          throw error;
        }

        const { data } = await api.post<ExtractedDocumentPayload>(
          "/publications/extract_document/",
          buildForm(),
          {
            params: { use_ai: 0, ocr_backend: "tesseract" },
            signal,
          }
        );
        return {
          ...data,
          warnings: sanitizeExtractionWarnings(data.warnings),
        };
      } finally {
        if (extractionAbortRef.current === controller) {
          extractionAbortRef.current = null;
        }
      }
    },
    onMutate: () => {
      extractionCancelledRef.current = false;
      setExtractionUi({
        status: "extracting",
        warnings: [],
        sectionNotes: {},
      });
    },
    onSuccess: (data) => {
      applyExtractedDocument(data);
    },
    onError: (err) => {
      if (axios.isCancel(err)) {
        setExtractionUi({
          status: "idle",
          warnings: ["Extraction stopped. You can upload the file again to retry."],
          sectionNotes: {},
        });
        return;
      }
      setExtractionUi({
        status: "error",
        warnings: [parseApiError(err, "Could not extract sections from that file.")],
        sectionNotes: {},
      });
    },
  });

  const stopExtraction = useCallback(() => {
    extractionCancelledRef.current = true;
    extractionAbortRef.current?.abort();
    extractionAbortRef.current = null;
    extractDocumentMutation.reset();
    setDocumentUploadExtracting(false);
    setExtractionUi({
      status: "idle",
      warnings: ["Extraction stopped. You can upload the file again to retry."],
      sectionNotes: {},
    });
  }, [extractDocumentMutation]);

  const extractionActive =
    extractionUi.status === "extracting" || documentUploadExtracting;

  useEffect(() => {
    if (!pendingDocument) {
      extractionCancelledRef.current = false;
      if (!documentUploadExtracting) {
        setExtractionUi({ status: "idle", warnings: [], sectionNotes: {} });
      }
      return;
    }
    if (extractionCancelledRef.current) {
      return;
    }
    extractDocumentMutation.mutate(pendingDocument);
  }, [pendingDocument]);

  const buildCollaboratorsPayload = (): Collaborator[] => {
    if (submitterRole === "coauthor") {
      const extra = collaborators.filter((c) => (c.fullname || "").trim());
      return [
        {
          fullname: leadAuthorName.trim(),
          affiliation: leadAuthorAffiliation.trim(),
          email: leadAuthorEmail.trim(),
          role: "Lead author",
        },
        {
          fullname: user?.full_name || `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim(),
          affiliation: user?.affiliation || "",
          email: user?.email || "",
          role: "Co-author",
        },
        ...extra,
      ];
    }
    return collaborators;
  };

  const reportValidationError = (message: string) => {
    setError(message);
    toast.error({
      title: "Missing required field",
      description: message,
    });
  };

  const getSaveValidationError = (): string | null => {
    if (extractionActive) {
      return "Please wait while GRE extracts manuscript sections from the uploaded paper.";
    }
    if (figuresUploadBusy) {
      return "Please wait while figures finish uploading.";
    }
    if (figuresPendingCount > 0) {
      return "Wait for figures to finish uploading, or remove pending images.";
    }
    if (!title.trim()) return "Title is required.";
    if (!hasTextContent(abstract)) return "Abstract is required.";
    if (submitterRole === "coauthor" && !leadAuthorName.trim()) {
      return "Lead author name is required when submitting as a co-author.";
    }
    return null;
  };

  const getSubmitValidationError = (): string | null => {
    const saveErr = getSaveValidationError();
    if (saveErr) return saveErr;
    if (!categoryId) return "Research field is required.";
    if (!subCategoryId) return "Research subfield is required.";
    if (!coordinates.location.trim()) return "Location of study is required.";
    if (!coordinates.institution?.trim()) return "Institution / affiliation is required.";
    if (!hasValidCoords(coordinates.latitude, coordinates.longitude)) {
      return "Pick a study location on the map (valid coordinates).";
    }
    if (isClosedAccess) {
      if (!hasTextContent(introduction)) return "Introduction is required for restricted access.";
      if (!hasTextContent(methods)) return "Methods is required for restricted access.";
      if (!hasTextContent(findings)) {
        return "Findings is required for restricted access.";
      }
      if (!gre.external_url?.trim()) return "Publisher access link is required for restricted access.";
    } else if (!hasDocument && !gre.external_url?.trim()) {
      return "Upload a manuscript PDF or add an external access link.";
    }
    return null;
  };

  const persistPublicationDraft = useCallback(
    async (options?: { quiet?: boolean }): Promise<Publication | null> => {
      const err = getSaveValidationError();
      if (err) {
        if (!options?.quiet) reportValidationError(err);
        return null;
      }
      if (saveDraftPromiseRef.current) {
        return saveDraftPromiseRef.current;
      }

      const task = (async (): Promise<Publication | null> => {
        try {
          const payload = {
            title,
            abstract,
            introduction,
            methods,
            findings,
            conclusion,
            funder,
            references: limitReferences(references, title),
            keywords: parseKeywords(keywords),
            sub_category_id: subCategoryId ? Number(subCategoryId) : null,
            coordinates,
            collaborators: buildCollaboratorsPayload(),
          };
          let data: Publication;
          if (isNew && !createdDraftIdRef.current) {
            const res = await api.post<Publication>("/publications/", payload);
            data = res.data;
          } else {
            const targetId = createdDraftIdRef.current ?? Number(id);
            const res = await api.patch<Publication>(
              `/publications/${publicationApiSegment(
                targetId,
                createdDraftEncodedIdRef.current ?? persistedEncodedId
              )}/`,
              payload
            );
            data = res.data;
          }
          createdDraftIdRef.current = data.id;
          if (data.encoded_id) createdDraftEncodedIdRef.current = data.encoded_id;
          hydratedPublicationId.current = data.id;
          setCreatedDraftId(data.id);
          if (data.encoded_id) setCreatedDraftEncodedId(data.encoded_id);
          queryClient.invalidateQueries({ queryKey: ["publications"] });
          queryClient.invalidateQueries({ queryKey: editQueryKey });
          return data;
        } catch {
          return null;
        }
      })();

      saveDraftPromiseRef.current = task;
      try {
        return await task;
      } finally {
        saveDraftPromiseRef.current = null;
      }
    },
    [
      abstract,
      conclusion,
      coordinates,
      collaborators,
      createdDraftEncodedId,
      editQueryKey,
      extractionUi.status,
      figuresPendingCount,
      figuresUploadBusy,
      findings,
      funder,
      id,
      introduction,
      isNew,
      keywords,
      leadAuthorAffiliation,
      leadAuthorEmail,
      leadAuthorName,
      methods,
      queryClient,
      references,
      subCategoryId,
      submitterRole,
      title,
    ]
  );

  const saveMutation = useMutation({
    mutationFn: async (options?: SaveOptions) => {
      const data = await persistPublicationDraft({ quiet: options?.quiet });
      if (!data) throw new Error("SAVE_FAILED");
      let captionWarning: string | null = null;
      try {
        await flushFigureCaptionsRef.current?.();
      } catch {
        captionWarning =
          "Some figure captions could not be saved. Re-open the draft and save captions again if needed.";
      }
      if (options?.thenSubmit) {
        await api.post(
          `/publications/${publicationApiSegment(data.id, data.encoded_id)}/submit_review/`,
          { author_declaration: true }
        );
      }
      return { data, captionWarning };
    },
    onSuccess: async ({ data, captionWarning }, options?: SaveOptions) => {
      if (isNew && typeof window !== "undefined") {
        window.sessionStorage.removeItem(NEW_DRAFT_SESSION_KEY);
      }
      if (pendingDocument) {
        try {
          const form = new FormData();
          form.append("document", pendingDocument);
          await api.post(`/publications/${data.id}/upload_document/`, form);
        } catch {
          setError("Draft saved, but the manuscript file could not be uploaded. Try again from the submission form.");
          setSubmitReviewOpen(false);
          queryClient.invalidateQueries({ queryKey: ["publications"] });
          navigate(buildDashboardPublicationPath(data.id, data.encoded_id));
          return;
        }
        setPendingDocument(null);
      }
      if (data.id) {
        try {
          await updatePublicationGre(data.id, gre);
        } catch {
          /* gre meta optional on save */
        }
      }
      queryClient.invalidateQueries({ queryKey: ["publications"] });
      queryClient.invalidateQueries({ queryKey: editQueryKey });
      hydratedPublicationId.current = data.id;
      setCreatedDraftId(data.id);
      if (data.encoded_id) setCreatedDraftEncodedId(data.encoded_id);

      if (options?.quiet) {
        return;
      }

      if (captionWarning) {
        setError(captionWarning);
      }

      if (options?.thenSubmit) {
        setSubmitReviewOpen(false);
        navigate("/dashboard/publications?status=1");
      } else if (!options?.quiet) {
        navigate(draftsNavPath);
      }
    },
    onError: (err: { response?: { data?: Record<string, unknown> } }, options?: SaveOptions) => {
      if (options?.thenSubmit) {
        const detail =
          typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : parseApiError(err);
        setError(detail || "Could not submit for review. Check required fields and try again.");
        return;
      }
      const data = err.response?.data;
      if (typeof data?.detail === "string") {
        setError(data.detail);
        return;
      }
      if (data && typeof data === "object") {
        const parts: string[] = [];
        for (const [key, val] of Object.entries(data)) {
          if (Array.isArray(val)) parts.push(String(val[0] ?? val));
          else if (typeof val === "string") parts.push(val);
        }
        if (parts.length) {
          setError(parts.join(" "));
          return;
        }
      }
      setError("Could not save publication. Check the title and abstract, then try again.");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () =>
      api.post(`/publications/${publicationApiSegment(id!, pub?.encoded_id)}/accept/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: editQueryKey });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () =>
      api.post(`/publications/${publicationApiSegment(id!, pub?.encoded_id)}/admin_comment/`, {
        comment: adminNote.trim(),
      }),
    onSuccess: () => {
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: editQueryKey });
    },
  });

  const hideMutation = useMutation({
    mutationFn: () =>
      api.post(`/publications/${publicationApiSegment(id!, pub?.encoded_id)}/archive/`),
    onSuccess: () => navigate("/dashboard/publications?status=4"),
  });

  const isOwner = Boolean(pub && pub.author?.id === user?.id);
  const canEditForm = isNew || isOwner || isAdmin;
  const isReadOnly = Boolean(
    pub && (pub.status === 4 || pub.status === 6 || (!canEditForm && !isNew))
  );
  const canSubmit =
    pub && (pub.status === 0 || pub.status === 2) && isOwner && !isReadOnly;

  const addCollaborator = () =>
    setCollaborators([...collaborators, { fullname: "", affiliation: "", email: "", role: "" }]);

  const showComposer = accessTypeChosen || !isNew;

  const subVisual = useMemo(() => {
    if (!subCategoryId || !categories.length) return null;
    for (const cat of categories) {
      const sub = cat.sub_categories?.find((s) => String(s.id) === subCategoryId);
      if (sub) return resolveSubcategoryFromModel(sub);
    }
    return null;
  }, [categories, subCategoryId]);

  const subCategoryName =
    categories
      .flatMap((c) => c.sub_categories ?? [])
      .find((s) => String(s.id) === subCategoryId)?.name ?? pub?.sub_category_name;

  const authorDisplayName =
    user?.full_name || `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim();

  const previewAuthorTeam = useMemo(() => {
    if (submitterRole === "coauthor") {
      const team = [
        {
          fullname: leadAuthorName.trim(),
          affiliation: leadAuthorAffiliation.trim(),
        },
        {
          fullname: authorDisplayName,
          affiliation: user?.affiliation || coordinates.institution || "",
          profile_url: user?.id ? `/researcher/${user.id}` : null,
          user_id: user?.id ?? null,
        },
        ...collaborators
          .filter((c) => (c.fullname || "").trim())
          .map((c) => ({
            fullname: c.fullname,
            affiliation: c.affiliation,
          })),
      ];
      return team.filter((c) => (c.fullname || "").trim());
    }
    const primary = {
      fullname: authorDisplayName,
      affiliation: user?.affiliation || coordinates.institution || "",
      profile_url: user?.id ? `/researcher/${user.id}` : null,
      user_id: user?.id ?? null,
    };
    const coAuthors = collaborators
      .filter((c) => (c.fullname || "").trim())
      .map((c) => ({
        fullname: c.fullname,
        affiliation: c.affiliation,
      }));
    return [primary, ...coAuthors];
  }, [
    submitterRole,
    authorDisplayName,
    user?.affiliation,
    user?.id,
    coordinates.institution,
    collaborators,
    leadAuthorName,
    leadAuthorAffiliation,
    leadAuthorEmail,
  ]);

  const previewAuthorByline = useMemo(
    () => buildAuthorByline(previewAuthorTeam),
    [previewAuthorTeam]
  );

  const paperPreviewData = useMemo(
    () => ({
      title,
      greNumber: pub?.short_number,
      authorByline: previewAuthorByline,
      abstract,
      keywords: parseKeywords(keywords),
      funder,
      introduction,
      methods,
      findings,
      conclusion,
      subVisual,
      subCategoryName,
      location: coordinates.location,
      accessType: gre.access_type,
      authorsComment: gre.authors_comment,
      figures,
      greDoi: gre.gre_doi ?? pub?.gre?.gre_doi ?? null,
      viewsCount: pub?.views_count ?? 0,
      downloadsCount: pub?.downloads_count ?? 0,
      discussionsCount: pub?.discussions_count ?? 0,
      responsesCount: pub?.responses_count ?? 0,
    }),
    [
      title,
      pub?.short_number,
      pub?.views_count,
      pub?.downloads_count,
      pub?.discussions_count,
      pub?.responses_count,
      previewAuthorByline,
      coordinates.location,
      abstract,
      keywords,
      funder,
      introduction,
      methods,
      findings,
      conclusion,
      subVisual,
      subCategoryName,
      gre.access_type,
      gre.authors_comment,
      gre.gre_doi,
      pub?.gre?.gre_doi,
      figures,
    ]
  );

  const handleAccessTypeSelect = (type: PublicationAccessType) => {
    setGre((g) => ({ ...g, access_type: type }));
    setAccessTypeChosen(true);
    setComposerTab("editor");
  };
  const openHasSource = hasDocument || Boolean(gre.external_url?.trim());

  const submitValidationError = getSubmitValidationError();
  const readyToSubmit = submitValidationError === null;
  const showSubmitReview = isNew || canSubmit;

  const ensurePublicationForFigures = async (): Promise<number | null> => {
    if (persistedPublicationId) return persistedPublicationId;
    const data = await persistPublicationDraft({ quiet: true });
    return data?.id ?? null;
  };

  const validateAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = getSaveValidationError();
    if (err) {
      reportValidationError(err);
      return;
    }
    saveMutation.mutate({});
  };

  const openSubmitReview = () => {
    setError("");
    const err = getSubmitValidationError();
    if (err) {
      reportValidationError(err);
      return;
    }
    setSubmitReviewOpen(true);
  };

  const confirmSubmitForReview = () => {
    saveMutation.mutate({ thenSubmit: true });
  };

  if (!isNew && isLoading) {
    return <p className="text-slate-500">Loading publication…</p>;
  }

  if (!isNew && !isLoading && (pubLoadError || !pub)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6">
        <p className="font-semibold text-red-900">Could not load this publication</p>
        <p className="mt-2 text-sm text-red-800/90">
          Your draft or revision data could not be retrieved. Check your connection and try again.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => refetchPublication()}>
            Retry
          </Button>
          <Link
            to="/dashboard/publications?status=2"
            className="inline-flex items-center text-sm font-semibold text-brand-600 hover:underline"
          >
            Back to revisions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up pb-8">
      <PageHeader
        title={isNew ? "New publication" : pub?.title || "Edit publication"}
        action={
          !isNew && pub ? (
            <div className="flex items-center gap-2">
              <StatusBadge status={pub.status} />
              <Link
                to={draftsNavPath}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Drafts
              </Link>
              <Link
                to="/dashboard/publications"
                className="text-sm font-medium text-slate-500 hover:text-brand-600"
              >
                Back to list
              </Link>
            </div>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!isNew && pub && (pub.plagiarism_claims?.length ?? 0) > 0 && (
        <section id="claims" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertCircle className="h-4 w-4" />
            Plagiarism claims and moderation requests
          </h2>
          <p className="mt-2 text-sm text-amber-900/85">
            Review the claim details below, update this existing publication, and resubmit when you
            have addressed the issues.
          </p>
          <div className="mt-4 space-y-4">
            {pub.plagiarism_claims!.map((claim) => (
              <article key={claim.id} className="rounded-xl border border-amber-100 bg-white/90 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      Claim #{claim.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Filed {new Date(claim.created_at).toLocaleString()}
                      {claim.reporter_name ? ` · Reporter: ${claim.reporter_name}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    {claim.status === "revision"
                      ? "Address claims requested"
                      : claim.status === "hidden"
                        ? "Hidden from publications"
                        : claim.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {claim.description}
                </p>
                {claim.admin_notes && (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                    <span className="font-semibold">Admin note: </span>
                    {claim.admin_notes}
                  </p>
                )}
                {claim.evidence.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Claim evidence
                    </p>
                    <ul className="mt-2 space-y-1">
                      {claim.evidence.map((item) => (
                        <li key={item.id}>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-brand-700 hover:underline"
                          >
                            {item.label || "Attachment"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {canReviewThis && !isNew && pub && pub.status === 1 && (
        <section id="review" className="mb-8 scroll-mt-6">
          <AdminPublicationReviewCard pub={pub} />
        </section>
      )}

      {!isNew && pub && (
        <PublicationLifecyclePanel
          publication={pub}
          isOwner={isOwner}
          isAdmin={isAdmin}
        />
      )}

      {isAdmin && !isOwner && !isNew && pub && pub.status !== 1 && pub.status !== 4 && pub.status !== 6 && (
        <section className="mb-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
          <h2 className="text-sm font-semibold text-violet-900">Admin actions</h2>
          {!isOwner && (
            <p className="mt-2 text-sm text-violet-800/90">
              You are viewing another researcher&apos;s submission. You can edit metadata to help, but
              only the author may submit for review.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {pub.status === 3 && (
              <Button type="button" variant="secondary" onClick={() => hideMutation.mutate()}>
                Archive (admin)
              </Button>
            )}
          </div>
          {pub.status === 2 && (
            <form
              className="mt-4 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (adminNote.trim()) commentMutation.mutate();
              }}
            >
              <Textarea
                label="Request revision"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Feedback for the author…"
              />
              <Button type="submit" variant="secondary" loading={commentMutation.isPending}>
                Send revision request
              </Button>
            </form>
          )}
        </section>
      )}

      {isNew && !accessTypeChosen && (
        <PublicationAccessTypeGate
          selected={accessTypeChosen ? gre.access_type : null}
          onSelect={handleAccessTypeSelect}
        />
      )}

      {showComposer && !isNew && pub?.status === 2 && isOwner && (
        <div className="mb-6">
          <RevisionFeedbackBanner
            comments={pub.admin_comments ?? []}
            revisionRequested
          />
        </div>
      )}

      {showComposer && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-slate-100/90 p-1.5 ring-1 ring-slate-200/70">
          <button
            type="button"
            onClick={() => setComposerTab("editor")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              composerTab === "editor"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            <PenLine className="h-4 w-4" />
            Submission details
          </button>
          <button
            type="button"
            onClick={() => setComposerTab("preview")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              composerTab === "preview"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            <Eye className="h-4 w-4" />
            Paper preview
          </button>
          {isNew && accessTypeChosen && (
            <button
              type="button"
              onClick={() => setAccessTypeChosen(false)}
              className="ml-auto self-center px-3 text-xs font-semibold text-brand-600 hover:underline"
            >
              Change access type
            </button>
          )}
        </div>
      )}

      {showComposer && (
      <form className={`space-y-8${isReadOnly ? " pointer-events-none opacity-60" : ""}`} onSubmit={validateAndSave}>
        {isReadOnly && (
          <p className="pointer-events-auto rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            {pub?.status === 6 || pub?.status === 4
              ? `This publication is ${pub?.status === 6 ? "deleted" : "archived"} and cannot be edited until restored.`
              : "Only the publication author can edit this submission."}
          </p>
        )}
        {composerTab === "preview" && (
          <section className="gre-card p-4 sm:p-6">
            <PublicationPaperPreview
              data={paperPreviewData}
              publicationId={persistedPublicationId ?? 0}
              encodedPublicationId={persistedEncodedId ?? pub?.encoded_id}
              documentPath={existingDocPath}
              manuscriptPreviewUrl={
                persistedPublicationId
                  ? reviewManuscriptPdfUrl(
                      persistedPublicationId,
                      true,
                      persistedEncodedId ?? pub?.encoded_id
                    )
                  : null
              }
              pendingFile={pendingDocument}
              draft
            />
          </section>
        )}

        {composerTab === "editor" && (
          <>
            <ComposerStage number="1" title="Research setup">
              <RequiredFieldsLegend className="mb-4" />
              <CategorySubcategoryPicker
                categories={categories}
                categoryId={categoryId}
                subCategoryId={subCategoryId}
                onCategoryChange={setCategoryId}
                onSubCategoryChange={setSubCategoryId}
                required
              />
            </ComposerStage>

            <ComposerStage number="2" title="Source paper">
                {isNew ? (
                  <div className="space-y-3">
                    <ManuscriptUploadField
                      file={pendingDocument}
                      onFileChange={(file) => {
                        extractionCancelledRef.current = false;
                        setPendingDocument(file);
                      }}
                      existingDocumentPath={existingDocPath}
                      disabled={isReadOnly}
                    />
                    {extractionUi.status === "error" && extractionUi.warnings[0] && (
                      <p className="text-sm text-red-600">{extractionUi.warnings[0]}</p>
                    )}
                  </div>
                ) : persistedPublicationId ? (
                  <PublicationDocumentUpload
                    publicationId={persistedPublicationId}
                    documents={pub?.documents}
                    disabled={isReadOnly}
                    extractOnUpload
                    onExtracted={applyExtractedDocument}
                    onSourceRemoved={() => {
                      setTitle("");
                      setAbstract("");
                      setIntroduction("");
                      setMethods("");
                      setFindings("");
                      setConclusion("");
                      setFunder("");
                      setReferences("");
                      setKeywords("");
                      setPendingDocument(null);
                      setExtractionUi({ status: "idle", warnings: [], sectionNotes: {} });
                    }}
                    extractionAbortRef={extractionAbortRef}
                    onExtractingChange={(active) => {
                      setDocumentUploadExtracting(active);
                      if (active) {
                        extractionCancelledRef.current = false;
                        setExtractionUi({
                          status: "extracting",
                          warnings: [],
                          sectionNotes: {},
                        });
                      }
                    }}
                  />
                ) : null}
            </ComposerStage>

            <ComposerStage number="3" title="Manuscript">
              <div className="space-y-6">
                {extractionActive && (
                  <ExtractionLoadingPanel
                    fileName={pendingDocument?.name ?? existingDocPath}
                    onStop={stopExtraction}
                  />
                )}
                {extractionUi.status === "ready" && extractionUi.warnings.length > 0 && (
                  <ul className="mb-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                    {extractionUi.warnings.map((warning) => (
                      <li key={warning} className="flex gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {extractionUi.status === "error" && extractionUi.warnings[0] && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {extractionUi.warnings[0]}
                  </div>
                )}
                <ManuscriptSectionsEditor
                  title={title}
                  onTitleChange={setTitle}
                  fields={manuscript}
                  onChange={setManuscript}
                  requireNarrativeSections={isClosedAccess}
                  sectionNotes={extractionUi.sectionNotes}
                  afterMethods={
                    <PublicationFiguresEditor
                      publicationId={persistedPublicationId ?? 0}
                      encodedPublicationId={persistedEncodedId}
                      figures={figures}
                      onChange={setFigures}
                      ensurePublicationId={ensurePublicationForFigures}
                      onActivityChange={({ uploading, pendingCount }) => {
                        setFiguresUploadBusy(uploading);
                        setFiguresPendingCount(pendingCount);
                      }}
                      registerFlushCaptions={(flush) => {
                        flushFigureCaptionsRef.current = flush;
                      }}
                    />
                  }
                />
              </div>
            </ComposerStage>

        <ComposerStage number="4" title="Study context">
          <LocationPicker
            value={coordinates}
            onChange={setCoordinates}
            institutionDefault={user?.affiliation || ""}
          />
        </ComposerStage>

        <ComposerStage number="5" title="Access & submit">
          <div className="space-y-8">
            <PublicationAccessFields
              gre={gre}
              onChange={setGre}
              accessLocked={isNew && accessTypeChosen}
              onChangeAccess={!isNew ? handleAccessTypeSelect : undefined}
              disabled={isReadOnly}
              requirePublisherLink={isClosedAccess}
            />

            {!isClosedAccess && !isNew && persistedPublicationId && (
              <PublicationSupplementaryUpload
                publicationId={persistedPublicationId}
                documents={pub?.documents as GreDocument[] | undefined}
              />
            )}

          </div>
        </ComposerStage>

        <ComposerStage number="6" title="Contributors">
          <section className="space-y-4">
            <div>
              <h2 className="font-semibold text-ink">Your role on this publication</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["lead", "I am the lead author"],
                  ["coauthor", "I am a co-author"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => setSubmitterRole(value)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition ${
                    submitterRole === value
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-700 ring-slate-200 hover:ring-brand-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {submitterRole === "coauthor" && (
              <div className="grid gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Lead author name"
                  value={leadAuthorName}
                  onChange={(e) => setLeadAuthorName(e.target.value)}
                  disabled={isReadOnly}
                />
                <InstitutionPicker
                  value={leadAuthorAffiliation}
                  onChange={setLeadAuthorAffiliation}
                  label="Lead author affiliation"
                  hideHint
                />
                <Input
                  label="Lead author email"
                  value={leadAuthorEmail}
                  onChange={(e) => setLeadAuthorEmail(e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            )}
          </section>

          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Additional co-authors</h2>
              <button
                type="button"
                onClick={addCollaborator}
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            {collaborators.map((c, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 lg:grid-cols-2 xl:grid-cols-4"
              >
                <Input
                  label="Name"
                  value={c.fullname}
                  onChange={(e) => {
                    const next = [...collaborators];
                    next[i] = { ...c, fullname: e.target.value };
                    setCollaborators(next);
                  }}
                />
                <InstitutionPicker
                  value={c.affiliation}
                  onChange={(affiliation) => {
                    const next = [...collaborators];
                    next[i] = { ...c, affiliation };
                    setCollaborators(next);
                  }}
                  label="Affiliation"
                  hideHint
                />
                <Input
                  label="Contribution (optional)"
                  placeholder="e.g. Field lead, Data analysis"
                  value={c.role || ""}
                  onChange={(e) => {
                    const next = [...collaborators];
                    next[i] = { ...c, role: e.target.value };
                    setCollaborators(next);
                  }}
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="Email"
                    value={c.email || ""}
                    onChange={(e) => {
                      const next = [...collaborators];
                      next[i] = { ...c, email: e.target.value };
                      setCollaborators(next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setCollaborators(collaborators.filter((_, j) => j !== i))}
                    className="mb-0.5 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </section>
        </ComposerStage>

        <ComposerStage number="7" title={AUTHORS_PERSONAL_FEELING_LABEL}>
          <AuthorsCommentSection gre={gre} onChange={setGre} disabled={isReadOnly} />
        </ComposerStage>

        <div
          className={`publication-submit-bar ${greFormActionsClass} !shadow-lg`}
        >
          <Button
            type="submit"
            variant="secondary"
            className={greFormPrimaryButtonClass}
            loading={saveMutation.isPending && !submitReviewOpen}
            disabled={
              extractionActive ||
              figuresUploadBusy ||
              (saveMutation.isPending && !submitReviewOpen)
            }
          >
            <Save className="h-4 w-4" />
            {isNew ? "Save draft" : "Save changes"}
          </Button>
          {showSubmitReview && (
            <Button
              type="button"
              className={greFormPrimaryButtonClass}
              loading={saveMutation.isPending && submitReviewOpen}
              disabled={
                extractionActive ||
                figuresUploadBusy ||
                figuresPendingCount > 0 ||
                !readyToSubmit ||
                (saveMutation.isPending && submitReviewOpen)
              }
              title={!readyToSubmit && submitValidationError ? submitValidationError : undefined}
              onClick={openSubmitReview}
            >
              <Send className="h-4 w-4" />
              {pub?.status === 2 ? "Review & resubmit" : "Review & submit"}
            </Button>
          )}
          {showSubmitReview && !readyToSubmit && submitValidationError && (
            <p className="w-full text-xs text-slate-500 sm:basis-full">
              {submitValidationError}
            </p>
          )}
          {!isNew && isAdmin && !isOwner && (pub?.status === 0 || pub?.status === 2) && (
            <p className="text-xs text-slate-500">
              Only the author can submit or resubmit. Use{" "}
              <Link to="/dashboard/review" className="font-semibold text-brand-600 hover:underline">
                Review queue
              </Link>{" "}
              for pending submissions.
            </p>
          )}
          {!isNew && pub?.status === 3 && (
            <Link
              to={buildPublicationPath(pub.id, pub.encoded_id)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Eye className="h-4 w-4" />
              View on public map
            </Link>
          )}
        </div>
          </>
        )}
      </form>
      )}

      <SubmissionReviewDialog
        open={submitReviewOpen}
        title={title}
        manuscript={manuscript}
        keywords={keywords}
        subCategoryName={subCategoryName}
        location={coordinates.location}
        institution={coordinates.institution}
        accessType={gre.access_type}
        authorsComment={gre.authors_comment}
        figures={figures}
        publicationId={persistedPublicationId ?? figures[0]?.publication ?? 0}
        encodedPublicationId={persistedEncodedId ?? pub?.encoded_id}
        manuscriptFileName={
          pendingDocument?.name ??
          (existingDocPath ? existingDocPath.split("/").pop() : null)
        }
        submitting={saveMutation.isPending && submitReviewOpen}
        onClose={() => setSubmitReviewOpen(false)}
        onConfirm={confirmSubmitForReview}
      />
    </div>
  );
}
