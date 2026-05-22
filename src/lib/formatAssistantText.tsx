import type { ReactNode } from "react";

type Block =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; lines: ReactNode[] }
  | { type: "list"; items: ReactNode[][] };

const SKIPPED_LABELS = /^(title|subcategory|category|location|keywords|introduction|methods|results|findings|conclusion|abstract)$/i;

/** e.g. ['a', 'b'] → a, b */
function normalizePythonListLiteral(line: string): string {
  const trimmed = line.trim();
  const match = trimmed.match(/^\[(.+)\]$/);
  if (!match) return line;

  const items: string[] = [];
  const re = /['"]([^'"]*)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(match[1])) !== null) {
    const item = m[1].trim();
    if (item) items.push(item);
  }
  return items.length ? items.join(", ") : line;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Remove markdown / echoed publication metadata before rendering. */
export function cleanAssistantSummary(raw: string): string {
  return raw
    .split("\n")
    .map((line) => {
      let t = line.trim();
      if (!t) return "";
      if (/^[-]{3,}$/.test(t)) return "";
      t = t.replace(/^#{1,6}\s+/, "").trim();
      if (/^TITLE\s*:/i.test(t)) return "";
      if (/^Subcategory\s*:/i.test(t)) return "";
      if (/^Location\s*:/i.test(t)) return "";
      if (/^Keywords\s*:/i.test(t)) return "";
      return normalizePythonListLiteral(t);
    })
    .filter((line, i, arr) => {
      if (!line) return i === 0 || arr[i - 1] !== "";
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

function inlineFormat(text: string): ReactNode[] {
  const plain = stripHtml(text);
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(plain)) !== null) {
    if (m.index > last) parts.push(plain.slice(last, m.index));
    parts.push(
      <strong key={`${m.index}-b`} className="font-semibold text-ink">
        {m[1]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < plain.length) parts.push(plain.slice(last));
  return parts.length ? parts : [plain];
}

function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const trimmed = line.trim();

    const mdHeading = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (mdHeading) {
      const text = mdHeading[1].replace(/^(title|abstract)\s*:\s*/i, "").trim();
      if (text && !SKIPPED_LABELS.test(text.split(":")[0]?.trim() ?? "")) {
        blocks.push({ type: "heading", level: 4, text });
      }
      i += 1;
      continue;
    }

    const summaryLabel = trimmed.match(
      /^(Key findings|Why it matters):\s*(.*)$/i
    );
    if (summaryLabel) {
      const labelName = summaryLabel[1]
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      const body = stripHtml(summaryLabel[2]);
      blocks.push({ type: "heading", level: 4, text: labelName });
      if (body) {
        blocks.push({ type: "paragraph", lines: inlineFormat(body) });
      }
      i += 1;
      continue;
    }

    const labelInline = trimmed.match(/^([A-Za-z][A-Za-z\s]{0,40}):\s*(.+)$/);
    if (labelInline) {
      const labelName = labelInline[1].trim();
      const body = stripHtml(labelInline[2]);
      if (!SKIPPED_LABELS.test(labelName) && body) {
        blocks.push({
          type: "heading",
          level: 4,
          text: labelName.charAt(0).toUpperCase() + labelName.slice(1).toLowerCase(),
        });
        blocks.push({ type: "paragraph", lines: inlineFormat(body) });
      }
      i += 1;
      continue;
    }

    const label = trimmed.match(/^([A-Za-z][A-Za-z\s]{0,40}):\s*$/);
    if (label) {
      const labelName = label[1].trim();
      if (/^key findings$/i.test(labelName) || /^why it matters$/i.test(labelName)) {
        blocks.push({
          type: "heading",
          level: 4,
          text: labelName
            .split(/\s+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(" "),
        });
        i += 1;
        const nextLines: string[] = [];
        while (i < lines.length && lines[i].trim() && !/^([A-Za-z][A-Za-z\s]{0,40}):\s*/.test(lines[i].trim())) {
          nextLines.push(lines[i].trim());
          i += 1;
        }
        const merged = stripHtml(nextLines.join(" "));
        if (merged) {
          blocks.push({ type: "paragraph", lines: inlineFormat(merged) });
        }
        continue;
      }
      if (!SKIPPED_LABELS.test(labelName)) {
        blocks.push({
          type: "heading",
          level: 4,
          text: labelName.charAt(0).toUpperCase() + labelName.slice(1).toLowerCase(),
        });
      }
      i += 1;
      continue;
    }

    const capsHeading = trimmed.match(/^([A-Z]{2,}(?:\s+[A-Z]{2,})+|[A-Z]{5,})$/);
    if (capsHeading && !SKIPPED_LABELS.test(capsHeading[1])) {
      const text = capsHeading[1]
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      blocks.push({ type: "heading", level: 4, text });
      i += 1;
      continue;
    }

    if (/^[-•*]\s+/.test(trimmed)) {
      const items: ReactNode[][] = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[-•*]\s+/, "");
        items.push(inlineFormat(item));
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      const t = lines[i].trim();
      if (
        /^#{1,6}\s/.test(t) ||
        /^[-•*]\s+/.test(t) ||
        /^[-]{3,}$/.test(t) ||
        /^([A-Za-z][A-Za-z\s]{0,40}):\s*/.test(t)
      ) {
        break;
      }
      paraLines.push(lines[i]);
      i += 1;
    }
    if (paraLines.length) {
      const merged = stripHtml(paraLines.join(" ").replace(/\s+/g, " ").trim());
      if (merged) {
        blocks.push({ type: "paragraph", lines: inlineFormat(merged) });
      }
    }
  }

  return blocks;
}

interface Props {
  content: string;
  streaming?: boolean;
  className?: string;
}

export function FormattedAssistantText({ content, streaming, className = "" }: Props) {
  const normalized = cleanAssistantSummary(content);
  const blocks = parseBlocks(normalized);

  if (!content.trim() && !streaming) return null;

  if (!blocks.length && normalized.trim()) {
    return (
      <div className={`gre-assistant-formatted text-sm leading-relaxed text-slate-700 ${className}`}>
        <p>{inlineFormat(normalized.trim())}</p>
        {streaming && <StreamCursor />}
      </div>
    );
  }

  return (
    <div className={`gre-assistant-formatted space-y-3 text-sm leading-relaxed text-slate-700 ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h3" : block.level === 3 ? "h4" : "h5";
          return (
            <Tag
              key={idx}
              className={
                block.level === 2
                  ? "text-sm font-bold text-ink"
                  : "text-xs font-semibold uppercase tracking-wide text-brand-700"
              }
            >
              {block.text}
            </Tag>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={idx} className="list-disc space-y-1.5 pl-4">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="leading-relaxed text-slate-700">
            {block.lines}
          </p>
        );
      })}
      {streaming && <StreamCursor />}
    </div>
  );
}

function StreamCursor() {
  return (
    <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-brand-500 align-middle" />
  );
}
