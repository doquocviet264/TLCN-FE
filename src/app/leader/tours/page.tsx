"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar, MapPin, Users, ChevronRight, Plane, Search, X, Filter,
} from "lucide-react";
import { leaderToursApi, LeaderTour } from "@/lib/leader/leaderApi";

const STATUS_CFG: Record<string, { bg: string; text: string; border: string; dot: string; label: string; bar: string }> = {
  pending:     { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500",   label: "Chờ xác nhận",  bar: "from-amber-400 to-amber-500" },
  confirmed:   { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500",    label: "Đã xác nhận",   bar: "from-blue-400 to-blue-500" },
  in_progress: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500", label: "Đang diễn ra",  bar: "from-emerald-400 to-emerald-500" },
  completed:   { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",  dot: "bg-slate-400",   label: "Hoàn thành",    bar: "from-slate-300 to-slate-400" },
  closed:      { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",    dot: "bg-red-500",     label: "Đã đóng",       bar: "from-red-400 to-red-500" },
};

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "in_progress", label: "Đang diễn ra" },
  { value: "confirmed",   label: "Đã xác nhận" },
  { value: "pending",     label: "Chờ xác nhận" },
  { value: "completed",   label: "Hoàn thành" },
  { value: "closed",      label: "Đã đóng" },
];

function TourSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex gap-4">
      <div className="w-14 h-14 bg-slate-100 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
        <div className="h-2 bg-slate-100 rounded-full" />
      </div>
      <div className="h-6 w-24 bg-slate-100 rounded-full flex-shrink-0" />
    </div>
  );
}

export default function LeaderToursPage() {
  const [tours, setTours]               = useState<LeaderTour[]>([]);
  const [filteredTours, setFiltered]    = useState<LeaderTour[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [statusFilter, setStatus]       = useState("");
  const [searchTerm, setSearch]         = useState("");

  useEffect(() => {
    setIsLoading(true);
    leaderToursApi.getMyTours(statusFilter ? { status: statusFilter } : undefined)
      .then(d => { setTours(d); setFiltered(d); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    if (!searchTerm.trim()) { setFiltered(tours); return; }
    const lo = searchTerm.toLowerCase();
    setFiltered(tours.filter(t => t.title.toLowerCase().includes(lo) || t.destination.toLowerCase().includes(lo)));
  }, [searchTerm, tours]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const countOf = (s: string) => tours.filter(t => t.status === s).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-4 md:p-6 lg:p-8 space-y-5">

        {/* Header banner */}
        <div className="relative overflow-hidden rounded-2xl
          bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-800 shadow-lg shadow-blue-900/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(249,115,22,0.2),transparent_55%)]" />
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30
                  rounded-full px-3 py-1 text-xs font-semibold text-orange-200 mb-3">
                  <Plane className="w-3 h-3" /> Lịch trình phân công
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white">Tour của tôi</h1>
                <p className="text-blue-200/70 text-sm mt-1">Quản lý và theo dõi các tour được phân công</p>
              </div>
              {!isLoading && (
                <div className="flex gap-4 bg-white/15 backdrop-blur-sm border border-white/20
                  rounded-xl px-5 py-3 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-white">{tours.length}</p>
                    <p className="text-xs text-blue-300">Tổng</p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-emerald-300">{countOf("in_progress")}</p>
                    <p className="text-xs text-blue-300">Đang chạy</p>
                  </div>
                  <div className="w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-slate-200">{countOf("completed")}</p>
                    <p className="text-xs text-blue-300">Xong</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên tour, điểm đến..."
              value={searchTerm}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-slate-800
                placeholder-slate-400 text-sm shadow-sm
                focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {FILTERS.map(f => {
              const active = statusFilter === f.value;
              const count  = f.value === "" ? tours.length : countOf(f.value);
              return (
                <button key={f.value} onClick={() => setStatus(f.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm
                    font-medium transition-all duration-200 border
                    ${active
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-600"
                    }`}>
                  {f.label}
                  {!isLoading && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full
                      ${active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tour list */}
        {isLoading ? (
          <div className="space-y-3">{Array(5).fill(0).map((_, i) => <TourSkeleton key={i} />)}</div>
        ) : filteredTours.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">
              {searchTerm ? "Không tìm thấy tour" : "Không có tour"}
            </h3>
            <p className="text-slate-400 text-sm">
              {searchTerm ? `Không có tour khớp "${searchTerm}"` : "Chưa có tour với trạng thái này"}
            </p>
            {(searchTerm || statusFilter) && (
              <button onClick={() => { setSearch(""); setStatus(""); }}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200
                  text-sm text-slate-600 hover:bg-slate-200 transition-all">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTours.map(tour => {
              const cfg = STATUS_CFG[tour.status] || STATUS_CFG.pending;
              const capacity = tour.quantity ?? 0;
              const pct = capacity > 0 ? Math.round((tour.bookedCount||0)/capacity*100) : 0;
              return (
                <Link key={tour._id} href={`/leader/tours/${tour._id}`}
                  className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200
                    hover:border-orange-300 hover:shadow-md transition-all duration-200 p-4 md:p-5 shadow-sm">
                  {/* Status bar */}
                  <div className={`w-1 h-14 rounded-full bg-gradient-to-b ${cfg.bar} flex-shrink-0`} />
                  {/* Icon */}
                  <div className="w-13 h-13 w-12 h-12 rounded-xl bg-blue-50 border border-blue-100
                    flex items-center justify-center flex-shrink-0
                    group-hover:scale-105 transition-transform duration-200">
                    <Plane className="w-6 h-6 text-blue-500" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-orange-600
                      transition-colors truncate">
                      {tour.title}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tour.destination}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                        {formatDate(tour.startDate)} – {formatDate(tour.endDate)}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />
                        {tour.bookedCount||0}/{capacity} khách</span>
                    </div>
                    {/* Progress */}
                    <div className="mt-2 flex items-center gap-2 max-w-xs">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${cfg.bar} rounded-full transition-all duration-700`}
                          style={{width:`${pct}%`}} />
                      </div>
                      <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  {/* Status + Arrow */}
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
        )}

        {/* Summary */}
        {!isLoading && filteredTours.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Hiển thị <span className="font-semibold text-slate-800">{filteredTours.length}</span> trong tổng số{" "}
              <span className="font-semibold text-slate-800">{tours.length}</span> tour
              {statusFilter && <> — lọc:{" "}
                <span className="text-orange-500 font-medium">{STATUS_CFG[statusFilter]?.label}</span></>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
