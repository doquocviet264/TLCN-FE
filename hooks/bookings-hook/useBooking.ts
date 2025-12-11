// src/hooks/bookings-hook/useBooking.ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  initBookingPayment,
  getBookingByCode,
} from "@/lib/checkout/checkoutApi";

export const bookingKeys = {
  all: ["bookings"] as const,
  mine: () => [...bookingKeys.all, "me"] as const,
  byCode: (code: string) => [...bookingKeys.all, "code", code] as const,
  detail: (code: string) => [...bookingKeys.all, "detail", code] as const,
};

export function useMyBookings(options?: {
  enabled?: boolean;
  staleTime?: number;
}) {
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => getMyBookings(),
    staleTime: options?.staleTime ?? 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useBookingDetail(
  code: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bookingKeys.detail(code),
    queryFn: () => getBookingByCode(code),
    staleTime: 60_000,
    enabled: options?.enabled ?? !!code,
  });
}

export function useInitPayment(options?: { onError?: (err: unknown) => void }) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, totalPrice }: { code: string; totalPrice: number }) =>
      initBookingPayment(code, totalPrice),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: bookingKeys.mine() });
      const url = res?.payUrl ?? res?.deeplink;
      if (url) window.location.href = url;
    },
    onError: (e) => options?.onError?.(e),
  });
}

export function useCancelBooking(options?: {
  onSuccess?: (code: string) => void;
  onError?: (error: unknown) => void;
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const key = bookingKeys.mine();
      const prev = qc.getQueryData<any[]>(key);
      if (prev)
        qc.setQueryData<any[]>(
          key,
          prev.filter((b) => b?.code !== code)
        );
      try {
        const res = await cancelBooking(code);
        if (!res?.ok) throw new Error("Hủy booking thất bại");
        return code;
      } catch (e) {
        if (prev) qc.setQueryData(key, prev);
        throw e;
      }
    },
    onSuccess: async (code) => {
      await qc.invalidateQueries({ queryKey: bookingKeys.mine() });
      options?.onSuccess?.(code);
    },
    onError: (err) => options?.onError?.(err),
  });
}
