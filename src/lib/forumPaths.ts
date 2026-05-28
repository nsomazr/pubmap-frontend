type TopicLike = { id: number; encoded_id?: string | null } | number;

export function forumTopicRef(topic: TopicLike, encodedId?: string | null): string {
  if (typeof topic === "object") {
    const encoded = (topic.encoded_id || encodedId || "").trim();
    if (encoded) return encoded;
    return String(topic.id);
  }
  if (encodedId?.trim()) return encodedId.trim();
  return String(topic);
}

export function buildForumTopicPath(topic: TopicLike, encodedId?: string | null): string {
  return `/forum/topic/${forumTopicRef(topic, encodedId)}`;
}

/** API path segment for forum topic routes (accepts encoded or legacy integer). */
export function forumTopicApiSegment(topic: TopicLike | string | number): string {
  if (typeof topic === "object") return forumTopicRef(topic);
  return String(topic);
}
