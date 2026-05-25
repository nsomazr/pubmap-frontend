import { appNavigate } from "./appNavigate";
import { buildPublicationSummaryPath } from "./mapDeepLink";

export function openPublicationSummaryPage(publicationId: number) {
  appNavigate(buildPublicationSummaryPath(publicationId));
}
