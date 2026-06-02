"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Copy, TicketPercent } from "lucide-react";
import { voucherApi, type PublicVoucher } from "@/lib/voucher/voucherApi";

const vnd = (value?: number | null) =>
  typeof value === "number"
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value)
    : "0đ";

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Đang cập nhật";

const discountLabel = (voucher: PublicVoucher) =>
  voucher.discountType === "percent"
    ? `Giảm ${voucher.discountValue}%`
    : `Giảm ${vnd(voucher.discountValue)}`;

function SkeletonCard() {
  return (
    <div className="h-full rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200" />
      <div className="mt-5 h-10 w-full animate-pulse rounded-full bg-slate-200" />
    </div>
  );
}

function VoucherCard({
  voucher,
  copiedCode,
  onCopy,
}: {
  voucher: PublicVoucher;
  copiedCode: string | null;
  onCopy: (code: string) => void;
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-100">
      <Link href={`/user/vouchers/${voucher._id}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          {voucher.image ? (
            <img
              src={voucher.image}
              alt={voucher.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50">
              <TicketPercent className="h-14 w-14 text-orange-500" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute left-3 top-3 rounded-full bg-orange-500/95 px-3 py-1 text-[11px] font-semibold text-white shadow">
            {discountLabel(voucher)}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <Link href={`/user/vouchers/${voucher._id}`} className="block">
          <h3 className="line-clamp-2 text-[16px] font-semibold leading-snug text-slate-900 transition group-hover:text-[#144d7e] sm:text-[17px]">
            {voucher.name}
          </h3>
        </Link>

        <p className="line-clamp-2 text-[13px] leading-relaxed text-slate-500">
          {voucher.description || "Ưu đãi đặc biệt dành cho khách hàng AHH Travel."}
        </p>

        <div className="mt-1 space-y-1.5 text-[13px] text-slate-700">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-[2px] h-4 w-4 text-orange-500" />
            <span>Hạn dùng: {formatDate(voucher.validUntil)}</span>
          </div>
          <div className="flex items-start gap-2">
            <TicketPercent className="mt-[2px] h-4 w-4 text-orange-500" />
            <span>Đơn tối thiểu: {vnd(voucher.minOrderValue || 0)}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={() => onCopy(voucher.code)}
            className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-[12px] font-semibold text-orange-700 transition hover:border-orange-200 hover:bg-orange-100"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedCode === voucher.code ? "Đã copy" : voucher.code}
          </button>

          <Link
            href={`/user/vouchers/${voucher._id}`}
            className="inline-flex items-center justify-center rounded-full border border-orange-500 bg-white px-4 py-2 text-[12px] font-semibold text-orange-600 transition-all duration-200 group-hover:border-orange-600 group-hover:text-orange-700"
          >
            Xem chi tiết
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function VoucherEventsSection() {
  const [vouchers, setVouchers] = useState<PublicVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    voucherApi
      .getPublicVouchers(6)
      .then((data) => {
        if (mounted) setVouchers(data);
      })
      .catch(() => {
        if (mounted) setVouchers([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      setCopiedCode(null);
    }
  };

  if (!loading && vouchers.length === 0) return null;

  return (
    <section className="bg-slate-50 px-4 py-14 sm:py-16">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Ưu đãi đang diễn ra
          </div>
          <h2 className="mt-3 text-2xl font-extrabold text-[#144d7e] sm:text-3xl md:text-4xl">
            VOUCHER DU LỊCH
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            Lưu mã ưu đãi và dùng ngay khi đặt tour phù hợp.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : vouchers.slice(0, 6).map((voucher) => (
                <VoucherCard
                  key={voucher._id}
                  voucher={voucher}
                  copiedCode={copiedCode}
                  onCopy={copyCode}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
