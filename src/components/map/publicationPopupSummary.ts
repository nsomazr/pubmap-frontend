import L from "leaflet";
import { openPublicationSummaryPage } from "../../lib/publicationSummaryNav";

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

      openPublicationSummaryPage(pubId);
      map.closePopup();
    };

    btn.addEventListener("click", handler);
  };

  map.on("popupopen", onPopupOpen);
  return () => map.off("popupopen", onPopupOpen);
}
