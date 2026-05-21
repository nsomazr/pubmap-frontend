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
  success: boolean;
  metadata_only?: boolean;
};

export async function extractDocument(
  file: File,
  metadataOnly = true
): Promise<ExtractedManuscript> {
  const form = new FormData();
  form.append("document", file);
  const { data } = await api.post<ExtractedManuscript>(
    `/publications/extract_document/?metadata_only=${metadataOnly ? "1" : "0"}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
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
    `/publications/${publicationId}/upload_document/?extract=1&merge=${merge ? "1" : "0"}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}
