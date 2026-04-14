"use client";

import { useCallback, useMemo, useState } from "react";

interface UsePaginationParams<T> {
  items: T[];
  pageSize?: number;
  resetPageKey?: unknown;
}

export function usePagination<T>({
  items,
  pageSize = 10,
  resetPageKey,
}: UsePaginationParams<T>) {
  const [pageState, setPageState] = useState({ page: 1, pageSize, resetPageKey });
  const page =
    pageState.pageSize === pageSize && pageState.resetPageKey === resetPageKey
      ? pageState.page
      : 1;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const setPage = useCallback(
    (nextPage: number) => {
      setPageState({
        page: Math.min(Math.max(1, nextPage), totalPages),
        pageSize,
        resetPageKey,
      });
    },
    [pageSize, resetPageKey, totalPages],
  );

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePage]);

  return {
    page: safePage,
    setPage,
    pageSize,
    totalPages,
    paginatedItems,
  };
}
