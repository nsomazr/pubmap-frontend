import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildMeetingPath } from "../lib/meetingPaths";
import type { MeetSession } from "../types";

/** Replace bare numeric `/meetings/7/...` URLs with encoded public ids once meeting loads. */
export function useCanonicalMeetingUrl(
  meeting: Pick<MeetSession, "id" | "encoded_id"> | undefined,
  suffix?: "archive" | "edit"
) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const encoded = meeting?.encoded_id?.trim();
    if (!encoded || !routeId) return;
    if (routeId === encoded) return;
    if (routeId !== String(meeting?.id)) return;
    navigate(buildMeetingPath(meeting!, suffix), { replace: true });
  }, [meeting, navigate, routeId, suffix]);
}
