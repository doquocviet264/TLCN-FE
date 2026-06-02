"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Zap,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import {
  leaderToursApi,
  LeaderTour,
  leaderAuthApi,
} from "@/lib/leader/leaderApi";

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; dot: string; label: string; bar: string }> = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500",   label: "Chờ xác nhận",  bar: "from-amber-400 to-amber-500" },
  confirmed:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500",    label: "Đã xác nhận",   bar: "from-blue-400 to-blue-500" },
  in_progress: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500", label: "Đang diễn ra",  bar: "from-emerald-400 to-emerald-500" },
  completed:   { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",  dot: "bg-slate-400",   label: "Hoàn thành",    bar: "from-slate-300 to-slate-400" },
  closed:      { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",    dot: "bg-red-500",     label: "Đã đóng",       bar: "from-red-400 to-red-500" },
};

/* Animated counter */
function AnimatedCounter({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setCount(target); return; }
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span>{count}</span>;
}

/* Skeletons */
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-8 w-10 bg-slate-100 rounded" />
          <div className="h-2.5 w-16 bg-slate-100 rounded" />
        </div>
        <div className="w-11 h-11 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}
function TourSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex gap-4">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
        <div className="h-2 w-full bg-slate-100 rounded-full" />
      </div>
    </div>
  );
}

