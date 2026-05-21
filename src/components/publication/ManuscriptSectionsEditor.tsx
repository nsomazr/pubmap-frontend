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
};

interface Props {
  fields: ManuscriptFields;
  onChange: (key: keyof ManuscriptFields, value: string) => void;
}

export function ManuscriptSectionsEditor({ fields, onChange }: Props) {
  return (
    <div className="space-y-5">
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
