import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PublicEmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="gre-public-card px-6 py-10 text-center sm:px-8">
      <Icon className="mx-auto h-9 w-9 text-slate-300" aria-hidden />
      <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
