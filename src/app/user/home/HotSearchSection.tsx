"use client";

import React, { useMemo } from "react";
import CardHot, { CardHotProps } from "@/components/cards/CardHot";
import { useGetTours } from "#/hooks/tours-hook/useTours";

/* ===== helpers ===== */
const toNum = (v?: number | string) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};

const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const formatDate = (d?: string) => {
  if (!d) return undefined;
  return new Date(d).toLocaleDateString("vi-VN");
};

/* ===== skeleton card ===== */
function Skeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

// Kiểm tra tour đã khởi hành chưa
const checkIsDeparted = (startDate?: string | Date): boolean => {
  if (!startDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tourStartDate = new Date(startDate);
  tourStartDate.setHours(0, 0, 0, 0);
  return tourStartDate < today;
};

const HotSearchSection = () => {
  const { data, isLoading, isError } = useGetTours(1, 12);
  const list = data?.data ?? [];

  // Lọc bỏ các tour đã khởi hành
  const activeTours = useMemo(() => {
    return list.filter((t) => {
      const startDateRaw = (t as any).startDate ?? (t as any).start_date;
      return !checkIsDeparted(startDateRaw);
    });
  }, [list]);

  const cards: CardHotProps[] = useMemo(
    () =>
      activeTours.map((t) => {
        const id = (t as any)._id ?? (t as any).id ?? "";
        const slug = (t as any).destinationSlug ?? slugify(t.title);
        const href = `/user/destination/${slug}/${id}`;

        const originalPrice = toNum((t as any).priceAdult);
        const salePrice = toNum((t as any).salePrice);

        const image =
          (Array.isArray((t as any).images) && (t as any).images[0]) ||
          (t as any).image ||
          (t as any).cover ||
          "/hot1.jpg";

        const startDateRaw = (t as any).startDate ?? (t as any).start_date;

        return {
          title: t.title,
          image,
          href,
          originalPrice,
          salePrice,
          discountPercent: (t as any).discountPercent,
          discountAmount: (t as any).discountAmount,

          time: (t as any).time ?? undefined,
          destination: (t as any).destination ?? undefined,
          seats: (t as any).quantity ?? (t as any).seats,
          schedule: startDateRaw
            ? `Khởi hành: ${formatDate(startDateRaw)}`
            : undefined,
          badgeText: (t as any).discountPercent
            ? `Giảm ${(t as any).discountPercent}%`
            : undefined,
          startDate: startDateRaw,
        } as CardHotProps;
      }),
    [activeTours]
  );

  return (
    <section className="bg-slate-50 px-4 pb-14 pt-10">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Tour được yêu thích
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
            Tour nổi bật hiện nay
          </h2>
          {cards.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              Khám phá {cards.length} hành trình được nhiều khách lựa chọn.
            </p>
          )}
        </div>

        {/* Error */}
        {isError && !isLoading && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            Không tải được danh sách tour. Vui lòng thử lại sau.
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`sk-${i}`} />
            ))}

          {!isLoading && !isError && cards.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500 text-sm">
              Hiện chưa có tour phù hợp để hiển thị.
            </div>
          )}

          {!isLoading &&
            !isError &&
            cards.map((t) => <CardHot key={`${t.title}-${t.href}`} {...t} />)}
        </div>
      </div>
    </section>
  );
};

export default HotSearchSection;
