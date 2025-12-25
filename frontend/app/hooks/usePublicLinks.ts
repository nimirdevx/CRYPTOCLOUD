/**
 * Hook for managing public share links
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMyPublicLinks,
  revokePublicLink,
} from "@/app/services/publicShareService";
import type { PublicShareListItem } from "@/app/types";

export function usePublicLinks() {
  const [publicLinks, setPublicLinks] = useState<PublicShareListItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchPublicLinks = useCallback(async () => {
    setIsFetching(true);
    setError(null);
    try {
      const links = await getMyPublicLinks();
      setPublicLinks(links);
    } catch (err: any) {
      setError(err.message || "Failed to fetch public links");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicLinks();
  }, [fetchPublicLinks]);

  const revokeLink = useCallback(
    async (token: string) => {
      setIsRevoking(true);
      setError(null);
      try {
        await revokePublicLink(token);
        // Refresh the list after revoking
        await fetchPublicLinks();
      } catch (err: any) {
        setError(err.message || "Failed to revoke link");
        throw err;
      } finally {
        setIsRevoking(false);
      }
    },
    [fetchPublicLinks]
  );

  return {
    publicLinks,
    isFetching,
    error,
    isRevoking,
    revokeLink,
    refreshLinks: fetchPublicLinks,
    setError,
  };
}
