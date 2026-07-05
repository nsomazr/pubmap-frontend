import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { greFieldClass } from "../../lib/formStyles";

interface Props {
  open: boolean;
  onToggle: () => void;
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  posting: boolean;
  error?: string;
}

export function ForumNewTopicForm({
  open,
  onToggle,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  posting,
  error,
}: Props) {
  const canPost = title.trim().length > 0 && content.trim().length > 0;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {open ? "Start a discussion in this forum." : "Share a question or update with the community."}
        </p>
        <button
          type="button"
          onClick={onToggle}
          className="gre-interactive inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-200 hover:text-brand-700"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Close" : "New topic"}
        </button>
      </div>

      {open ? (
        <form
          className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canPost) onSubmit();
          }}
        >
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="What do you want to discuss?"
                className={greFieldClass}
                required
                autoFocus
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Message</span>
              <textarea
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Add context, links, or questions…"
                rows={4}
                className={`${greFieldClass} min-h-[6.5rem] resize-y`}
                required
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="submit" loading={posting} disabled={!canPost}>
              Post
            </Button>
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-white hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
