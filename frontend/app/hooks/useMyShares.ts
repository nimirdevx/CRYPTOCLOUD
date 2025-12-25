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
  currentPage: number;
  totalPages: number;
  totalItems: number;
  fetchMyShares: (page?: number) => Promise<void>;
  goToPage: (page: number) => void;
  revokeShare: (shareId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useMyShares = (): UseMySharesResult => {
  const { jwt } = useAuth();

  const [myShares, setMyShares] = useState<MyShareResponse[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 50;

  // Fetch my shares
  const fetchMyShares = useCallback(
    async (page: number = 1) => {
      if (!jwt) return;

      setIsFetching(true);
      setError(null);

      try {
        const service = createShareService(jwt);
        const data = await service.getSharedByMe(page, pageSize);
        setMyShares(data.items);
        setCurrentPage(data.page);
        setTotalPages(data.total_pages);
        setTotalItems(data.total);
      } catch (err: any) {
        setError(err.message || "Failed to fetch your shared files");
      } finally {
        setIsFetching(false);
      }
    },
    [jwt]
  );

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

  // Go to specific page
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        fetchMyShares(page);
      }
    },
    [totalPages, fetchMyShares]
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
    currentPage,
    totalPages,
    totalItems,
    fetchMyShares,
    goToPage,
    revokeShare,
    setError,
  };
};
