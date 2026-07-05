import type {
  CollaborationNetworkData,
  CollaborationNetworkNode,
} from "../types";

export type CollaboratorListRow = {
  node: CollaborationNetworkNode;
  sharedPublications: number;
  onThisPaper: boolean;
};

/** Flat collaborator rows from graph API data, sorted by shared work. */
export function collaboratorsFromNetwork(
  network: Pick<CollaborationNetworkData, "nodes" | "edges">,
  focusNodeId?: string
): CollaboratorListRow[] {
  const focus =
    focusNodeId ??
    network.nodes.find((node) => node.kind === "primary")?.id ??
    network.nodes[0]?.id;
  if (!focus) return [];

  const sharedCount = new Map<string, number>();
  const onThisPaper = new Set<string>();

  for (const edge of network.edges) {
    const left = edge.source;
    const right = edge.target;
    const count = edge.shared_publications ?? 1;
    const isPaperTeam = edge.kind !== "collaboration";

    if (left !== focus && right !== focus) continue;

    const other = left === focus ? right : left;
    if (isPaperTeam) {
      onThisPaper.add(other);
    }
    sharedCount.set(other, Math.max(sharedCount.get(other) ?? 0, count));
  }

  const rows: CollaboratorListRow[] = [];
  for (const node of network.nodes) {
    if (node.id === focus) continue;
    const shared = sharedCount.get(node.id) ?? 0;
    const paperMember = onThisPaper.has(node.id);
    if (!paperMember && shared <= 0) continue;
    rows.push({
      node,
      sharedPublications: Math.max(shared, paperMember ? 1 : 0),
      onThisPaper: paperMember,
    });
  }

  return rows.sort(
    (a, b) =>
      b.sharedPublications - a.sharedPublications ||
      Number(b.onThisPaper) - Number(a.onThisPaper) ||
      a.node.label.localeCompare(b.node.label)
  );
}

export function frequentCollaboratorsFromNetwork(
  network: Pick<CollaborationNetworkData, "nodes" | "edges">,
  limit = 8,
  minShared = 2
): CollaboratorListRow[] {
  const focus = network.nodes.find((node) => node.kind === "primary")?.id;
  return collaboratorsFromNetwork(network, focus)
    .filter((row) => row.sharedPublications >= minShared)
    .slice(0, limit);
}
