import L from "leaflet";
import { buildPublicationChatPath } from "../../lib/publicationChat";

export const GRE_SUMMARY_REQUEST = "gre:summary-request";

export type GreSummaryRequestDetail = { publicationId: number };

/** Opens the dedicated research chat page for this publication. */
export function requestPublicationSummary(publicationId: number) {
  window.dispatchEvent(
    new CustomEvent<GreSummaryRequestDetail>(GRE_SUMMARY_REQUEST, {
      detail: { publicationId },
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

      requestPublicationSummary(pubId);
      map.closePopup();
    };

    btn.addEventListener("click", handler);
  };

  map.on("popupopen", onPopupOpen);
  return () => map.off("popupopen", onPopupOpen);
}
