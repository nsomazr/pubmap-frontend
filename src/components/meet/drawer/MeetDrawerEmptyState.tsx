import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function MeetDrawerEmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 ring-1 ring-slate-700/50">
        <Icon className="h-8 w-8 text-cyan-500/60" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
