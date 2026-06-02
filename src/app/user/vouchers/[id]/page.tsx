"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Gift,
  Info,
  Tag,
  TicketPercent,
  Users,
  Zap,
} from "lucide-react";
import { voucherApi, type PublicVoucher } from "@/lib/voucher/voucherApi";

// ─── utils ───────────────────────────────────────────────────────────────────
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
    ? `${voucher.discountValue}%`
    : vnd(voucher.discountValue);

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          highlight
            ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-md shadow-orange-200"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className={`mt-0.5 text-sm font-bold ${highlight ? "text-orange-600" : "text-slate-900"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── TourCard ─────────────────────────────────────────────────────────────────
function TourCard({
  tour,
}: {
  tour: NonNullable<PublicVoucher["applicableTours"]>[number];
}) {
  return (
    <Link
      href={`/user/tours/${tour._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-slate-200/80"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {tour.images && tour.images[0] ? (
          <img
            src={tour.images[0]}
            alt={tour.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
            <TicketPercent className="h-10 w-10 text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {tour.code && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#144d7e] shadow-sm backdrop-blur-sm">
            {tour.code}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-[#144d7e]">
          {tour.title}
        </h3>
        {(tour.priceAdult || tour.price) && (
          <p className="mt-auto pt-2 text-base font-extrabold text-[#144d7e]">
            {vnd(tour.priceAdult ?? tour.price)}
            <span className="ml-1 text-xs font-normal text-slate-400">/ người</span>
          </p>
        )}
      </div>
    </Link>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-[360px] animate-pulse bg-blue-950/80" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-[220px] animate-pulse rounded-3xl bg-slate-200" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VoucherDetailPage() {
  const params = useParams<{ id: string }>();
  const [voucher, setVoucher] = useState<PublicVoucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    voucherApi
      .getPublicVoucherById(params.id)
      .then((data) => { if (mounted) setVoucher(data); })
      .catch((err) => {
        if (mounted)
          setError(err?.response?.data?.message || "Không tìm thấy voucher hoặc voucher đã hết hạn.");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [params.id]);

  const usageText = useMemo(() => {
    if (!voucher) return "";
    if (!voucher.usageLimit) return "Không giới hạn";
    const remaining = Math.max(voucher.usageLimit - (voucher.usedCount || 0), 0);
    return `Còn ${remaining} / ${voucher.usageLimit}`;
  }, [voucher]);

  if (loading) return <LoadingSkeleton />;

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
            <Gift className="h-10 w-10 text-orange-500" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Voucher không khả dụng</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{error}</p>
          <Link
            href="/user"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#144d7e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3d66]"
          >
            <ChevronLeft className="h-4 w-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isPercent = voucher.discountType === "percent";

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-blue-950 pb-24 pt-10 text-white">
        {/* dot pattern – giống tour detail */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* bg image mờ nếu có */}
        {voucher.image && (
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <img src={voucher.image} alt={voucher.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/80 to-blue-900/60" />
          </div>
        )}

        {/* glow orbs */}
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          {/* Back button */}
          <button
            onClick={() => window.history.back()}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-blue-100 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại
          </button>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            {/* LEFT: name + desc */}
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-blue-100 backdrop-blur-sm">
                <Zap className="h-3 w-3 fill-current text-orange-300" />
                Ưu đãi đặc biệt
              </div>
              <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {voucher.name}
              </h1>
              {voucher.description && (
                <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100/80 sm:text-base">
                  {voucher.description}
                </p>
              )}

              {/* quick meta chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(voucher.validFrom)} – {formatDate(voucher.validUntil)}
                </span>
                {voucher.minOrderValue ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
                    <Info className="h-3 w-3" />
                    Đơn từ {vnd(voucher.minOrderValue)}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm">
                  <Users className="h-3 w-3" />
                  {usageText} lượt dùng
                </span>
              </div>
            </div>

            {/* RIGHT: discount badge */}
            <div className="w-full max-w-xs shrink-0">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-blue-900/90 to-slate-900/90 px-7 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.6)] backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
                  Ưu đãi lên đến
                </p>
                <p className="mt-1 text-5xl font-black text-amber-300 sm:text-6xl">
                  {discountLabel(voucher)}
                </p>
                <p className="mt-1 text-sm text-blue-100/60">
                  {isPercent ? "phần trăm giảm giá" : "giảm cố định"}
                </p>
                {isPercent && voucher.maxDiscount && (
                  <p className="mt-2 text-xs font-semibold text-blue-200">
                    Tối đa {vnd(voucher.maxDiscount)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wave bottom – giống destination page */}
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

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 pb-14 sm:px-6">

        {/* Voucher code + stats */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <div className="grid sm:grid-cols-[auto_1fr]">
            {/* Code panel */}
            <div className="flex flex-col items-center justify-center gap-2 border-b border-slate-100 bg-gradient-to-br from-orange-50 via-amber-50 to-white px-8 py-8 sm:border-b-0 sm:border-r sm:py-10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-600">
                Mã voucher
              </p>
              {/* Ticket stub */}
              <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-dashed border-orange-300 bg-white px-8 py-4 shadow-inner">
                <div className="absolute -left-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-orange-50 ring-2 ring-orange-200" />
                <div className="absolute -right-3.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full bg-orange-50 ring-2 ring-orange-200" />
                <p className="text-center text-2xl font-black tracking-[0.18em] text-slate-900 sm:text-3xl">
                  {voucher.code}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-400">Dùng mã này khi thanh toán</p>
            </div>

            {/* Stats */}
            <div className="p-6 sm:p-8">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                Thông tin ưu đãi
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Từ ngày"
                  value={formatDate(voucher.validFrom)}
                />
                <StatCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Đến ngày"
                  value={formatDate(voucher.validUntil)}
                />
                <StatCard
                  icon={<Info className="h-4 w-4" />}
                  label="Đơn tối thiểu"
                  value={vnd(voucher.minOrderValue || 0)}
                  highlight
                />
                <StatCard
                  icon={<Users className="h-4 w-4" />}
                  label="Lượt dùng còn"
                  value={usageText}
                  highlight
                />
              </div>
            </div>
          </div>
        </section>

        {/* Conditions + Scope */}
        <section className="mt-6 grid gap-5 sm:grid-cols-2">

          {/* Điều kiện áp dụng */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <CheckCircle2 className="h-5 w-5 text-[#144d7e]" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Điều kiện áp dụng</h2>
            </div>
            <ul className="mt-5 space-y-3">
              {[
                `Voucher có hiệu lực từ ${formatDate(voucher.validFrom)} đến ${formatDate(voucher.validUntil)}.`,
                voucher.minOrderValue
                  ? `Đơn hàng phải đạt tối thiểu ${vnd(voucher.minOrderValue)}.`
                  : "Không yêu cầu giá trị đơn hàng tối thiểu.",
                voucher.usageLimit
                  ? `Tổng giới hạn ${voucher.usageLimit} lượt sử dụng trên toàn hệ thống.`
                  : "Không giới hạn tổng số lượt sử dụng.",
                `Mỗi tài khoản chỉ dùng được ${voucher.userUsageLimit ?? 1} lần.`,
                isPercent && voucher.maxDiscount
                  ? `Số tiền giảm tối đa ${vnd(voucher.maxDiscount)}.`
                  : null,
                voucher.applicableTours?.length
                  ? `Chỉ áp dụng cho ${voucher.applicableTours.length} tour được chỉ định bên dưới.`
                  : "Áp dụng cho tất cả các tour trên hệ thống.",
              ]
                .filter(Boolean)
                .map((cond, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-6 text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span>{cond}</span>
                  </li>
                ))}
            </ul>
          </div>

          {/* Phạm vi áp dụng */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
                <Tag className="h-5 w-5 text-orange-500" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">Phạm vi áp dụng</h2>
            </div>

            {voucher.applicableTours && voucher.applicableTours.length > 0 ? (
              <div className="mt-5 space-y-2">
                {voucher.applicableTours.map((tour) => (
                  <Link
                    key={tour._id}
                    href={`/user/tours/${tour._id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <TicketPercent className="h-4 w-4 shrink-0 text-orange-400" />
                    <span className="line-clamp-1">{tour.title}</span>
                    {tour.code && (
                      <span className="ml-auto shrink-0 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                        {tour.code}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 py-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                  <TicketPercent className="h-7 w-7 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Áp dụng cho tất cả tour</p>
                <p className="text-center text-xs leading-relaxed text-slate-500">
                  Voucher này có thể dùng được cho <br />
                  toàn bộ các tour trên AHH Travel.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Tour cards */}
        {voucher.applicableTours &&
          voucher.applicableTours.length > 0 &&
          voucher.applicableTours.some(
            (t) => (t.images && t.images[0]) || t.priceAdult || t.price
          ) && (
            <section className="mt-12">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
                    Danh sách tour
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#144d7e] sm:text-3xl">
                    Tour Áp Dụng Voucher
                  </h2>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-bold text-slate-600 shadow-sm">
                  {voucher.applicableTours.length} tour
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {voucher.applicableTours.map((tour) => (
                  <TourCard key={tour._id} tour={tour} />
                ))}
              </div>
            </section>
          )}
      </div>
    </div>
  );
}
