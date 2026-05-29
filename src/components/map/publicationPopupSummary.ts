import L from "leaflet";
import { safeMapOff, safeMapOp } from "../../lib/safeLeaflet";

export const GRE_SUMMARY_REQUEST = "gre:summary-request";

export type GreSummaryRequestDetail = {
  publicationId: number;
  encodedId?: string | null;
};

/** Opens the research assistant page for this publication (summary auto-generates on load). */
export function requestPublicationSummary(
  publicationId: number,
  encodedId?: string | null
) {
  window.dispatchEvent(
    new CustomEvent<GreSummaryRequestDetail>(GRE_SUMMARY_REQUEST, {
      detail: { publicationId, encodedId },
    })
  );
}

export function attachPublicationPopupSummary(map: L.Map): () => void {
  const onPopupOpen = (e: L.PopupEvent) => {
    const root = e.popup.getElement();
    if (!root) return;

    const btn = root.querySelector<HTMLAnchorElement>(".gre-popup-summary-btn");
    if (!btn) return;

    const handler = (event: Event) => {
      event.preventDefault();
      const pubId = Number(btn.dataset.pubId);
      if (!pubId) return;
      const encodedId = btn.dataset.pubEncoded?.trim() || null;

      requestPublicationSummary(pubId, encodedId);
      safeMapOp(map, (m) => m.closePopup());
    };

    btn.addEventListener("click", handler);
  };

  safeMapOp(map, (m) => m.on("popupopen", onPopupOpen));
  return () => safeMapOff(map, "popupopen", onPopupOpen);
}
