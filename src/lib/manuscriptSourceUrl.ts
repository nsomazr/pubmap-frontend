import api from "./api";

const PDF_LINK_ERROR =
  "PDF not available through this link. Upload the file instead.";

async function parseErrorFromBlob(blob: Blob): Promise<string> {
  try {
    const text = await blob.text();
    const parsed = JSON.parse(text) as { detail?: string };
    return parsed.detail?.trim() || PDF_LINK_ERROR;
  } catch {
    return PDF_LINK_ERROR;
  }
}

function filenameFromDisposition(header: string | undefined): string | null {
  if (!header) return null;
  const match = /filename\*?=(?:UTF-8'')?"?([^";\n]+)"?/i.exec(header);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].trim().replace(/^"|"$/g, ""));
  } catch {
    return match[1].trim().replace(/^"|"$/g, "");
  }
}

/** Download a PDF from a public URL via GRE backend (SSRF-safe). */
export async function fetchManuscriptPdfFromUrl(url: string): Promise<File> {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Enter a link to your PDF.");
  }

  const response = await api.post<Blob>(
    "/publications/fetch_manuscript_url/",
    { source_url: trimmed },
    { responseType: "blob", validateStatus: () => true }
  );

  if (response.status >= 400) {
    const detail = await parseErrorFromBlob(response.data);
    throw new Error(detail);
  }

  const rawType = response.headers["content-type"];
  const contentType = (typeof rawType === "string" ? rawType : "").toLowerCase();
  if (contentType.includes("application/json")) {
    const detail = await parseErrorFromBlob(response.data);
    throw new Error(detail);
  }

  const blob = response.data;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error(PDF_LINK_ERROR);
  }

  const rawDisposition = response.headers["content-disposition"];
  const headerName = filenameFromDisposition(
    typeof rawDisposition === "string" ? rawDisposition : undefined
  );
  const filename =
    headerName && headerName.toLowerCase().endsWith(".pdf")
      ? headerName
      : "manuscript.pdf";

  return new File([blob], filename, { type: "application/pdf" });
}
