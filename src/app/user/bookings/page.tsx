"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import {
  useMyBookings,
  useCancelBooking,
} from "#/hooks/bookings-hook/useBooking";
import {
  pickBookingImage,
  formatVND,
  fmtDate,
  StatusChip,
  classifyBooking,
  type BookingTab,
} from "./_utils";

/* ---------- Tabs helper ---------- */
const tabs: { key: BookingTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ thanh toán" },
  { key: "upcoming", label: "Sắp khởi hành" },
  { key: "done", label: "Hoàn thành" },
  { key: "canceled", label: "Đã huỷ" },
];

export default function MyBookingsPage() {
  // data
  const { data, isLoading, isError, refetch } = useMyBookings();
  const cancelMut = useCancelBooking({
    onSuccess: () => refetch(),
  });

  const [activeTab, setActiveTab] = React.useState<BookingTab>("all");
  const list: any[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  const filtered = React.useMemo(() => {
    if (activeTab === "all") return list;
    return list.filter((b) => classifyBooking(b) === activeTab);
  }, [list, activeTab]);

  return (
    <div className="mx-auto w-[92%] max-w-6xl py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              Đặt chỗ của tôi
            </h1>
            <p className="text-slate-500 text-sm">
              Xem lại các đơn đặt tour, thanh toán cọc hoặc huỷ nếu cần
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === t.key
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                : "bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Nội dung */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          Đang tải danh sách đặt chỗ…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Không tải được dữ liệu. Vui lòng thử lại.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Bạn chưa có đặt chỗ nào trong mục “
          {tabs.find((t) => t.key === activeTab)?.label}”.
        </div>
      ) : (
        <div className="space-y-10">
          {filtered.map((b) => (
            <BookingRow
              key={b?.code ?? b?._id}
              booking={b}
              onCancel={() =>
                cancelMut.mutate(String(b?.code ?? b?.bookingCode ?? ""))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
const pickTourImage = (t: any): string => {
  const imgs = Array.isArray(t?.images) ? t.images.filter(Boolean) : [];
  if (imgs.length > 0) {
    const seed = String(t?._id ?? t?.id ?? t?.title ?? "");
    let hash = 0;
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    return imgs[hash % imgs.length];
  }
  return t?.image ?? t?.cover ?? "/hot1.jpg"; // Đây là ảnh default của bạn
};

/* ---------- 1 item booking (giống card ở trang Cài đặt) ---------- */
function BookingRow({
  booking,
  onCancel,
}: {
  booking: any;
  onCancel: () => void;
}) {
  const status = classifyBooking(booking);
  const tour: any =
    (booking?.tourId && typeof booking.tourId === "object"
      ? booking.tourId
      : null) ??
    (booking?.tour && typeof booking.tour === "object" ? booking.tour : null) ??
    {};
  const title = tour?.title ?? "Tour";
  const image = pickTourImage(tour);
  const total = Number(booking?.totalPrice || 0);
  const paid = Number(booking?.paidAmount || 0);
  const remain = Math.max(0, total - paid);
  const guests =
    Number(booking?.numAdults || 0) + Number(booking?.numChildren || 0);
  const start = tour?.startDate
    ? fmtDate(tour.startDate)
    : "Thời gian linh hoạt";
  const code = String(booking?.code ?? booking?.bookingCode ?? "");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[280px_minmax(0,1fr)]">
        {/* Ảnh */}
        <div className="relative h-[220px] overflow-hidden rounded-t-2xl md:h-full md:rounded-l-2xl md:rounded-tr-none">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/hot1.jpg";
            }}
          />
          <div className="absolute left-3 top-3">
            <StatusChip booking={booking} />
          </div>
        </div>

        {/* Nội dung */}
        <div className="flex flex-col gap-4 p-5 md:p-6">
          {/* header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`/user/bookings/${encodeURIComponent(code)}`}
              className="hover:text-orange-600"
            >
              <h2 className="text-[18px] font-semibold leading-tight">
                Đơn {code} • {title}
              </h2>
            </Link>
            <div className="text-sm text-slate-500">
              Mã đơn <b className="text-slate-800">{code}</b>
            </div>
          </div>

          {/* 3 cột tổng/đã thanh toán/còn lại */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatBox
              icon={<CreditCard size={16} />}
              label="Tổng thanh toán"
              value={formatVND(total)}
            />
            <StatBox
              icon={<CheckCircle2 size={16} />}
              label="Đã thanh toán"
              value={formatVND(paid)}
            />
            <StatBox
              icon={<AlertCircle size={16} />}
              label="Còn lại"
              value={formatVND(remain)}
            />
          </div>

          {/* thông tin tour */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoPill
              icon={<Users size={16} />}
              text={`${guests} khách (NL ${booking?.numAdults || 0}${
                Number(booking?.numChildren || 0)
                  ? `, TE ${booking.numChildren}`
                  : ""
              })`}
            />
            <InfoPill
              icon={<MapPin size={16} />}
              text={tour?.destination ?? "Điểm đến"}
            />
            <InfoPill icon={<Calendar size={16} />} text={start} />
            <InfoPill
              icon={<Clock size={16} />}
              text={tour?.time ?? "Thời lượng tuỳ tour"}
            />
          </div>

          {/* actions */}
          <div className="mt-1 flex flex-wrap items-center gap-10">
            <Link
              href={`/user/booking/${booking.code}`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-blue-500 hover:text-blue-600"
            >
              Chi tiết
            </Link>

            <Link
              href={`/user/destination/${tour?.destinationSlug ?? ""}/${
                tour?._id ?? ""
              }`}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:border-orange-500 hover:text-orange-600"
            >
              Xem tour
            </Link>

            <div className="ml-auto flex items-center gap-8">
              {/* Thanh toán cọc / đủ — chỉ khi đang chờ hoặc sắp khởi hành */}
              {(status === "pending" || status === "upcoming") &&
                remain > 0 && (
                  <Link
                    href={`/user/checkout?id=${
                      tour?._id ?? booking?.tourId ?? ""
                    }`}
                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-600 hover:to-orange-700"
                  >
                    {status === "pending" ? "Thanh toán cọc" : "Thanh toán"}
                  </Link>
                )}

              {/* Huỷ đơn — chỉ khi pending */}
              {status === "pending" && (
                <button
                  onClick={onCancel}
                  className="inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                >
                  <XCircle size={16} className="mr-2" /> Hủy đơn
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- small atoms ---------- */
function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-slate-600">
        <span className="text-slate-700">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-semibold text-emerald-700">{value}</span>
    </div>
  );
}

function InfoPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
      <span className="text-slate-600">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}
