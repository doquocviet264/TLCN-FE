import { useQuery } from "@tanstack/react-query";
import { getTourById, getTourDepartures, getDepartureById, type TourDetail } from "#/src/lib/tours/tour";

/** Hook chính lấy chi tiết tour theo id */
export const useGetTourById = (id?: string | number) =>
  useQuery<TourDetail, Error, TourDetail, readonly [string, string | number]>({
    queryKey: ["getTourById", id ?? ""] as const,
    queryFn: () => getTourById(id as string | number),
    enabled: !!id,
     placeholderData: (prev) => prev, // giữ dữ liệu cũ khi chuyển id
  });

/** Hook lấy danh sách lịch khởi hành của tour */
export const useGetTourDepartures = (id?: string | number) =>
  useQuery({
    queryKey: ["getTourDepartures", id ?? ""] as const,
    queryFn: () => getTourDepartures(id as string | number),
    enabled: !!id,
  });

/** Hook lấy chi tiết lịch khởi hành (kèm tourId) */
export const useGetDepartureById = (id?: string | number) =>
  useQuery({
    queryKey: ["getDepartureById", id ?? ""] as const,
    queryFn: () => getDepartureById(id as string | number),
    enabled: !!id,
  });

/** Alias để import thuận tay: `import { useTourDetail } from ...` */
export const useTourDetail = useGetTourById;

export type { TourDetail };
