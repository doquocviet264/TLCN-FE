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
} from "lucide-react";
import {
  leaderToursApi,
  LeaderTour,
  leaderAuthApi,
} from "@/lib/leader/leaderApi";

const statusColors: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    label: "Chờ xác nhận",
  },
  confirmed: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    label: "Đã xác nhận",
  },
  in_progress: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    label: "Đang diễn ra",
  },
  completed: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    label: "Hoàn thành",
  },
  closed: { bg: "bg-red-500/10", text: "text-red-400", label: "Đã đóng" },
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
        const storedLeader = leaderAuthApi.getStoredLeader();
        setLeader(storedLeader);

        const allTours = await leaderToursApi.getMyTours();
        setTours(allTours);

        const today = await leaderToursApi.getMyTours({ onlyToday: true });
        setTodayTours(today);
      } catch (err: any) {
        console.error(err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = {
    total: tours.length,
    inProgress: tours.filter((t) => t.status === "in_progress").length,
    upcoming: tours.filter((t) => t.status === "confirmed").length,
    completed: tours.filter((t) => t.status === "completed").length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      {/* Welcome Header - Blue Gradient như Admin */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium">Xin chào,</p>
            <h1 className="text-4xl font-bold mt-1">
              {leader?.fullName || "Tour Leader"} 👋
            </h1>
            <p className="text-blue-100 mt-2 text-lg">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          {todayTours.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-6 text-center">
              <p className="text-xs uppercase tracking-widest text-blue-200">
                Hôm nay
              </p>
              <p className="text-5xl font-bold mt-1 text-white">
                {todayTours.length}
              </p>
              <p className="text-blue-100">tour đang diễn ra</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Tổng tour",
            value: stats.total,
            icon: Calendar,
            color: "blue",
          },
          {
            label: "Đang diễn ra",
            value: stats.inProgress,
            icon: Plane,
            color: "emerald",
          },
          {
            label: "Sắp khởi hành",
            value: stats.upcoming,
            icon: Clock,
            color: "amber",
          },
          {
            label: "Hoàn thành",
            value: stats.completed,
            icon: CheckCircle2,
            color: "slate",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-4xl font-bold mt-3">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center`}
              >
                <stat.icon className={`w-7 h-7 text-${stat.color}-400`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tour hôm nay */}
      {todayTours.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
            <Clock className="w-5 h-5" /> Tour hôm nay
          </h2>
          <div className="space-y-4">
            {todayTours.map((tour) => (
              <Link
                key={tour._id}
                href={`/leader/tours/${tour._id}`}
                className="block bg-white/5 border border-white/10 hover:border-blue-400 rounded-2xl p-6 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                      {tour.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {tour.destination}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {tour.bookedCount || 0}/{tour.quantity} khách
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-5 py-2 rounded-full text-sm font-medium ${statusColors[tour.status]?.bg} ${statusColors[tour.status]?.text}`}
                  >
                    {statusColors[tour.status]?.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tất cả tour */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
            <Calendar className="w-5 h-5" />
            Tất cả tour được phân công
          </h2>
          <Link
            href="/leader/tours"
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-sm"
          >
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {tours.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
            <Calendar className="w-20 h-20 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-300">
              Chưa có tour nào
            </h3>
            <p className="text-slate-500 mt-2">
              Bạn chưa được phân công tour nào.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tours.slice(0, 6).map((tour) => (
              <Link
                key={tour._id}
                href={`/leader/tours/${tour._id}`}
                className="bg-white/5 border border-white/10 hover:border-blue-400 rounded-2xl p-6 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                      {tour.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {tour.destination}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {formatDate(tour.startDate)} —{" "}
                        {formatDate(tour.endDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {tour.bookedCount || 0}/{tour.quantity} khách
                      </span>
                    </div>
                  </div>
                  <div
                    className={`px-5 py-2 rounded-full text-sm font-medium ${statusColors[tour.status]?.bg} ${statusColors[tour.status]?.text}`}
                  >
                    {statusColors[tour.status]?.label}
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
