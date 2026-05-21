import { ngrokHeaders, resolveApiBaseUrl } from "./apiBaseUrl";

const API_URL = resolveApiBaseUrl();

export type StreamHandlers = {
  onToken: (token: string) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function consumeAssistantStream(
  path: string,
  body: Record<string, unknown>,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...ngrokHeaders(),
      ...authHeaders(),
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!res.ok) {
    let detail = "GRE Assistant is temporarily unavailable. Please try again in a moment.";
    try {
      const text = await res.text();
      const err = JSON.parse(text) as { detail?: string };
      if (err.detail) detail = err.detail;
    } catch {
      /* ignore */
    }
    handlers.onError?.(detail);
    throw new Error(detail);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    handlers.onError?.("Streaming is not supported in this browser.");
    throw new Error("No stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const data = JSON.parse(line.slice(6)) as {
            token?: string;
            done?: boolean;
            error?: string;
          };
          if (data.error) handlers.onError?.(data.error);
          if (data.token) handlers.onToken(data.token);
          if (data.done) handlers.onDone?.();
        } catch {
          /* skip malformed chunk */
        }
      }
    }
  }
}

export async function assistantHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/assistant/health/`, { headers: ngrokHeaders() });
    const data = await res.json();
    return data.available;
  } catch {
    return false;
  }
}

export function assistantChatStream(
  message: string,
  handlers: StreamHandlers,
  context?: string,
  signal?: AbortSignal
): Promise<void> {
  return consumeAssistantStream(
    "/assistant/chat/",
    { message, context },
    handlers,
    signal
  );
}

export function assistantSummarizePublicationStream(
  publicationId: number,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  return consumeAssistantStream(
    "/assistant/summarize/",
    { publication_id: publicationId },
    handlers,
    signal
  );
}

export function assistantSummarizeTextStream(
  text: string,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  return consumeAssistantStream("/assistant/summarize/", { text }, handlers, signal);
}

export function assistantDraftHelpStream(
  task: "improve" | "shorten" | "keywords",
  title: string,
  abstract: string,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  return consumeAssistantStream(
    "/assistant/draft/",
    { task, title, abstract },
    handlers,
    signal
  );
}

export type MessageDraftTask = "polish" | "draft" | "shorter" | "follow_up";

export function assistantMessageDraftStream(
  partnerId: number,
  draft: string,
  task: MessageDraftTask,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  return consumeAssistantStream(
    "/assistant/message-draft/",
    { partner_id: partnerId, draft, task },
    handlers,
    signal
  );
}
