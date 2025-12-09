"use client";

import React, { useMemo } from "react";
import DestinationCard from "@/components/cards/DestinationCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useGetTours } from "#/hooks/tours-hook/useTours";

import "swiper/css";
import "swiper/css/autoplay";

/* === helpers === */
const toNum = (v?: number | string) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};

const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      })
        .format(n)
        .replace(/\s?₫$/, " VNĐ")
    : "—";

// Hàm tạo slug an toàn cho URL (Ví dụ: "Tour Cần Thơ" -> "tour-can-tho")
const slugify = (s = "") =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* === skeleton card === */
function SkeletonCard() {
  return (
    <div className="h-full rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-6 w-1/3 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

const HotDestinations = () => {
  const { data, isLoading, isError } = useGetTours();

  const list: any[] = useMemo(() => {
    if (Array.isArray((data as any)?.data)) return (data as any).data as any[];
    if (Array.isArray(data as any)) return data as any as any[];
    return [];
  }, [data]);

  const cards = useMemo(
    () =>
      list.slice(0, 12).map((t) => {
        const price = toNum(t.salePrice ?? t.priceAdult);
        const image =
          (Array.isArray(t.images) && t.images[0]) ||
          t.image ||
          t.cover ||
          "/hot1.jpg";

        // Tạo slug và id
        const slug = t.destinationSlug || slugify(t.title);
        const id = t._id || t.id;

        return {
          title: t.title,
          duration: t.time ?? "—",
          price: vnd(price),
          image,
          // 👇 Tạo đường dẫn chi tiết tại đây
          href: `/user/destination/${slug}/${id}`,
        };
      }),
    [list]
  );

  return (
    <section className="py-14 sm:py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide text-[#144d7e] mb-8">
          TOUR NỔI BẬT TRONG THÁNG
        </h2>

        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
          grabCursor
          spaceBetween={16}
          breakpoints={{
            0: { slidesPerView: 1.1, spaceBetween: 12 },
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 18 },
            1280: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="!pb-8"
        >
          {/* Loading */}
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <SwiperSlide key={`s-${i}`} className="!h-auto">
                <SkeletonCard />
              </SwiperSlide>
            ))}

          {/* Error fallback */}
          {isError && !isLoading && (
            <SwiperSlide className="!h-auto">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                Không tải được danh sách tour. Vui lòng thử lại sau.
              </div>
            </SwiperSlide>
          )}

          {/* Data */}
          {!isLoading &&
            !isError &&
            cards.map((c, idx) => (
              <SwiperSlide key={`${c.title}-${idx}`} className="!h-auto">
                <DestinationCard {...c} />
              </SwiperSlide>
            ))}
        </Swiper>
      </div>
    </section>
  );
};

export default HotDestinations;
