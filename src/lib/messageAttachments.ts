export const MAX_MESSAGE_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const MESSAGE_ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.png,.jpg,.jpeg,.webp,.gif";

export function formatMessageAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateMessageAttachmentFile(file: File): string | null {
  if (file.size > MAX_MESSAGE_ATTACHMENT_BYTES) {
    return "Document must be 25 MB or smaller.";
  }
  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  const allowed = MESSAGE_ATTACHMENT_ACCEPT.split(",").map((item) => item.trim().toLowerCase());
  if (!allowed.includes(ext === ".jpeg" ? ".jpg" : ext)) {
    return "That file type is not supported for messaging.";
  }
  return null;
}

export function isMessageAttachmentImage(name?: string | null): boolean {
  const ext = (name || "").toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((item) => ext.endsWith(item));
}
