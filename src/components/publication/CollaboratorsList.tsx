import { Link } from "react-router-dom";
import { collaboratorsFromNetwork, type CollaboratorListRow } from "../../lib/collaboratorsList";
import type { CollaborationNetworkData } from "../../types";
import { UserAvatar } from "../ui/UserAvatar";

interface Props {
  network: Pick<CollaborationNetworkData, "nodes" | "edges">;
  focusNodeId?: string;
  minShared?: number;
  limit?: number;
  emptyMessage?: string;
}

function sharedLabel(row: CollaboratorListRow): string {
  const n = row.sharedPublications;
  if (row.onThisPaper && !row.sharedPublications) return "On this paper";
  if (n === 1 && row.onThisPaper) return "1 paper together";
  if (n === 1) return "1 other paper";
  return `${n} papers together`;
}

export function CollaboratorsList({
  network,
  focusNodeId,
  minShared = 1,
  limit,
  emptyMessage = "No collaborators to show yet.",
}: Props) {
  let rows = collaboratorsFromNetwork(network, focusNodeId).filter(
    (row) => row.sharedPublications >= minShared
  );
  if (limit != null) {
    rows = rows.slice(0, limit);
  }

  if (!rows.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const { node } = row;
        const profilePath = node.profile_url || (node.user_id ? `/researcher/${node.user_id}` : null);
        const shellClass =
          "flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/30";

        const content = (
          <>
            <UserAvatar name={node.label} photoUrl={node.photo} size="sm" className="h-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{node.label}</p>
              {node.affiliation ? (
                <p className="truncate text-xs text-slate-500">{node.affiliation}</p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600">
              {sharedLabel(row)}
            </span>
          </>
        );

        return (
          <li key={node.id}>
            {profilePath ? (
              <Link to={profilePath} className={shellClass}>
                {content}
              </Link>
            ) : (
              <div className={shellClass}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
