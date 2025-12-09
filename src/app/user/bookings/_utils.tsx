// src/app/user/bookings/_utils.ts
"use client";

import * as React from "react";

/** ----------------------------- Formatting ----------------------------- */

export const formatVND = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(n)
        .replace(/\s?₫$/, " VNĐ")
    : "—";

export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";

/** ---------------------------- Image picking --------------------------- */

/** Lấy ảnh đại diện của tour trong một booking (hỗ trợ nhiều shape dữ liệu) */
/** Lấy ảnh đại diện cho booking từ nhiều kiểu dữ liệu khác nhau */

/** Lấy ảnh đại diện cho booking từ nhiều kiểu dữ liệu khác nhau */
export const pickBookingImage = (b: any): string => {
  // Lấy object tour từ booking
  const tour: any =
    (b?.tourId && typeof b.tourId === "object" ? b.tourId : null) ??
    (b?.tour && typeof b.tour === "object" ? b.tour : null) ??
    {};

  // Ưu tiên danh sách ảnh
  const imgs: string[] = Array.isArray(tour?.images)
    ? (tour.images as string[]).filter((x) => typeof x === "string" && x.trim() !== "")
    : [];

  if (imgs.length > 0) {
    // chọn pseudo-random để phân tán ảnh
    const seed = String(tour?._id ?? b?.tourId ?? b?.code ?? "");
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return imgs[hash % imgs.length];
  }

  // ✅ Nếu không có images → thử các trường khác có khả năng chứa ảnh
  const candidates = [
    tour?.cover,
    tour?.image,
    tour?.banner,
    tour?.thumbnail,
    b?.tourImage,
    b?.image,
    b?.cover,
  ].filter((v): v is string => typeof v === "string" && v.trim() !== "");

  if (candidates.length > 0) return candidates[0] as string;

  // ✅ Nếu vẫn không có → quét toàn object tìm URL có đuôi ảnh
  const allValues: string[] = [
    ...Object.values(tour ?? {}),
    ...Object.values(b ?? {}),
  ]
    .filter((v): v is string => typeof v === "string")
    .filter((v) => /\.(jpg|jpeg|png|webp|avif)$/i.test(v));

  if (allValues.length > 0) return allValues[0];

  // fallback cuối
  return "/hot1.jpg";
};

/** ----------------------------- Classifiers ---------------------------- */

export type BookingTab = "all" | "pending" | "upcoming" | "done" | "canceled";

/** Phân loại booking theo tab dùng cho UI lọc */
export function classifyBooking(b: any): BookingTab {
  const st = b?.bookingStatus; // 'p' | 'c' | 'x'
  if (st === "x") return "canceled";
  if (st === "c") return "done";

  // Nếu đang pending nhưng đã có tiền (cọc) và chưa đến ngày start -> "Sắp khởi hành"
  const paidSome = Number(b?.paidAmount || 0) > 0 || Boolean(b?.depositPaid);
  const start = b?.tourId?.startDate || b?.tour?.startDate;
  const startTime = start
    ? new Date(start).getTime()
    : Number.POSITIVE_INFINITY;
  if (st === "p" && paidSome && startTime > Date.now()) return "upcoming";

  return "pending";
}

/** ------------------------------ Helpers ------------------------------- */

/** Số khách tổng = NL + TE (support nhiều shape) */
export const getGuestCount = (b: any) =>
  Number(b?.numAdults || b?.guests?.adults || 0) +
  Number(b?.numChildren || b?.guests?.children || 0);

/** Số tiền còn lại phải trả */
export const getRemaining = (b: any) => {
  const total = Number(b?.totalPrice || b?.pricing?.total || 0);
  const paid = Number(b?.paidAmount || 0);
  return Math.max(0, total - paid);
};

/** Nhãn phương thức thanh toán (nếu cần hiển thị) */
export const getPaymentLabel = (b: any) => {
  const m = b?.paymentMethod || b?.payment?.method;
  switch (m) {
    case "momo":
    case "momo-payment":
      return "Thanh toán MoMo";
    case "paypal":
    case "paypal-payment":
      return "PayPal";
    case "vnpay":
    case "vnpay-payment":
      return "VNPay";
    case "office":
    case "offline":
    case "office-payment":
      return "Thanh toán tại văn phòng";
    default:
      return "Thanh toán online";
  }
};

/** ------------------------------ UI Parts ------------------------------ */

/** Chip hiển thị trạng thái (độc lập, có thể dùng ở mọi nơi) */
export function StatusChip({ booking }: { booking: any }) {
  const tab = classifyBooking(booking);

  const styles: Record<BookingTab, string> = {
    all: "bg-slate-200 text-slate-700",
    pending: "bg-amber-100 text-amber-700",
    upcoming: "bg-emerald-100 text-emerald-700",
    done: "bg-blue-100 text-blue-700",
    canceled: "bg-rose-100 text-rose-700",
  };

  const text: Record<BookingTab, string> = {
    all: "Tất cả",
    pending: "Đang chờ",
    upcoming: "Sắp khởi hành",
    done: "Hoàn thành",
    canceled: "Đã huỷ",
  };

  return (
    <span
      className={`pointer-events-none inline-flex select-none items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[tab]}`}
    >
      {text[tab]}
    </span>
  );
}
