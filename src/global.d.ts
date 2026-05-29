/** CDN globals (CKEditor classic + super-build, DOMPurify) */

interface CkEditorInstance {
  getData: () => string;
  setData: (data: string) => void;
  destroy: () => Promise<void>;
  enableReadOnlyMode: (lockId: string) => void;
  disableReadOnlyMode: (lockId: string) => void;
  model: {
    document: {
      on: (event: string, cb: () => void) => void;
    };
  };
}

interface Window {
  CKEDITOR?: Record<string, unknown> & {
    ClassicEditor?: {
      create: (
        element: HTMLElement,
        config?: Record<string, unknown>
      ) => Promise<CkEditorInstance>;
    };
  };
  ClassicEditor?: {
    create: (
      element: HTMLElement,
      config?: Record<string, unknown>
    ) => Promise<CkEditorInstance>;
  };
  DOMPurify?: {
    sanitize: (html: string, config?: Record<string, unknown>) => string;
  };
}
