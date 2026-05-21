import { Textarea } from "../ui/Textarea";
import { Input } from "../ui/Input";
import { CategorySubcategoryPicker } from "../forms/CategorySubcategoryPicker";
import type { Category } from "../../types";
import { abstractPlainText } from "../../lib/abstractText";

interface Props {
  title: string;
  abstract: string;
  categoryId: string;
  subCategoryId: string;
  categories: Category[];
  onTitleChange: (v: string) => void;
  onAbstractChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onSubCategoryChange: (v: string) => void;
}

/** Metadata fields shown for PDF upload submissions (search + review). */
export function PdfSubmissionFields({
  title,
  abstract,
  categoryId,
  subCategoryId,
  categories,
  onTitleChange,
  onAbstractChange,
  onCategoryChange,
  onSubCategoryChange,
}: Props) {
  const abstractDisplay = abstractPlainText(abstract) || abstract;

  return (
    <div className="space-y-4">
      <Input label="Title" value={title} onChange={(e) => onTitleChange(e.target.value)} required />
      <Textarea
        label="Abstract"
        value={abstractDisplay}
        onChange={(e) => onAbstractChange(e.target.value)}
        rows={6}
        required
        placeholder="Shown in search results. Extracted from your PDF or type manually."
      />
      <CategorySubcategoryPicker
        categories={categories}
        categoryId={categoryId}
        subCategoryId={subCategoryId}
        onCategoryChange={onCategoryChange}
        onSubCategoryChange={onSubCategoryChange}
        required
      />
    </div>
  );
}
