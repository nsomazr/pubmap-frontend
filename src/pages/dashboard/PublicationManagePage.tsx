import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { marked } from "marked";
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LocationPicker } from "../../components/map/LocationPicker";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { buildAuthorByline } from "../../lib/publicationAuthors";
import { hasValidCoords } from "../../lib/geocode";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { Button } from "../../components/ui/Button";
import { InstitutionPicker } from "../../components/institutions/InstitutionPicker";
import { Input } from "../../components/ui/Input";
import { RequiredFieldsLegend } from "../../components/ui/RequiredField";
import { CategorySubcategoryPicker } from "../../components/forms/CategorySubcategoryPicker";
import { PublicationLifecyclePanel } from "../../components/publication/PublicationLifecyclePanel";
import { AdminPublicationReviewCard } from "../../components/publication/AdminPublicationReviewCard";
import { ManuscriptUploadField } from "../../components/publication/ManuscriptUploadField";
import {
  ManuscriptSectionsEditor,
  type ManuscriptFields,
} from "../../components/publication/ManuscriptSectionsEditor";
import {
  PublicationDocumentUpload,
  type ExtractedDocumentPayload,
} from "../../components/publication/PublicationDocumentUpload";
import {
  PublicationAccessTypeGate,
} from "../../components/publication/PublicationAccessTypeGate";
import { PublicationAccessFields } from "../../components/publication/PublicationAccessFields";
import { PublicationPaperPreview } from "../../components/publication/PublicationPaperPreview";
import { SubmissionReviewDialog } from "../../components/publication/SubmissionReviewDialog";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import api, { parseApiError } from "../../lib/api";
import { PublicationFiguresEditor } from "../../components/publication/PublicationFiguresEditor";
import { PublicationSupplementaryUpload } from "../../components/publication/PublicationSupplementaryUpload";
import { sanitizeHtml } from "../../lib/sanitizeHtml";
import {
  updatePublicationGre,
  type GreDocument,
  type PublicationAccessType,
  type PublicationGre,
} from "../../lib/publicationGre";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { resolveSubcategoryFromModel } from "../../lib/taxonomyVisuals";
import { canReviewPublication, isPlatformAdmin } from "../../lib/userAccess";
import type { Category, Collaborator, Coordinate, Publication, PublicationFigure } from "../../types";

