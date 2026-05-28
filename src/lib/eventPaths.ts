import type { Event } from "../types";

type EventLike = Pick<Event, "id" | "encoded_id"> | number;

export function eventRef(event: EventLike, encodedId?: string | null): string {
  if (typeof event === "object") {
    const encoded = (event.encoded_id || encodedId || "").trim();
    if (encoded) return encoded;
    return String(event.id);
  }
  if (encodedId?.trim()) return encodedId.trim();
  return String(event);
}

export function buildEventPath(event: EventLike, encodedId?: string | null): string {
  return `/events/${eventRef(event, encodedId)}`;
}

/** API path segment for event detail routes (accepts encoded or legacy integer). */
export function eventApiSegment(event: EventLike | string | number): string {
  if (typeof event === "object") return eventRef(event);
  return String(event);
}