export default function LeaderDashboardPage() {
  const router = useRouter();
  const [tours, setTours]           = useState<LeaderTour[]>([]);
  const [todayTours, setTodayTours] = useState<LeaderTour[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");
  const [leader, setLeader]         = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = leaderAuthApi.getStoredLeader();
        setLeader(stored);
        const [all, today] = await Promise.all([
          leaderToursApi.getMyTours(),
          leaderToursApi.getMyTours({ onlyToday: true }),
        ]);
        setTours(all);
        setTodayTours(today);
      } catch {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const stats = {
    total:      tours.length,
    inProgress: tours.filter(t => t.status === "in_progress").length,
    upcoming:   tours.filter(t => t.status === "confirmed").length,
    completed:  tours.filter(t => t.status === "completed").length,
  };

  const statCards = [
    { label: "Tổng tour",       value: stats.total,      icon: BarChart3,    iconBg: "bg-blue-100",    iconColor: "text-blue-600",    sub: "Tất cả lịch trình" },
    { label: "Đang diễn ra",    value: stats.inProgress, icon: Plane,        iconBg: "bg-emerald-100", iconColor: "text-emerald-600", sub: "Tour đang chạy" },
    { label: "Sắp khởi hành",   value: stats.upcoming,   icon: Clock,        iconBg: "bg-amber-100",   iconColor: "text-amber-600",   sub: "Đã xác nhận" },
    { label: "Hoàn thành",      value: stats.completed,  icon: CheckCircle2, iconBg: "bg-violet-100",  iconColor: "text-violet-600",  sub: "Tour kết thúc" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-4 md:p-6 lg:p-8 space-y-6">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl
          bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800
          shadow-lg shadow-blue-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.2),transparent_55%)]" />
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute right-0 bottom-0 w-32 h-32 rounded-full bg-orange-500/10 blur-xl" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-blue-200/80 text-sm">{greeting()},</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-0.5">
                  {leader?.fullName || "Tour Leader"} 👋
                </h1>
                <p className="text-blue-200/70 text-sm mt-1">
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
                {!isLoading && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {stats.inProgress > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30
                        text-emerald-200 text-xs font-medium px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {stats.inProgress} tour đang diễn ra
                      </span>
                    )}
                    {stats.upcoming > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30
                        text-blue-200 text-xs font-medium px-3 py-1 rounded-full">
                        <Zap className="w-3 h-3" />
                        {stats.upcoming} tour sắp khởi hành
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!isLoading && todayTours.length > 0 && (
                <div className="bg-white/15 backdrop-blur-sm border border-white/20
                  rounded-xl px-6 py-4 text-center flex-shrink-0">
                  <p className="text-xs uppercase tracking-wider text-blue-200/70">Hôm nay</p>
                  <p className="text-4xl font-extrabold text-white mt-0.5">{todayTours.length}</p>
                  <p className="text-blue-200 text-xs mt-0.5">tour đang diễn ra</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Error & Warnings ── */}
        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200
              rounded-xl p-4 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Underbooked Warnings */}
          {!isLoading && tours.filter(t => {
            const capacity = t.quantity ?? 0;
            return capacity > 0 && (t.status === "confirmed" || t.status === "pending") && (t.bookedCount || 0) < capacity / 2;
          }).map((tour, i) => (
            <div key={`warn-${i}`} className="flex items-center gap-3 bg-amber-50 border border-amber-200
              rounded-xl p-4 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
              <div>
                <strong>Cảnh báo tour:</strong> {tour.title} (Khởi hành: {formatDate(tour.startDate)}) chỉ mới có {tour.bookedCount || 0}/{tour.quantity ?? 0} khách.
              </div>
              <button onClick={() => router.push(`/leader/tours/${tour._id}`)} className="ml-auto text-amber-600 font-semibold hover:text-amber-700 underline text-xs">
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
            : statCards.map((c, i) => (
              <div key={i}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5
                  hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">
                      <AnimatedCounter target={c.value} />
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
                  </div>
                  <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <c.icon className={`w-5 h-5 ${c.iconColor}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
                  <TrendingUp className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400">Cập nhật realtime</span>
                </div>
              </div>
            ))}
        </div>

        {/* ── Today Tours ── */}
        {!isLoading && todayTours.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-orange-500" />
              <h2 className="font-bold text-slate-800">Tour hôm nay</h2>
              <span className="ml-auto bg-orange-100 text-orange-700 text-xs font-semibold
                px-2.5 py-0.5 rounded-full border border-orange-200">
                {todayTours.length}
              </span>
            </div>
            <div className="space-y-3">
              {todayTours.map(tour => {
                const cfg = STATUS_CFG[tour.status] || STATUS_CFG.pending;
                const capacity = tour.quantity ?? 0;
                const pct = capacity > 0 ? Math.round((tour.bookedCount||0)/capacity*100) : 0;
                return (
                  <Link key={tour._id} href={`/leader/tours/${tour._id}`}
                    className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200
                      hover:border-orange-300 hover:shadow-md transition-all duration-200 p-4 md:p-5">
                    <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${cfg.bar} flex-shrink-0`} />
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100
                      flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Plane className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 group-hover:text-orange-600
                        transition-colors truncate text-sm md:text-base">
                        {tour.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tour.destination}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tour.bookedCount||0}/{capacity} khách</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full`} style={{width:`${pct}%`}} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}
                          ${tour.status==="in_progress"?"animate-pulse":""}`} />
                        {cfg.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500
                        group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── All Tours ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-slate-800">Tất cả tour được phân công</h2>
            </div>
            <Link href="/leader/tours"
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600
                font-medium transition-colors group">
              Xem tất cả
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <TourSkeleton key={i} />)}</div>
          ) : tours.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-semibold text-slate-600 mb-1">Chưa có tour nào</h3>
              <p className="text-slate-400 text-sm">Bạn chưa được phân công tour nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tours.slice(0, 6).map(tour => {
                const cfg = STATUS_CFG[tour.status] || STATUS_CFG.pending;
                const capacity = tour.quantity ?? 0;
                const pct = capacity > 0 ? Math.round((tour.bookedCount||0)/capacity*100) : 0;
                return (
                  <Link key={tour._id} href={`/leader/tours/${tour._id}`}
                    className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200
                      hover:border-blue-300 hover:shadow-md transition-all duration-200 p-4 md:p-5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100
                      flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Plane className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600
                        transition-colors truncate text-sm md:text-base">
                        {tour.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tour.destination}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                          {formatDate(tour.startDate)} — {formatDate(tour.endDate)}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{tour.bookedCount||0}/{capacity}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 max-w-xs">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full`} style={{width:`${pct}%`}} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-7 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500
                        group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
