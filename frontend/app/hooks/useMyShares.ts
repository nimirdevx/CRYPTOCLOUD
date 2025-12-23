/**
 * useMyShares Hook
 * Manages files shared by the current user
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { MyShareResponse } from "@/app/types";
import { createShareService } from "@/app/services/shareService";

export interface UseMySharesResult {
  myShares: MyShareResponse[];
  isFetching: boolean;
  error: string | null;
  isLoading: boolean;
  fetchMyShares: () => Promise<void>;
  revokeShare: (shareId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useMyShares = (): UseMySharesResult => {
  const { jwt } = useAuth();

  const [myShares, setMyShares] = useState<MyShareResponse[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch my shares
  const fetchMyShares = useCallback(async () => {
    if (!jwt) return;

    setIsFetching(true);
    setError(null);

    try {
      const service = createShareService(jwt);
      const data = await service.getSharedByMe();
      setMyShares(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch your shared files");
    } finally {
      setIsFetching(false);
    }
  }, [jwt]);

  // Revoke share
  const revokeShare = useCallback(
    async (shareId: string) => {
      if (!jwt) return;

      setIsLoading(true);
      setError(null);

      try {
        const service = createShareService(jwt);
        await service.revokeShare(shareId);
        await fetchMyShares();
      } catch (err: any) {
        setError(err.message || "Failed to unshare file");
      } finally {
        setIsLoading(false);
      }
    },
    [jwt, fetchMyShares]
  );

  // Fetch on mount
  useEffect(() => {
    fetchMyShares();
  }, [fetchMyShares]);

  return {
    myShares,
    isFetching,
    error,
    isLoading,
    fetchMyShares,
    revokeShare,
    setError,
  };
};
