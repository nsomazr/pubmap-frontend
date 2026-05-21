import type { TopicReply } from "../types";

export type ReplyTreeNode = TopicReply & { children: ReplyTreeNode[] };

function byCreatedAt(a: ReplyTreeNode, b: ReplyTreeNode) {
  const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
  const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
  return ta - tb;
}

export function buildReplyTree(replies: TopicReply[]): ReplyTreeNode[] {
  const nodes = new Map<number, ReplyTreeNode>();
  for (const r of replies) {
    nodes.set(r.id, { ...r, children: [] });
  }
  const roots: ReplyTreeNode[] = [];
  for (const r of replies) {
    const node = nodes.get(r.id)!;
    const parentId = r.parent_reply_id ?? null;
    if (parentId != null && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortTree = (list: ReplyTreeNode[]): ReplyTreeNode[] =>
    [...list].sort(byCreatedAt).map((n) => ({
      ...n,
      children: sortTree(n.children),
    }));
  return sortTree(roots);
}

/** Flat map for resolving parent author labels in the UI. */
export function replyById(replies: TopicReply[]): Map<number, TopicReply> {
  return new Map(replies.map((r) => [r.id, r]));
}

export function countDescendants(node: ReplyTreeNode): number {
  return node.children.reduce(
    (n, child) => n + 1 + countDescendants(child),
    0
  );
}
