"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plane,
  TrendingUp,
} from "lucide-react";
import { leaderToursApi, LeaderTour, leaderAuthApi } from "@/lib/leader/leaderApi";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Chờ xác nhận" },
  confirmed: { bg: "bg-blue-100", text: "text-blue-700", label: "Đã xác nhận" },
  in_progress: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Đang diễn ra" },
  completed: { bg: "bg-slate-100", text: "text-slate-700", label: "Hoàn thành" },
  closed: { bg: "bg-red-100", text: "text-red-700", label: "Đã đóng" },
};

export default function LeaderDashboardPage() {
  const [tours, setTours] = useState<LeaderTour[]>([]);
  const [todayTours, setTodayTours] = useState<LeaderTour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [leader, setLeader] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy thông tin leader
        const storedLeader = leaderAuthApi.getStoredLeader();
        setLeader(storedLeader);

        // Lấy tất cả tour
        const allTours = await leaderToursApi.getMyTours();
        setTours(allTours);

        // Lấy tour hôm nay
        const today = await leaderToursApi.getMyTours({ onlyToday: true });
        setTodayTours(today);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Thống kê
  const stats = {
    total: tours.length,
    inProgress: tours.filter((t) => t.status === "in_progress").length,
    confirmed: tours.filter((t) => t.status === "confirmed").length,
    completed: tours.filter((t) => t.status === "completed").length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Xin chào, {leader?.fullName || "Leader"}!
            </h1>
            <p className="text-emerald-100">
              Hôm nay là{" "}
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          {todayTours.length > 0 && (
            <div className="bg-white/20 backdrop-blur rounded-xl px-6 py-4">
              <p className="text-sm text-emerald-100">Tour hôm nay</p>
              <p className="text-3xl font-bold">{todayTours.length}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
          </div>
          <p className="text-slate-600 text-sm">Tổng số tour</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Plane className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">{stats.inProgress}</span>
          </div>
          <p className="text-slate-600 text-sm">Đang diễn ra</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-yellow-600">{stats.confirmed}</span>
          </div>
          <p className="text-slate-600 text-sm">Sắp khởi hành</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-2xl font-bold text-slate-600">{stats.completed}</span>
          </div>
          <p className="text-slate-600 text-sm">Hoàn thành</p>
        </div>
      </div>

      {/* Today's Tours */}
      {todayTours.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Tour hôm nay
            </h2>
          </div>
          <div className="grid gap-4">
            {todayTours.map((tour) => (
              <Link
                key={tour._id}
                href={`/leader/tours/${tour._id}`}
                className="block bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Plane className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg">
                          {tour.title}
                        </h3>
                        <p className="text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-4 h-4" />
                          {tour.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        statusColors[tour.status]?.bg || "bg-slate-100"
                      } ${statusColors[tour.status]?.text || "text-slate-700"}`}
                    >
                      {statusColors[tour.status]?.label || tour.status}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Tours */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Tất cả tour được phân công
          </h2>
          <Link
            href="/leader/tours"
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {tours.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-100">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Chưa có tour nào
            </h3>
            <p className="text-slate-500">
              Bạn chưa được phân công tour nào. Vui lòng liên hệ Admin.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tours.slice(0, 5).map((tour) => (
              <Link
                key={tour._id}
                href={`/leader/tours/${tour._id}`}
                className="block bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{tour.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {tour.destination}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tour.bookedCount || 0}/{tour.quantity} khách
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        statusColors[tour.status]?.bg || "bg-slate-100"
                      } ${statusColors[tour.status]?.text || "text-slate-700"}`}
                    >
                      {statusColors[tour.status]?.label || tour.status}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
