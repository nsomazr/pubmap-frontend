import { ChevronDown, ChevronRight, MessageSquare, Reply, X } from "lucide-react";
import { useMemo, useState } from "react";
import { greFormPanelNestedClass } from "../../lib/formStyles";
import { Button } from "../ui/Button";
import { TextareaWithSendAddon } from "../ui/FieldSendAddon";
import {
  buildReplyTree,
  countDescendants,
  replyById,
  type ReplyTreeNode,
} from "../../lib/forumReplyTree";
import { UserAvatar } from "../ui/UserAvatar";
import type { TopicReply, User } from "../../types";

const PREVIEW_CHARS = 240;
const MAX_INDENT_DEPTH = 8;

function authorLabel(author?: User) {
  return (
    author?.full_name?.trim() ||
    `${author?.firstname ?? ""} ${author?.lastname ?? ""}`.trim() ||
    "Member"
  );
}

function formatTime(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ReplyComposer({
  placeholder,
  draft,
  onDraftChange,
  onSubmit,
  onCancel,
  posting,
}: {
  placeholder: string;
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  posting: boolean;
}) {
  return (
    <div className={greFormPanelNestedClass}>
      <TextareaWithSendAddon
        value={draft}
        onChange={onDraftChange}
        onSubmit={onSubmit}
        rows={3}
        placeholder={placeholder}
        loading={posting}
        submitAriaLabel="Post reply"
        footer={
          <button
            type="button"
            onClick={onCancel}
            className="gre-interactive mt-2 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white/80"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        }
      />
    </div>
  );
}

interface ReplyNodeProps {
  node: ReplyTreeNode;
  depth: number;
  parentAuthor?: string;
  replyingTo: number | null;
  onReply: (id: number | null) => void;
  onSubmitReply: (content: string, parentReplyId?: number) => void;
  posting: boolean;
  canReply: boolean;
}

function ReplyNode({
  node,
  depth,
  parentAuthor,
  replyingTo,
  onReply,
  onSubmitReply,
  posting,
  canReply,
}: ReplyNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const [threadOpen, setThreadOpen] = useState(depth < 1);
  const [draft, setDraft] = useState("");

  const isLong = node.content.length > PREVIEW_CHARS;
  const showPreview = isLong && !expanded;
  const childCount = countDescendants(node);
  const isReplyingHere = replyingTo === node.id;

  return (
    <div
      className={depth > 0 ? "forum-reply-nested mt-3" : "mt-2"}
      style={
        depth > 0
          ? { marginLeft: `min(${depth * 1.25}rem, ${MAX_INDENT_DEPTH * 1.25}rem)` }
          : undefined
      }
    >
      <article className="forum-reply-card group">
        {depth > 0 && parentAuthor && (
          <p className="mb-1.5 text-xs font-medium text-brand-600">
            Reply to {parentAuthor}
          </p>
        )}
        <div className="flex gap-3">
          <UserAvatar user={node.author} size="sm" className="h-9 w-9 border-2 text-xs" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-slate-900">
                {authorLabel(node.author)}
              </span>
              {node.created_at && (
                <time className="text-xs text-slate-400">{formatTime(node.created_at)}</time>
              )}
            </div>

            <p
              className={`mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 ${
                showPreview ? "line-clamp-4" : ""
              }`}
            >
              {node.content}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="gre-interactive text-xs font-semibold text-brand-600 hover:text-teal-700"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
              {canReply && (
                <button
                  type="button"
                  onClick={() => onReply(isReplyingHere ? null : node.id)}
                  className="gre-interactive inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-600"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>
              )}
            </div>

            {isReplyingHere && canReply && (
              <ReplyComposer
                placeholder={`Reply to ${authorLabel(node.author)}…`}
                draft={draft}
                onDraftChange={setDraft}
                onSubmit={() => {
                  const text = draft.trim();
                  if (!text) return;
                  onSubmitReply(text, node.id);
                  setDraft("");
                  onReply(null);
                }}
                onCancel={() => {
                  setDraft("");
                  onReply(null);
                }}
                posting={posting}
              />
            )}
          </div>
        </div>
      </article>

      {node.children.length > 0 && (
        <div className="forum-reply-children">
          {!threadOpen ? (
            <button
              type="button"
              onClick={() => setThreadOpen(true)}
              className="gre-interactive mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-teal-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Show {childCount} {childCount === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <>
              {depth >= 1 && (
                <button
                  type="button"
                  onClick={() => setThreadOpen(false)}
                  className="gre-interactive mt-2 mb-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Hide replies
                </button>
              )}
              {node.children.map((child) => (
                <ReplyNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  parentAuthor={authorLabel(node.author)}
                  replyingTo={replyingTo}
                  onReply={onReply}
                  onSubmitReply={onSubmitReply}
                  posting={posting}
                  canReply={canReply}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  replies: TopicReply[];
  totalCount?: number;
  loadError?: boolean;
  onRetryLoad?: () => void;
  canReply: boolean;
  posting: boolean;
  onSubmitReply: (content: string, parentReplyId?: number) => void;
  topLevelDraft: string;
  onTopLevelDraftChange: (v: string) => void;
  onTopLevelSubmit: () => void;
}

export function ForumReplyThread({
  replies,
  totalCount,
  loadError,
  onRetryLoad,
  canReply,
  posting,
  onSubmitReply,
  topLevelDraft,
  onTopLevelDraftChange,
  onTopLevelSubmit,
}: Props) {
  const displayCount = totalCount ?? replies.length;
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const tree = useMemo(() => buildReplyTree(replies), [replies]);
  const lookup = useMemo(() => replyById(replies), [replies]);

  return (
    <section className="forum-reply-thread gre-card p-5 sm:p-6">
      <h2 className="gre-display mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
        <MessageSquare className="h-5 w-5 text-brand-600" />
        Replies ({displayCount})
      </h2>

      {loadError && (
        <div className="gre-card border-brand-200/80 bg-brand-50/50 px-4 py-4 text-sm text-brand-900">
          <p>Replies could not be loaded{displayCount > 0 ? ` (${displayCount} in database)` : ""}.</p>
          {onRetryLoad && (
            <button
              type="button"
              onClick={() => onRetryLoad()}
              className="gre-interactive mt-2 font-semibold text-brand-600 hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {!loadError && replies.length === 0 && displayCount === 0 ? (
        <p className="gre-card border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
          No replies yet. Be the first to respond.
        </p>
      ) : !loadError ? (
        <div className="gre-stagger space-y-1">
          {tree.map((node) => (
            <ReplyNode
              key={node.id}
              node={node}
              depth={0}
              parentAuthor={
                node.parent_reply_id
                  ? authorLabel(lookup.get(node.parent_reply_id)?.author)
                  : undefined
              }
              replyingTo={replyingTo}
              onReply={setReplyingTo}
              onSubmitReply={onSubmitReply}
              posting={posting}
              canReply={canReply}
            />
          ))}
        </div>
      ) : null}

      {!loadError && replies.length === 0 && displayCount > 0 && (
        <p className="gre-card border-dashed border-brand-200/80 bg-brand-50/40 py-6 text-center text-sm text-brand-800">
          Replies exist but could not be displayed.{" "}
          {onRetryLoad && (
            <button
              type="button"
              onClick={() => onRetryLoad()}
              className="font-semibold text-brand-600 hover:underline"
            >
              Reload
            </button>
          )}
        </p>
      )}

      {canReply && replyingTo === null && (
        <div className="forum-compose-bar">
          <p className="mb-2 text-sm font-medium text-slate-700">Join the discussion</p>
          <TextareaWithSendAddon
            value={topLevelDraft}
            onChange={onTopLevelDraftChange}
            onSubmit={onTopLevelSubmit}
            rows={4}
            placeholder="Share your perspective, ask a question, or build on this thread…"
            loading={posting}
            submitAriaLabel="Post reply"
            footer={
              <p className="mt-2 text-xs text-slate-500">
                Replies are threaded. Use Reply on any comment to respond directly.
              </p>
            }
          />
        </div>
      )}
    </section>
  );
}
