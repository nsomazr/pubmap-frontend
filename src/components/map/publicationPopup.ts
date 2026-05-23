import type { Publication } from "../../types";
import { assets } from "../../lib/brand";
import { effectiveProfilePhoto } from "../../lib/profilePhoto";
import { mediaUrl } from "../../lib/mediaUrl";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { userInitials } from "../../lib/userDisplay";

export function buildPublicationPopupHtml(pub: Publication): string {
  const author =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const authorPhotoRaw = effectiveProfilePhoto(pub.author?.photo);
  const authorPhoto = authorPhotoRaw ? mediaUrl(authorPhotoRaw) : null;
  const initials = userInitials(pub.author);
  const views = pub.views_count ?? 0;
  const downloads = pub.downloads_count ?? 0;
  const subVisual = publicationSubcategoryVisual(pub);

  const avatarHtml = authorPhoto
    ? `<img class="gre-popup-avatar" src="${escapeAttr(authorPhoto)}" alt="" />`
    : `<span class="gre-popup-avatar gre-popup-avatar--initials">${escapeHtml(initials)}</span>`;

  const subcategoryHtml = subVisual
    ? `<div class="gre-popup-subcategory" style="--accent:${escapeAttr(subVisual.accent_color)}">
        <span class="gre-popup-subcategory-dot"></span>
        <span>${escapeHtml(subVisual.name)}</span>
      </div>`
    : "";

  return `
    <div class="gre-popup-inner">
      <div class="gre-popup-head">
        ${avatarHtml}
        <div class="gre-popup-head-text">
          <div class="gre-popup-logo">
            <img src="${assets.logo}" alt="" />
          </div>
          ${subcategoryHtml}
          <h3 class="gre-popup-title">${escapeHtml(pub.title)}</h3>
          <p class="gre-popup-author">${escapeHtml(author)}</p>
        </div>
      </div>
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

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}
