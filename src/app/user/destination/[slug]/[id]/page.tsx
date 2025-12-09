"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useEffect } from "react";
import { useChatStore } from "#/stores/chatStore";
// Optional: npm i framer-motion
import { motion } from "framer-motion";

import { useGetTourById } from "#/hooks/tours-hook/useTourDetail";
import { useGetTours } from "#/hooks/tours-hook/useTours";
import { useGetTourReviews, useCreateReview } from "#/hooks/reviews-hook/useReviews";
import { useAuthStore } from "#/stores/auth";
import { getUserToken } from "@/lib/auth/tokenManager";
import CardHot from "@/components/cards/CardHot";
import { toast } from "react-hot-toast";

/* ============ helpers ============ */
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
        .replace(/\s?₫$/, "VNĐ")
    : "—";

const extractDays = (time?: string) => {
  if (!time) return 1;
  const m = time.match(/(\d+)\s*ngày/i);
  return m ? Math.max(1, Number.parseInt(m[1], 10)) : 1;
};
const getSeatsValue = (raw: any): number | string | undefined => {
  if (raw == null) return undefined;

  // nếu BE chơi kiểu [{ value: 36 }]
  if (Array.isArray(raw)) {
    const first = raw[0] as any;
    if (!first) return undefined;
    if (typeof first === "object" && first !== null && "value" in first) {
      return first.value as any;
    }
    return String(first);
  }

  return raw as any;
};
/* ============ tiny UI ============ */
function StarRating({
  value = 4.6,
  count = 128,
}: {
  value?: number;
  count?: number;
}) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const fill =
          idx <= full
            ? "text-amber-500"
            : idx === full + 1 && half
            ? "text-amber-500"
            : "text-slate-300";
        return (
          <svg
            key={i}
            className={`h-5 w-5 ${fill}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
      <span className="ml-2 text-sm text-slate-500">
        {value.toFixed(1)} · {count} đánh giá
      </span>
    </div>
  );
}

const Chevron: React.FC<{ open?: boolean }> = ({ open }) => (
  <svg
    className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

type DayItem = { title: string; content?: React.ReactNode };
function DaysAccordion({ items }: { items: DayItem[] }) {
  const [open, setOpen] = React.useState(0);
  return (
    <div className="mt-6 space-y-3">
      {items.map((it, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={idx}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : idx)}
              className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left ${
                isOpen ? "bg-emerald-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl font-semibold ${
                    isOpen
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="font-semibold text-slate-900">{it.title}</span>
              </div>
              <span
                className={`${isOpen ? "text-emerald-600" : "text-slate-500"}`}
              >
                <Chevron open={isOpen} />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-[15px] leading-relaxed text-slate-800">
                  {it.content ?? (
                    <p className="text-slate-500">
                      Lịch trình sẽ được cập nhật chi tiết.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============ Page ============ */
export default function TourDetailPage() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: tour, isLoading, isError } = useGetTourById(id);
  const { data: recRaw } = useGetTours();

  // Reviews
  const { data: reviewsData, isLoading: reviewsLoading } = useGetTourReviews(id);
  const createReviewMutation = useCreateReview();
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  // Auth
  const { token } = useAuthStore();
  const accessToken = token?.accessToken || getUserToken();
  const isLoggedIn = !!accessToken;

  const priceAdult = toNum(tour?.priceAdult);
  const priceChild = toNum(tour?.priceChild);

  const gallery = useMemo(() => {
    const imgs = [
      ...(tour?.images ?? []),
      ...(tour?.image ? [tour.image] : []),
      ...(tour?.cover ? [tour.cover] : []),
    ].filter(Boolean) as string[];
    if (!imgs.length)
      return ["/hot1.jpg", "/hot1.jpg", "/hot1.jpg", "/hot1.jpg", "/hot1.jpg"];
    const uniq = [...new Set(imgs)];
    while (uniq.length < 5) uniq.push(uniq[uniq.length - 1]);
    return uniq.slice(0, 5);
  }, [tour]);

  const related = useMemo(() => {
    const list: any[] = Array.isArray((recRaw as any)?.data)
      ? (recRaw as any).data
      : Array.isArray(recRaw)
      ? (recRaw as any[])
      : [];
    return list.filter((t) => t._id !== tour?._id).slice(0, 3);
  }, [recRaw, tour]);

  const days = extractDays(tour?.time);
  const { openChat } = useChatStore();
  const tourImage =
    tour?.images?.[0] || tour?.image || tour?.cover || "/hot1.jpg";
  const tourPrice = priceAdult ? vnd(priceAdult) : "Liên hệ";
  const handleConsult = () => {
    openChat({
      id: String(tour?._id || id),
      title: tour?.title || "Tour du lịch",
      image: tourImage,
      price: tourPrice,
    });
  };
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <p className="mt-4 text-sm text-slate-600">
            Đang tải thông tin tour…
          </p>
        </div>
      </div>
    );
  }
  if (isError || !tour)
    return (
      <div className="mx-auto max-w-6xl px-5 py-12">
        Không tải được chi tiết tour.
      </div>
    );

  const rating = Number(tour.rating ?? 4.6);

  return (
    <div className="min-h-screen bg-white">
      {/* ===== Top bar ===== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <nav className="mb-2 text-sm">
            <ol className="flex items-center gap-2 text-slate-500">
              <li>
                <Link href="/" className="hover:text-emerald-600">
                  Trang chủ
                </Link>
              </li>
              <li aria-hidden>
                <svg
                  className="h-4 w-4 text-slate-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </li>
              <li className="text-slate-900">Chi tiết tour</li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 111.314 0z"
                />
                <path
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-base font-semibold">
                {tour.destination ?? "Điểm đến"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  navigator.clipboard?.writeText(window.location.href)
                }
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-emerald-600 hover:text-emerald-700"
              >
                <i className="i-tabler-share-3 h-5 w-5" aria-hidden />
                Chia sẻ
              </button>
              <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-amber-500 hover:text-amber-600">
                <i className="i-tabler-heart h-5 w-5" aria-hidden />
                Yêu thích
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Gallery ===== */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="grid gap-3 md:grid-cols-4"
          >
            <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 md:aspect-auto">
              <Image
                src={gallery[0] || "/hot1.jpg"}
                alt={`${tour.title} #1`}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>
            {gallery.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
              >
                <Image
                  src={img || "/hot1.jpg"}
                  alt={`${tour.title} #${i + 2}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Title & meta ===== */}
      <section className="py-6">
        <div className="mx-auto max-w-7xl px-5">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                {tour.title ?? "Tour"}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <StarRating value={rating} count={tour.reviewsCount ?? 128} />
                <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg
                    className="h-5 w-5 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{tour.time ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Content & Booking ===== */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            {/* left */}
            <div className="space-y-8">
              {/* Description */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-4 flex items-center gap-3 text-2xl font-bold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Khám phá Tours
                </h3>
                <div className="prose prose-slate max-w-none text-[15px] leading-relaxed">
                  {tour.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: tour.description }}
                    />
                  ) : (
                    <p className="text-slate-500">
                      Đang cập nhật mô tả chi tiết cho tour này.
                    </p>
                  )}
                </div>
              </div>

              {/* Includes/Excludes */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h5 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <svg
                      className="h-6 w-6 text-[var(--primary)]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Bao gồm
                  </h5>
                  <ul className="space-y-2 text-[15px] text-slate-800">
                    {(Array.isArray((tour as any).includes) && (tour as any).includes.length > 0
                      ? (tour as any).includes
                      : [
                          "Xe đưa đón theo chương trình",
                          "Khách sạn tiêu chuẩn",
                          "Các bữa ăn theo chương trình",
                          "Hướng dẫn viên nhiệt tình",
                          "Vé tham quan các điểm",
                          "Bảo hiểm du lịch",
                        ]
                    ).map((txt: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--primary)]"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h5 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <svg
                      className="h-6 w-6 text-slate-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Không bao gồm
                  </h5>
                  <ul className="space-y-2 text-[15px] text-slate-600">
                    {(Array.isArray((tour as any).excludes) && (tour as any).excludes.length > 0
                      ? (tour as any).excludes
                      : [
                          "Chi phí cá nhân",
                          "Tiền tip cho HDV và tài xế",
                          "Đồ uống trong bữa ăn",
                          "Phụ thu phòng đơn",
                          "Các dịch vụ không nêu trong chương trình",
                        ]
                    ).map((txt: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Itinerary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-2 flex items-center gap-3 text-2xl font-bold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      />
                    </svg>
                  </div>
                  Lịch trình chi tiết
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Khám phá từng ngày trong hành trình của bạn
                </p>
                <DaysAccordion
                  items={
                    Array.isArray(tour.itinerary) && tour.itinerary.length > 0
                      ? tour.itinerary.map((day: any, i: number) => ({
                          title: day.title || `Ngày ${i + 1} – ${tour.destination ?? "Hành trình"}`,
                          content: (
                            <div className="prose prose-slate max-w-none text-[15px]">
                              {day.description ? (
                                <div dangerouslySetInnerHTML={{ __html: day.description }} />
                              ) : Array.isArray(day.activities) && day.activities.length > 0 ? (
                                <ul className="space-y-2">
                                  {day.activities.map((act: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      <span>{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-slate-500">Chi tiết sẽ được cập nhật.</p>
                              )}
                            </div>
                          ),
                        }))
                      : Array.from({ length: days }).map((_, i) => ({
                          title: `Ngày ${i + 1} – ${tour.destination ?? tour.title ?? "Hành trình"}`,
                          content: (
                            <ul className="space-y-2">
                              {[
                                "Đón khách • Check-in • Khởi hành",
                                "Tham quan điểm chính trong ngày",
                                "Ăn trưa/ăn tối tại nhà hàng địa phương",
                                "Về khách sạn nghỉ đêm",
                              ].map((txt) => (
                                <li key={txt} className="flex items-start gap-2">
                                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{txt}</span>
                                </li>
                              ))}
                            </ul>
                          ),
                        }))
                  }
                />
              </div>

              {/* Reviews List */}
              <div
                id="partials_reviews"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Đánh giá
                  </h3>
                  {reviewsData && reviewsData.total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(reviewsData.averageRating)
                                ? "text-amber-500"
                                : "text-slate-300"
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {reviewsData.averageRating.toFixed(1)} ({reviewsData.total} đánh giá)
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Tổng hợp cảm nhận từ khách hàng đã trải nghiệm.
                </p>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-[var(--primary)]" />
                  </div>
                ) : reviewsData && reviewsData.data.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.data.map((review) => (
                      <div
                        key={review._id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                            {review.userId?.avatarUrl ? (
                              <Image
                                src={review.userId.avatarUrl}
                                alt={review.userId.fullName || "User"}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                                {(review.userId?.fullName || review.userId?.username || "U")[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-slate-900">
                                {review.userId?.fullName || review.userId?.username || "Khách hàng"}
                              </h5>
                              <span className="text-xs text-slate-500">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? "text-amber-500" : "text-slate-300"
                                  }`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {review.comment && (
                              <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                    Chưa có đánh giá. Hãy là người đầu tiên!
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-2xl font-bold text-slate-900">
                  Thêm đánh giá
                </h3>

                {!isLoggedIn ? (
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-600 mb-3">
                      Vui lòng đăng nhập để đánh giá tour này
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-white shadow hover:brightness-105"
                    >
                      Đăng nhập
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-3 text-sm text-slate-600">Đánh giá của bạn:</div>
                    <div className="mb-5 flex gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewRating(i + 1)}
                          className={`h-10 w-10 rounded-full text-xl transition-all ${
                            i < reviewRating
                              ? "bg-amber-100 text-amber-500 ring-2 ring-amber-300"
                              : "bg-slate-100 text-slate-400 ring-1 ring-slate-200 hover:bg-amber-50 hover:text-amber-400"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                      <span className="ml-2 flex items-center text-sm text-slate-600">
                        {reviewRating}/5 sao
                      </span>
                    </div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nội dung (tùy chọn)
                    </label>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      rows={4}
                      placeholder="Chia sẻ trải nghiệm của bạn…"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      disabled={submittingReview}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!id) return;
                        setSubmittingReview(true);
                        try {
                          await createReviewMutation.mutateAsync({
                            tourId: id,
                            rating: reviewRating,
                            comment: reviewComment.trim() || undefined,
                          });
                          toast.success("Đánh giá của bạn đã được gửi!");
                          setReviewComment("");
                          setReviewRating(5);
                        } catch (err: any) {
                          const msg = err?.response?.data?.message || err?.message || "Không thể gửi đánh giá";
                          toast.error(msg);
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                      disabled={submittingReview}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-white shadow hover:brightness-105 disabled:opacity-60"
                    >
                      {submittingReview ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          Gửi đánh giá
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <path
                              stroke="currentColor"
                              strokeWidth="2"
                              d="M13 7l5 5-5 5M6 12h12"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                    <p className="mt-3 text-xs text-slate-500">
                      * Bạn cần hoàn thành tour để có thể đánh giá
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* right — Booking */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                <div className="bg-emerald-700 p-6 text-white">
                  <div className="mb-1 text-sm/5 opacity-90">Giá chỉ từ</div>
                  <div className="text-3xl font-bold">{vnd(priceAdult)}</div>
                  <div className="mt-0.5 text-xs/5 opacity-90">/ người lớn</div>
                </div>
                <div className="p-6">
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Ngày bắt đầu
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <svg
                          className="h-5 w-5 text-emerald-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            stroke="currentColor"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-slate-900">
                          {tour.startDate
                            ? new Date(tour.startDate).toLocaleDateString(
                                "vi-VN"
                              )
                            : "Chọn ngày"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Ngày kết thúc
                      </label>
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <svg
                          className="h-5 w-5 text-amber-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            stroke="currentColor"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                          />
                        </svg>
                        <span className="text-sm font-medium text-slate-900">
                          {tour.endDate
                            ? new Date(tour.endDate).toLocaleDateString("vi-VN")
                            : "Chọn ngày"}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <svg
                          className="h-5 w-5 text-emerald-600"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            stroke="currentColor"
                            strokeWidth="2"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-slate-800">
                          {tour.time ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {typeof priceChild === "number" && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          Giá trẻ em
                        </span>
                        <span className="text-lg font-bold text-slate-900">
                          {vnd(priceChild)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      router.push(
                        `/user/checkout?id=${encodeURIComponent(
                          String(tour._id ?? id)
                        )}&adults=1&children=0`
                      )
                    }
                    className="group relative w-full overflow-hidden rounded-2xl bg-amber-600 px-6 py-4 text-lg font-bold text-white shadow-md transition hover:brightness-[1.05] active:scale-[0.99]"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Đặt ngay
                      <svg
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          stroke="currentColor"
                          strokeWidth="2"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </span>
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                  </button>
                  <button
                    type="button"
                    onClick={handleConsult}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-100 bg-emerald-50 px-6 py-3 text-lg font-bold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 active:scale-[0.99]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Tư vấn ngay
                  </button>

                  <p className="mt-4 text-center text-xs text-slate-500">
                    🎉 Đặt sớm để giữ giá tốt!
                  </p>
                </div>
              </div>

              {/* Help Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-700">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Cần trợ giúp?</h5>
                    <p className="text-sm text-slate-600">
                      Chúng tôi luôn sẵn sàng hỗ trợ
                    </p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:quochung.dev@gmail.com"
                      className="font-medium text-slate-800 hover:text-emerald-700"
                    >
                      quochung.dev@gmail.com
                    </a>
                  </li>
                  <li className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <svg
                      className="h-5 w-5 text-amber-600"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="font-medium text-slate-800">
                      +000 (123) 456 88
                    </span>
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-700">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h6 className="text-2xl font-bold text-slate-900">
                    Tours tương tự
                  </h6>
                  <p className="text-sm text-slate-600">
                    Khám phá thêm các tour hấp dẫn khác
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((t: any) => (
                  <CardHot
                    key={t._id ?? t.id ?? t.title}
                    title={t.title}
                    image={
                      t.cover ||
                      (Array.isArray(t.images) && t.images.length > 0
                        ? t.images[0]
                        : null) ||
                      "/hot1.jpg"
                    }
                    originalPrice={toNum(t.priceAdult)}
                    salePrice={t.salePrice}
                    discountPercent={t.discountPercent}
                    discountAmount={t.discountAmount}
                    href={`/user/destination/${
                      t.destinationSlug ??
                      (t.title || "").toLowerCase().replace(/\s+/g, "-")
                    }/${t._id ?? t.id ?? ""}`}
                    time={t.time}
                    destination={t.destination ?? tour.destination ?? ""}
                    schedule={
                      t.startText ??
                      (t.startDate
                        ? `Khởi hành: ${new Date(
                            t.startDate
                          ).toLocaleDateString("vi-VN")}`
                        : undefined)
                    }
                    seats={getSeatsValue(t.quantity ?? t.seats)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
