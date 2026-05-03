// src/hooks/tours-hook/useTours.ts
import { useQuery } from "@tanstack/react-query";
import { getTours, searchTours, type ToursResponse, type ToursQuery } from "#/src/lib/tours/tour";

/** Hook danh sách tour có phân trang & query */
export const useGetTours = (page = 1, limit = 12, query?: ToursQuery) =>
  useQuery<ToursResponse, Error, ToursResponse, readonly [string, number, number, ToursQuery | undefined]>({
    queryKey: ["getTours", page, limit, query] as const,
    queryFn: () => {
      // Nếu có query từ filters đặc biệt
      if (query && (query.budgetMin !== undefined || query.from || query.q || query.destination || query.time)) {
         return searchTours(page, limit, query);
      }
      return getTours(page, limit, query);
    },
    placeholderData: (prev) => prev,       // giữ data cũ khi đổi trang
    staleTime: 30_000,
  });
