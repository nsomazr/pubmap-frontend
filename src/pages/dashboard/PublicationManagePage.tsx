import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  PenLine,
  Plus,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LocationPicker } from "../../components/map/LocationPicker";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { hasValidCoords } from "../../lib/geocode";
import { StatusBadge } from "../../components/dashboard/StatusBadge";
import { Button } from "../../components/ui/Button";
import { InstitutionPicker } from "../../components/institutions/InstitutionPicker";
import { Input } from "../../components/ui/Input";
import { CategorySubcategoryPicker } from "../../components/forms/CategorySubcategoryPicker";
import { PublicationLifecyclePanel } from "../../components/publication/PublicationLifecyclePanel";
import { AdminPublicationReviewCard } from "../../components/publication/AdminPublicationReviewCard";
import { DocumentUploadPanel } from "../../components/publication/DocumentUploadPanel";
import { PdfSubmissionFields } from "../../components/publication/PdfSubmissionFields";
import {
  ManuscriptSectionsEditor,
  type ManuscriptFields,
} from "../../components/publication/ManuscriptSectionsEditor";
import {
  PublicationModeSelector,
  type PublicationEntryMode,
} from "../../components/publication/PublicationModeSelector";
import { PdfPreview } from "../../components/publication/PdfPreview";
import { SubmissionReviewDialog } from "../../components/publication/SubmissionReviewDialog";
import { Textarea } from "../../components/ui/Textarea";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import { plainTextToHtml } from "../../lib/sanitizeHtml";
import {
  extractDocument,
  uploadDocumentWithExtract,
  type ExtractedManuscript,
} from "../../lib/publicationExtract";
import { PublicationAccessPanel } from "../../components/publication/PublicationAccessPanel";
import { PublicationFiguresEditor } from "../../components/publication/PublicationFiguresEditor";
import { PublicationSupplementaryUpload } from "../../components/publication/PublicationSupplementaryUpload";
import {
  updatePublicationGre,
  type GreDocument,
  type PublicationGre,
} from "../../lib/publicationGre";
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

type ComposerTab = "upload" | "editor";

