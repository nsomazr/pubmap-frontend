import api from "./api";

export type ExtractedManuscript = {
  title: string;
  abstract: string;
  keywords?: string;
  introduction?: string;
  methods?: string;
  results?: string;
  findings?: string;
  conclusion?: string;
  funder?: string;
  references?: string;
  warnings: string[];
  section_notes?: Record<string, string>;
  ai_enhanced?: boolean;
  success: boolean;
  metadata_only?: boolean;
};

export interface ExtractDocumentOptions {
  metadataOnly?: boolean;
  useAi?: boolean;
}

export async function extractDocument(
  file: File,
  options: ExtractDocumentOptions = {}
): Promise<ExtractedManuscript> {
  const metadataOnly = options.metadataOnly ?? false;
  const useAi = options.useAi ?? true;
  const params = new URLSearchParams({
    metadata_only: metadataOnly ? "1" : "0",
    use_ai: useAi ? "1" : "0",
  });
  const form = new FormData();
  form.append("document", file);
  const { data } = await api.post<ExtractedManuscript>(
    `/publications/extract_document/?${params.toString()}`,
    form
  );
  return data;
}

export async function uploadDocumentWithExtract(
  publicationId: number,
  file: File,
  merge = true
): Promise<{ extracted: ExtractedManuscript; merged_fields?: string[] }> {
  const form = new FormData();
  form.append("document", file);
  const { data } = await api.post(
    `/publications/${publicationId}/upload_document/?extract=1&merge=${merge ? "1" : "0"}&use_ai=1`,
    form
  );
  return data;
}

export const EXTRACT_SECTION_LABELS: Record<string, string> = {
  title: "Title",
  abstract: "Abstract",
  keywords: "Keywords",
  introduction: "Introduction",
  methods: "Methods",
  results: "Results",
  findings: "Findings",
  conclusion: "Conclusion",
  funder: "Funding",
  references: "References",
};
