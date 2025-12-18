// /app/user/destination/page.tsx (ví dụ đường dẫn)
// nhớ chỉnh lại path cho đúng với project của bạn

"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import CardHot from "@/components/cards/CardHot";
import TourFilter, { type TourFilterValue } from "@/components/TourFilter";
import { useGetTours } from "#/hooks/tours-hook/useTours";
import { getTours } from "@/lib/tours/tour";

/* ========= Helpers ========= */
type DayBucket = "1-4" | "5-8" | "9-12" | "14+";

const slugify = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeForSearch = (s?: string) => {
  if (!s) return undefined;
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const titleFromSlug = (s?: string) => (s ? s.replace(/-/g, " ") : "");
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("vi-VN") : "";
const toNum = (v?: number | string) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};

const computePercent = (t: any): number | undefined => {
  if (typeof t?.discountPercent === "number" && t.discountPercent > 0)
    return Math.round(t.discountPercent);
  const origin = toNum(t?.priceAdult);
  if (!origin || origin <= 0) return undefined;
  let sale = toNum(t?.salePrice);
  if (sale == null && typeof t?.discountAmount === "number")
    sale = Math.max(0, origin - t.discountAmount);
  if (typeof sale === "number" && sale < origin)
    return Math.round((1 - sale / origin) * 100);
  return undefined;
};

const pickTourImage = (t: any): string => {
  const imgs = Array.isArray(t?.images) ? t.images.filter(Boolean) : [];
  if (imgs.length > 0) {
    const seed = String(t?._id ?? t?.id ?? t?.title ?? "");
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return imgs[hash % imgs.length];
  }
  return t?.image ?? t?.cover ?? "/hot1.jpg";
};

const bucketToRange = (b?: DayBucket | ""): [number, number] | null => {
  switch (b) {
    case "1-4":
      return [1, 4];
    case "5-8":
      return [5, 8];
    case "9-12":
      return [9, 12];
    case "14+":
      return [14, Infinity];
    default:
      return null;
  }
};

const getDurationDays = (t: any): number | undefined => {
  if (t.time && typeof t.time === "string") {
    const m = t.time.match(/(\d+)\s*ngày/i);
    if (m) {
      const d = Number(m[1]);
      if (Number.isFinite(d) && d > 0) return d;
    }
  }
  if (t.startDate && t.endDate) {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(diff) && diff > 0) return Math.round(diff);
  }
  if (Array.isArray(t.itinerary) && t.itinerary.length > 0) {
    return t.itinerary.length;
  }
  return undefined;
};

const PAGE_SIZE = 12;
const DEFAULT_PERCENT = 0;

type SearchQuery = {
  q?: string;
  destination?: string;
  from?: string;
  budgetMin?: number;
  budgetMax?: number;
};

// ========= Skeleton Component =========
const TourSkeleton = () => (
  <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
    <div className="h-48 w-full rounded-xl bg-slate-100" />
    <div className="mt-3 h-4 w-3/4 rounded bg-slate-100" />
    <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
    <div className="mt-4 flex justify-between">
      <div className="h-4 w-1/4 rounded bg-slate-100" />
      <div className="h-4 w-1/4 rounded bg-slate-100" />
    </div>
  </div>
);

function DestinationPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ===== 1. Init từ URL =====
  const initialPage = Math.max(1, Number(sp.get("page") || 1));
  const qFromUrl = sp.get("q") || "";
  const destFromUrl = sp.get("destination") || "";
  const fromDateUrl = sp.get("from") || undefined;
  const budgetMinUrl = Number(sp.get("budgetMin") || 0);
  const budgetMaxUrl = Number(sp.get("budgetMax") || 1_000_000_000);
  const daysFromUrl = (sp.get("days") || "") as DayBucket | "";

  // UI filter state
  const [filters, setFilters] = useState<TourFilterValue>({
    from: undefined,
    to: destFromUrl || undefined,
    date: fromDateUrl,
    days: daysFromUrl,
    keyword: qFromUrl,
    budget: [budgetMinUrl, budgetMaxUrl],
  });

  // Query thực gửi BE
  const [apiQuery, setApiQuery] = useState<SearchQuery>({
    q: normalizeForSearch(qFromUrl) || undefined,
    destination: normalizeForSearch(destFromUrl) || undefined,
    from: fromDateUrl,
    budgetMin: budgetMinUrl || 0,
    budgetMax: budgetMaxUrl || 1_000_000_000,
  });

  const [page, setPage] = useState<number>(initialPage);

  // ===== 2. GỌI API =====
  const { data, isLoading, isError } = useGetTours(page, PAGE_SIZE, apiQuery);

  const tours = data?.data ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // ===== 3. Lấy danh sách option =====
  const [fromOptions, setFromOptions] = useState<string[]>([]);
  const [toOptions, setToOptions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getTours(1, 200, {});
        const depSet = new Set<string>();
        const destSet = new Set<string>();

        res.data.forEach((t: any) => {
          if (t.departure) depSet.add(String(t.departure));
          if (t.destination) destSet.add(String(t.destination));
          else if (t.destinationSlug)
            destSet.add(titleFromSlug(t.destinationSlug));
        });

        setFromOptions(Array.from(depSet));
        setToOptions(Array.from(destSet));
      } catch (err) {
        console.error("Lỗi tải options", err);
      }
    })();
  }, []);

  // ===== 4. Lọc theo Số ngày client =====
  const visibleTours = useMemo(() => {
    const range = bucketToRange(filters.days as DayBucket | "");
    if (!range) return tours;
    const [minDays, maxDays] = range;

    return tours.filter((t: any) => {
      const d = getDurationDays(t);
      if (!d) return false;
      if (!Number.isFinite(maxDays)) return d >= minDays;
      return d >= minDays && d <= maxDays;
    });
  }, [tours, filters.days]);

  const visibleCount = visibleTours.length;

  // ===== 5. Đồng bộ URL =====
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    if (apiQuery.q) params.set("q", apiQuery.q);
    if (apiQuery.destination) params.set("destination", apiQuery.destination);
    if (apiQuery.from) params.set("from", apiQuery.from);
    params.set("budgetMin", String(apiQuery.budgetMin ?? 0));
    params.set("budgetMax", String(apiQuery.budgetMax ?? 1_000_000_000));
    if (filters.days) params.set("days", String(filters.days));
    else params.delete("days");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, currentPage, apiQuery, filters.days]);

  // ===== 6. Pagination =====
  const pageNumbers = useMemo(() => {
    const arr: (number | "...")[] = [];
    const win = 1;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) arr.push(i);
      return arr;
    }
    arr.push(1);
    if (currentPage - win > 2) arr.push("...");
    for (
      let i = Math.max(2, currentPage - win);
      i <= Math.min(totalPages - 1, currentPage + win);
      i++
    )
      arr.push(i);
    if (currentPage + win < totalPages - 1) arr.push("...");
    arr.push(totalPages);
    return arr;
  }, [currentPage, totalPages]);

  const goToPage = (n: number) => {
    const next = Math.min(Math.max(1, n), totalPages);
    if (next !== page) {
      setPage(next);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleSubmitFilter = () => {
    const nextQuery: SearchQuery = {
      q: normalizeForSearch(filters.keyword),
      destination: normalizeForSearch(filters.to),
      from: filters.date || undefined,
      budgetMin: filters.budget?.[0] ?? 0,
      budgetMax: filters.budget?.[1] ?? 1_000_000_000,
    };
    setApiQuery(nextQuery);
    setPage(1);
  };

  return (
    <main className="relative min-h-screen bg-slate-50 font-sans text-slate-600">
      {/* ===== HERO HEADER (match trang blog) ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 pb-20 pt-20 lg:pb-24 lg:pt-24">
        {/* Pattern background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 right-0 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-blue-500/20 blur-[80px]" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 px-4 py-1.5 mb-5">
              <span className="h-2 w-2 rounded-full bg-orange-400 shadow shadow-orange-300" />
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                AHH Travel · Tour Hot
              </span>
            </div>

            <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl leading-tight">
              Danh sách{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                Tour Du Lịch
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-lg text-blue-200">
              Chọn tour ưng ý, khám phá hành trình mơ ước và đặt chỗ ngay hôm
              nay cùng Travel AHH.
            </p>

            {/* Stats */}
            <div className="mt-7 flex flex-wrap gap-6 text-sm">
              <div className="text-white/90">
                <p className="text-2xl font-bold text-white">
                  {total}
                  <span className="ml-1 text-sm font-medium text-blue-200">
                    tour
                  </span>
                </p>
                <p className="text-xs uppercase tracking-wide text-blue-200">
                  đang mở bán
                </p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div className="text-white/90">
                <p className="text-2xl font-bold text-white">
                  {visibleCount}
                  <span className="ml-1 text-sm font-medium text-blue-200">
                    tour
                  </span>
                </p>
                <p className="text-xs uppercase tracking-wide text-blue-200">
                  phù hợp với bộ lọc hiện tại
                </p>
              </div>
              <div className="h-10 w-px bg-white/20 hidden sm:block" />
              <div className="text-white/90 hidden sm:block">
                <p className="text-2xl font-bold text-white">
                  {currentPage}/{totalPages}
                </p>
                <p className="text-xs uppercase tracking-wide text-blue-200">
                  trang kết quả
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 50L48 45.7C96 41.3 192 32.7 288 30.2C384 27.7 480 31.3 576 39.2C672 47 768 59 864 59.5C960 60 1056 49 1152 43.5C1248 38 1344 38 1392 38L1440 38V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V50Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 pb-14 lg:px-0">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* Sidebar filter */}
          <aside className="lg:sticky lg:top-24 lg:self-start z-10">
            <TourFilter
              value={filters}
              onChange={(v) => setFilters(v)}
              onSubmit={handleSubmitFilter}
              fromOptions={fromOptions}
              toOptions={toOptions}
            />
          </aside>

          {/* Grid kết quả */}
          <main id="list" className="pb-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Tour nổi bật
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Trang {currentPage}/{totalPages} · Hiển thị{" "}
                  <span className="font-semibold text-orange-600">
                    {visibleCount}
                  </span>{" "}
                  tour phù hợp
                </p>
              </div>
            </div>

            {isError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600 shadow-sm">
                Không tải được dữ liệu tour. Vui lòng thử lại sau.
              </div>
            ) : (
              <>
                {/* Tour Grid */}
                <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TourSkeleton key={i} />
                    ))
                  ) : visibleTours.length === 0 ? (
                    <div className="col-span-full py-12 text-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="h-8 w-8 text-orange-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-slate-800">
                        Không tìm thấy tour phù hợp
                      </h3>
                      <p className="text-sm text-slate-500">
                        Thử thay đổi điểm đến, ngân sách hoặc ngày khởi hành để
                        tìm được hành trình phù hợp hơn nhé.
                      </p>
                    </div>
                  ) : (
                    visibleTours.map((t: any) => {
                      const percent = computePercent(t) ?? DEFAULT_PERCENT;
                      const id = t._id ?? t.id ?? "";
                      const slug = t.destinationSlug ?? slugify(t.title);

                      return (
                        <motion.div
                          key={id || t.title}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="h-full"
                        >
                          <CardHot
                            image={pickTourImage(t)}
                            title={t.title}
                            href={`/user/destination/${slug}/${id}`}
                            originalPrice={toNum(t.priceAdult)}
                            salePrice={toNum(t.salePrice)}
                            discountPercent={percent}
                            discountAmount={t.discountAmount}
                            time={t.time}
                            destination={
                              t.destination ?? titleFromSlug(t.destinationSlug)
                            }
                            seats={t.quantity ?? t.seats ?? 0}
                            schedule={
                              t.startText ??
                              (t.startDate
                                ? `Khởi hành: ${fmtDate(t.startDate)}`
                                : undefined)
                            }
                          />
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      className="flex h-10 min-w-[38px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm transition-all hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:hover:border-slate-200"
                      disabled={currentPage <= 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Trước
                    </button>

                    {pageNumbers.map((n, idx) =>
                      n === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="select-none px-2 text-slate-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => goToPage(n as number)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                            n === currentPage
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30"
                              : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-orange-500 hover:text-orange-600"
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}

                    <button
                      className="flex h-10 min-w-[38px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm transition-all hover:border-orange-500 hover:text-orange-600 disabled:opacity-50 disabled:hover:border-slate-200"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </main>
  );
}

// Wrapper với Suspense để tránh lỗi useSearchParams
export default function DestinationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600 mx-auto" />
            <p className="mt-4 text-slate-600">Đang tải...</p>
          </div>
        </div>
      }
    >
      <DestinationPageContent />
    </Suspense>
  );
}
