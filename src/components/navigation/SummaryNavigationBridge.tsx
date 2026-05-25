import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildPublicationChatPath } from "../../lib/publicationChat";
import {
  GRE_SUMMARY_REQUEST,
  type GreSummaryRequestDetail,
} from "../map/publicationPopupSummary";

/** Routes map “Get summary” actions to the dedicated publication chat page. */
export function SummaryNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const onSummary = (event: Event) => {
      const { publicationId } = (event as CustomEvent<GreSummaryRequestDetail>).detail;
      if (!publicationId) return;
      navigate(buildPublicationChatPath(publicationId));
    };
    window.addEventListener(GRE_SUMMARY_REQUEST, onSummary);
    return () => window.removeEventListener(GRE_SUMMARY_REQUEST, onSummary);
  }, [navigate]);

  return null;
}
