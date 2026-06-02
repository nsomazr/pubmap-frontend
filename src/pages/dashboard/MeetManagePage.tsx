import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, FileText, Link2, Search, Shield, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCanonicalMeetingUrl } from "../../hooks/useCanonicalMeetingUrl";
import { PageHeader } from "../../components/dashboard/PageHeader";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/ToastProvider";
import { Input } from "../../components/ui/Input";
import { RequiredFieldsLegend } from "../../components/ui/RequiredField";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import api, { parseApiError } from "../../lib/api";
import { MeetHostToolsPanel } from "../../components/meet/MeetHostToolsPanel";
import { TimezoneSelect } from "../../components/meet/TimezoneSelect";
import { buildMeetingPath } from "../../lib/meetingPaths";
import { meetingApiSegment } from "../../lib/meetingPaths";
import {
  fetchMeeting,
  formatMeetingDateInTimezone,
  inviteMeetingByEmailBulk,
  inviteMeetingFieldMembers,
  MEETING_TYPE_LABELS,
  MEETING_VISIBILITY_LABELS,
} from "../../lib/meetings";
import {
  GRE_MEETING_TIMEZONE,
  previewScheduledAt,
  utcToWallInputValue,
  wallTimeToUtcIso,
} from "../../lib/meetTimezones";
import {
  greFormArtCardClass,
  greFormActionsClass,
  greFormGridClass,
  greFormGridMdClass,
  greFieldClass,
  greFormPrimaryButtonClass,
} from "../../lib/formStyles";
import { userFullName } from "../../lib/userDisplay";
import type { Category, MeetParticipant, MeetParticipantRole, MeetSession, Publication, Topic, User } from "../../types";

const emptyForm = {
  title: "",
  description: "",
  meeting_type: "research_discussion",
  visibility: "authenticated_private",
  category_id: "",
  sub_category_id: "",
  scheduled_at: "",
  scheduled_timezone: GRE_MEETING_TIMEZONE,
  publication_id: "",
  forum_topic_id: "",
};

function MeetFormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof CalendarClock;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${greFormArtCardClass} space-y-4`}>
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-brand-700 sm:h-8 sm:w-8">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="gre-form-section-heading text-base font-semibold text-ink sm:text-base">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:mt-0.5 sm:text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function participantDisplayName(participant: MeetParticipant) {
  if (participant.user) return userFullName(participant.user);
  return "Participant";
}

export function MeetManagePage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  const [participantRole, setParticipantRole] = useState<MeetParticipantRole>("participant");
  const [guestEmails, setGuestEmails] = useState("");
  const [guestInviteRole, setGuestInviteRole] = useState<"participant" | "speaker">("participant");
  const [guestInviteMessage, setGuestInviteMessage] = useState("");
  const [inviteMatchingMembers, setInviteMatchingMembers] = useState(false);
  const { data: meeting } = useQuery({
    queryKey: ["meeting", id],
    queryFn: () => fetchMeeting(id!),
    enabled: !!id,
  });

  useCanonicalMeetingUrl(meeting, "edit");

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
      scheduled_at: utcToWallInputValue(
        meeting.scheduled_at,
        meeting.scheduled_timezone || GRE_MEETING_TIMEZONE
      ),
      scheduled_timezone: meeting.scheduled_timezone || GRE_MEETING_TIMEZONE,
      publication_id: meeting.publication_id ? String(meeting.publication_id) : "",
      forum_topic_id: meeting.forum_topic_id ? String(meeting.forum_topic_id) : "",
    });
  }, [meeting]);

  useEffect(() => {
    if (meeting) return;
    setForm((prev) => ({
      ...prev,
      scheduled_timezone: prev.scheduled_timezone || GRE_MEETING_TIMEZONE,
    }));
  }, [meeting]);

  const subcategories = useMemo(() => {
    const category = categories.find((item) => String(item.id) === form.category_id);
    return category?.sub_categories ?? [];
  }, [categories, form.category_id]);

  const schedulePreview = useMemo(
    () => previewScheduledAt(form.scheduled_at, form.scheduled_timezone),
    [form.scheduled_at, form.scheduled_timezone]
  );

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
        scheduled_at: wallTimeToUtcIso(form.scheduled_at, form.scheduled_timezone),
        scheduled_timezone: form.scheduled_timezone || GRE_MEETING_TIMEZONE,
        publication_id: form.publication_id ? Number(form.publication_id) : null,
        forum_topic_id: form.forum_topic_id ? Number(form.forum_topic_id) : null,
      };
      if (isNew) {
        const { data } = await api.post<MeetSession>("/meetings/", payload);
        return data;
      }
      const { data } = await api.patch<MeetSession>(`/meetings/${meetingApiSegment(id!)}/`, payload);
      return data;
    },
    onSuccess: (data) => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      const emails = guestEmails
        .split(/[\n,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      const shouldSendGuestInvites = data.visibility === "invite_only" && emails.length > 0;
      const shouldInviteMatching = data.visibility === "invite_only" && inviteMatchingMembers;
      const afterSave = async () => {
        if (!shouldSendGuestInvites && !shouldInviteMatching) {
          toast.success({
            title: isNew ? "Meeting created" : "Meeting updated",
            description: isNew
              ? "The GRE meeting is ready to share."
              : "The GRE meeting details were updated.",
          });
          navigate(buildMeetingPath(data));
          return;
        }
        let result: { total: number; sent: number; failed: number } | null = null;
        if (shouldSendGuestInvites) {
          result = await inviteMeetingByEmailBulk(data.id, {
            emails,
            role: guestInviteRole,
            message: guestInviteMessage.trim() || undefined,
          });
        }
        if (shouldInviteMatching) {
          await inviteMeetingFieldMembers(data.id, {});
        }
        setGuestEmails("");
        toast.success({
          title: isNew ? "Meeting created and invitations sent" : "Invitations sent",
          description:
            shouldSendGuestInvites && result && result.failed > 0
              ? `${result.sent}/${result.total} email invites sent. ${result.failed} failed.`
              : shouldSendGuestInvites
                ? `${result?.sent ?? 0} email invites sent successfully.`
                : "Matching field/subfield members were invited.",
        });
        navigate(buildMeetingPath(data));
      };
      void afterSave().catch((err) => {
        toast.error({
          title: "Meeting saved, invite issue",
          description: parseApiError(err, "The meeting was saved, but some invitations could not be sent."),
        });
        navigate(buildMeetingPath(data));
      });
    },
    onError: (err) => {
      const detail = parseApiError(err, "Could not save the meeting.");
      setError(detail);
      toast.error({ title: "Could not save meeting", description: detail });
    },
  });

  const inviteGuestsNow = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Meeting id is required.");
      const emails = guestEmails
        .split(/[\n,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
      if (!emails.length) throw new Error("Add at least one guest email.");
      return inviteMeetingByEmailBulk(Number(id), {
        emails,
        role: guestInviteRole,
        message: guestInviteMessage.trim() || undefined,
      });
    },
    onSuccess: (result) => {
      setGuestEmails("");
      toast.success({
        title: "Invitations sent",
        description:
          result.failed > 0
            ? `${result.sent}/${result.total} invitations sent. ${result.failed} failed.`
            : `${result.sent} invitations sent successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
    },
    onError: (err) => {
      toast.error({
        title: "Could not send invitations",
        description: parseApiError(err, "Could not send guest invitations."),
      });
    },
  });

  const addParticipant = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: MeetParticipantRole }) =>
      api.post<MeetParticipant[]>(`/meetings/${meetingApiSegment(id!)}/participants/`, {
        user_id: userId,
        role,
      }),
    onSuccess: () => {
      setPeopleSearch("");
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Participant added",
        description: "The person was added to the meeting.",
      });
    },
    onError: (err) => {
      const detail = parseApiError(err, "Could not add that participant.");
      setError(detail);
      toast.error({ title: "Could not add participant", description: detail });
    },
  });

  const removeParticipant = useMutation({
    mutationFn: (participantId: number) =>
      api.post<MeetParticipant[]>(
        `/meetings/${meetingApiSegment(id!)}/participants/${participantId}/remove/`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
      toast.success({
        title: "Participant removed",
        description: "The participant was removed from the meeting.",
      });
    },
    onError: (err) => {
      const detail = parseApiError(err, "Could not remove that participant.");
      setError(detail);
      toast.error({ title: "Could not remove participant", description: detail });
    },
  });

  return (
    <div className="animate-fade-up space-y-4 sm:space-y-6">
      <PageHeader
        variant="clean"
        title={isNew ? "Create GRE Meet session" : "Edit GRE Meet session"}
        description={
          isNew
            ? "Schedule a session, set who can join, and link it to your GRE research context."
            : "Update the schedule, access rules, and linked papers or discussions."
        }
        action={
          <Link
            to="/dashboard/meetings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to meetings
          </Link>
        }
      />

      <RequiredFieldsLegend />

      <form
        className="space-y-4 sm:space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          saveMutation.mutate();
        }}
      >
        <MeetFormSection icon={CalendarClock} title="Schedule">
          <Input
            label="Meeting title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
            placeholder="e.g. GRE methods review, cohort A"
          />
          <div className={greFormGridMdClass}>
            <Input
              label="Date and time"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))}
              required
              hint="In your selected timezone"
            />
            <TimezoneSelect
              label="Organizer timezone"
              value={form.scheduled_timezone}
              onChange={(scheduled_timezone) => setForm((prev) => ({ ...prev, scheduled_timezone }))}
              required
              hint="Used for invites and the meeting archive"
            />
          </div>
          {schedulePreview && (
            <p className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
              <span className="font-semibold">Preview:</span> {schedulePreview}
            </p>
          )}
        </MeetFormSection>

        <MeetFormSection icon={Shield} title="Access and format">
          <div className={greFormGridClass}>
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
          </div>
        </MeetFormSection>

        <MeetFormSection icon={Link2} title="GRE research context">
          <div className={greFormGridClass}>
            <Select
              label="Category"
              value={form.category_id}
              required
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
              required
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
        </MeetFormSection>

        <MeetFormSection icon={FileText} title="Description">
          <Textarea
            label="Meeting description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={5}
            placeholder="Agenda, goals, pre-reading, or notes for participants…"
          />
        </MeetFormSection>

        {form.visibility === "invite_only" && (
          <MeetFormSection icon={Users} title="Guest invitations">
            <Textarea
              label="Guest emails"
              value={guestEmails}
              onChange={(e) => setGuestEmails(e.target.value)}
              rows={4}
              placeholder={"Paste emails separated by commas or new lines\nexample1@email.com\nexample2@email.com"}
            />
            <div className={greFormGridClass}>
              <Select
                label="Guest role"
                value={guestInviteRole}
                onChange={(e) => setGuestInviteRole(e.target.value as "participant" | "speaker")}
              >
                <option value="participant">Participant</option>
                <option value="speaker">Speaker</option>
              </Select>
            </div>
            <Textarea
              label="Personal message (optional)"
              value={guestInviteMessage}
              onChange={(e) => setGuestInviteMessage(e.target.value)}
              rows={2}
              placeholder="Included in the invite email."
            />
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={inviteMatchingMembers}
                onChange={(e) => setInviteMatchingMembers(e.target.checked)}
              />
              Also invite matching field/subfield members when saving
            </label>
          </MeetFormSection>
        )}

        {error && <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className={greFormActionsClass}>
          <Button
            type="submit"
            className={greFormPrimaryButtonClass}
            loading={saveMutation.isPending}
            disabled={!form.title || !form.sub_category_id || !form.scheduled_at || !form.scheduled_timezone}
          >
            {isNew ? "Create meeting" : "Save changes"}
          </Button>
          {!isNew && meeting && (
            <p className="text-center text-sm text-slate-500 sm:text-left">
              Saved schedule:{" "}
              <span className="font-medium text-ink">
                {formatMeetingDateInTimezone(meeting.scheduled_at, meeting.scheduled_timezone)}
              </span>
            </p>
          )}
          {!isNew && meeting && form.visibility === "invite_only" && (
            <Button
              type="button"
              variant="secondary"
              className={greFormPrimaryButtonClass}
              loading={inviteGuestsNow.isPending}
              onClick={() => inviteGuestsNow.mutate()}
            >
              Send guest invites now
            </Button>
          )}
        </div>
      </form>

      {!isNew && meeting && (
        <section className={`${greFormArtCardClass} space-y-4`}>
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-brand-700 sm:h-8 sm:w-8">
                <Shield className="h-4 w-4" />
              </span>
              <div>
                <h2 className="gre-form-section-heading text-base font-semibold text-ink">Host tools</h2>
                <p className="mt-0.5 text-sm text-slate-500">Recording, room controls, and session options.</p>
              </div>
            </div>
          </div>
          <MeetHostToolsPanel meeting={meeting} canManage={!!meeting.can_manage} />
        </section>
      )}

      {!isNew && meeting && (
        <section className={`${greFormArtCardClass} space-y-5`}>
          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-brand-700 sm:h-8 sm:w-8">
                <Users className="h-4 w-4" />
              </span>
              <div>
                <h2 className="gre-form-section-heading text-base font-semibold text-ink">
                  Participants and speakers
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Search GRE members to add; invite status updates when they open the room link.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={peopleSearch}
                onChange={(e) => setPeopleSearch(e.target.value)}
                placeholder="Search researchers by name, email, or affiliation"
                className={`${greFieldClass} pl-10`}
              />
            </div>
            <Select
              label="Role when adding"
              value={participantRole}
              onChange={(e) => setParticipantRole(e.target.value as MeetParticipantRole)}
            >
              <option value="participant">Participant</option>
              <option value="speaker">Speaker</option>
            </Select>
          </div>

          {peopleSearch.trim().length >= 2 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {people.map((person) => {
                const name = userFullName(person) || person.email || "Researcher";
                return (
                  <article
                    key={person.id}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <UserAvatar user={person} name={name} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{name}</p>
                      <p className="truncate text-xs text-slate-500">{person.email}</p>
                      <p className="mt-0.5 truncate text-[11px] text-brand-700">
                        {person.affiliation || "No affiliation"}
                      </p>
                      <Button
                        className="mt-2 !px-2.5 !py-1.5 text-xs"
                        variant="secondary"
                        loading={addParticipant.isPending}
                        onClick={() => addParticipant.mutate({ userId: person.id, role: participantRole })}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {(meeting.participants ?? []).map((participant) => {
              const name = participantDisplayName(participant);
              const isHost = participant.user_id === meeting.host_id;
              return (
                <article
                  key={participant.id}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                >
                  <UserAvatar user={participant.user} name={name} size="sm" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{name}</p>
                    <p className="mt-0.5 text-[11px] capitalize text-slate-500">
                      {participant.role} · {participant.invite_status}
                    </p>
                  </div>
                  {!isHost && (
                    <Button
                      variant="ghost"
                      className="shrink-0 text-xs text-red-600 hover:text-red-700"
                      loading={removeParticipant.isPending}
                      onClick={() => removeParticipant.mutate(participant.id)}
                    >
                      Remove
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
          {(meeting.participants?.length ?? 0) === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
              No invited participants yet. Search above to add researchers.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
