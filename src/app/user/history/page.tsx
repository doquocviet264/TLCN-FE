"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "#/stores/auth";
import { getUserToken } from "@/lib/auth/tokenManager";
import {
  getMyBookings,
  type MyBookingItem,
  cancelBooking,
} from "@/lib/checkout/checkoutApi";
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  ChevronRight,
  Filter,
  Info,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import VnpayPayButton from "@/app/user/checkout/VnpayPayButton";

type BookingStatus = "p" | "c" | "x" | "f";

const statusMap: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: any }
> = {
  p: {
    label: "Chờ thanh toán",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
    icon: Clock,
  },
  c: {
    label: "Đã xác nhận",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
    icon: CheckCircle2,
  },
  x: {
    label: "Đã hủy",
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
    icon: XCircle,
  },
  f: {
    label: "Hoàn thành",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
    icon: CheckCircle2,
  },
};

const statusFilters: {
  key: "all" | BookingStatus;
  label: string;
}[] = [
  { key: "all", label: "Tất cả" },
  { key: "p", label: "Chờ thanh toán" },
  { key: "c", label: "Đã xác nhận" },
  { key: "f", label: "Hoàn thành" },
  { key: "x", label: "Đã hủy" },
];

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "Chưa xác định";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Chưa xác định";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + " đ";
}

