import type { ReactNode } from "react";
import { GreAdPlacement } from "../ads/GreAdSlot";
import { PublicationAuthorsSidebar } from "./PublicationAuthorsSidebar";
import { PublicationMobileActionBar } from "./PublicationMobileActionBar";
import type { Publication } from "../../types";

type AdContext = {
  categoryId?: number;
  subCategoryId?: number;
  location?: string;
  affiliation?: string;
  title?: string;
};

interface Props {
  publication: Publication;
  adContext: AdContext;
  publicationTitle: string;
  children: ReactNode;
}

/** Publication detail layout: paper first on mobile, sidebar on desktop, sticky actions on phones. */
export function PublicationViewShell({
  publication,
  adContext,
  publicationTitle,
  children,
}: Props) {
  return (
    <div className="publication-view pb-24 lg:pb-0">
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
        <div className="min-w-0 space-y-5">{children}</div>

        <aside className="hidden space-y-6 lg:block">
          <PublicationAuthorsSidebar publication={publication} />
          <GreAdPlacement placement="sidebar" limit={4} rotate context={adContext} />
          <GreAdPlacement
            placement="sponsored_publication"
            limit={4}
            rotate
            context={adContext}
            className="mt-4 space-y-3"
          />
        </aside>
      </div>

      <PublicationMobileActionBar
        publicationId={publication.id}
        encodedId={publication.encoded_id}
        publicationTitle={publicationTitle}
      />
    </div>
  );
}
