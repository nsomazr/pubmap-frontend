import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isPlatformAdmin } from "../../lib/userAccess";
import { GreAdAnalyticsPanel } from "../../components/ads/GreAdAnalyticsPanel";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { Button } from "../../components/ui/Button";
import { useConfirm } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../components/ui/ToastProvider";
import { usePageParam } from "../../hooks/usePageParam";
import { DEFAULT_PAGE_SIZE, unwrapPaginated, type Paginated } from "../../lib/pagination";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import api, { parseApiError } from "../../lib/api";
import { greFormArtCardClass } from "../../lib/formStyles";
import {
  AD_IMAGE_ACCEPT,
  AD_PLACEMENTS,
  buildAdDetailPath,
  uploadAdImage,
  type AdAnalyticsRow,
  type AdPlacement,
} from "../../lib/ads";
import { mediaUrl } from "../../lib/mediaUrl";

interface Ad {
  id: number;
  title: string;
  image: string;
  link: string;
  location: string;
  placement: AdPlacement;
  status: string;
  gre_meta?: {
    sponsor_label?: string;
    description?: string;
    sort_order?: number;
    publication_id?: number | null;
  } | null;
}

const EMPTY_FORM = {
  title: "",
  image: "",
  link: "",
  location: "sidebar" as AdPlacement,
  status: "active",
  sponsor_label: "Sponsored",
  description: "",
  sort_order: "0",
  publication_id: "",
};

