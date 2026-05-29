import { createPortal } from "react-dom";
import { Button } from "../ui/Button";

/** Wait this long alone before prompting (ms). */
export const MEET_LONELY_PROMPT_AFTER_MS = 15 * 60 * 1000;

/** Countdown before auto-leave once the prompt is shown (seconds). */
export const MEET_LONELY_AUTO_LEAVE_SEC = 120;

function formatCountdown(seconds: number) {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

type Props = {
  open: boolean;
  secondsLeft: number;
  onStay: () => void;
  onLeave: () => void;
};

export function MeetLonelyRoomDialog({ open, secondsLeft, onStay, onLeave }: Props) {
  if (!open) return null;

  const minutesLeft = Math.max(1, Math.ceil(secondsLeft / 60));

  return createPortal(
    <div
      className="fixed inset-0 z-[10300] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meet-lonely-title"
      aria-describedby="meet-lonely-desc"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700/90 bg-slate-900 px-6 py-7 text-center shadow-[0_24px_64px_rgba(2,6,23,0.55)] ring-1 ring-slate-700/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-950/60 ring-2 ring-cyan-900/50"
          aria-hidden
        >
          <span className="text-xl font-bold tabular-nums text-cyan-300">
            {formatCountdown(secondsLeft)}
          </span>
        </div>
        <h2 id="meet-lonely-title" className="text-lg font-semibold text-slate-100">
          Are you still there?
        </h2>
        <p id="meet-lonely-desc" className="mt-3 text-sm leading-relaxed text-slate-400">
          You&apos;re the only one in this call, so it will end in about {minutesLeft}{" "}
          {minutesLeft === 1 ? "minute" : "minutes"} unless you choose to stay.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="!text-slate-300 hover:!bg-slate-800 hover:!text-white"
            onClick={onLeave}
          >
            Leave now
          </Button>
          <Button type="button" className="!bg-cyan-700 hover:!bg-cyan-600" onClick={onStay}>
            Stay in the call
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
