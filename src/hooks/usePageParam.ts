import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/** Sync list page index (1-based) with URL search param `page`. */
export function usePageParam(resetKeys: unknown[] = []) {
  const [params, setParams] = useSearchParams();

  const page = useMemo(() => {
    const raw = parseInt(params.get("page") || "1", 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 1;
  }, [params]);

  const setPage = useCallback(
    (next: number) => {
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev);
          if (next <= 1) copy.delete("page");
          else copy.set("page", String(next));
          return copy;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  useEffect(() => {
    if (page <= 1) return;
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev);
        copy.delete("page");
        return copy;
      },
      { replace: true }
    );
    // Reset to page 1 when filters/tabs change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKeys);

  return { page, setPage };
}