export function AdsPage() {
  const { user } = useAuth();
  if (!isPlatformAdmin(user)) return <Navigate to="/dashboard" replace />;

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const confirm = useConfirm();
  const pendingDeleteTitleRef = useRef("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const invalidateAdQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["ads"] });
    queryClient.invalidateQueries({ queryKey: ["ads", "analytics"] });
    queryClient.invalidateQueries({ queryKey: ["ads", "placement"] });
  };

  const { page, setPage } = usePageParam();

  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ["ads", page],
    queryFn: async () => {
      const { data } = await api.get("/ads/", {
        params: { page, page_size: DEFAULT_PAGE_SIZE },
      });
      return unwrapPaginated<Ad>(data as Ad[] | Paginated<Ad>);
    },
  });

  const ads = adsData?.results ?? [];
  const adsTotal = adsData?.count ?? 0;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setFormError("");
    setEditingId(null);
  };

  const adPayload = (image: string) => ({
    title: form.title,
    image,
    link: form.link,
    location: form.location,
    status: form.status,
    sponsor_label: form.sponsor_label,
    description: form.description,
    sort_order: Number(form.sort_order) || 0,
    publication_id: form.publication_id ? Number(form.publication_id) : null,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imagePath = form.image.trim();
      if (imageFile) {
        imagePath = await uploadAdImage(imageFile);
      }
      if (!imagePath) {
        throw new Error("Add an image file or paste an image URL.");
      }
      const payload = adPayload(imagePath);
      if (editingId) {
        await api.patch(`/ads/${editingId}/`, payload);
        return;
      }
      await api.post("/ads/", payload);
    },
    onSuccess: () => {
      invalidateAdQueries();
      toast.success({
        title: editingId ? "Advertisement updated" : "Advertisement created",
        description: form.title.trim()
          ? `"${form.title.trim()}" is saved.`
          : undefined,
      });
      resetForm();
    },
    onError: (error: unknown) => {
      const message =
        (error as Error)?.message ||
        parseApiError(error, "Could not save the advertisement.");
      setFormError(message);
      toast.error({
        title: editingId ? "Could not update ad" : "Could not create ad",
        description: message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/ads/${id}/`),
    onSuccess: () => {
      invalidateAdQueries();
      const title = pendingDeleteTitleRef.current;
      toast.success({
        title: "Advertisement deleted",
        description: title ? `"${title}" was removed.` : "The ad was removed from inventory.",
      });
      pendingDeleteTitleRef.current = "";
      if (editingId) {
        resetForm();
      }
    },
    onError: (error: unknown) => {
      toast.error({
        title: "Could not delete ad",
        description: parseApiError(error, "Delete failed."),
      });
    },
  });

  const startEditById = async (id: number) => {
    try {
      const { data } = await api.get<Ad>(`/ads/${id}/`);
      startEdit(data);
    } catch (error: unknown) {
      toast.error({
        title: "Could not open ad",
        description: parseApiError(error, "Failed to load advertisement."),
      });
    }
  };

  const confirmDeleteAd = async (id: number, title: string) => {
    const ok = await confirm({
      title: "Delete advertisement?",
      description: `Delete "${title}"? This removes the ad from all placements and cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    pendingDeleteTitleRef.current = title;
    deleteMutation.mutate(id);
  };

  const handleDeleteFromAnalytics = (row: AdAnalyticsRow) => {
    void confirmDeleteAd(row.id, row.title);
  };

  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setImageFile(null);
    setFormError("");
    setForm({
      title: ad.title,
      image: ad.image,
      link: ad.link,
      location: (ad.placement || ad.location) as AdPlacement,
      status: ad.status,
      sponsor_label: ad.gre_meta?.sponsor_label || "Sponsored",
      description: ad.gre_meta?.description || "",
      sort_order: String(ad.gre_meta?.sort_order ?? 0),
      publication_id: ad.gre_meta?.publication_id ? String(ad.gre_meta.publication_id) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectedPlacement = AD_PLACEMENTS.find((p) => p.value === form.location);

  return (
    <div className="animate-fade-up space-y-10">
      <PageHeader
        title="Advertisements"
      />

      <GreAdAnalyticsPanel
        days={30}
        onEditAd={(id) => void startEditById(id)}
        onDeleteAd={handleDeleteFromAnalytics}
        deletePendingId={
          deleteMutation.isPending ? (deleteMutation.variables ?? null) : null
        }
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-ink">Placements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ads live in side rails and banner zones so reading flow is never interrupted.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AD_PLACEMENTS.map((placement) => (
            <article key={placement.value} className="gre-card p-4">
              <p className="font-semibold text-ink">{placement.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{placement.hint}</p>
              <p className="mt-3 text-[11px] font-mono text-brand-700">{placement.value}</p>
            </article>
          ))}
        </div>
      </section>

      <form
        className={`${greFormArtCardClass} grid gap-4 lg:grid-cols-2`}
        onSubmit={(e) => {
          e.preventDefault();
          setFormError("");
          saveMutation.mutate();
        }}
      >
        <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">
            {editingId ? "Edit advertisement" : "Create advertisement"}
          </h2>
          {editingId && (
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
            >
              Cancel edit
            </Button>
          )}
        </div>
        <div className="lg:col-span-2">
          {selectedPlacement && (
            <p className="mt-1 text-sm text-slate-500">{selectedPlacement.hint}</p>
          )}
        </div>
        <Input
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Ad image</p>
          <p className="text-xs text-slate-500">
            Upload a JPG, PNG, WebP, or GIF (up to 4 MB), or paste an image URL below.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/40">
            <ImagePlus className="h-4 w-4 text-brand-600" />
            {imageFile ? imageFile.name : "Choose image file"}
            <input
              type="file"
              accept={AD_IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                setImageFile(e.target.files?.[0] ?? null);
                setFormError("");
              }}
            />
          </label>
          {(imagePreview || form.image) && (
            <img
              src={imagePreview || mediaUrl(form.image) || form.image}
              alt=""
              className="h-32 w-full max-w-sm rounded-xl border border-slate-200 object-cover"
            />
          )}
        </div>
        <Input
          label="Image URL (optional if uploading a file)"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
          placeholder="https://… or uploads/ads/…"
        />
        <Input
          label="Link URL"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="/events or https://…"
        />
        <Select
          label="Placement"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value as AdPlacement })}
        >
          {AD_PLACEMENTS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        <Input
          label="Sponsor label"
          value={form.sponsor_label}
          onChange={(e) => setForm({ ...form, sponsor_label: e.target.value })}
          placeholder="Sponsored"
        />
        <Input
          label="Sort order"
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
        />
        <Input
          label="Publication ID (optional, for sponsored publications)"
          value={form.publication_id}
          onChange={(e) => setForm({ ...form, publication_id: e.target.value })}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <div className="lg:col-span-2">
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>
        {formError ? (
          <p className="lg:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
            {formError}
          </p>
        ) : null}
        <div className="lg:col-span-2">
          <Button type="submit" loading={saveMutation.isPending}>
            {editingId ? "Save changes" : "Add advertisement"}
          </Button>
        </div>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Active inventory</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <div key={ad.id} className="gre-card overflow-hidden">
              {ad.image && (
                <img
                  src={mediaUrl(ad.image) || ad.image}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="space-y-2 p-4">
                <p className="font-medium text-ink">{ad.title}</p>
                <p className="text-xs text-slate-500">
                  {(ad.placement || ad.location).replace(/_/g, " ")} · {ad.status}
                </p>
                {ad.gre_meta?.description && (
                  <p className="line-clamp-2 text-xs text-slate-500">{ad.gre_meta.description}</p>
                )}
                <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  {ad.gre_meta?.sponsor_label || "Sponsored"}
                </span>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    to={buildAdDetailPath(ad.id, (ad.placement || ad.location) as AdPlacement)}
                    className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50/50"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Preview page
                  </Link>
                  <Button type="button" variant="secondary" onClick={() => startEdit(ad)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={deleteMutation.isPending}
                    onClick={() => void confirmDeleteAd(ad.id, ad.title)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!adsLoading && adsTotal > 0 && (
          <Pagination
            page={page}
            totalCount={adsTotal}
            onPageChange={setPage}
            itemLabel="ads"
            className="mt-6"
          />
        )}
      </section>
    </div>
  );
}
