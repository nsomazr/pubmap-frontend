import { useQuery } from "@tanstack/react-query";
import { fetchUnreadCounts } from "../lib/notifications";

export function useUnreadCounts(enabled = true) {
  return useQuery({
    queryKey: ["unread-counts"],
    queryFn: fetchUnreadCounts,
    enabled,
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}
