import {
  AlertTriangle,
  BookOpen,
  MessageCircle,
  MessageSquare,
  Newspaper,
  type LucideIcon,
} from "lucide-react";

export type NotificationVisual = {
  label: string;
  icon: LucideIcon;
  chipClass: string;
  dotClass: string;
};

const DEFAULT: NotificationVisual = {
  label: "Update",
  icon: Newspaper,
  chipClass: "bg-slate-100 text-slate-700 ring-slate-200/80",
  dotClass: "bg-slate-400",
};

const BY_TYPE: Record<string, NotificationVisual> = {
  message: {
    label: "Message",
    icon: MessageCircle,
    chipClass: "bg-brand-50 text-brand-800 ring-brand-100",
    dotClass: "bg-brand-500",
  },
  forum_reply: {
    label: "Forum",
    icon: MessageSquare,
    chipClass: "bg-violet-50 text-violet-800 ring-violet-100",
    dotClass: "bg-violet-500",
  },
  discussion: {
    label: "Discussion",
    icon: BookOpen,
    chipClass: "bg-teal-50 text-teal-800 ring-teal-100",
    dotClass: "bg-teal-500",
  },
  publication: {
    label: "Publication",
    icon: BookOpen,
    chipClass: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    dotClass: "bg-emerald-500",
  },
  plagiarism: {
    label: "Integrity",
    icon: AlertTriangle,
    chipClass: "bg-amber-50 text-amber-900 ring-amber-100",
    dotClass: "bg-amber-500",
  },
  plagiarism_admin: {
    label: "Moderation",
    icon: AlertTriangle,
    chipClass: "bg-red-50 text-red-800 ring-red-100",
    dotClass: "bg-red-500",
  },
};

export function notificationVisual(type: string): NotificationVisual {
  return BY_TYPE[type] ?? DEFAULT;
}
