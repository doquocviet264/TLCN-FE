"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Clock3, Plane, CalendarDays, Users2 } from "lucide-react";

export type CardHotProps = {
  image: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  originalPrice?: number | string;
  salePrice?: number | string;
  discountPercent?: number;
  discountAmount?: number;
  href?: string;
  time?: string;
  destination?: string;
  schedule?: string;
  seats?: number | string;
  startDate?: string | Date; // Ngày khởi hành để kiểm tra đã qua chưa
  meta?: {
    duration?: string;
    destination?: string;
    schedule?: string;
    seats?: number | string;
  };
  upcomingDepartures?: Array<{
    _id: string;
    startDate: string;
    max_guests: number;
    current_guests: number;
    priceAdult: number;
  }>;
  onClick?: () => void;
};

/* ============== helpers ============== */
const toNumber = (v?: number | string) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d]/g, ""));
    return Number.isNaN(n) ? undefined : n;
  }
};

const vnd = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("vi-VN", {
        maximumFractionDigits: 0,
      }).format(n) + "đ"
    : "—";

// Kiểm tra tour đã khởi hành chưa
const checkIsDeparted = (startDate?: string | Date): boolean => {
  if (!startDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tourStartDate = new Date(startDate);
  tourStartDate.setHours(0, 0, 0, 0);
  return tourStartDate < today;
};

/* ============== component ============== */
export default function CardHot(props: CardHotProps) {
  const {
    image,
    title,
    subtitle,
    badgeText,
    originalPrice,
    salePrice,
    discountPercent,
    discountAmount,
    href = "#",
    startDate,
  } = props;

  // Kiểm tra tour đã khởi hành
  const isDeparted = checkIsDeparted(startDate);

  // ---- pricing ----
  const originalNum = toNumber(originalPrice);
  let saleNum = toNumber(salePrice);

  if (saleNum == null && originalNum != null) {
    if (typeof discountPercent === "number") {
      saleNum = Math.round(originalNum * (1 - discountPercent / 100));
    } else if (typeof discountAmount === "number") {
      saleNum = Math.round(originalNum - discountAmount);
    }
  }

  const hasSale =
    originalNum != null && saleNum != null && saleNum < originalNum;
  const priceToShow = hasSale ? saleNum : saleNum ?? originalNum;

  // ---- tour info ----
  const durationText = props.meta?.duration ?? props.time;
  const destinationTxt = props.meta?.destination ?? props.destination;
  const scheduleText = props.meta?.schedule ?? props.schedule;
  const seatsText = props.meta?.seats ?? props.seats;

  return (
    <Link
      href={href}
      onClick={props.onClick}
      className="
        group flex h-full flex-col overflow-hidden
        rounded-2xl border border-slate-100 bg-white
        shadow-sm transition-all duration-300
        hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-100
      "
    >
      {/* media */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* overlay nhẹ khi hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Overlay mờ khi tour đã khởi hành */}
        {isDeparted && (
          <div className="absolute inset-0 bg-slate-900/40 z-10" />
        )}

        {/* Badge: Đã khởi hành hoặc badge tùy chỉnh */}
        {isDeparted ? (
          <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-rose-500/95 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Đã khởi hành
          </div>
        ) : badgeText ? (
          <div className="absolute left-3 top-3 rounded-full bg-orange-500/95 px-3 py-1 text-[11px] font-semibold text-white shadow">
            {badgeText}
          </div>
        ) : null}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <h3 className="line-clamp-2 text-[16px] sm:text-[17px] font-semibold leading-snug text-slate-900">
          {title}
        </h3>

        {subtitle && (
          <p className="line-clamp-1 text-[13px] text-slate-500">{subtitle}</p>
        )}

        {/* tour info */}
        {(durationText || destinationTxt || scheduleText || seatsText) && (
          <ul className="mt-1.5 space-y-1.5 text-[13px] sm:text-[14px] leading-snug text-slate-700">
            {durationText && (
              <li className="flex items-start gap-2">
                <Clock3 className="mt-[2px] h-4 w-4 text-orange-500" />
                <span>{durationText}</span>
              </li>
            )}
            {destinationTxt && (
              <li className="flex items-start gap-2">
                <Plane className="mt-[2px] h-4 w-4 text-orange-500" />
                <span>{destinationTxt}</span>
              </li>
            )}
            
            {/* Hiển thị các ngày khởi hành thay vì "Còn X chỗ" */}
            {props.upcomingDepartures && props.upcomingDepartures.length > 0 ? (
              <li className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-start gap-2">
                   <CalendarDays className="mt-[2px] h-4 w-4 text-orange-500" />
                   <span className="font-semibold text-slate-800">Lịch khởi hành:</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  {props.upcomingDepartures.slice(0, 3).map((dep) => (
                    <span 
                      key={dep._id} 
                      className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-100 text-[11px] font-medium text-orange-700"
                    >
                      {new Date(dep.startDate).toLocaleDateString("vi-VN")}
                    </span>
                  ))}
                  {props.upcomingDepartures.length > 3 && (
                    <span className="text-[11px] text-slate-400 self-center">
                      +{props.upcomingDepartures.length - 3} ngày khác
                    </span>
                  )}
                </div>
              </li>
            ) : (
                <>
                  {scheduleText && (
                    <li className="flex items-start gap-2">
                      <CalendarDays className="mt-[2px] h-4 w-4 text-orange-500" />
                      <span>{scheduleText}</span>
                    </li>
                  )}
                  {seatsText != null && seatsText !== "" && (
                    <li className="flex items-start gap-2">
                      <Users2 className="mt-[2px] h-4 w-4 text-orange-500" />
                      <span>Còn {seatsText} chỗ</span>
                    </li>
                  )}
                </>
            )}
          </ul>
        )}

        {/* footer */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="leading-tight">
            {hasSale && (
              <div className="text-[12px] text-slate-400 line-through">
                {vnd(originalNum)}
              </div>
            )}
            <div className="tabular-nums text-[17px] sm:text-[18px] font-bold text-slate-900">
              {vnd(priceToShow)}
            </div>
            {hasSale && typeof discountPercent === "number" && (
              <div className="mt-0.5 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">
                -{discountPercent}%
              </div>
            )}
          </div>

          <div
            className="
    inline-flex items-center justify-center
    rounded-full border border-orange-500
    px-4 py-2 text-[12px] font-semibold
    text-orange-600 bg-white
    transition-all duration-200

    group-hover:border-orange-600
    group-hover:text-orange-700

    active:bg-gradient-to-r active:from-orange-500 active:to-amber-400
    active:text-white active:border-transparent
    active:scale-[0.97]
  "
          >
            Xem chi tiết
          </div>
        </div>
      </div>
    </Link>
  );
}