export function PublicationManagePage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = isPlatformAdmin(user);

  const [composerTab, setComposerTab] = useState<ComposerTab>(isNew ? "upload" : "editor");
  const [entryMode, setEntryMode] = useState<PublicationEntryMode>(isNew ? "upload" : "form");

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
  const [extracted, setExtracted] = useState<ExtractedManuscript | null>(null);
  const [extractError, setExtractError] = useState("");
  const [submitReviewOpen, setSubmitReviewOpen] = useState(false);

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

  const applyExtracted = useCallback((data: ExtractedManuscript) => {
    if (data.title?.trim()) setTitle(data.title.trim());
    if (data.abstract) setAbstract(data.abstract);
    if (data.keywords) setKeywords(data.keywords);
    if (data.introduction) setIntroduction(data.introduction);
    if (data.methods) setMethods(data.methods);
    if (data.results) setResults(data.results);
    if (data.findings) setFindings(data.findings);
    if (data.conclusion) setConclusion(data.conclusion);
    if (data.funder) setFunder(data.funder);
    if (data.references) setReferences(data.references);
    setEntryMode("upload");
    setComposerTab("editor");
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
    canReviewPublication(user, { status: pub!.status, category_id: pub!.category_id });

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

  const extractMutation = useMutation({
    mutationFn: () => {
      if (!pendingDocument) throw new Error("Choose a file first.");
      return extractDocument(pendingDocument, { metadataOnly: false, useAi: true });
    },
    onSuccess: (data) => {
      setExtracted(data);
      setExtractError("");
    },
    onError: (err: { response?: { data?: { detail?: string; warnings?: string[] } } }) => {
      const d = err.response?.data;
      setExtractError(d?.detail || d?.warnings?.[0] || "Could not extract text from this file.");
      setExtracted(null);
    },
  });

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
          if (extracted?.success) {
            await uploadDocumentWithExtract(data.id, pendingDocument, true);
          } else {
            const form = new FormData();
            form.append("document", pendingDocument);
            await api.post(`/publications/${data.id}/upload_document/`, form);
          }
        } catch {
          setError("Draft saved, but the PDF could not be uploaded. Use Upload & extract to try again.");
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
          await api.post(`/publications/${data.id}/submit_review/`);
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
      setError("Could not save publication. Check title, abstract, category, and map location.");
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
  const isPdfWorkflow = entryMode === "upload" || hasDocument;
  const isClosedAccess = gre.access_type === "closed";
  const openNeedsDocument =
    !isClosedAccess && isPdfWorkflow && !gre.external_url?.trim();
  const closedSectionsReady =
    hasTextContent(abstract) &&
    hasTextContent(introduction) &&
    hasTextContent(methods) &&
    (hasTextContent(findings) || hasTextContent(results)) &&
    hasTextContent(conclusion);
  const readyToSubmit =
    Boolean(title.trim() && abstract.trim() && subCategoryId) &&
    hasValidCoords(coordinates.latitude, coordinates.longitude) &&
    Boolean(coordinates.location.trim()) &&
    (isClosedAccess ? closedSectionsReady : isPdfWorkflow ? hasDocument || Boolean(gre.external_url?.trim()) : true);

  const getSaveValidationError = (): string | null => {
    if (!title.trim()) return "Please add a title.";
    if (!abstract.trim()) return "Please add an abstract.";
    if (!subCategoryId) return "Please select a category and subcategory.";
    if (openNeedsDocument && !hasDocument) {
      return "Upload your manuscript PDF in the Upload tab before saving.";
    }
    if (isClosedAccess && !closedSectionsReady) {
      return "Restricted publications need introduction, methods, findings/results, and conclusion.";
    }
    if (!hasValidCoords(coordinates.latitude, coordinates.longitude)) {
      return "Please set a map location by searching for a place or clicking on the map.";
    }
    if (!coordinates.location.trim()) {
      return "Please add a location label (or search / pick on the map to fill it automatically).";
    }
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
          ? "Complete title, abstract, all required sections, category, and map location before submitting."
          : "Complete title, abstract, category, PDF or external URL, and map location before submitting."
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

  const subCategoryName =
    categories
      .flatMap((c) => c.sub_categories ?? [])
      .find((s) => String(s.id) === subCategoryId)?.name ??
    pub?.sub_category_name;

  if (!isNew && isLoading) {
    return <p className="text-slate-500">Loading publication…</p>;
  }

  return (
    <div className="animate-fade-up pb-8">
      <PageHeader
        title={isNew ? "New publication" : "Edit publication"}
        description={
          isNew
            ? "Upload a paper or write in the editor, preview your PDF, then submit for review."
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

      {!isNew && pub?.status === 2 && (pub.admin_comments?.length ?? 0) > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
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

      {isNew && (
        <section className="gre-card mb-8 p-6">
          <h2 className="text-lg font-bold text-ink">How do you want to start?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Upload a PDF. We extract title and abstract for search. Add map location, then submit for review.
          </p>
          <div className="mt-5">
            <PublicationModeSelector
              mode={entryMode}
              onChange={(m) => {
                setEntryMode(m);
                setComposerTab(m === "upload" ? "upload" : "editor");
              }}
            />
          </div>
        </section>
      )}

      {!isNew && (
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
            Editor & preview
          </button>
          <button
            type="button"
            onClick={() => setComposerTab("upload")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              composerTab === "upload"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-ink"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload & extract
          </button>
        </div>
      )}

      <form className={`space-y-8${isReadOnly ? " pointer-events-none opacity-60" : ""}`} onSubmit={validateAndSave}>
        {isReadOnly && (
          <p className="pointer-events-auto rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
            This publication is {pub?.status === 6 ? "deleted" : "archived"} and cannot be edited until
            restored.
          </p>
        )}
        {(isNew && entryMode === "upload" && composerTab === "upload") ||
        (!isNew && composerTab === "upload") ? (
          <section className="gre-card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <FileText className="h-5 w-5 text-brand-600" />
              Upload manuscript
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Upload your PDF, extract title and abstract, then complete category and map location to submit.
            </p>
            <div className="mt-6">
              <DocumentUploadPanel
                file={pendingDocument}
                onFileChange={(f) => {
                  setPendingDocument(f);
                  setExtracted(null);
                  setExtractError("");
                }}
                extracting={extractMutation.isPending}
                extractError={extractError}
                extracted={extracted}
                onExtract={() => extractMutation.mutate()}
                onApplyExtracted={() => extracted && applyExtracted(extracted)}
                onContinueToForm={() => setComposerTab("editor")}
              />
            </div>
          </section>
        ) : null}

        {isPdfWorkflow && (
          <section className="gre-card p-6">
            <h2 className="text-lg font-bold text-ink">Submission details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Required to save and submit. These appear in search; readers open your full PDF after approval.
            </p>
            <div className="mt-6 grid gap-8 lg:grid-cols-2">
              <PdfSubmissionFields
                title={title}
                abstract={abstract}
                categoryId={categoryId}
                subCategoryId={subCategoryId}
                categories={categories}
                onTitleChange={setTitle}
                onAbstractChange={setAbstract}
                onCategoryChange={setCategoryId}
                onSubCategoryChange={setSubCategoryId}
              />
              <PdfPreview
                file={pendingDocument}
                documentPath={existingDocPath}
                title="Manuscript PDF"
                className="min-h-[320px] lg:min-h-[400px]"
              />
            </div>
            {!hasDocument && (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Upload your PDF under <strong>Upload & extract</strong> before saving or submitting.
              </p>
            )}
            {!subCategoryId && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Select a <strong>category</strong> and <strong>subcategory</strong> below before saving.
              </p>
            )}
          </section>
        )}

        {!isPdfWorkflow && (composerTab === "editor" || (isNew && entryMode === "form")) && (
          <>
            <section className="gre-card space-y-4 p-6">
              <h2 className="text-lg font-bold text-ink">Core details</h2>
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea
                label="Abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                rows={5}
                required
              />
              <CategorySubcategoryPicker
                categories={categories}
                categoryId={categoryId}
                subCategoryId={subCategoryId}
                onCategoryChange={setCategoryId}
                onSubCategoryChange={setSubCategoryId}
                required
              />
            </section>
            <section className="gre-card overflow-visible p-6">
              <h2 className="text-lg font-bold text-ink">Manuscript (optional)</h2>
              <p className="mt-1 text-sm text-slate-500">
                Write sections in the editor, or switch to Upload and attach a PDF instead.
              </p>
              <div className="mt-6">
                <ManuscriptSectionsEditor fields={manuscript} onChange={setManuscript} />
              </div>
            </section>
          </>
        )}

        <section className="gre-card p-6">
          <PublicationAccessPanel gre={gre} onChange={setGre} />
        </section>

        {!isNew && id && (
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
          <Button type="submit" variant="secondary" disabled={saveMutation.isPending && !submitReviewOpen}>
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
              disabled={!readyToSubmit || (saveMutation.isPending && submitReviewOpen)}
              onClick={openSubmitReview}
            >
              <Send className="h-4 w-4" />
              {pub?.status === 2 ? "Review & resubmit" : "Review & submit"}
            </Button>
          )}
          {(isNew || canSubmit) && !readyToSubmit && (
            <p className="text-xs text-slate-500">
              {isClosedAccess
                ? "Complete title, abstract, required sections, category, and map location to submit."
                : "Complete title, abstract, category, PDF or external URL, and map location to submit."}
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
              to={`/publication/${id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Eye className="h-4 w-4" />
              View on public map
            </Link>
          )}
        </div>
      </form>

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
