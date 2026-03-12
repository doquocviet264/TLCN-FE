"use client";

import React from "react";
import Link from "next/link";
import { useDashboardStats, useOngoingTours } from "@/app/admin/hooks/useAdmin";
import RevenueChart from "./RevenueChart";
import BookingsChart from "./BookingsChart";
import TopRevenueTours from "./TopRevenueTours";
import BookingStatusChart from "./BookingStatusChart";

/* ===== Helpers ===== */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusColor = (status: string) => {
  switch (status) {
    case "p":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "c":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "x":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border border-slate-200";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "p":
      return "Chờ xác nhận";
    case "c":
      return "Đã xác nhận";
    case "x":
      return "Đã hủy";
    default:
      return status;
  }
};

export default function AdminDashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats();
  const { data: ongoingTours, isLoading: toursLoading } = useOngoingTours();
  const tours = Array.isArray(ongoingTours) ? ongoingTours : [];

  if (statsLoading || toursLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-800">
          Lỗi khi tải dữ liệu dashboard
        </h2>
        <p className="mt-2 text-sm text-rose-600">
          {(statsError as any).message || "Vui lòng thử lại sau."}
        </p>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const recentBookings = stats?.recentBookings || [];
  const popularTours = stats?.popularTours || [];
  const statusDistribution = stats?.statusDistribution || {};
  const topRevenueTours = stats?.topRevenueTours || [];
  const monthlyRevenue = stats?.monthlyRevenue || [];
  const monthlyBookingsChart = stats?.monthlyBookingsChart || [];
  const bookingStatusStats = stats?.bookingStatusStats || {
    confirmed: { count: 0, revenue: 0 },
    pending: { count: 0, revenue: 0 },
    cancelled: { count: 0, revenue: 0 },
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* ===== HEADER BANNER (sáng, theo màu chủ đạo) ===== */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-blue-900 via-blue-700 to-orange-500 p-6 shadow-lg shadow-blue-900/20 dark:border-slate-800">
          {/* glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-orange-400/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-emerald-400/35 blur-3xl" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                Bảng điều khiển quản trị
              </p>
              <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
                Xin chào, Admin 👋
              </h1>
              <p className="mt-2 max-w-xl text-sm text-blue-100 md:text-base">
                Xem nhanh tình trạng người dùng, tour, doanh thu và các hoạt
                động đặt tour trong hệ thống Travela.
              </p>
            </div>

            <div className="mt-3 flex flex-col items-start gap-3 md:mt-0 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-xs font-medium text-emerald-100 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Hệ thống hoạt động ổn định
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-blue-100 md:text-sm">
                <span className="rounded-full bg-blue-900/60 px-3 py-1">
                  Tổng tours:{" "}
                  <b>{overview.totalTours?.toLocaleString() || 0}</b>
                </span>
                <span className="rounded-full bg-blue-900/60 px-3 py-1">
                  Đặt tour tháng này:{" "}
                  <b>{overview.monthlyBookings?.toLocaleString() || 0}</b>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== OVERVIEW STATS (nền trắng, viền nhẹ) ===== */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {/* Users */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-400/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tổng người dùng
                </p>
                <p className="mt-2 text-2xl font-extrabold text-blue-950 dark:text-slate-50">
                  {overview.totalUsers?.toLocaleString() || 0}
                </p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                  {overview.newUsersThisMonth
                    ? `+${overview.newUsersThisMonth} tháng này`
                    : "Theo dõi tăng trưởng trong Admin"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 shadow-sm dark:bg-blue-900/40 dark:text-blue-200">
                <i className="ri-user-line text-2xl" />
              </div>
            </div>
          </div>

          {/* Tours */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tours
                </p>
                <p className="mt-2 text-2xl font-extrabold text-blue-950 dark:text-slate-50">
                  {overview.totalTours?.toLocaleString() || 0}
                </p>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                  {overview.activeTours || 0} tour đang hoạt động
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-200">
                <i className="ri-map-pin-line text-2xl" />
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-purple-400/60 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Đặt tour tháng này
                </p>
                <p className="mt-2 text-2xl font-extrabold text-blue-950 dark:text-slate-50">
                  {overview.monthlyBookings?.toLocaleString() || 0}
                </p>
                <p className="mt-1 text-xs text-purple-600 dark:text-purple-300">
                  Tổng hệ thống:{" "}
                  <span className="font-semibold">
                    {overview.totalBookings?.toLocaleString() || 0}
                  </span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 shadow-sm dark:bg-purple-900/40 dark:text-purple-200">
                <i className="ri-calendar-check-line text-2xl" />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-400/70 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Doanh thu năm
                </p>
                <p className="mt-2 text-2xl font-extrabold text-orange-600 dark:text-amber-300">
                  {formatCurrency(overview.yearlyRevenue || 0)}
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                  ⭐ {(overview.averageRating || 0).toFixed(1)}/5 điểm đánh giá
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 shadow-sm dark:bg-orange-900/40 dark:text-orange-200">
                <i className="ri-money-dollar-circle-line text-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ===== SECONDARY STATS ===== */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Content / community */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-100">
                B
              </span>
              Nội dung & cộng đồng
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Bài viết blog
                </span>
                <span className="font-semibold text-blue-950 dark:text-slate-50">
                  {overview.totalBlogs || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Đánh giá
                </span>
                <span className="font-semibold text-blue-950 dark:text-slate-50">
                  {overview.totalReviews || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Tour status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-100">
                T
              </span>
              Trạng thái tours
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Chờ duyệt
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  {statusDistribution.pending || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Đã duyệt
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {statusDistribution.confirmed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Đang diễn ra
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                  {statusDistribution.inProgress || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">
                  Hoàn thành
                </span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800/60 dark:text-slate-100">
                  {statusDistribution.completed || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Popular tours */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-50 text-xs font-bold text-orange-600 dark:bg-orange-900/40 dark:text-orange-200">
                  ⭐
                </span>
                Tours phổ biến
              </span>
              <Link
                href="/admin/tours"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Quản lý tours →
              </Link>
            </h3>
            <div className="space-y-3">
              {popularTours.slice(0, 3).map((tour: any, index: number) => (
                <div
                  key={tour._id || index}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {tour.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {tour.bookingCount} lượt đặt
                    </p>
                  </div>
                </div>
              ))}

              {popularTours.length === 0 && (
                <p className="py-3 text-center text-xs text-slate-400">
                  Chưa có dữ liệu tour phổ biến.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ===== BIỂU ĐỒ DOANH THU + BOOKING ===== */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueChart data={monthlyRevenue} />
          <BookingsChart data={monthlyBookingsChart} />
        </section>

        {/* ===== TOP REVENUE TOURS + BOOKING STATUS ===== */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopRevenueTours data={topRevenueTours} />
          <BookingStatusChart data={bookingStatusStats} />
        </section>

        {/* ===== RECENT BOOKINGS + ONGOING TOURS ===== */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent bookings */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Đặt tour gần đây
              </h3>
              <Link
                href="/admin/bookings"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="p-5">
              {recentBookings.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Chưa có đặt tour nào gần đây.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking: any) => (
                    <div
                      key={booking._id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {booking.userInfo?.fullName || "Khách lẻ"}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                          {booking.tourInfo?.title || "Tour không xác định"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                          {booking.createdAt
                            ? formatDateTime(booking.createdAt)
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                          {formatCurrency(booking.totalPrice || 0)}
                        </p>
                        <span
                          className={`mt-1 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(
                            booking.bookingStatus
                          )}`}
                        >
                          {getStatusText(booking.bookingStatus)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ongoing tours */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Tours đang hoạt động
              </h3>
              <Link
                href="/admin/tours"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
              >
                Quản lý tours →
              </Link>
            </div>
            <div className="p-5">
              {tours.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  Hiện chưa có tour nào đang diễn ra.
                </p>
              ) : (
                <div className="space-y-3">
                  {tours.slice(0, 5).map((tour: any) => (
                    <div
                      key={tour._id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {tour.title}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                          {tour.destination}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                          {tour.startDate
                            ? `Khởi hành: ${formatDateTime(tour.startDate)}`
                            : "Chưa xác định ngày khởi hành"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-300">
                          Khách hiện tại
                        </p>
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                          {tour.current_guests || 0}/{tour.quantity || "—"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">
                          Leader:{" "}
                          <span className="font-medium text-slate-700 dark:text-slate-100">
                            {tour.leader?.fullName || "Chưa gán"}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
