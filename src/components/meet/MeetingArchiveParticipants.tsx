import { ChevronDown, Search, UserCheck, UserMinus, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "../ui/Input";
import { UserAvatar } from "../ui/UserAvatar";
import { userFullName } from "../../lib/userDisplay";
import type { MeetInviteStatus, MeetParticipant, MeetParticipantRole } from "../../types";

const PAGE_SIZE = 12;
const SEARCH_MIN = 8;
const COMPACT_GRID_MAX = 6;

type RoleFilter = "all" | MeetParticipantRole;
type StatusFilter = "all" | MeetInviteStatus;

type Props = {
  participants: MeetParticipant[];
};

function participantName(p: MeetParticipant) {
  if (p.user) return userFullName(p.user);
  return "Participant";
}

function inviteStatusMeta(status: MeetInviteStatus) {
  if (status === "accepted") {
    return { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200/80", label: "Accepted" };
  }
  if (status === "invited") {
    return { dot: "bg-amber-400", chip: "bg-amber-50 text-amber-900 ring-amber-200/80", label: "Invited" };
  }
  if (status === "declined") {
    return { dot: "bg-red-400", chip: "bg-red-50 text-red-800 ring-red-200/80", label: "Declined" };
  }
  return { dot: "bg-slate-400", chip: "bg-slate-100 text-slate-600 ring-slate-200/80", label: "Removed" };
}

function roleMeta(role: MeetParticipantRole) {
  if (role === "host") return { chip: "bg-brand-50 text-brand-800 ring-brand-200/80", label: "Host" };
  if (role === "speaker") return { chip: "bg-violet-50 text-violet-800 ring-violet-200/80", label: "Speaker" };
  return { chip: "bg-slate-100 text-slate-700 ring-slate-200/80", label: "Attendee" };
}

function ParticipantTile({ participant, dense = false }: { participant: MeetParticipant; dense?: boolean }) {
  const name = participantName(participant);
  const status = inviteStatusMeta(participant.invite_status);
  const role = roleMeta(participant.role);
  const present = participant.was_present === true;

  return (
    <article
      className={`group flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white transition hover:border-slate-300 hover:shadow-sm ${
        dense ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
      title={name}
    >
      <UserAvatar user={participant.user} name={name} size="sm" className="shrink-0 ring-2 ring-white" />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold text-ink ${dense ? "text-xs" : "text-sm"}`}>{name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${role.chip}`}>
            {role.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ${status.chip}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden />
            {status.label}
          </span>
          {present && (
            <span className="text-[10px] font-medium text-teal-700">Joined live</span>
          )}
        </div>
      </div>
    </article>
  );
}

function Facepile({ participants }: { participants: MeetParticipant[] }) {
  const visible = participants.slice(0, 8);
  const overflow = participants.length - visible.length;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((p) => {
          const name = participantName(p);
          return (
            <span key={p.id} title={name} className="inline-flex">
              <UserAvatar user={p.user} name={name} size="sm" className="ring-2 ring-white" />
            </span>
          );
        })}
      </div>
      {overflow > 0 && (
        <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
          +{overflow} more
        </span>
      )}
    </div>
  );
}

function ParticipantsEmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <Users className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-2 text-sm font-medium text-slate-600">No participants listed yet</p>
    </div>
  );
}

export function MeetingArchiveParticipants({ participants }: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const sorted = useMemo(() => {
    const roleOrder: Record<MeetParticipantRole, number> = {
      host: 0,
      speaker: 1,
      participant: 2,
    };
    const statusOrder: Record<MeetInviteStatus, number> = {
      accepted: 0,
      invited: 1,
      declined: 2,
      removed: 3,
    };
    return [...participants].sort((a, b) => {
      const roleDiff = roleOrder[a.role] - roleOrder[b.role];
      if (roleDiff !== 0) return roleDiff;
      const statusDiff = statusOrder[a.invite_status] - statusOrder[b.invite_status];
      if (statusDiff !== 0) return statusDiff;
      return participantName(a).localeCompare(participantName(b));
    });
  }, [participants]);

  const stats = useMemo(() => {
    const hosts = sorted.filter((p) => p.role === "host").length;
    const speakers = sorted.filter((p) => p.role === "speaker").length;
    const accepted = sorted.filter((p) => p.invite_status === "accepted").length;
    const pending = sorted.filter((p) => p.invite_status === "invited").length;
    const declined = sorted.filter((p) => p.invite_status === "declined").length;
    const present = sorted.filter((p) => p.was_present).length;
    return { hosts, speakers, accepted, pending, declined, present, total: sorted.length };
  }, [sorted]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (statusFilter !== "all" && p.invite_status !== statusFilter) return false;
      if (!q) return true;
      const name = participantName(p).toLowerCase();
      const email = p.user?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q) || p.role.includes(q);
    });
  }, [sorted, query, roleFilter, statusFilter]);

  const useGroupedLayout = sorted.length > COMPACT_GRID_MAX && !query.trim();
  const showSearch = sorted.length >= SEARCH_MIN;

  const grouped = useMemo(() => {
    const sections: { id: string; label: string; items: MeetParticipant[] }[] = [
      { id: "hosts", label: "Hosts", items: [] },
      { id: "speakers", label: "Speakers", items: [] },
      { id: "attendees", label: "Attendees", items: [] },
      { id: "pending", label: "Pending & declined", items: [] },
    ];
    for (const p of filtered) {
      if (p.role === "host") sections[0].items.push(p);
      else if (p.role === "speaker") sections[1].items.push(p);
      else if (p.invite_status === "accepted") sections[2].items.push(p);
      else sections[3].items.push(p);
    }
    return sections.filter((s) => s.items.length > 0);
  }, [filtered]);

  const isSectionExpanded = (id: string, count: number) => {
    if (expandedSections[id] != null) return expandedSections[id];
    if (id === "hosts" || id === "speakers") return true;
    if (count <= 4) return true;
    return id !== "attendees";
  };

  const toggleSection = (id: string, count: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !isSectionExpanded(id, count),
    }));
  };

  if (sorted.length === 0) {
    return <ParticipantsEmptyState />;
  }

  const visibleFlat = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
        <Facepile participants={sorted} />
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200/80">
            <Users className="h-3 w-3 text-brand-600" />
            {stats.total} total
          </span>
          {stats.accepted > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200/80">
              <UserCheck className="h-3 w-3" />
              {stats.accepted} accepted
            </span>
          )}
          {stats.present > 0 && (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-800 ring-1 ring-teal-200/80">
              {stats.present} joined live
            </span>
          )}
          {stats.pending > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-900 ring-1 ring-amber-200/80">
              <UserPlus className="h-3 w-3" />
              {stats.pending} invited
            </span>
          )}
          {stats.declined > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-red-800 ring-1 ring-red-200/80">
              <UserMinus className="h-3 w-3" />
              {stats.declined} declined
            </span>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search by name or email…"
              className="pl-9"
              aria-label="Search participants"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "host", "speaker", "participant"] as RoleFilter[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRoleFilter(id);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition ${
                  roleFilter === id
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {id === "all" ? "All roles" : id === "participant" ? "Attendees" : id}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
          No participants match your search.
        </p>
      ) : useGroupedLayout ? (
        <div className="max-h-[min(28rem,55vh)] space-y-2 overflow-y-auto pr-0.5">
          {grouped.map((section) => {
            const open = isSectionExpanded(section.id, section.items.length);
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id, section.items.length)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50/80"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {section.label}
                    <span className="ml-1.5 font-normal text-slate-400">({section.items.length})</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="grid gap-2 border-t border-slate-100 p-2 sm:grid-cols-2">
                    {section.items.map((p) => (
                      <ParticipantTile key={p.id} participant={p} dense />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`grid gap-2 ${
              filtered.length > 3 ? "sm:grid-cols-2" : "grid-cols-1"
            } max-h-[min(28rem,55vh)] overflow-y-auto pr-0.5`}
          >
            {visibleFlat.map((p) => (
              <ParticipantTile key={p.id} participant={p} dense={filtered.length > 4} />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50/50"
            >
              Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more (
              {filtered.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
