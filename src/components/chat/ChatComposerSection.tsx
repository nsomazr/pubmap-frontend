import { MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title?: string;
  suggestions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Sticky bottom composer block shared by manuscript assistant and similar chats. */
export function ChatComposerSection({
  title = "Chat about this manuscript",
  suggestions,
  children,
  className = "",
}: Props) {
  return (
    <div className={`gre-chat-composer ${className}`}>
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
        <MessageCircle className="h-3.5 w-3.5 shrink-0" />
        {title}
      </p>
      {suggestions && (
        <div className="mt-2.5 space-y-2">
          <p className="text-xs text-slate-500">Suggested questions</p>
          {suggestions}
        </div>
      )}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}
