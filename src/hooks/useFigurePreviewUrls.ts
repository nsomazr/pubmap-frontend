import { useEffect, useState } from "react";
import api from "../lib/api";
import { mediaUrl } from "../lib/mediaUrl";
import {
  fetchFigureImageBlob,
  resolveFigureImageSrc,
  type PublicationFigure,
} from "../lib/publicationGre";

type PublicationIdRef = number | string;

/**
 * Loads figure thumbnails via authenticated API (reliable for drafts)
 * with media URL fallback for legacy paths.
 */
export function useFigurePreviewUrls(
  figures: PublicationFigure[],
  publicationId: PublicationIdRef,
  encodedPublicationId?: string | null
): Record<number, string> {
  const [urls, setUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    const load = async () => {
      const next: Record<number, string> = {};
      await Promise.all(
        figures.map(async (fig) => {
          if (!fig.id) return;
          let resolved = "";
          const targetPublicationId = publicationId || fig.publication || 0;
          if (targetPublicationId && fig.id > 0) {
            try {
              const blob = await fetchFigureImageBlob(
                targetPublicationId,
                fig.id,
                encodedPublicationId
              );
              const objectUrl = URL.createObjectURL(blob);
              objectUrls.push(objectUrl);
              resolved = objectUrl;
            } catch {
              /* try fallbacks */
            }
          }
          if (!resolved) {
            resolved = resolveFigureImageSrc(
              fig,
              targetPublicationId || fig.publication || 0,
              encodedPublicationId
            ) || "";
          }
          if (!resolved) {
            const remote = fig.photo_url?.trim();
            resolved = mediaUrl(fig.photo) || mediaUrl(remote) || "";
          }
          next[fig.id] = resolved;
        })
      );
      if (!cancelled) setUrls(next);
    };

    void load();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [figures, publicationId, encodedPublicationId]);

  return urls;
}
