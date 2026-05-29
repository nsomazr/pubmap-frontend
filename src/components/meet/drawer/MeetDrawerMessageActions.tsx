import type { ReactNode } from "react";
import { meetDrawer } from "../../../lib/meetDrawerTheme";

type Props = {
  align: "start" | "end";
  children: ReactNode;
};

export function MeetDrawerMessageActions({ align, children }: Props) {
  return (
    <div
      className={`${meetDrawer.messageActions} ${
        align === "end" ? meetDrawer.messageActionsEnd : meetDrawer.messageActionsStart
      }`}
    >
      {children}
    </div>
  );
}

export function MeetDrawerActionButton({
  onClick,
  children,
  variant = "default",
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: "default" | "accent" | "own";
}) {
  const className =
    variant === "own"
      ? meetDrawer.messageActionBtnOwn
      : variant === "accent"
        ? meetDrawer.messageActionBtnAccent
        : meetDrawer.messageActionBtn;

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
