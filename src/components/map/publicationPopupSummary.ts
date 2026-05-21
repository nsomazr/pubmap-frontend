import L from "leaflet";

export const GRE_SUMMARY_REQUEST = "gre:summary-request";

export type GreSummaryRequestDetail = { publicationId: number };

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

    const btn = root.querySelector<HTMLButtonElement>(".gre-popup-summary-btn");
    if (!btn) return;

    const handler = () => {
      const pubId = Number(btn.dataset.pubId);
      if (!pubId) return;

      map.closePopup();
      requestPublicationSummary(pubId);
    };

    btn.addEventListener("click", handler);
  };

  map.on("popupopen", onPopupOpen);
  return () => map.off("popupopen", onPopupOpen);
}
