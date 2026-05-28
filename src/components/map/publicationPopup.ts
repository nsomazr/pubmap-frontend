import type { Publication } from "../../types";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { assets } from "../../lib/brand";
import { resolveProfilePhotoSrc } from "../../lib/profilePhoto";
import { publicationSubcategoryVisual } from "../../lib/taxonomyVisuals";
import { userInitials } from "../../lib/userDisplay";

export type PublicationPopupVariant = "default" | "detail";

export function buildPublicationPopupHtml(
  pub: Publication,
  options?: { variant?: PublicationPopupVariant }
) {
  const author =
    pub.author?.full_name ||
    `${pub.author?.firstname ?? ""} ${pub.author?.lastname ?? ""}`.trim();
  const authorPhoto = resolveProfilePhotoSrc(
    pub.author?.photo,
    pub.author?.updated_at
  );
  const initials = userInitials(pub.author);
  const views = pub.views_count ?? 0;
  const downloads = pub.downloads_count ?? 0;
  const subVisual = publicationSubcategoryVisual(pub);

  const avatarHtml = authorPhoto
    ? `<span class="gre-popup-avatar-wrap">
        <img class="gre-popup-avatar" src="${escapeAttr(authorPhoto)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false;" />
        <span class="gre-popup-avatar gre-popup-avatar--initials" hidden>${escapeHtml(initials)}</span>
      </span>`
    : `<span class="gre-popup-avatar gre-popup-avatar--initials">${escapeHtml(initials)}</span>`;

  const subcategoryHtml = subVisual
    ? `<div class="gre-popup-subcategory" style="--accent:${escapeAttr(subVisual.accent_color)}">
        <span class="gre-popup-subcategory-dot"></span>
        <span>${escapeHtml(subVisual.name)}</span>
      </div>`
    : "";
  const publicationPath = `/publication/${escapeAttr(pub.encoded_id || String(pub.id))}`;
  const publicationChatPath = `${publicationPath}/chat`;

  const viewLink =
    options?.variant === "detail"
      ? ""
      : `<a href="${publicationPath}" class="gre-popup-link">View publication</a>`;

  return `
    <div class="gre-popup-inner">
      <div class="gre-popup-head">
        ${avatarHtml}
        <div class="gre-popup-head-text">
          <div class="gre-popup-logo">
            <img src="${assets.logo}" alt="" />
          </div>
          ${subcategoryHtml}
          <h3 class="gre-popup-title">${escapeHtml(formatGrePaperTitle(pub.title, pub.short_number))}</h3>
          <p class="gre-popup-author">${escapeHtml(author)}</p>
        </div>
      </div>
      <div class="gre-popup-stats">
        <span class="gre-popup-stat">
          <svg class="gre-popup-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          ${views}
        </span>
        <span class="gre-popup-stat">
          <svg class="gre-popup-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
          ${downloads}
        </span>
      </div>
      <div class="gre-popup-actions">
        <a href="${publicationChatPath}" class="gre-popup-summary-btn" data-pub-id="${pub.id}">
          Get summary
        </a>
        ${viewLink}
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
