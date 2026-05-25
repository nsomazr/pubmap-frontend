import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Search, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import api, { parseApiError } from "../../lib/api";
import {
  fetchMeeting,
  formatMeetingDate,
  MEETING_TYPE_LABELS,
  MEETING_VISIBILITY_LABELS,
} from "../../lib/meetings";
import type { Category, MeetParticipant, MeetParticipantRole, MeetSession, Publication, Topic, User } from "../../types";

const emptyForm = {
  title: "",
  description: "",
  meeting_type: "research_discussion",
  visibility: "authenticated_private",
  category_id: "",
  sub_category_id: "",
  scheduled_at: "",
  publication_id: "",
  forum_topic_id: "",
  host_notes: "",
};

function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MeetManagePage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [participantRole, setParticipantRole] = useState<MeetParticipantRole>("participant");

  const { data: meeting } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-admin"],
    queryFn: async () => {
      const { data } = await api.get<Category[] | { results: Category[] }>("/categories/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: publications = [] } = useQuery({
    queryKey: ["publications-for-meet-linking"],
    queryFn: async () => {
      const { data } = await api.get<Publication[] | { results: Publication[] }>("/publications/");
      return Array.isArray(data) ? data : (data.results ?? []);
    },
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["topics-for-meet-linking", form.sub_category_id],
    queryFn: async () => {
      const { data } = await api.get<Topic[] | { results: Topic[] }>("/forum/topics/", {
        params: form.sub_category_id ? { sub_category: form.sub_category_id } : undefined,
      });
      return Array.isArray(data) ? data : (data.results ?? []);
    },
    enabled: !!form.sub_category_id,
  });

  const { data: people = [] } = useQuery({
    queryKey: ["meeting-people-search", peopleSearch],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/meetings/people-search/", { params: { q: peopleSearch } });
      return data;
    },
    enabled: !!id && peopleSearch.trim().length >= 2,
  });

  useEffect(() => {
    if (!meeting) return;
    setForm({
      title: meeting.title || "",
      description: meeting.description || "",
      meeting_type: meeting.meeting_type,
      visibility: meeting.visibility,
      category_id: meeting.category_id ? String(meeting.category_id) : "",
      sub_category_id: meeting.sub_category_id ? String(meeting.sub_category_id) : "",
      scheduled_at: toLocalInputValue(meeting.scheduled_at),
      publication_id: meeting.publication_id ? String(meeting.publication_id) : "",
      forum_topic_id: meeting.forum_topic_id ? String(meeting.forum_topic_id) : "",
      host_notes: meeting.host_notes || "",
    });
  }, [meeting]);

  const subcategories = useMemo(() => {
    const category = categories.find((item) => String(item.id) === form.category_id);
    return category?.sub_categories ?? [];
  }, [categories, form.category_id]);

  const filteredPublications = useMemo(
    () =>
      publications.filter(
        (pub) => !form.sub_category_id || String(pub.sub_category_id) === form.sub_category_id
      ),
    [form.sub_category_id, publications]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        description: form.description,
        meeting_type: form.meeting_type,
        visibility: form.visibility,
        sub_category_id: Number(form.sub_category_id),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        publication_id: form.publication_id ? Number(form.publication_id) : null,
        forum_topic_id: form.forum_topic_id ? Number(form.forum_topic_id) : null,
        host_notes: form.host_notes,
      };
      if (isNew) {
        const { data } = await api.post<MeetSession>("/meetings/", payload);
        return data;
      }
      const { data } = await api.patch<MeetSession>(`/meetings/${id}/`, payload);
      return data;
    },
    onSuccess: (data) => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      navigate(`/dashboard/meetings/${data.id}`);
    },
    onError: (err) => setError(parseApiError(err, "Could not save the meeting.")),
  });

  const addParticipant = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: MeetParticipantRole }) =>
      api.post<MeetParticipant[]>(`/meetings/${id}/participants/`, {
        user_id: userId,
        role,
      }),
    onSuccess: () => {
      setPeopleSearch("");
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
    },
    onError: (err) => setError(parseApiError(err, "Could not add that participant.")),
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: number) =>
      api.post<MeetParticipant[]>(`/meetings/${id}/participants/${participantId}/remove/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meeting", id] }),
    onError: (err) => setError(parseApiError(err, "Could not remove that participant.")),
  });

  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title={isNew ? "Create GRE Meet session" : "Edit GRE Meet session"}
        description={
          isNew
            ? "Schedule a research-centered meeting tied to a GRE subcategory."
            : `Update meeting settings, invite participants, and refine the archive context for ${meeting?.title || "this session"}.`
        }
        action={
          <Link to="/dashboard/meetings" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <ArrowLeft className="h-4 w-4" />
            Back to meetings
          </Link>
        }
      />

      <form
        className="gre-card space-y-6 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          saveMutation.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Meeting title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Input
            label="Scheduled at"
            type="datetime-local"
            value={form.scheduled_at}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
            required
          />
          <Select
            label="Meeting type"
            value={form.meeting_type}
            onChange={(e) => setForm((prev) => ({ ...prev, meeting_type: e.target.value }))}
          >
            {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Visibility"
            value={form.visibility}
            onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.value }))}
          >
            {Object.entries(MEETING_VISIBILITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="Category"
            value={form.category_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                category_id: e.target.value,
                sub_category_id: "",
                publication_id: "",
                forum_topic_id: "",
              }))
            }
          >
            <option value="">Select category…</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Subcategory"
            value={form.sub_category_id}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sub_category_id: e.target.value,
                publication_id: "",
                forum_topic_id: "",
              }))
            }
            disabled={!form.category_id}
          >
            <option value="">Select subcategory…</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={String(subcategory.id)}>
                {subcategory.name}
              </option>
            ))}
          </Select>
          <Select
            label="Related paper (optional)"
            value={form.publication_id}
            onChange={(e) => setForm((prev) => ({ ...prev, publication_id: e.target.value }))}
            disabled={!form.sub_category_id}
          >
            <option value="">No linked paper</option>
            {filteredPublications.map((publication) => (
              <option key={publication.id} value={String(publication.id)}>
                {publication.title}
              </option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Select
              label="Related discussion (optional)"
              value={form.forum_topic_id}
              onChange={(e) => setForm((prev) => ({ ...prev, forum_topic_id: e.target.value }))}
              disabled={!form.sub_category_id}
            >
              <option value="">No linked discussion</option>
              {topics.map((topic) => (
                <option key={topic.id} value={String(topic.id)}>
                  {topic.topic}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Host notes for summary generation"
              value={form.host_notes}
              onChange={(e) => setForm((prev) => ({ ...prev, host_notes: e.target.value }))}
              rows={3}
              placeholder="Optional wrap-up, decisions, or action points to preserve in the archive summary."
            />
          </div>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            loading={saveMutation.isPending}
            disabled={!form.title || !form.sub_category_id || !form.scheduled_at}
          >
            {isNew ? "Create meeting" : "Save changes"}
          </Button>
          {!isNew && meeting && (
            <p className="flex items-center text-sm text-slate-500">
              Current schedule: {formatMeetingDate(meeting.scheduled_at)}
            </p>
          )}
        </div>
      </form>

      {!isNew && meeting && (
        <section className="gre-card space-y-5 p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-ink">Participants and speakers</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder="Search researchers by name, email, or affiliation"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <Select value={participantRole} onChange={(e) => setParticipantRole(e.target.value as MeetParticipantRole)}>
              <option value="participant">Participant</option>
              <option value="speaker">Speaker</option>
            </Select>
            <div className="flex items-center text-sm text-slate-500">
              Invite status updates when they open the room link.
            </div>
          </div>

          {peopleSearch.trim().length >= 2 && (
            <div className="grid gap-3 md:grid-cols-2">
              {people.map((person) => (
                <div key={person.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-ink">{person.full_name || `${person.firstname} ${person.lastname}`}</p>
                  <p className="mt-1 text-sm text-slate-500">{person.email}</p>
                  <p className="mt-1 text-xs text-brand-700">{person.affiliation || "No affiliation"}</p>
                  <Button
                    className="mt-3"
                    variant="secondary"
                    loading={addParticipant.isPending}
                    onClick={() => addParticipant.mutate({ userId: person.id, role: participantRole })}
                  >
                    <UserPlus className="h-4 w-4" />
                    Add to meeting
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {(meeting.participants ?? []).map((participant) => (
              <div
                key={participant.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {participant.user?.full_name ||
                      `${participant.user?.firstname ?? ""} ${participant.user?.lastname ?? ""}`.trim() ||
                      participant.user?.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {participant.role} · {participant.invite_status}
                  </p>
                </div>
                {participant.user_id !== meeting.host_id && (
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                    loading={removeParticipant.isPending}
                    onClick={() => removeParticipant.mutate(participant.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {(meeting.participants?.length ?? 0) === 0 && (
              <p className="text-sm text-slate-500">No invited participants yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