// ... (Giữ nguyên hàm getPaymentText logic cũ nhưng format lại string nếu cần) ...
function getPaymentText(b: MyBookingItem) {
  const {
    totalPrice,
    paidAmount,
    depositAmount,
    depositPaid,
    requireFullPayment,
  } = b;
  if (!totalPrice) return "Chưa có thông tin tổng tiền";
  const remaining = Math.max(totalPrice - paidAmount, 0);
  const percent =
    totalPrice > 0
      ? Math.min(100, Math.round((paidAmount / totalPrice) * 100))
      : 0;

  if (b.bookingStatus === "x")
    return `Đã hủy · Đã thanh toán: ${formatPrice(paidAmount)}`;
  if (percent >= 100) return `Đã thanh toán đủ (${formatPrice(paidAmount)})`;
  if (depositPaid && depositAmount > 0)
    return `Đã cọc ${formatPrice(depositAmount)} · Còn lại ${formatPrice(
      remaining
    )}`;
  if (requireFullPayment)
    return `Yêu cầu thanh toán đủ · Còn lại ${formatPrice(remaining)}`;
  if (paidAmount > 0)
    return `Đã thanh toán ${formatPrice(paidAmount)} · Còn lại ${formatPrice(
      remaining
    )}`;
  return "Chưa thanh toán";
}

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function HistoryPage() {
  const [bookings, setBookings] = useState<MyBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all"
  );

  const [cancelingCode, setCancelingCode] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyBookingItem | null>(null);

  const accessToken =
    useAuthStore((s) => s.token.accessToken) || getUserToken();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!accessToken) {
      window.location.href = "/auth/login";
      return;
    }
    fetchBookings();
  }, [accessToken, page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyBookings(page, 10);
      if (response?.data) {
        setBookings(response.data);
        setTotalPages(Math.ceil(response.total / response.limit) || 1);
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(
        err?.response?.data?.message || "Không thể tải lịch sử booking."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    const code = cancelTarget.code;
    try {
      setError("");
      setSuccess("");
      setCancelingCode(code);

      const res = await cancelBooking(code);
      if (res?.ok) {
        setSuccess("Huỷ booking thành công.");
        setCancelTarget(null);
        await fetchBookings();
      } else {
        setError("Không thể huỷ booking. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Error cancel booking:", err);
      setError(err?.response?.data?.message || "Không thể huỷ booking.");
    } finally {
      setCancelingCode(null);
    }
  };

  const filteredBookings = useMemo(() => {
    const list =
      statusFilter === "all"
        ? bookings
        : bookings.filter((b) => b.bookingStatus === statusFilter);
    return [...list].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
  }, [bookings, statusFilter]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const upcoming = bookings.filter((b) => {
      if (!b.startDate) return false;
      const start = new Date(b.startDate).getTime();
      const now = Date.now();
      return (
        start >= now && (b.bookingStatus === "p" || b.bookingStatus === "c")
      );
    }).length;
    const totalPaid = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    return { total, upcoming, totalPaid };
  }, [bookings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-20 bg-slate-200 rounded-xl animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 bg-white rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600">
      {/* HEADER SECTION */}
      <div className="bg-blue-950 pt-10 pb-20 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image
                src={user?.avatar || "/default-avatar.png"}
                alt="Avatar"
                width={64}
                height={64}
                className="rounded-full object-cover border-2 border-orange-500 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-blue-950" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Chào, {user?.fullName || "Bạn"}!
              </h1>
              <p className="text-blue-200 text-sm">Thành viên AHH Travel</p>
            </div>
          </div>

          {/* Stats Cards Small */}
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 px-5 border border-white/10 text-center">
              <p className="text-xs text-blue-200 uppercase tracking-wider">
                Tổng booking
              </p>
              <p className="text-xl font-bold text-orange-400">{stats.total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 px-5 border border-white/10 text-center">
              <p className="text-xs text-blue-200 uppercase tracking-wider">
                Sắp đi
              </p>
              <p className="text-xl font-bold text-emerald-400">
                {stats.upcoming}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION (Negative Margin to pull up) */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 pb-20">
        {/* Filter Tabs */}
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex flex-wrap gap-2 mb-8 overflow-x-auto no-scrollbar">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                statusFilter === f.key
                  ? "bg-blue-950 text-white shadow-md"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
                error
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}
            >
              {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-medium">{error || success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Chưa có booking nào
            </h3>
            <p className="text-slate-500 mb-6">
              Bạn chưa có chuyến đi nào ở trạng thái này.
            </p>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-full font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-700 transition-all"
            >
              Đặt tour ngay <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {filteredBookings.map((booking) => {
              const statusMeta = statusMap[booking.bookingStatus];
              const StatusIcon = statusMeta.icon;
              const isCanceling = cancelingCode === booking.code;

              return (
                <motion.div
                  key={booking.code}
                  variants={itemVariants}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-64 h-48 md:h-auto relative shrink-0">
                      <Image
                        src={booking.tourImage || "/hot1.jpg"}
                        alt={booking.tourTitle || "Tour"}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${statusMeta.bg} ${statusMeta.color}`}
                        >
                          <StatusIcon size={12} /> {statusMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 md:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-blue-950 line-clamp-2 pr-4">
                            {booking.tourTitle}
                          </h3>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-orange-600">
                              {formatPrice(booking.totalPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-slate-500 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>{formatDate(booking.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            <span>
                              {booking.numAdults} người lớn,{" "}
                              {booking.numChildren} trẻ em
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <span className="truncate">
                              {booking.tourDestination}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} className="text-slate-400" />
                            <span className="text-orange-600 font-medium">
                              {getPaymentText(booking)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-slate-400 font-mono">
                          #{booking.code}
                        </span>

                        <div className="flex items-center gap-3">
                          {booking.bookingStatus === "p" && (
                            <>
                              <button
                                onClick={() => setCancelTarget(booking)}
                                disabled={isCanceling}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Huỷ tour
                              </button>
                              {/* Nút thanh toán VNPay */}
                              <div className="scale-95">
                                <VnpayPayButton
                                  bookingCode={booking.code}
                                  label="Thanh toán"
                                />
                              </div>
                            </>
                          )}
                          <Link
                            href={`/user/booking/${booking.code}`}
                            className="px-5 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  page === i + 1
                    ? "bg-blue-950 text-white shadow-lg"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-orange-500"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CANCEL MODAL */}
      <AnimatePresence>
        {cancelTarget && (
          <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-blue-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-red-50 p-6 border-b border-red-100 flex gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-500">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900">
                    Huỷ đặt tour?
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    Hành động này không thể hoàn tác. Bạn chắc chắn muốn huỷ?
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-slate-50 p-4 rounded-xl mb-6 text-sm text-slate-600 space-y-2">
                  <p>
                    <span className="font-semibold text-slate-800">Tour:</span>{" "}
                    {cancelTarget.tourTitle}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Mã:</span>{" "}
                    {cancelTarget.code}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">
                      Ngày đi:
                    </span>{" "}
                    {formatDate(cancelTarget.startDate)}
                  </p>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setCancelTarget(null)}
                    className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                  >
                    Không, quay lại
                  </button>
                  <button
                    onClick={handleCancelConfirm}
                    disabled={cancelingCode === cancelTarget.code}
                    className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all disabled:opacity-70"
                  >
                    {cancelingCode ? "Đang xử lý..." : "Xác nhận huỷ"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
