import { RichTextEditor } from "../editor/RichTextEditor";
import { Input } from "../ui/Input";

export type ManuscriptFields = {
  abstract: string;
  introduction: string;
  methods: string;
  results: string;
  findings: string;
  conclusion: string;
  funder: string;
  references: string;
  keywords: string;
};

interface Props {
  fields: ManuscriptFields;
  onChange: (key: keyof ManuscriptFields, value: string) => void;
}

export function ManuscriptSectionsEditor({ fields, onChange }: Props) {
  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
        <strong className="text-slate-700">Results</strong> should list factual outcomes.{" "}
        <strong className="text-slate-700">Findings / discussion</strong> holds interpretation. After
        AI extraction, review Methods especially; it is often missed in PDFs.
      </p>
      <RichTextEditor
        label="Abstract"
        value={fields.abstract}
        onChange={(v) => onChange("abstract", v)}
        minHeight={140}
        required
      />
      <RichTextEditor
        label="Introduction"
        value={fields.introduction}
        onChange={(v) => onChange("introduction", v)}
      />
      <Input
        label="Keywords"
        value={fields.keywords}
        onChange={(e) => onChange("keywords", e.target.value)}
        placeholder="climate, remote sensing, East Africa (comma-separated)"
      />
      <RichTextEditor
        label="Methods"
        value={fields.methods}
        onChange={(v) => onChange("methods", v)}
      />
      <RichTextEditor
        label="Results"
        value={fields.results}
        onChange={(v) => onChange("results", v)}
      />
      <RichTextEditor
        label="Findings / discussion"
        value={fields.findings}
        onChange={(v) => onChange("findings", v)}
      />
      <RichTextEditor
        label="Conclusion"
        value={fields.conclusion}
        onChange={(v) => onChange("conclusion", v)}
      />
      <Input
        label="Funder / acknowledgements"
        value={fields.funder}
        onChange={(e) => onChange("funder", e.target.value)}
      />
      <RichTextEditor
        label="References"
        value={fields.references}
        onChange={(v) => onChange("references", v)}
        minHeight={120}
      />
    </div>
  );
}
