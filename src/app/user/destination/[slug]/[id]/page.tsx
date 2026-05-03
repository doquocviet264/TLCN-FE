"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useChatStore } from "#/stores/chatStore";
import { useGetTourById, useGetTourDepartures } from "#/hooks/tours-hook/useTourDetail";
import { useGetTours } from "#/hooks/tours-hook/useTours";
import {
  useGetTourReviews,
  useCreateReview,
} from "#/hooks/reviews-hook/useReviews";
import { useAuthStore } from "#/stores/auth";
import { getUserToken } from "@/lib/auth/tokenManager";
import CardHot from "@/components/cards/CardHot";
import CompareTourDialog from "@/components/ui/CompareTourDialog";
import TourRecommendations from "@/components/TourRecommendations";
import { toast } from "react-hot-toast";

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
  if (Array.isArray(raw)) {
    const first = raw[0] as any;
    if (!first) return undefined;
    if (typeof first === "object" && first !== null && "value" in first) {
      return (first as any).value;
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
            ? "text-amber-400"
            : idx === full + 1 && half
            ? "text-amber-400"
            : "text-slate-300";
        return (
          <svg
            key={i}
            className={`h-5 w-5 ${fill}`}
            viewBox="0 0 20 20"
            fill="currentColor"
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
    <div className="mt-6 space-y-3 relative z-10">
      {items.map((it, idx) => {
        const isOpen = open === idx;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : idx)}
              className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left rounded-2xl transition-colors ${
                isOpen ? "bg-orange-50 rounded-b-none" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                    isOpen
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="font-semibold text-slate-900">{it.title}</span>
              </div>
              <span className={isOpen ? "text-orange-500" : "text-slate-500"}>
                <Chevron open={isOpen} />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className={isOpen ? "overflow-visible" : "overflow-hidden"}>
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-[15px] leading-relaxed text-slate-800 rounded-b-2xl">
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

function ItineraryImageHover({ url, title, isHovered }: { url: string; title: string, isHovered: boolean }) {
  return (
    <div className="relative inline-block z-50 align-middle">
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -10 }}
            className="absolute top-1/2 left-0 z-[100] ml-4 w-64 -translate-y-1/2 pointer-events-none"
          >
            <div className="overflow-hidden rounded-2xl bg-white p-1.5 shadow-2xl border border-slate-200 ring-4 ring-black/5">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
                <Image 
                  src={url} 
                  alt={title} 
                  fill 
                  className="object-cover" 
                  unoptimized
                />
              </div>
              <div className="p-2 text-center">
                <p className="truncate text-[11px] font-bold text-slate-800">{title}</p>
              </div>
              {/* Left pointing arrow */}
              <div className="absolute top-1/2 -left-2 h-4 w-4 -translate-y-1/2 rotate-45 border-b border-l border-slate-200 bg-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function DaySegmentItem({ text, img }: { text: string; img: string | null }) {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <li 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="space-y-2 group cursor-pointer"
    >
      <div className="flex items-start gap-2 text-[15px] text-slate-700 transition-colors group-hover:text-orange-600">
        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 flex-shrink-0 ring-offset-2 transition-all group-hover:ring-2 group-hover:ring-orange-400" />
        <span className="flex-1">
          {text}
          {img && <ItineraryImageHover url={img} title={text} isHovered={isHovered} />}
        </span>
      </div>
    </li>
  );
}

function TourCalendar({ departures, selectedDeparture, onSelect }: any) {
  const [currentMonthStr, setCurrentMonthStr] = React.useState<string>("");

  const months = React.useMemo(() => {
    if (!departures || departures.length === 0) return [];
    const map = new Map<string, Date>();
    departures.forEach((dep: any) => {
      const d = new Date(dep.startDate);
      const mStr = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!map.has(mStr)) {
        map.set(mStr, new Date(d.getFullYear(), d.getMonth(), 1));
      }
    });
    const sorted = Array.from(map.entries()).sort((a, b) => a[1].getTime() - b[1].getTime());
    return sorted.map(s => s[0]);
  }, [departures]);

  React.useEffect(() => {
    if (months.length > 0 && (!currentMonthStr || !months.includes(currentMonthStr))) {
      setCurrentMonthStr(months[0]);
    }
  }, [months, currentMonthStr]);

  const handlePrevMonth = () => {
    const idx = months.indexOf(currentMonthStr);
    if (idx > 0) setCurrentMonthStr(months[idx - 1]);
  };
  const handleNextMonth = () => {
    const idx = months.indexOf(currentMonthStr);
    if (idx >= 0 && idx < months.length - 1) setCurrentMonthStr(months[idx + 1]);
  };

  const currentIdx = months.indexOf(currentMonthStr);
  const canPrev = currentIdx > 0;
  const canNext = currentIdx >= 0 && currentIdx < months.length - 1;

  const calendarDays = React.useMemo(() => {
    if (!currentMonthStr) return [];
    const [m, y] = currentMonthStr.split('/');
    const year = Number(y);
    const month = Number(m) - 1;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonthStr]);

  if (!departures || departures.length === 0) return null;

  const formatK = (price: number) => {
    return (price / 1000).toLocaleString('en-US') + 'K';
  };

  return (
    <div className="mb-8">
      <h3 className="text-center text-2xl font-bold text-slate-900 mb-6 uppercase">
        Lịch khởi hành
      </h3>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 shrink-0 flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm h-fit">
          <p className="font-bold text-slate-900 mb-2 px-2 text-center md:text-left">Chọn tháng</p>
          <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            {months.map(m => (
              <button
                key={m}
                onClick={() => setCurrentMonthStr(m)}
                className={`px-4 py-3 text-sm font-bold rounded-xl transition whitespace-nowrap text-center ${
                  currentMonthStr === m
                    ? "bg-[#0b5cba] text-white"
                    : "text-[#0b5cba] hover:bg-blue-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-center gap-6 mb-8">
            <button 
              onClick={handlePrevMonth}
              disabled={!canPrev}
              className={`p-2 rounded-full ${canPrev ? "hover:bg-slate-100 text-slate-700" : "text-slate-300 cursor-not-allowed"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h4 className="text-xl font-bold text-[#0b5cba] uppercase min-w-[150px] text-center">
              Tháng {currentMonthStr}
            </h4>
            <button 
              onClick={handleNextMonth}
              disabled={!canNext}
              className={`p-2 rounded-full ${canNext ? "hover:bg-slate-100 text-slate-700 bg-slate-50" : "text-slate-300 cursor-not-allowed"}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-4">
            {['T2', 'T3', 'T4', 'T5', 'T6'].map(d => (
              <div key={d} className="font-bold text-slate-900 text-[15px] py-2">{d}</div>
            ))}
            <div className="font-bold text-red-600 text-[15px] py-2">T7</div>
            <div className="font-bold text-red-600 text-[15px] py-2">CN</div>
          </div>

          <div className="grid grid-cols-7 gap-x-2 gap-y-4">
            {calendarDays.map((dateObj, i) => {
              if (!dateObj) {
                return <div key={`empty-${i}`} className="p-2"></div>;
              }
              const depsForDay = departures.filter((dep: any) => {
                const d = new Date(dep.startDate);
                return d.getDate() === dateObj.getDate() && 
                       d.getMonth() === dateObj.getMonth() && 
                       d.getFullYear() === dateObj.getFullYear();
              });
              
              const dep = depsForDay[0];
              const isSelected = selectedDeparture && selectedDeparture._id === dep?._id;
              
              if (!dep) {
                return (
                  <div key={i} className="flex flex-col items-center justify-center p-2 h-16 text-slate-700 text-[15px]">
                    {dateObj.getDate()}
                  </div>
                );
              }

              return (
                <button
                  key={i}
                  onClick={() => onSelect(dep)}
                  className={`flex flex-col items-center justify-center p-1 h-16 rounded-xl border transition group ${
                    isSelected 
                      ? "border-red-500" 
                      : "border-transparent hover:border-red-500 hover:bg-red-50/10"
                  }`}
                >
                  <span className={`font-semibold text-[15px] ${isSelected ? "text-slate-900" : "text-slate-900"}`}>
                    {dateObj.getDate()}
                  </span>
                  <span className="text-[11px] font-bold text-red-600 mt-0.5">
                    {formatK(dep.priceAdult)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);

  const { data: tour, isLoading, isError } = useGetTourById(id);
  const { data: recRaw } = useGetTours(1, 12);

  // Reviews
  const { data: reviewsData, isLoading: reviewsLoading } =
    useGetTourReviews(id);
  const createReview = useCreateReview();
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState("");
  const [submittingReview, setSubmittingReview] = React.useState(false);

  // So sánh Tour
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);

  const { token } = useAuthStore();
  const accessToken = token?.accessToken || getUserToken();
  const isLoggedIn = !!accessToken;

  // Itinerary Image Modal
  const [activeItineraryImg, setActiveItineraryImg] = React.useState<{url: string, title: string} | null>(null);

  // Fetch Departures
  const { data: departuresData, isLoading: isLoadingDeps } = useGetTourDepartures(id);
  const departures = useMemo(() => {
    const list = departuresData?.data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return list.filter((d: any) => {
      if (!d.startDate) return false;
      const start = new Date(d.startDate);
      start.setHours(0, 0, 0, 0);
      return start >= today;
    });
  }, [departuresData]);
  const [selectedDeparture, setSelectedDeparture] = React.useState<any>(null);

  // Không tự chọn mặc định nữa để ép người dùng phải chọn (theo yêu cầu)
  // useEffect(() => {
  //   if (departures.length > 0 && !selectedDeparture) {
  //     setSelectedDeparture(departures[0]);
  //   }
  // }, [departures, selectedDeparture]);

  const priceAdult = selectedDeparture 
    ? toNum(selectedDeparture.priceAdult) 
    : toNum(tour?.priceAdult);
  const priceChild = selectedDeparture
    ? toNum(selectedDeparture.priceChild)
    : toNum(tour?.priceChild);

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

  // related - loại bỏ tour đã khởi hành
  const related = useMemo(() => {
    const list: any[] = Array.isArray((recRaw as any)?.data)
      ? (recRaw as any).data
      : Array.isArray(recRaw)
      ? (recRaw as any)
      : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return list
      .filter((t) => {
        // Loại tour hiện tại
        if (t._id === tour?._id) return false;

        // Loại tour đã khởi hành
        if (t.startDate) {
          const startDate = new Date(t.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (startDate < today) return false;
        }

        return true;
      })
      .slice(0, 3);
  }, [recRaw, tour]);

  // Kiểm tra tour đã khởi hành chưa (phải đặt trước conditional returns)
  const isDeparted = useMemo(() => {
    if (!tour?.startDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tourStartDate = new Date(tour.startDate as any);
    tourStartDate.setHours(0, 0, 0, 0);
    return tourStartDate < today;
  }, [tour?.startDate]);

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
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-orange-500" />
          <p className="mt-4 text-sm text-slate-600">
            Đang tải thông tin tour…
          </p>
        </div>
      </div>
    );
  }

  if (isError || !tour) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-12 text-center">
        <p className="text-slate-600">
          Không tải được chi tiết tour. Vui lòng thử lại sau.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-500 hover:text-orange-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const rating = Number(tour.rating ?? reviewsData?.averageRating ?? 4.6);

  /* ====== itinerary data ====== */
  const timeOfDayLabels: Record<string, string> = {
    morning: "Buổi sáng",
    afternoon: "Buổi chiều",
    evening: "Buổi tối",
  };

  const timeOfDayIcons: Record<string, React.ReactNode> = {
    morning: (
      <svg className="h-4 w-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>
    ),
    afternoon: (
      <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
      </svg>
    ),
    evening: (
      <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
      </svg>
    ),
  };

  const itineraryItems: DayItem[] =
    Array.isArray(tour.itinerary) && tour.itinerary.length > 0
      ? tour.itinerary.map((day: any, i: number) => ({
          title: day.title || `Ngày ${i + 1}`,
          content: (
            <div className="space-y-4">
              {/* Summary */}
              {day.summary && (
                <p className="text-[15px] text-slate-600 italic border-l-2 border-orange-300 pl-3">
                  {day.summary}
                </p>
              )}

              {/* Segments with timeOfDay */}
              {Array.isArray(day.segments) && day.segments.length > 0 ? (
                <div className="space-y-4">
                  {day.segments.map((segment: any, segIdx: number) => (
                    <div key={segIdx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {timeOfDayIcons[segment.timeOfDay] || timeOfDayIcons.morning}
                        <span className="text-sm font-semibold text-slate-700">
                          {timeOfDayLabels[segment.timeOfDay] || "Buổi sáng"}
                          {segment.title && ` - ${segment.title}`}
                        </span>
                      </div>
                      {Array.isArray(segment.items) && segment.items.length > 0 && (
                        <ul className="ml-6 space-y-3">
                          {segment.items.map((item: any, itemIdx: number) => {
                            const isObj = typeof item === 'object' && item !== null;
                            const text = isObj ? item.text : item;
                            const img = isObj ? item.imageUrl : null;

                            return (
                              <DaySegmentItem key={itemIdx} text={text} img={img} />
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : day.description ? (
                <div
                  className="prose prose-slate max-w-none text-[15px]"
                  dangerouslySetInnerHTML={{ __html: day.description }}
                />
              ) : Array.isArray(day.activities) && day.activities.length > 0 ? (
                <ul className="space-y-2">
                  {day.activities.map((a: string, idx: number) => (
                    <DaySegmentItem key={idx} text={a} img={null} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  Chi tiết ngày này sẽ được cập nhật.
                </p>
              )}
            </div>
          ),
        }))
      : Array.from({ length: days }).map((_, i) => ({
          title: `Ngày ${i + 1} – ${tour.destination ?? "Hành trình"}`,
          content: (
            <ul className="space-y-2 text-[15px] text-slate-700">
              {[
                "Đón khách, làm thủ tục và khởi hành",
                "Tham quan các điểm nổi bật trong ngày",
                "Thưởng thức ẩm thực địa phương",
                "Nghỉ đêm tại khách sạn / homestay",
              ].map((txt) => (
                <li key={txt} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-500" />
                  <span>{txt}</span>
                </li>
              ))}
            </ul>
          ),
        }));

  /* ====== JSX ====== */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== Hero ===== */}
      {/* ===== HERO TOUR DETAIL ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 pb-24 pt-10 text-white">
        {/* pattern chấm */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* background image mờ phía sau */}
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <Image
            src={tourImage}
            alt={tour.title || "Tour"}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-900/85 to-blue-900/60" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT: info */}
            <div className="max-w-2xl">
              {/* badge */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>
                    {tour.time ? tour.time.toUpperCase() : "TOUR"} ·{" "}
                    {tour.destination || "Điểm đến"}
                  </span>
                </div>
                {isDeparted && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Đã khởi hành
                  </div>
                )}
              </div>

              {/* title */}
              <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
                {tour.title}
              </h1>

              {/* rating + meta */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-blue-100">
                <StarRating
                  value={rating}
                  count={reviewsData?.total ?? tour.reviewsCount ?? 0}
                />

                <span className="hidden h-4 w-px bg-white/30 sm:inline-block" />

                {tour.destination && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-emerald-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
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
                    <span>{tour.destination}</span>
                  </div>
                )}

                {tour.time && (
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 text-emerald-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{tour.time}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: price card */}
            <div className="w-full max-w-sm">
              <div className="rounded-3xl bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 px-6 py-5 shadow-[0_24px_60px_rgba(15,23,42,0.7)] border border-white/10 backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">
                  Giá chỉ từ
                </p>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-300">
                    {priceAdult ? vnd(priceAdult) : "Liên hệ"}
                  </span>
                  <span className="text-xs font-medium text-blue-100">
                    / người lớn
                  </span>
                </div>

                {typeof priceChild === "number" && (
                  <p className="mt-1 text-[11px] text-blue-100">
                    Trẻ em:{" "}
                    <span className="font-semibold text-white">
                      {vnd(priceChild)}
                    </span>
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {departures.length === 0 ? (
                    <div className="flex-1 rounded-2xl bg-slate-500/50 px-4 py-3 text-center text-sm font-bold text-white/80 cursor-not-allowed">
                      Hết lịch khởi hành
                    </div>
                  ) : !selectedDeparture ? (
                    <div className="flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-center text-sm font-bold text-white/60">
                      Vui lòng chọn ngày khởi hành
                    </div>
                  ) : isDeparted ? (
                    <div className="flex-1 rounded-2xl bg-slate-500/50 px-4 py-3 text-center text-sm font-bold text-white/80 cursor-not-allowed">
                      Hành trình đã bắt đầu
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        router.push(
                          `/user/checkout?id=${encodeURIComponent(
                            String(selectedDeparture._id)
                          )}&adults=1&children=0`
                        )
                      }
                      className="flex-1 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/40 transition hover:brightness-[1.05] active:scale-[0.98]"
                    >
                      Đặt tour ngay
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConsult}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/5 px-4 py-3 text-sm font-semibold text-blue-50 backdrop-blur-md transition hover:bg-white/15 active:scale-[0.98]"
                  >
                    Tư vấn
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-blue-200 text-center">
                  {isDeparted
                    ? "Tour này đã khởi hành. Vui lòng chọn tour khác."
                    : "Giá đã bao gồm nhiều ưu đãi, số chỗ có hạn."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* wave bottom */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0">
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

      {/* ===== Main content ===== */}
      <section className="-mt-4 pb-16">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* LEFT column – Main Content */}
            <div className="space-y-8">
              {/* Gallery grid (small) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="grid gap-3 md:grid-cols-4"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl md:col-span-2 md:row-span-2">
                  <Image
                    src={gallery[0] || "/hot1.jpg"}
                    alt={`${tour.title} 1`}
                    fill
                    className="object-cover"
                  />
                </div>
                {gallery.slice(1, 5).map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={img || "/hot1.jpg"}
                      alt={`${tour.title} ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </motion.div>

              {/* Description */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-3 flex items-center gap-3 text-2xl font-bold text-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M13 7H7m6 4H7m6 4H7m10-8h.01M17 11h.01M17 15h.01M5 5a2 2 0 012-2h10a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V5z"
                      />
                    </svg>
                  </span>
                  Giới thiệu tour
                </h3>
                <div className="prose prose-slate max-w-none text-[15px] leading-relaxed">
                  {tour.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: tour.description }}
                    />
                  ) : (
                    <p className="text-slate-600">
                      Đang cập nhật mô tả chi tiết cho tour này. Liên hệ chúng
                      tôi để được tư vấn cụ thể hơn về hành trình.
                    </p>
                  )}
                </div>
              </div>

              {/* Includes / Excludes */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      ✓
                    </span>
                    Đã bao gồm
                  </h4>
                  <ul className="space-y-2 text-[15px] text-slate-800">
                    {(Array.isArray((tour as any).includes) &&
                    (tour as any).includes.length > 0
                      ? (tour as any).includes
                      : [
                          "Xe đưa đón theo chương trình",
                          "Khách sạn tiêu chuẩn",
                          "Các bữa ăn chính theo lịch trình",
                          "Hướng dẫn viên du lịch nhiệt tình",
                          "Vé tham quan các điểm trong chương trình",
                          "Bảo hiểm du lịch",
                        ]
                    ).map((txt: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                      ✕
                    </span>
                    Chưa bao gồm
                  </h4>
                  <ul className="space-y-2 text-[15px] text-slate-700">
                    {(Array.isArray((tour as any).excludes) &&
                    (tour as any).excludes.length > 0
                      ? (tour as any).excludes
                      : [
                          "Chi phí cá nhân ngoài chương trình",
                          "Tiền tip cho hướng dẫn viên và tài xế",
                          "Đồ uống trong bữa ăn",
                          "Phụ thu phòng đơn (nếu có)",
                        ]
                    ).map((txt: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lịch khởi hành mới */}
              <TourCalendar 
                departures={departures} 
                selectedDeparture={selectedDeparture} 
                onSelect={setSelectedDeparture} 
              />

              {/* Itinerary */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <h3 className="mb-2 flex items-center gap-3 text-2xl font-bold text-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                      />
                    </svg>
                  </span>
                  Lịch trình chi tiết
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  Khám phá từng ngày trong hành trình của bạn.
                </p>
                <DaysAccordion items={itineraryItems} />
              </div>

              {/* Reviews list */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900">
                    Đánh giá từ khách hàng
                  </h3>
                  {reviewsData && reviewsData.total > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRating
                        value={reviewsData.averageRating}
                        count={reviewsData.total}
                      />
                    </div>
                  )}
                </div>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-200 border-t-orange-500" />
                  </div>
                ) : reviewsData && reviewsData.data.length > 0 ? (
                  <div className="space-y-4">
                    {reviewsData.data.map((r: any) => (
                      <div
                        key={r._id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 text-sm font-semibold text-orange-600">
                            {(r.userId?.fullName ||
                              r.userId?.username ||
                              "K")[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-900">
                                {r.userId?.fullName ||
                                  r.userId?.username ||
                                  "Khách hàng"}
                              </p>
                              <span className="text-xs text-slate-500">
                                {new Date(r.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < r.rating
                                      ? "text-amber-400"
                                      : "text-slate-300"
                                  }`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            {r.comment && (
                              <p className="mt-2 text-[13px] text-slate-700">
                                {r.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">
                    Chưa có đánh giá nào cho tour này. Hãy là người đầu tiên!
                  </p>
                )}
              </div>

              {/* Review form */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-2xl font-bold text-slate-900">
                  Viết đánh giá
                </h3>
                {!isLoggedIn ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-600 mb-3">
                      Vui lòng đăng nhập để đánh giá tour.
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600"
                    >
                      Đăng nhập
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
                      <span>Đánh giá của bạn:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i + 1)}
                            className={`h-8 w-8 rounded-full text-base transition-all ${
                              i < reviewRating
                                ? "bg-amber-100 text-amber-500 ring-2 ring-amber-300"
                                : "bg-slate-100 text-slate-400 ring-1 ring-slate-200 hover:bg-amber-50 hover:text-amber-400"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span className="ml-1 text-xs text-slate-500">
                        {reviewRating}/5 sao
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder="Hãy chia sẻ trải nghiệm của bạn về tour này..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      disabled={submittingReview}
                    />
                    <button
                      type="button"
                      disabled={submittingReview}
                      onClick={async () => {
                        try {
                          setSubmittingReview(true);
                          await createReview.mutateAsync({
                            tourId: id,
                            rating: reviewRating,
                            comment:
                              reviewComment.trim().length > 0
                                ? reviewComment.trim()
                                : undefined,
                          });
                          toast.success("Cảm ơn bạn đã gửi đánh giá!");
                          setReviewComment("");
                          setReviewRating(5);
                        } catch (err: any) {
                          const msg =
                            err?.response?.data?.message ||
                            err?.message ||
                            "Không thể gửi đánh giá.";
                          toast.error(msg);
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
                    >
                      {submittingReview ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          Gửi đánh giá
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              stroke="currentColor"
                              strokeWidth="2"
                              d="M13 7l5 5-5 5M6 12h12"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                    <p className="mt-2 text-xs text-slate-500">
                      * Chỉ những khách đã hoàn thành tour mới được ưu tiên
                      duyệt đánh giá.
                    </p>
                  </>
                )}
              </div>
            </div>
            {/* RIGHT column – booking sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                <div className="border-b border-slate-200 bg-blue-50/30 px-6 py-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
                    Thông tin đặt tour
                  </p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-medium">Giá người lớn</p>
                    <p className="text-3xl font-extrabold text-slate-900">
                      {priceAdult ? vnd(priceAdult) : "Liên hệ"}
                    </p>
                  </div>

                  {typeof priceChild === "number" && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5">
                      <span className="text-xs text-slate-500 font-medium">Giá trẻ em</span>
                      <span className="text-sm font-bold text-slate-800">
                        {vnd(priceChild)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Thời gian:</span>
                      <span className="text-sm font-bold text-slate-900">{tour.time || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Khởi hành:</span>
                      <span className="text-sm font-bold text-slate-900">
                        {selectedDeparture 
                          ? new Date(selectedDeparture.startDate).toLocaleDateString("vi-VN")
                          : "Vui lòng chọn ngày"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Số chỗ còn lại:</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {selectedDeparture 
                          ? (selectedDeparture.max_guests - (selectedDeparture.current_guests || 0))
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {!selectedDeparture ? (
                    <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 text-center">
                      <p className="text-xs font-semibold text-orange-700">
                        * Hãy chọn một ngày khởi hành ở phía trên hoặc trong phần lịch trình để tiếp tục.
                      </p>
                    </div>
                  ) : isDeparted ? (
                    <div className="w-full rounded-2xl bg-slate-200 py-4 text-center text-sm font-bold text-slate-500">
                      Đã hết hạn đặt chỗ
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        router.push(
                          `/user/checkout?id=${encodeURIComponent(String(selectedDeparture._id))}&adults=1&children=0`
                        )
                      }
                      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-4 text-center text-sm font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:brightness-110 active:scale-95"
                    >
                      Đặt tour ngay &rarr;
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    </button>
                  )}

                  <button
                    onClick={handleConsult}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                  >
                    <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                    </svg>
                    Tư vấn qua chat
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    Hỗ trợ 24/7 · Miễn phí tư vấn trước khi đặt.
                  </p>
                </div>
              </div>

              {/* Support info card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Cần trợ giúp?</h4>
                    <p className="mt-1 text-sm text-slate-500">Đội ngũ AHH luôn sẵn sàng hỗ trợ bạn.</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-base font-bold text-slate-700">+000 (123) 456 88</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-orange-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-base font-bold text-slate-700">quochung.dev@gmail.com</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Tour tương tự - Recommendation */}
          <section className="mt-14">
            <TourRecommendations
              type="similar"
              tourId={id}
              heading="Tour tương tự bạn có thể thích"
              limit={4}
            />
          </section>
        </div>
      </section>

      <CompareTourDialog
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        baseTour={tour}
        allTours={(recRaw as any)?.data || recRaw || []}
      />

      {/* Itinerary Image Lightbox */}
      {activeItineraryImg && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm transition-all animate-in fade-in zoom-in duration-300">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setActiveItineraryImg(null)}
              className="absolute -top-12 right-0 flex items-center gap-2 text-white/80 hover:text-white"
            >
              <span className="text-sm font-medium">Đóng</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            <div className="overflow-hidden rounded-3xl bg-white p-2 shadow-2xl">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                <Image
                  src={activeItineraryImg.url}
                  alt={activeItineraryImg.title}
                  fill
                  className="object-cover"
                  unoptimized // avoid 400 bad request for local dev images
                />
              </div>
              <div className="p-4 text-center">
                <p className="text-lg font-bold text-slate-900">{activeItineraryImg.title}</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10 cursor-pointer" onClick={() => setActiveItineraryImg(null)} />
        </div>
      )}
    </div>
  );
}

