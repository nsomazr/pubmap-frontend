import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { buildForumTopicPath } from "../../lib/forumPaths";
import type { Topic } from "../../types";

interface Props {
  topics: Topic[];
  className?: string;
}

export function ForumRecentDiscussions({ topics, className = "" }: Props) {
  if (!topics.length) return null;

  return (
    <section className={`mt-8 ${className}`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Recent</h2>
        <span className="text-xs text-slate-400">{topics.length} topics</span>
      </div>

      <ul className="space-y-2">
        {topics.map((topic) => {
          const replies = topic.replies_count ?? 0;
          const subfield = topic.sub_category_name || topic.subfield_name;
          const author =
            topic.author?.full_name?.trim() ||
            [topic.author?.firstname, topic.author?.lastname].filter(Boolean).join(" ").trim();

          return (
            <li key={topic.id}>
              <Link
                to={buildForumTopicPath(topic)}
                className="gre-interactive group block rounded-xl border border-slate-100 bg-white px-4 py-3 transition hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-ink group-hover:text-brand-800">
                      {topic.topic}
                    </p>
                    {(subfield || author) && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {[subfield, author].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600 group-hover:bg-white">
                    {replies} {replies === 1 ? "reply" : "replies"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ForumRecentDiscussionsEmpty() {
  return (
    <section className="mt-8 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
      <MessageSquare className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
      <p className="mt-2 text-sm text-slate-500">No recent discussions yet.</p>
    </section>
  );
}
