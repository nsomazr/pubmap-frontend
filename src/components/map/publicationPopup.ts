import type { Publication } from "../../types";
import { assets } from "../../lib/brand";

export function buildPublicationPopupHtml(pub: Publication): string {
  const author =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const views = pub.views_count ?? 0;
  const downloads = pub.downloads_count ?? 0;

  return `
    <div class="gre-popup-inner">
      <div class="gre-popup-logo">
        <img src="${assets.logo}" alt="" />
      </div>
      <h3 class="gre-popup-title">${escapeHtml(pub.title)}</h3>
      <p class="gre-popup-author">${escapeHtml(author)}</p>
      <div class="gre-popup-stats">
        <span>👁 ${views}</span>
        <span>⬇ ${downloads}</span>
      </div>
      <div class="gre-popup-actions">
        <button type="button" class="gre-popup-summary-btn" data-pub-id="${pub.id}">
          Get summary
        </button>
        <a href="/publication/${pub.id}" class="gre-popup-link">View publication</a>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