const emptyCoord = (): Coordinate => ({
  location: "",
  latitude: "",
  longitude: "",
  institution: "",
  study_area: "",
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

marked.setOptions({
  gfm: true,
  breaks: false,
});

function looksLikeExtractedStructuralLine(line: string): boolean {
  const value = line.trim();
  if (!value) return false;
  if (/^\d+\s+of\s+\d+$/i.test(value)) return true;
  if (/^(?:keywords?|key\s+words?)\s*[:\-]/i.test(value)) return true;
  if (/^\s*(?:[-*+]|(?:\d+|[a-z])[\.\)])\s+/.test(value)) return true;
  if (/^\s*(?:abstract|summary|introduction|methods?|methodology|results?|findings?|discussion|conclusion|references?|bibliography)\b/i.test(value)) {
    return true;
  }
  if (/(?:https?:\/\/doi\.org\/|doi:\s*)/i.test(value)) return true;
  return false;
}

function looksLikeFormulaLine(line: string): boolean {
  const value = line.trim();
  if (!value) return false;
  if (/[=<>≈≠±×÷∑∏√∂∫μσλπϕθ]/.test(value)) return true;
  if (/\b(?:softmax|max|min|argmax|argmin|Q\(|O\(|f\(x\)|g\(x\)|sin\(|cos\(|tan\(|log\(|exp\()/i.test(value)) {
    return true;
  }
  const operatorCount = (value.match(/[=+\-/*^<>()[\]{}]/g) || []).length;
  const digitCount = (value.match(/\d/g) || []).length;
  return operatorCount >= 3 && digitCount >= 1;
}

function reflowExtractedBlock(block: string): string {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return lines[0] || "";

  const parts: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      parts.push(paragraph.join(" "));
      paragraph = [];
    }
  };

  for (const line of lines) {
    if (/^\d+\s+of\s+\d+$/i.test(line)) continue;
    if (looksLikeExtractedStructuralLine(line) || looksLikeFormulaLine(line)) {
      flushParagraph();
      parts.push(line);
      continue;
    }
    if (paragraph.length > 0 && paragraph[paragraph.length - 1].endsWith("-")) {
      paragraph[paragraph.length - 1] = paragraph[paragraph.length - 1].slice(0, -1) + line;
    } else {
      paragraph.push(line);
    }
  }

  flushParagraph();
  return parts.join("\n");
}

function markdownishFromExtractedText(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((block) => reflowExtractedBlock(block))
    .filter(Boolean)
    .map((block) =>
      block
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          if (/^\s*(?:[-*+]|(?:\d+|[a-z])[\.\)])\s+/.test(line)) return line;
          if (
            /^\s*(?:abstract|summary|introduction|methods?|methodology|results?|findings?|discussion|conclusion|references?|bibliography)\b/i.test(
              line.trim()
            )
          ) {
            return `### ${line.trim()}`;
          }
          return line;
        })
        .join("\n\n")
    )
    .join("\n\n");
}

function extractedTextToHtml(value?: string | null): string {
  const text = (value || "").trim();
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return sanitizeHtml(text);
  }

  const markdown = markdownishFromExtractedText(text);
  const rendered = marked.parse(markdown);
  return sanitizeHtml(typeof rendered === "string" ? rendered : String(rendered));
}

type ExtractionStatus = "idle" | "extracting" | "ready" | "error";

type ExtractionUiState = {
  status: ExtractionStatus;
  warnings: string[];
  engine?: string;
};

const EXTRACTION_STEPS = [
  {
    title: "Read",
    detail: "Reading the uploaded paper",
  },
  {
    title: "Detect",
    detail: "Detecting the title and main sections",
  },
  {
    title: "Prepare",
    detail: "Preparing fields for your review",
  },
] as const;

function ExtractionLoadingPanel({
  compact = false,
  activeStep = 0,
}: {
  compact?: boolean;
  activeStep?: number;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-200 bg-white/90 shadow-sm ${
        compact ? "mt-3 px-4 py-4" : "mb-5 px-5 py-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-900">Extracting manuscript details</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            GRE is reading the file and preparing the title plus manuscript sections for
            review. This usually takes a moment.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {EXTRACTION_STEPS.map((step, index) => {
              const isDone = index < activeStep;
              const isActive = index === activeStep;
              return (
                <div
                  key={step.title}
                  className={`rounded-2xl border px-3 py-3 transition ${
                    isActive
                      ? "border-brand-300 bg-brand-50/90 shadow-sm"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50/80"
                        : "border-slate-200 bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-brand-600 text-white"
                          : isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-600">{step.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!compact && (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ComposerTab = "editor" | "preview";

export function PublicationManagePage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = isPlatformAdmin(user);

  const [composerTab, setComposerTab] = useState<ComposerTab>("editor");
  const [accessTypeChosen, setAccessTypeChosen] = useState(!isNew);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [methods, setMethods] = useState("");
  const [results, setResults] = useState("");
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
  });
  const [activeExtractionStep, setActiveExtractionStep] = useState(0);
  const [submitReviewOpen, setSubmitReviewOpen] = useState(false);
  const isClosedAccess = gre.access_type === "closed";

  type SaveOptions = { thenSubmit?: boolean };

  const manuscript: ManuscriptFields = {
    abstract,
    introduction,
    methods,
    results,
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
      results: setResults,
      findings: setFindings,
      conclusion: setConclusion,
      funder: setFunder,
      references: setReferences,
      keywords: setKeywords,
    };
    setters[key](value);
  }, []);

  const applyExtractedDocument = useCallback((payload: ExtractedDocumentPayload) => {
    setTitle((current) => current.trim() || (payload.title || "").trim());
    setAbstract((current) =>
      hasTextContent(current) ? current : extractedTextToHtml(payload.abstract)
    );
    setIntroduction((current) =>
      hasTextContent(current) ? current : extractedTextToHtml(payload.introduction)
    );
    setMethods((current) => (hasTextContent(current) ? current : extractedTextToHtml(payload.methods)));
    setResults((current) => (hasTextContent(current) ? current : extractedTextToHtml(payload.results)));
    setFindings((current) =>
      hasTextContent(current) ? current : extractedTextToHtml(payload.findings)
    );
    setConclusion((current) =>
      hasTextContent(current) ? current : extractedTextToHtml(payload.conclusion)
    );
    setReferences((current) =>
      hasTextContent(current) ? current : extractedTextToHtml(payload.references)
    );
    setFunder((current) => current.trim() || (payload.funder || "").trim());
    setKeywords((current) => current.trim() || (payload.keywords || "").trim());
    setExtractionUi({
      status: "ready",
      warnings: payload.warnings ?? [],
      engine: payload.extraction_engine,
    });
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: pub, isLoading } = useQuery({
    queryKey: ["publication-edit", id],
    enabled: !isNew && !!id,
    queryFn: async () => {
      const { data } = await api.get<Publication>(`/publications/${id}/`);
      return data;
    },
  });

  const canReviewThis =
    Boolean(pub) &&
    canReviewPublication(user, { status: pub!.status, sub_category_id: pub!.sub_category_id });

  useEffect(() => {
    if (!pub) return;
    setTitle(pub.title);
    setAbstract(pub.abstract ?? "");
    setIntroduction(pub.introduction ?? "");
    setMethods(pub.methods ?? "");
    setResults(pub.results ?? "");
    setFindings(pub.findings ?? "");
    setConclusion(pub.conclusion ?? "");
    setFunder(pub.funder ?? "");
    setReferences(pub.references ?? "");
    setKeywords(formatKeywords(pub.keywords));
    setSubCategoryId(pub.sub_category_id ? String(pub.sub_category_id) : "");
    if (pub.sub_category_id && categories.length) {
      const cat = categories.find((c) =>
        c.sub_categories?.some((s) => s.id === pub.sub_category_id)
      );
      if (cat) setCategoryId(String(cat.id));
    }
    if (pub.coordinates) {
      setCoordinates({
        ...pub.coordinates,
        institution:
          pub.coordinates.institution?.trim() || user?.affiliation?.trim() || "",
      });
    }
    if (pub.collaborators) {
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
    }
    setGre(pub.gre ?? { access_type: "open" });
    setFigures(pub.figures ?? pub.photos ?? []);
    setAccessTypeChosen(true);
  }, [pub, categories, user?.affiliation]);

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
          }
        );
        return data;
      } catch (error) {
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        if (status && status < 500 && status !== 401 && status !== 429) {
          throw error;
        }

        const { data } = await api.post<ExtractedDocumentPayload>(
          "/publications/extract_document/",
          buildForm(),
          {
            params: { use_ai: 0 },
          }
        );
        const warnings = data.warnings ?? [];
        return {
          ...data,
          warnings: [
            ...warnings,
            "AI-assisted extraction was unavailable, so GRE retried with OCR-only extraction.",
          ],
        };
      }
    },
    onMutate: () => {
      setExtractionUi({
        status: "extracting",
        warnings: [],
      });
    },
    onSuccess: (data) => {
      applyExtractedDocument(data);
    },
    onError: (err) => {
      setExtractionUi({
        status: "error",
        warnings: [parseApiError(err, "Could not extract sections from that file.")],
      });
    },
  });

  useEffect(() => {
    if (!pendingDocument) {
      setExtractionUi({ status: "idle", warnings: [] });
      return;
    }
    extractDocumentMutation.mutate(pendingDocument);
  }, [pendingDocument]);

  useEffect(() => {
    if (extractionUi.status !== "extracting") {
      setActiveExtractionStep(0);
      return;
    }
    setActiveExtractionStep(0);
    const interval = window.setInterval(() => {
      setActiveExtractionStep((current) => Math.min(current + 1, EXTRACTION_STEPS.length - 1));
    }, 1400);
    return () => window.clearInterval(interval);
  }, [extractionUi.status]);

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

  const saveMutation = useMutation({
    mutationFn: async (_options?: SaveOptions) => {
      const payload = {
        title,
        abstract,
        introduction,
        methods,
        results,
        findings,
        conclusion,
        funder,
        references,
        keywords: parseKeywords(keywords),
        sub_category_id: subCategoryId ? Number(subCategoryId) : null,
        coordinates,
        collaborators: buildCollaboratorsPayload(),
      };
      if (isNew) {
        const { data } = await api.post<Publication>("/publications/", payload);
        return data;
      }
      const { data } = await api.patch<Publication>(`/publications/${id}/`, payload);
      return data;
    },
    onSuccess: async (data, options?: SaveOptions) => {
      if (pendingDocument) {
        try {
          const form = new FormData();
          form.append("document", pendingDocument);
          await api.post(`/publications/${data.id}/upload_document/`, form);
        } catch {
          setError("Draft saved, but the manuscript file could not be uploaded. Try again from the submission form.");
          setSubmitReviewOpen(false);
          queryClient.invalidateQueries({ queryKey: ["publications"] });
          navigate(`/dashboard/publications/${data.id}`);
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
      queryClient.invalidateQueries({ queryKey: ["publication-edit", String(data.id)] });

      if (options?.thenSubmit) {
        try {
          await api.post(`/publications/${data.id}/submit_review/`, {
            author_declaration: true,
          });
          setSubmitReviewOpen(false);
          navigate("/dashboard/publications?status=1");
        } catch (err: unknown) {
          const e = err as { response?: { data?: { detail?: string } } };
          setError(e.response?.data?.detail || "Saved, but could not submit for review.");
          setSubmitReviewOpen(false);
          navigate(`/dashboard/publications/${data.id}`);
        }
      } else {
        navigate(`/dashboard/publications/${data.id}`);
      }
    },
    onError: (err: { response?: { data?: Record<string, unknown> } }) => {
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
    mutationFn: () => api.post(`/publications/${id}/accept/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publication-edit", id] });
      queryClient.invalidateQueries({ queryKey: ["publications"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/publications/${id}/admin_comment/`, { comment: adminNote.trim() }),
    onSuccess: () => {
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["publication-edit", id] });
    },
  });

  const hideMutation = useMutation({
    mutationFn: () => api.post(`/publications/${id}/archive/`),
    onSuccess: () => navigate("/dashboard/publications?status=4"),
  });

  const isOwner = Boolean(pub && pub.author?.id === user?.id);
  const isReadOnly = Boolean(pub && (pub.status === 4 || pub.status === 6));
  const canSubmit =
    pub && (pub.status === 0 || pub.status === 2) && isOwner && !isReadOnly;

  const addCollaborator = () =>
    setCollaborators([...collaborators, { fullname: "", affiliation: "", email: "", role: "" }]);

  const existingDocPath = pub?.documents?.[0]?.document ?? null;
  const hasDocument = Boolean(pendingDocument || existingDocPath);
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
      results,
      findings,
      conclusion,
      subVisual,
      subCategoryName,
      location: coordinates.location,
      accessType: gre.access_type,
      greDoi: gre.gre_doi ?? pub?.gre?.gre_doi ?? null,
      viewsCount: pub?.views_count ?? 0,
      downloadsCount: pub?.downloads_count ?? 0,
      discussionsCount: pub?.discussions_count ?? 0,
    }),
    [
      title,
      pub?.short_number,
      pub?.views_count,
      pub?.downloads_count,
      pub?.discussions_count,
      previewAuthorByline,
      coordinates.location,
      abstract,
      keywords,
      funder,
      introduction,
      methods,
      results,
      findings,
      conclusion,
      subVisual,
      subCategoryName,
      gre.access_type,
      gre.gre_doi,
      pub?.gre?.gre_doi,
    ]
  );

  const handleAccessTypeSelect = (type: PublicationAccessType) => {
    setGre((g) => ({ ...g, access_type: type }));
    setAccessTypeChosen(true);
    setComposerTab("editor");
  };
  const closedSectionsReady =
    hasTextContent(abstract) &&
    hasTextContent(introduction) &&
    hasTextContent(methods) &&
    (hasTextContent(findings) || hasTextContent(results)) &&
    hasTextContent(conclusion);
  const openHasSource = hasDocument || Boolean(gre.external_url?.trim());
  const readyToSubmit =
    Boolean(title.trim() && abstract.trim() && subCategoryId) &&
    hasValidCoords(coordinates.latitude, coordinates.longitude) &&
    Boolean(coordinates.location.trim()) &&
    (isClosedAccess
      ? closedSectionsReady && Boolean(gre.external_url?.trim())
      : openHasSource);

  const getSaveValidationError = (): string | null => {
    if (extractionUi.status === "extracting") {
      return "Please wait while GRE extracts manuscript sections from the uploaded paper.";
    }
    if (!title.trim()) return "Please add a title.";
    if (!abstract.trim()) return "Please add an abstract.";
    if (submitterRole === "coauthor" && !leadAuthorName.trim()) {
      return "Please enter the lead author’s name when submitting as a co-author.";
    }
    return null;
  };

  const validateAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const err = getSaveValidationError();
    if (err) {
      setError(err);
      return;
    }
    saveMutation.mutate({});
  };

  const openSubmitReview = () => {
    setError("");
    if (!readyToSubmit) {
      setError(
        isClosedAccess
          ? "Complete title, abstract, all required sections, the publisher access link, the subfield, and the map location before submitting."
          : "Complete title, abstract, the subfield, the uploaded paper or external link, and the map location before submitting."
      );
      return;
    }
    const err = getSaveValidationError();
    if (err) {
      setError(err);
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

  return (
    <div className="animate-fade-up pb-8">
      <PageHeader
        title={isNew ? "New publication" : "Edit publication"}
        description={
          isNew
            ? accessTypeChosen
              ? isClosedAccess
                ? "Complete all manuscript sections and the publisher access link, then submit for review."
                : "Fill in publication details, add your paper or link, then submit for review."
              : "Choose open or restricted access to begin your submission."
            : pub?.title
        }
        action={
          !isNew && pub ? (
            <div className="flex items-center gap-2">
              <StatusBadge status={pub.status} />
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

      {!isNew && pub?.status === 2 && (pub.admin_comments?.length ?? 0) > 0 && (
        <section id="feedback" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertCircle className="h-4 w-4" />
            Admin revision notes
          </h2>
          <ul className="mt-3 space-y-3">
            {pub.admin_comments!.map((c) => (
              <li key={c.id} className="rounded-xl bg-white/80 px-4 py-3 text-sm text-amber-950">
                {c.comment}
              </li>
            ))}
          </ul>
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

      {isAdmin && !isNew && pub && pub.status !== 1 && pub.status !== 4 && pub.status !== 6 && (
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

      {showComposer && <RequiredFieldsLegend className="-mt-4 mb-6" />}

      {showComposer && (
      <form className={`space-y-8${isReadOnly ? " pointer-events-none opacity-60" : ""}`} onSubmit={validateAndSave}>
        {isReadOnly && (
          <p className="pointer-events-auto rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            This publication is {pub?.status === 6 ? "deleted" : "archived"} and cannot be edited until
            restored.
          </p>
        )}
        {composerTab === "preview" && (
          <section className="gre-card p-4 sm:p-6">
            <PublicationPaperPreview
              data={paperPreviewData}
              documentPath={existingDocPath}
              pendingFile={pendingDocument}
              draft
            />
          </section>
        )}

        {composerTab === "editor" && (
          <>
            <section className="gre-card space-y-4 p-6">
                <div>
                  <h2 className="text-lg font-bold text-ink">Original paper</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload the manuscript first so GRE can auto-fill the title and manuscript sections
                    before you continue editing. Open papers show the uploaded file publicly after
                    approval; closed papers keep it visible only to the paper owner.
                  </p>
                </div>
                {isNew ? (
                  <div className="space-y-3">
                    <ManuscriptUploadField
                      file={pendingDocument}
                      onFileChange={setPendingDocument}
                      existingDocumentPath={existingDocPath}
                      disabled={isReadOnly}
                    />
                    <div className="rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm text-slate-600">
                      <p>
                        GRE will extract the title, abstract, introduction, methods, results,
                        findings, conclusion, funding, keywords, and references from your uploaded
                        paper using GRE document OCR. You can edit everything before saving.
                      </p>
                      {extractionUi.status === "extracting" && (
                        <p className="mt-2 text-sm font-medium text-brand-700">
                          Autofill is in progress. Review the manuscript workspace below.
                        </p>
                      )}
                      {extractionUi.status === "ready" && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                          Autofill ready
                        </p>
                      )}
                      {extractionUi.status === "error" && extractionUi.warnings[0] && (
                        <p className="mt-2 text-sm text-red-600">{extractionUi.warnings[0]}</p>
                      )}
                      {extractionUi.status !== "error" &&
                        extractionUi.warnings.map((warning) => (
                          <p key={warning} className="mt-2 text-sm text-amber-700">
                            {warning}
                          </p>
                        ))}
                    </div>
                  </div>
                ) : id ? (
                  <PublicationDocumentUpload
                    publicationId={Number(id)}
                    documents={pub?.documents}
                    disabled={isReadOnly}
                    extractOnUpload
                    onExtracted={applyExtractedDocument}
                  />
                ) : null}
            </section>

            <section className="gre-card space-y-4 p-6">
              <div>
                <h2 className="text-lg font-bold text-ink">Publication details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isClosedAccess
                    ? "Title and subfield appear on the map and in search."
                    : "Upload your paper to auto-fill the manuscript sections, then review and edit them before publishing."}
                </p>
              </div>
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <CategorySubcategoryPicker
                categories={categories}
                categoryId={categoryId}
                subCategoryId={subCategoryId}
                onCategoryChange={setCategoryId}
                onSubCategoryChange={setSubCategoryId}
              />
            </section>

            <section className="gre-card p-6">
              <PublicationAccessFields
                gre={gre}
                onChange={setGre}
                accessLocked={isNew && accessTypeChosen}
                onChangeAccess={!isNew ? handleAccessTypeSelect : undefined}
                disabled={isReadOnly}
              />
            </section>

            <section className="gre-card overflow-visible p-6 sm:p-8">
              <div className="border-b border-slate-100 pb-5">
                <h2 className="text-lg font-bold text-ink">Manuscript sections</h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  {isClosedAccess ? (
                    <>
                      Closed-access uploads can still auto-fill these sections from the source file.
                      Use <strong>Paper preview</strong> to see the reader layout.
                    </>
                  ) : (
                    <>
                      Open-access uploads can auto-fill these sections from the paper. Review and refine
                      them here before saving.
                    </>
                  )}
                </p>
              </div>
              <div className="mt-6">
                {extractionUi.status === "extracting" && (
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-700">
                    Autofill workspace
                  </p>
                )}
                {extractionUi.status === "extracting" && (
                  <ExtractionLoadingPanel activeStep={activeExtractionStep} />
                )}
                {extractionUi.status === "ready" && (
                  <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>
                        Extracted manuscript content is ready. You can edit every section below before
                        saving.
                      </span>
                      {extractionUi.warnings.length > 0 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                          Review notes available
                        </span>
                      )}
                    </div>
                    {extractionUi.warnings.length > 0 && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-white/80 px-3 py-3 text-sm text-amber-900">
                        <p className="font-semibold">Extraction notes</p>
                        <ul className="mt-2 space-y-2 text-sm">
                          {extractionUi.warnings.map((warning) => (
                            <li key={warning} className="flex gap-2">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {extractionUi.status === "error" && extractionUi.warnings[0] && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {extractionUi.warnings[0]}
                  </div>
                )}
                <ManuscriptSectionsEditor fields={manuscript} onChange={setManuscript} />
              </div>
            </section>
          </>
        )}

        {!isClosedAccess && !isNew && id && (
          <PublicationSupplementaryUpload
            publicationId={Number(id)}
            documents={pub?.documents as GreDocument[] | undefined}
          />
        )}

        {!isNew && id && (
          <PublicationFiguresEditor
            publicationId={Number(id)}
            figures={figures}
            onChange={setFigures}
          />
        )}

        <section className="gre-card p-6">
          <h2 className="mb-1 font-semibold text-ink">Where does this study take place?</h2>
          <p className="mb-5 text-sm text-slate-500">
            Search for a city or landmark, or click the map. Coordinates are filled automatically.
          </p>
          <LocationPicker
            value={coordinates}
            onChange={setCoordinates}
            institutionDefault={user?.affiliation || ""}
          />
        </section>

        <section className="gre-card space-y-4 p-6">
          <div>
            <h2 className="font-semibold text-ink">Your role on this publication</h2>
            <p className="mt-1 text-sm text-slate-500">
              If you are submitting on behalf of the team, designate the lead author separately. Your
              GRE account remains the submission owner for editing.
            </p>
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

        <section className="gre-card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">Additional co-authors</h2>
              <p className="mt-1 text-sm text-slate-500">
                List other team members not covered by your role above.
              </p>
            </div>
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
            <div key={i} className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="publication-submit-bar sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-md">
          <Button
            type="submit"
            variant="secondary"
            disabled={extractionUi.status === "extracting" || (saveMutation.isPending && !submitReviewOpen)}
          >
            {saveMutation.isPending && !submitReviewOpen ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isNew ? "Save draft" : "Save changes"}
          </Button>
          {(isNew || canSubmit) && (
            <Button
              type="button"
              disabled={
                extractionUi.status === "extracting" ||
                !readyToSubmit ||
                (saveMutation.isPending && submitReviewOpen)
              }
              onClick={openSubmitReview}
            >
              <Send className="h-4 w-4" />
              {pub?.status === 2 ? "Review & resubmit" : "Review & submit"}
            </Button>
          )}
          {(isNew || canSubmit) && !readyToSubmit && (
            <p className="text-xs text-slate-500">
              {isClosedAccess
                ? "Complete title, abstract, subfield, required sections, publisher access link, and map location to submit."
                : "Complete title, abstract, subfield, uploaded paper or external link, and map location to submit."}
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
      </form>
      )}

      <SubmissionReviewDialog
        open={submitReviewOpen}
        title={title}
        abstract={abstract}
        subCategoryName={subCategoryName}
        location={coordinates.location}
        institution={coordinates.institution}
        documentPath={existingDocPath}
        pendingFile={pendingDocument}
        submitting={saveMutation.isPending && submitReviewOpen}
        onClose={() => setSubmitReviewOpen(false)}
        onConfirm={confirmSubmitForReview}
      />
    </div>
  );
}
